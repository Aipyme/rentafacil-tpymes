/**
 * Router de notificaciones por email
 *
 * Endpoints para que el asesor pueda disparar emails transaccionales
 * al cliente desde el panel: borrador listo, documentos recibidos,
 * declaración presentada, etc.
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { declaraciones } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "../lib/email";
import {
  buildEmailBorradorListo,
  buildEmailDocumentosRecibidos,
  buildEmailDeclaracionPresentada,
} from "../lib/emailTemplates";

const baseUrl = () => process.env.APP_BASE_URL || "https://rentatpymes.aicheckpyme.co";

/** Helper: sacar datos del expediente para emails */
async function getExpedienteParaEmail(expedienteId: string) {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible");

  const [exp] = await db
    .select()
    .from(declaraciones)
    .where(eq(declaraciones.expedienteId, expedienteId));

  if (!exp) throw new Error(`Expediente ${expedienteId} no encontrado`);

  const contrib = (exp.datosContribuyente as Record<string, unknown>) || {};
  const contribInner = (contrib.contribuyente as Record<string, unknown>) || {};
  const nombreCliente = `${contribInner.nombre || contrib.nombre || ""} ${contribInner.apellidos || contrib.apellidos || ""}`.trim();
  const emailCliente = exp.emailContacto || "";
  const urlMiRenta = `${baseUrl()}/mi-renta/${expedienteId}`;

  return { exp, contrib, nombreCliente, emailCliente, urlMiRenta, db };
}

export const notificacionesRouter = router({
  /**
   * Enviar email "Borrador listo para revisar"
   * Llamado por el asesor cuando termina el borrador
   */
  enviarBorradorListo: publicProcedure
    .input(z.object({
      expedienteId: z.string(),
      resultadoEstimado: z.number().optional(),
      tipoResultado: z.string().optional(),
      ahorroVsBorrador: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { exp, nombreCliente, emailCliente, urlMiRenta, db } = await getExpedienteParaEmail(input.expedienteId);

      if (!emailCliente) {
        return { success: false, error: "El expediente no tiene email de contacto" };
      }

      // Actualizar estado a borrador_listo
      await db
        .update(declaraciones)
        .set({
          subestado: "borrador_listo",
          estadoUpdatedAt: new Date(),
          estadoUpdatedBy: "asesor_panel",
        })
        .where(eq(declaraciones.expedienteId, input.expedienteId));

      const resultadoCalc = (exp.resultadoCalculo as Record<string, unknown>) || {};
      const emailData = buildEmailBorradorListo({
        expedienteId: input.expedienteId,
        nombreCliente,
        urlMiRenta,
        resultadoEstimado: input.resultadoEstimado ?? (resultadoCalc.resultado_aproximado as number) ?? undefined,
        tipoResultado: input.tipoResultado ?? (resultadoCalc.tipo_resultado as string) ?? undefined,
        ahorroVsBorrador: input.ahorroVsBorrador,
      });

      const result = await sendEmail({
        to: emailCliente,
        toName: nombreCliente || undefined,
        subject: emailData.subject,
        htmlContent: emailData.html,
      });

      console.log(`[Notificaciones] Borrador listo → ${emailCliente}: ${result.success ? 'OK' : result.error}`);
      return { success: result.success, error: result.error };
    }),

  /**
   * Enviar email "Documentos recibidos"
   * Se puede disparar manualmente o automáticamente
   */
  enviarDocumentosRecibidos: publicProcedure
    .input(z.object({
      expedienteId: z.string(),
      documentosSubidos: z.array(z.string()),
      documentosPendientes: z.array(z.string()).default([]),
    }))
    .mutation(async ({ input }) => {
      const { nombreCliente, emailCliente, urlMiRenta } = await getExpedienteParaEmail(input.expedienteId);

      if (!emailCliente) {
        return { success: false, error: "El expediente no tiene email de contacto" };
      }

      const emailData = buildEmailDocumentosRecibidos({
        expedienteId: input.expedienteId,
        nombreCliente,
        urlMiRenta,
        documentosSubidos: input.documentosSubidos,
        documentosPendientes: input.documentosPendientes,
      });

      const result = await sendEmail({
        to: emailCliente,
        toName: nombreCliente || undefined,
        subject: emailData.subject,
        htmlContent: emailData.html,
      });

      console.log(`[Notificaciones] Docs recibidos → ${emailCliente}: ${result.success ? 'OK' : result.error}`);
      return { success: result.success, error: result.error };
    }),

  /**
   * Enviar email "Declaración presentada"
   * Llamado por el asesor cuando presenta la declaración ante la AEAT
   */
  enviarDeclaracionPresentada: publicProcedure
    .input(z.object({
      expedienteId: z.string(),
      resultadoFinal: z.number(),
      tipoResultado: z.string(),
      numeroCsvAeat: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { nombreCliente, emailCliente, urlMiRenta, db } = await getExpedienteParaEmail(input.expedienteId);

      if (!emailCliente) {
        return { success: false, error: "El expediente no tiene email de contacto" };
      }

      // Actualizar estado a completado/cerrado
      await db
        .update(declaraciones)
        .set({
          estado: "completado",
          subestado: "presentada_aeat",
          estadoUpdatedAt: new Date(),
          estadoUpdatedBy: "asesor_panel",
        })
        .where(eq(declaraciones.expedienteId, input.expedienteId));

      const fechaPresentacion = new Date().toLocaleDateString("es-ES", {
        day: "2-digit", month: "long", year: "numeric",
      });

      const emailData = buildEmailDeclaracionPresentada({
        expedienteId: input.expedienteId,
        nombreCliente,
        urlMiRenta,
        fechaPresentacion,
        resultadoFinal: input.resultadoFinal,
        tipoResultado: input.tipoResultado,
        numeroCsvAeat: input.numeroCsvAeat,
      });

      const result = await sendEmail({
        to: emailCliente,
        toName: nombreCliente || undefined,
        subject: emailData.subject,
        htmlContent: emailData.html,
      });

      console.log(`[Notificaciones] Declaración presentada → ${emailCliente}: ${result.success ? 'OK' : result.error}`);
      return { success: result.success, error: result.error };
    }),
});
