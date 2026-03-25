import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { solicitudesAsesor, declaraciones } from "../../drizzle/schema";
import { eq, desc, and, or, like } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

// Franjas horarias disponibles
const FRANJAS_HORARIAS = [
  { id: "manana_temprano", label: "Mañana temprano (9:00 - 11:00)" },
  { id: "manana", label: "Mañana (11:00 - 13:00)" },
  { id: "mediodia", label: "Mediodía (13:00 - 15:00)" },
  { id: "tarde_temprano", label: "Tarde temprana (15:00 - 17:00)" },
  { id: "tarde", label: "Tarde (17:00 - 19:00)" },
  { id: "flexible", label: "Flexible (cualquier hora)" },
];

export const asesorRouter = router({
  /**
   * Obtener franjas horarias disponibles
   */
  getFranjasHorarias: publicProcedure.query(() => {
    return FRANJAS_HORARIAS;
  }),

  /**
   * Crear solicitud de contacto con asesor (derivación de caso complejo)
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
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Crear la solicitud en DB
      await db.insert(solicitudesAsesor).values({
        expedienteId: input.expedienteId || null,
        nombre: input.nombre,
        nif: input.nif,
        email: input.email,
        telefono: input.telefono,
        franjaHoraria: input.franjaHoraria || "flexible",
        motivoComplejidad: input.motivoComplejidad || null,
        descripcionSituacion: input.descripcionSituacion || null,
        resultadoSimulador: input.resultadoSimulador as Record<string, unknown> || null,
        precioEstimado: input.precioEstimado || null,
        estado: "pendiente",
      });

      // Obtener el ID recién creado
      const [solicitud] = await db
        .select()
        .from(solicitudesAsesor)
        .where(eq(solicitudesAsesor.email, input.email))
        .orderBy(desc(solicitudesAsesor.createdAt))
        .limit(1);

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
          `Franja horaria: ${FRANJAS_HORARIAS.find(f => f.id === input.franjaHoraria)?.label || "Flexible"}\n` +
          `Motivo: ${input.motivoComplejidad || "No especificado"}\n` +
          `Ahorro estimado: ${ahorroEstimado}\n` +
          `Expediente: ${input.expedienteId || "Sin expediente previo"}\n\n` +
          `Descripcion del cliente: ${input.descripcionSituacion || "Sin descripcion adicional"}`
        });
      } catch (notifyErr) {
        console.error("[Asesor] Error notificando al owner:", notifyErr);
      }

      // Enviar webhook a n8n si está configurado
      const n8nWebhookUrl = process.env.VITE_WEBHOOK_N8N;
      if (n8nWebhookUrl) {
        try {
          const webhookPayload = {
            event: "derivacion_created",
            derivacion_id: solicitud?.id,
            expediente_id: input.expedienteId,
            user_contact: {
              nombre: input.nombre,
              nif: input.nif,
              email: input.email,
              telefono: input.telefono,
            },
            franja_horaria: input.franjaHoraria,
            motivo_complejidad: input.motivoComplejidad,
            descripcion_situacion: input.descripcionSituacion,
            ahorro_estimado: (input.resultadoSimulador as any)?.ahorro_total,
            precio_estimado: input.precioEstimado,
            resultado_simulador: input.resultadoSimulador,
            timestamp: new Date().toISOString(),
          };

          await fetch(n8nWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(webhookPayload),
          });
        } catch (err) {
          console.error("[Asesor] Error enviando webhook n8n:", err);
          // No lanzamos error - la solicitud ya se guardó en DB
        }
      }

      return {
        success: true,
        solicitudId: solicitud?.id,
        mensaje: "Tu solicitud ha sido recibida. Te contactaremos en menos de 24 horas.",
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
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(solicitudesAsesor)
        .set({
          estado: input.estado,
          notasAsesor: input.notasAsesor,
          asesorAsignado: input.asesorAsignado,
        })
        .where(eq(solicitudesAsesor.id, input.id));

      return { success: true };
    }),
});
