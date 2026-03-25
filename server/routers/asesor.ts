import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { solicitudesAsesor, declaraciones } from "../../drizzle/schema";
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
            // Datos para crear evento Google Calendar
            google_calendar_event: {
              summary: `Revisión Renta - ${input.nombre} (${input.expedienteId || derivacionId})`,
              description: `Expediente: ${input.expedienteId || "Directo"}\nMotivo: ${input.motivoComplejidad || "No especificado"}\nAhorro estimado: ${ahorroEstimado}\nLink admin: https://rentatpymes.aicheckpyme.co/panel-asesor`,
              start: { dateTime: reservedSlot },
              end: { dateTime: calcularReservedSlot(franjaId).replace(/T\d{2}:/, `T${(FRANJAS_HORARIAS.find(f => f.id === franjaId)?.horaFin || 11).toString().padStart(2, "0")}:`) },
              attendees: [{ email: "info@ayudatpymes.com" }],
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

          const n8nResponse = await fetch(n8nWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(webhookPayload),
          });
          n8nStatus = n8nResponse.ok ? "sent" : `error_${n8nResponse.status}`;

          // Actualizar notificaciones_sent en DB
          if (solicitudId) {
            const notif = [{
              type: "n8n_webhook",
              timestamp: ahora,
              status: n8nStatus,
              payload_summary: { derivacion_id: derivacionId, reserved_slot: reservedSlot },
            }];
            await db
              .update(solicitudesAsesor)
              .set({ notificacionesSent: notif as any, n8nExecutionId: derivacionId })
              .where(eq(solicitudesAsesor.id, solicitudId));
          }
        } catch (err) {
          console.error("[Asesor] Error enviando webhook n8n:", err);
          n8nStatus = "error_fetch";
          // No lanzamos error - la solicitud ya se guardó en DB
        }
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
});
