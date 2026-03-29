import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { solicitudesAsesor, declaraciones, asesores } from "../../drizzle/schema";
import { eq, desc, and, or, like } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

// Franjas horarias disponibles
const FRANJAS_HORARIAS = [
  { id: "manana_temprano", label: "Mañana temprano (9:00 - 11:00)", horaInicio: 9, horaFin: 11 },
  { id: "manana", label: "Mañana (11:00 - 13:00)", horaInicio: 11, horaFin: 13 },
  { id: "mediodia", label: "Mediodía (13:00 - 15:00)", horaInicio: 13, horaFin: 15 },
  { id: "tarde_temprano", label: "Tarde temprana (15:00 - 17:00)", horaInicio: 15, horaFin: 17 },
  { id: "tarde", label: "Tarde (17:00 - 19:00)", horaInicio: 17, horaFin: 19 },
  { id: "flexible", label: "Flexible (cualquier hora)", horaInicio: 9, horaFin: 19 },
];

/**
 * Calcula el próximo día hábil (lunes-viernes) a partir de hoy.
 * Si hoy es viernes/sábado/domingo, salta al lunes.
 */
function proximoDiaHabil(offsetDias = 1): Date {
  const fecha = new Date();
  // Usar hora española (Europe/Madrid)
  const ahora = new Date(fecha.toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
  ahora.setDate(ahora.getDate() + offsetDias);
  // Si cae en sábado (6) → lunes
  if (ahora.getDay() === 6) ahora.setDate(ahora.getDate() + 2);
  // Si cae en domingo (0) → lunes
  if (ahora.getDay() === 0) ahora.setDate(ahora.getDate() + 1);
  return ahora;
}

/**
 * Genera el ISO datetime del slot reservado basado en la franja horaria y el día.
 * Devuelve el primer día hábil disponible (mañana si es día hábil, si no el lunes).
 */
function calcularReservedSlot(franjaId: string): string {
  const franja = FRANJAS_HORARIAS.find(f => f.id === franjaId) || FRANJAS_HORARIAS[5];
  const dia = proximoDiaHabil(1);
  dia.setHours(franja.horaInicio, 0, 0, 0);
  // Formatear como ISO con offset +02:00 (CEST) o +01:00 (CET)
  // Usamos toISOString y ajustamos manualmente para España
  const offset = "+02:00"; // Campaña de renta = abril-junio = CEST (UTC+2)
  const pad = (n: number) => String(n).padStart(2, "0");
  const iso = `${dia.getFullYear()}-${pad(dia.getMonth() + 1)}-${pad(dia.getDate())}T${pad(franja.horaInicio)}:00:00${offset}`;
  return iso;
}

export const asesorRouter = router({
  /**
   * Obtener franjas horarias disponibles
   */
  getFranjasHorarias: publicProcedure.query(() => {
    return FRANJAS_HORARIAS;
  }),

  /**
   * Crear solicitud de contacto con asesor (derivación de caso complejo).
   * Guarda audit_log, calcula reserved_slot, envía webhook enriquecido a n8n.
   */
  crearSolicitud: publicProcedure
    .input(z.object({
      expedienteId: z.string().optional(),
      nombre: z.string().min(2, "El nombre es obligatorio"),
      nif: z.string().min(8, "El NIF/NIE es obligatorio"),
      email: z.string().email("Email inválido"),
      telefono: z.string().min(9, "El teléfono es obligatorio"),
      franjaHoraria: z.string().optional(),
      motivoComplejidad: z.string().optional(),
      descripcionSituacion: z.string().optional(),
      resultadoSimulador: z.record(z.string(), z.unknown()).optional(),
      precioEstimado: z.number().optional(),
      consentimientoRGPD: z.boolean().refine(v => v === true, "Debes aceptar la política de privacidad"),
      // Audit fields pasados desde el frontend
      ipAddress: z.string().optional(),
      userAgent: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const franjaId = input.franjaHoraria || "flexible";
      const reservedSlot = calcularReservedSlot(franjaId);
      const ahora = new Date().toISOString();

      // Construir audit log inicial
      const auditLog = [{
        action: "solicitud_creada",
        timestamp: ahora,
        ip: input.ipAddress || "unknown",
        user_agent: input.userAgent || "unknown",
        details: {
          expediente_id: input.expedienteId,
          franja: franjaId,
          reserved_slot: reservedSlot,
          consent: input.consentimientoRGPD,
        },
      }];

      // Idempotencia: comprobar si ya existe una solicitud reciente con el mismo expedienteId
      // (evita duplicados si n8n reintenta el webhook)
      if (input.expedienteId) {
        const [existente] = await db
          .select({ id: solicitudesAsesor.id, derivacionId: solicitudesAsesor.n8nExecutionId })
          .from(solicitudesAsesor)
          .where(and(
            eq(solicitudesAsesor.expedienteId, input.expedienteId),
            or(
              eq(solicitudesAsesor.slotStatus, "tentative"),
              eq(solicitudesAsesor.slotStatus, "confirmed")
            )
          ))
          .limit(1);

        if (existente) {
          console.log(`[Asesor] Solicitud duplicada detectada para expediente ${input.expedienteId}, devolviendo existente`);
          return {
            success: true,
            solicitudId: existente.id,
            derivacionId: existente.derivacionId || `d-${existente.id}`,
            reservedSlot,
            mensaje: "Ya tienes una solicitud activa. Te contactaremos en menos de 24 horas.",
            n8nStatus: "duplicate_skipped",
          };
        }
      }

      // Crear la solicitud en DB
      await db.insert(solicitudesAsesor).values({
        expedienteId: input.expedienteId || null,
        nombre: input.nombre,
        nif: input.nif,
        email: input.email,
        telefono: input.telefono,
        franjaHoraria: franjaId,
        motivoComplejidad: input.motivoComplejidad || null,
        descripcionSituacion: input.descripcionSituacion || null,
        resultadoSimulador: input.resultadoSimulador as Record<string, unknown> || null,
        precioEstimado: input.precioEstimado || null,
        estado: "pendiente",
        reservedSlot,
        slotStatus: "tentative",
        auditLogs: auditLog as any,
        notificacionesSent: [] as any,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
      });

      // Obtener el ID recién creado
      const [solicitud] = await db
        .select()
        .from(solicitudesAsesor)
        .where(eq(solicitudesAsesor.email, input.email))
        .orderBy(desc(solicitudesAsesor.createdAt))
        .limit(1);

      const solicitudId = solicitud?.id;
      const derivacionId = `d-${solicitudId}`;

      // Actualizar estado del expediente a "derivado" si existe
      if (input.expedienteId) {
        await db
          .update(declaraciones)
          .set({ estado: "derivado" })
          .where(eq(declaraciones.expedienteId, input.expedienteId));
      }

      // Notificar al propietario (asesor) via Manus notification
      const ahorroEstimado = (input.resultadoSimulador as any)?.ahorro_total
        ? `${((input.resultadoSimulador as any).ahorro_total).toFixed(2)} €`
        : "No calculado";

      try {
        await notifyOwner({
          title: `🔔 Nuevo caso complejo - ${input.nombre}`,
          content: `Nuevo caso derivado a asesor\n\n` +
          `Cliente: ${input.nombre} (${input.nif})\n` +
          `Email: ${input.email}\n` +
          `Telefono: ${input.telefono}\n` +
          `Franja horaria: ${FRANJAS_HORARIAS.find(f => f.id === franjaId)?.label || "Flexible"}\n` +
          `Slot reservado: ${reservedSlot}\n` +
          `Motivo: ${input.motivoComplejidad || "No especificado"}\n` +
          `Ahorro estimado: ${ahorroEstimado}\n` +
          `Precio estimado: ${input.precioEstimado ? input.precioEstimado + " €" : "Por determinar"}\n` +
          `Expediente: ${input.expedienteId || "Sin expediente previo"}\n` +
          `Derivacion ID: ${derivacionId}\n\n` +
          `Descripcion del cliente: ${input.descripcionSituacion || "Sin descripcion adicional"}`
        });
      } catch (notifyErr) {
        console.error("[Asesor] Error notificando al owner:", notifyErr);
      }

      // Enviar webhook a n8n con payload enriquecido (formato del documento de especificaciones)
      const n8nWebhookUrl = process.env.VITE_WEBHOOK_N8N;
      const n8nWebhookKey = process.env.N8N_WEBHOOK_KEY; // Clave secreta para autenticar el webhook
      let n8nStatus = "not_configured";
      if (n8nWebhookUrl) {
        try {
          const webhookPayload = {
            event: "derivacion_created",
            derivacion_id: derivacionId,
            expediente_id: input.expedienteId,
            user_contact: {
              nombre: input.nombre,
              nif: input.nif,
              email: input.email,
              phone: input.telefono,
            },
            franja_horaria: franjaId,
            reserved_slot: reservedSlot,
            motivo: input.motivoComplejidad,
            descripcion_situacion: input.descripcionSituacion,
            ahorro_estimado: (input.resultadoSimulador as any)?.ahorro_total || 0,
            precio: input.precioEstimado || 0,
            resultado_simulador: input.resultadoSimulador,
            // Email del asesor asignado (para attendee dinámico en Calendar)
            // Si no hay asignación, usa el email del pool de asesores
            assigned_advisor_email: process.env.ASESOR_EMAIL_POOL || "info@ayudatpymes.com",
            // Datos para crear evento Google Calendar
            google_calendar_event: {
              summary: `Revisión Renta - ${input.nombre} (${input.expedienteId || derivacionId})`,
              description: `Expediente: ${input.expedienteId || "Directo"}\nMotivo: ${input.motivoComplejidad || "No especificado"}\nAhorro estimado: ${ahorroEstimado}\nLink admin: https://rentatpymes.aicheckpyme.co/panel-asesor`,
              start: { dateTime: reservedSlot },
              end: { dateTime: calcularReservedSlot(franjaId).replace(/T\d{2}:/, `T${(FRANJAS_HORARIAS.find(f => f.id === franjaId)?.horaFin || 11).toString().padStart(2, "0")}:`) },
              attendees: [{ email: process.env.ASESOR_EMAIL_POOL || "info@ayudatpymes.com" }],
              status: "tentative",
            },
            // Plantilla email confirmación provisional
            email_template: {
              to: input.email,
              subject: "Confirmación provisional de cita — Renta Fácil",
              nombre_cliente: input.nombre,
              expediente_id: input.expedienteId || derivacionId,
              motivo: input.motivoComplejidad || "Revisión especializada",
              ahorro_estimado: (input.resultadoSimulador as any)?.ahorro_total || 0,
              precio: input.precioEstimado || 0,
              reserved_slot: reservedSlot,
              link_expediente: `https://rentatpymes.aicheckpyme.co/mi-renta/${input.expedienteId || ""}`,
            },
            timestamp: ahora,
          };

          const fetchHeaders: Record<string, string> = { "Content-Type": "application/json" };
          if (n8nWebhookKey) {
            fetchHeaders["X-Webhook-Key"] = n8nWebhookKey;
          }

          const n8nResponse = await fetch(n8nWebhookUrl, {
            method: "POST",
            headers: fetchHeaders,
            body: JSON.stringify(webhookPayload),
          });
          n8nStatus = n8nResponse.ok ? "sent" : `error_${n8nResponse.status}`;

          // Intentar extraer calendarEventId de la respuesta de n8n
          let calendarEventId: string | null = null;
          try {
            const n8nBody = await n8nResponse.json();
            calendarEventId = n8nBody?.calendar_event_id || n8nBody?.data?.calendar_event_id || null;
          } catch { /* respuesta no es JSON */ }

          // Actualizar notificaciones_sent y calendarEventId en DB
          if (solicitudId) {
            const notif = [{
              type: "n8n_webhook",
              timestamp: ahora,
              status: n8nStatus,
              payload_summary: { derivacion_id: derivacionId, reserved_slot: reservedSlot },
            }];
            await db
              .update(solicitudesAsesor)
              .set({
                notificacionesSent: notif as any,
                n8nExecutionId: derivacionId,
                ...(calendarEventId ? { calendarEventId, calendarCreatedBy: "shared_calendar" } : {}),
              } as any)
              .where(eq(solicitudesAsesor.id, solicitudId));
          }
        } catch (err) {
          console.error("[Asesor] Error enviando webhook n8n:", err);
          n8nStatus = "error_fetch";
          // No lanzamos error - la solicitud ya se guardó en DB
        }
      }

      // ── Escribir derivación en Google Sheet "Derivaciones" ──
      // Campos alineados con DERIVACIONES_HEADERS canónicos
      try {
        const { upsertDeclaracionSheet } = await import("../lib/googleSheets");
        await upsertDeclaracionSheet({
          derivacion_id: derivacionId,
          expediente_id: input.expedienteId || derivacionId,
          cliente_nombre: input.nombre,
          cliente_email: input.email,
          cliente_telefono: input.telefono,
          nif: input.nif,
          motivo_derivacion: input.motivoComplejidad || "",
          descripcion_situacion: input.descripcionSituacion || "",
          franja_horaria: input.franjaHoraria || "flexible",
          reserved_slot: reservedSlot,
          estado: "pending",
          derivado_a: "",
          prioridad: "media",
          n8n_status: n8nStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          resuelto_por: "",
          resuelto_at: "",
          observaciones: "",
        }, "Derivaciones");
        console.log(`[Asesor] Derivación ${derivacionId} escrita en Sheet Derivaciones`);
      } catch (sheetErr: any) {
        console.warn(`[Asesor] Error escribiendo derivación en Sheet: ${sheetErr.message}`);
      }

      return {
        success: true,
        solicitudId,
        derivacionId,
        reservedSlot,
        mensaje: "Tu solicitud ha sido recibida. Te contactaremos en menos de 24 horas.",
        n8nStatus,
      };
    }),

  /**
   * Obtener solicitud por ID (para página de confirmación)
   */
  getSolicitud: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [solicitud] = await db
        .select()
        .from(solicitudesAsesor)
        .where(eq(solicitudesAsesor.id, input.id));
      return solicitud || null;
    }),

  /**
   * Obtener solicitudes por email (para área cliente)
   */
  getMisSolicitudes: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(solicitudesAsesor)
        .where(eq(solicitudesAsesor.email, input.email))
        .orderBy(desc(solicitudesAsesor.createdAt));
    }),

  /**
   * ADMIN: Listar todas las solicitudes
   */
  adminListarSolicitudes: protectedProcedure
    .input(z.object({
      estado: z.string().optional(),
      busqueda: z.string().optional(),
      limite: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { solicitudes: [], total: 0 };

      const conditions = [];
      if (input.estado && input.estado !== "todos") {
        conditions.push(eq(solicitudesAsesor.estado, input.estado as any));
      }
      if (input.busqueda) {
        conditions.push(
          or(
            like(solicitudesAsesor.nombre, `%${input.busqueda}%`),
            like(solicitudesAsesor.email, `%${input.busqueda}%`),
            like(solicitudesAsesor.nif, `%${input.busqueda}%`)
          )
        );
      }

      const solicitudes = await db
        .select()
        .from(solicitudesAsesor)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(solicitudesAsesor.createdAt))
        .limit(input.limite)
        .offset(input.offset);

      return { solicitudes };
    }),

  /**
   * ADMIN: Actualizar estado de una solicitud
   */
  adminActualizarEstado: protectedProcedure
    .input(z.object({
      id: z.number(),
      estado: z.enum(["pendiente", "contactado", "en_gestion", "resuelto", "cancelado"]),
      notasAsesor: z.string().optional(),
      asesorAsignado: z.string().optional(),
      slotStatus: z.enum(["tentative", "confirmed", "cancelled", "retrying"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: Record<string, unknown> = {
        estado: input.estado,
        notasAsesor: input.notasAsesor,
        asesorAsignado: input.asesorAsignado,
      };
      if (input.slotStatus) {
        updateData.slotStatus = input.slotStatus;
      }

      await db
        .update(solicitudesAsesor)
        .set(updateData as any)
        .where(eq(solicitudesAsesor.id, input.id));

      return { success: true };
    }),

  /**
   * ADMIN: Confirmar slot de una solicitud (actualiza a confirmed)
   */
  adminConfirmarSlot: protectedProcedure
    .input(z.object({
      id: z.number(),
      slotConfirmado: z.string().optional(), // ISO datetime, si se cambia
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: Record<string, unknown> = {
        slotStatus: "confirmed",
        estado: "contactado",
      };
      if (input.slotConfirmado) {
        updateData.reservedSlot = input.slotConfirmado;
      }

      await db
        .update(solicitudesAsesor)
        .set(updateData as any)
        .where(eq(solicitudesAsesor.id, input.id));

      return { success: true };
    }),

  /**
   * ADMIN: Asignar asesor a una derivación y disparar webhook derivacion-confirm a n8n.
   * Actualiza assigned_advisor_id, assigned_advisor_email, slot_status = confirmed.
   * Dispara el workflow n8n derivacion-confirm que crea el evento Calendar definitivo.
   */
  adminAsignarAsesor: protectedProcedure
    .input(z.object({
      solicitudId: z.number(),
      asesorId: z.number(),
      reservedSlot: z.string().optional(), // ISO datetime, si se quiere cambiar el slot
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 1) Obtener el asesor
      const [asesor] = await db
        .select()
        .from(asesores)
        .where(eq(asesores.id, input.asesorId))
        .limit(1);

      if (!asesor) throw new Error("Asesor no encontrado");

      // 2) Obtener la solicitud
      const [solicitud] = await db
        .select()
        .from(solicitudesAsesor)
        .where(eq(solicitudesAsesor.id, input.solicitudId))
        .limit(1);

      if (!solicitud) throw new Error("Solicitud no encontrada");

      const slotFinal = input.reservedSlot || solicitud.reservedSlot || calcularReservedSlot(solicitud.franjaHoraria || "flexible");
      const ahora = new Date().toISOString();

      // 3) Actualizar la solicitud en BD
      await db
        .update(solicitudesAsesor)
        .set({
          asesorAsignado: asesor.nombre,
          assignedAdvisorId: String(asesor.id),
          slotStatus: "confirmed",
          estado: "contactado",
          reservedSlot: slotFinal,
        } as any)
        .where(eq(solicitudesAsesor.id, input.solicitudId));

      // 4) Disparar webhook derivacion-confirm a n8n
      const n8nConfirmUrl = (process.env.VITE_WEBHOOK_N8N || "").replace(
        "derivacion-create",
        "derivacion-confirm"
      );
      const n8nWebhookKey = process.env.N8N_WEBHOOK_KEY;
      let n8nStatus = "not_configured";

      if (n8nConfirmUrl && n8nConfirmUrl.includes("derivacion-confirm")) {
        try {
          const payload = {
            event: "derivacion_confirmed",
            derivacion_id: solicitud.n8nExecutionId || `d-${solicitud.id}`,
            expediente_id: solicitud.expedienteId,
            assigned_advisor_id: String(asesor.id),
            assigned_advisor_email: asesor.email,
            contribuyente: {
              nombre: solicitud.nombre,
              nif: solicitud.nif,
            },
            user_contact: {
              nombre: solicitud.nombre,
              nif: solicitud.nif,
              email: solicitud.email,
              phone: solicitud.telefono,
            },
            motivo: solicitud.motivoComplejidad,
            ahorro_estimado: (solicitud.resultadoSimulador as any)?.ahorro_total || 0,
            precio: solicitud.precioEstimado || 0,
            reserved_slot: slotFinal,
            es_complejo: true,
            timestamp: ahora,
          };

          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (n8nWebhookKey) headers["X-Webhook-Key"] = n8nWebhookKey;

          const resp = await fetch(n8nConfirmUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
          });
          n8nStatus = resp.ok ? "sent" : `error_${resp.status}`;

          // Intentar extraer calendarEventId de la respuesta
          let calendarEventId: string | null = null;
          try {
            const respBody = await resp.json();
            calendarEventId = respBody?.calendar_event_id || respBody?.data?.calendar_event_id || null;
          } catch { /* no JSON */ }

          if (calendarEventId) {
            await db
              .update(solicitudesAsesor)
              .set({ calendarEventId, calendarCreatedBy: "shared_calendar" } as any)
              .where(eq(solicitudesAsesor.id, input.solicitudId));
          }
        } catch (err) {
          console.error("[Asesor] Error enviando webhook derivacion-confirm:", err);
          n8nStatus = "error_fetch";
        }
      }

      return {
        success: true,
        asesorNombre: asesor.nombre,
        asesorEmail: asesor.email,
        reservedSlot: slotFinal,
        n8nStatus,
      };
    }),

  /**
   * ADMIN: Listar asesores disponibles
   */
  getAsesores: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(asesores)
        .where(eq(asesores.activo, true))
        .orderBy(asesores.nombre);
    }),

  /**
   * ADMIN: Crear un nuevo asesor
   */
  adminCrearAsesor: protectedProcedure
    .input(z.object({
      nombre: z.string().min(2),
      email: z.string().email(),
      calendarMode: z.enum(["shared_calendar", "personal_oauth"]).default("shared_calendar"),
      workingHours: z.record(z.string(), z.object({
        inicio: z.string(),
        fin: z.string(),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(asesores).values({
        nombre: input.nombre,
        email: input.email,
        calendarMode: input.calendarMode,
        workingHours: input.workingHours as any || null,
        activo: true,
      });

      const [nuevo] = await db
        .select()
        .from(asesores)
        .where(eq(asesores.email, input.email))
        .limit(1);

      return { success: true, asesor: nuevo };
    }),

  /**
   * ADMIN: Eliminar (desactivar) un asesor
   */
  adminDesactivarAsesor: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .update(asesores)
        .set({ activo: false })
        .where(eq(asesores.id, input.id));
      return { success: true };
    }),

  /**
   * ADMIN: Inicializar headers correctos en tab "Derivaciones" del Sheet
   * y limpiar columnas vacías de casos_master_v2.
   * Llamar UNA VEZ desde el panel asesor para dejar el Sheet bonito.
   */
  adminFixSheet: protectedProcedure
    .mutation(async () => {
      const { initDerivacionesHeaders, limpiarColumnasVaciasCasosMaster } = await import("../lib/googleSheets");
      const [derivResult, cleanResult] = await Promise.all([
        initDerivacionesHeaders(),
        limpiarColumnasVaciasCasosMaster(),
      ]);
      return {
        derivaciones_headers_ok: derivResult,
        columnas_vacias: cleanResult,
      };
    }),

  /**
   * ADMIN: Listar derivaciones del Sheet para el panel de derivaciones
   */
  adminListarDerivaciones: protectedProcedure
    .input(z.object({
      estado: z.string().optional(),
      limit: z.number().optional().default(50),
    }))
    .query(async ({ input }) => {
      const { leerCasosMasterV2 } = await import("../lib/googleSheets");
      const casos = await leerCasosMasterV2({
        es_derivacion: true,
        estado: input.estado,
        limit: input.limit,
      });
      return { casos, total: casos.length };
    }),

  /**
   * Panel: Listar expedientes complejos o derivados (desde declaraciones DB).
   * Accesible desde el panel con token de contraseña (publicProcedure).
   * Devuelve expedientes donde esComplejo=true o estado es 'derivado'/'derivado_asesor'.
   */
  panelListarDerivaciones: publicProcedure
    .input(z.object({
      estado: z.string().optional(),
      busqueda: z.string().optional(),
      limite: z.number().default(100),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { derivaciones: [], total: 0 };

      // Filtrar: esComplejo=true O estado en [derivado, derivado_asesor, ...]
      const condBase = or(
        eq(declaraciones.esComplejo, true),
        eq(declaraciones.estado, "derivado"),
        eq(declaraciones.estado, "derivado_asesor"),
        eq(declaraciones.estado, "cita_propuesta"),
        eq(declaraciones.estado, "cita_confirmada"),
        eq(declaraciones.estado, "en_preparacion"),
      );

      const rows = await db
        .select({
          expedienteId: declaraciones.expedienteId,
          estado: declaraciones.estado,
          esComplejo: declaraciones.esComplejo,
          motivoComplejidad: declaraciones.motivoComplejidad,
          emailContacto: declaraciones.emailContacto,
          telefonoContacto: declaraciones.telefonoContacto,
          datosContribuyente: declaraciones.datosContribuyente,
          precioTotal: declaraciones.precioTotal,
          createdAt: declaraciones.createdAt,
          updatedAt: declaraciones.updatedAt,
        })
        .from(declaraciones)
        .where(condBase)
        .orderBy(desc(declaraciones.createdAt))
        .limit(input.limite)
        .offset(input.offset);

      // Enriquecer con datos de la solicitud del asesor si existe
      const derivaciones = await Promise.all(rows.map(async (row) => {
        let solicitudInfo: {
          id: number;
          nombre: string;
          asesorAsignado: string | null;
          estado: string;
          reservedSlot: string | null;
        } | null = null;

        try {
          const [sol] = await db
            .select({
              id: solicitudesAsesor.id,
              nombre: solicitudesAsesor.nombre,
              asesorAsignado: solicitudesAsesor.asesorAsignado,
              estado: solicitudesAsesor.estado,
              reservedSlot: solicitudesAsesor.reservedSlot,
            })
            .from(solicitudesAsesor)
            .where(eq(solicitudesAsesor.expedienteId, row.expedienteId))
            .orderBy(desc(solicitudesAsesor.createdAt))
            .limit(1);
          if (sol) solicitudInfo = sol;
        } catch { /* no hay solicitud */ }

        const datos = (row.datosContribuyente as Record<string, unknown>) || {};
        const contribuyente = (datos.contribuyente as Record<string, unknown>) || {};

        return {
          expedienteId: row.expedienteId,
          clienteNombre: String(contribuyente.nombre || contribuyente.nombre_completo || datos.nombre || ""),
          clienteEmail: row.emailContacto || "",
          clienteTelefono: row.telefonoContacto || "",
          motivoDerivacion: row.motivoComplejidad || "",
          estado: row.estado,
          esComplejo: row.esComplejo,
          prioridad: (row.precioTotal || 0) > 10000 ? "Alta" : "Media",
          asesorAsignado: solicitudInfo?.asesorAsignado || "",
          solicitudId: solicitudInfo?.id || null,
          solicitudEstado: solicitudInfo?.estado || null,
          reservedSlot: solicitudInfo?.reservedSlot || null,
          createdAt: row.createdAt.toISOString(),
        };
      }));

      // Filtrado adicional en memoria por búsqueda y estado
      let resultado = derivaciones;
      if (input.estado && input.estado !== "todos") {
        resultado = resultado.filter(d => d.solicitudEstado === input.estado || d.estado === input.estado);
      }
      if (input.busqueda) {
        const q = input.busqueda.toLowerCase();
        resultado = resultado.filter(d =>
          d.expedienteId.toLowerCase().includes(q) ||
          d.clienteNombre.toLowerCase().includes(q) ||
          d.clienteEmail.toLowerCase().includes(q) ||
          d.motivoDerivacion.toLowerCase().includes(q)
        );
      }

      return { derivaciones: resultado, total: resultado.length };
    }),

  /**
   * Panel: Asignar asesor (texto libre) a una solicitud por su ID.
   * Usado desde la página Derivaciones.
   */
  panelAsignarAsesor: publicProcedure
    .input(z.object({
      solicitudId: z.number(),
      asesorNombre: z.string().min(1, "El nombre del asesor es obligatorio"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(solicitudesAsesor)
        .set({ asesorAsignado: input.asesorNombre } as any)
        .where(eq(solicitudesAsesor.id, input.solicitudId));

      return { success: true };
    }),

  /**
   * Panel: Marcar una solicitud de derivación como resuelta.
   */
  panelMarcarResuelto: publicProcedure
    .input(z.object({
      solicitudId: z.number(),
      notasAsesor: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(solicitudesAsesor)
        .set({
          estado: "resuelto",
          ...(input.notasAsesor ? { notasAsesor: input.notasAsesor } : {}),
        } as any)
        .where(eq(solicitudesAsesor.id, input.solicitudId));

      return { success: true };
    }),
});
