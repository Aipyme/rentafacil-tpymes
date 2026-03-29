/**
 * Router de borradores — genera PDF + XML y permite descarga
 *
 * Endpoints:
 *  - borrador.generar(expedienteId) → genera PDF + XML, sube a S3, devuelve URLs
 *  - borrador.descargar(expedienteId, tipo) → devuelve presigned URL
 *  - borrador.marcarPresentado(expedienteId, datos) → marca como presentado manualmente
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { declaraciones } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { generarInformePDF } from "../lib/generarPDF";
import { storagePut, storageGet } from "../storage";
import { sendEmail } from "../lib/email";
import { buildEmailBorradorListo } from "../lib/emailTemplates";

export const borradorRouter = router({
  /**
   * Generar borrador completo: PDF informe + XML interno
   * Sube ambos a S3 y guarda las keys en BD
   */
  generar: publicProcedure
    .input(z.object({ expedienteId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [exp] = await db
        .select()
        .from(declaraciones)
        .where(eq(declaraciones.expedienteId, input.expedienteId));

      if (!exp) throw new Error(`Expediente ${input.expedienteId} no encontrado`);

      const datos = (exp.datosContribuyente as any) || {};
      const resultado = (exp.resultadoCalculo as any) || {};
      const contrib = datos.contribuyente || datos;

      // 1. Generar PDF
      const pdfBuffer = await generarInformePDF({
        expedienteId: exp.expedienteId,
        contribuyente: {
          nif: contrib.nif,
          nombre: contrib.nombre,
          apellidos: contrib.apellidos,
        },
        comunidad: datos.comunidad || contrib.comunidad_autonoma,
        resultado,
        precioTotal: exp.precioTotal || 0,
      });

      // 2. Generar XML interno
      const xml = buildXmlInterno(exp);

      // 3. Subir a S3
      const ts = Date.now();
      const pdfKey = `borradores/${input.expedienteId}/${ts}-modelo100.pdf`;
      const xmlKey = `borradores/${input.expedienteId}/${ts}-modelo100.xml`;

      const { url: pdfUrl } = await storagePut(pdfKey, pdfBuffer, "application/pdf");
      const { url: xmlUrl } = await storagePut(xmlKey, Buffer.from(xml, "utf-8"), "application/xml");

      // 4. Guardar en BD
      await db
        .update(declaraciones)
        .set({
          informePdfUrl: pdfUrl,
          subestado: "borrador_listo",
          estadoUpdatedAt: new Date(),
          estadoUpdatedBy: "borrador_generator",
        })
        .where(eq(declaraciones.expedienteId, input.expedienteId));

      // 5. Generar presigned URLs (1 hora)
      let presignedPdf = pdfUrl;
      let presignedXml = xmlUrl;
      try {
        const pdfPresigned = await storageGet(pdfKey, 3600);
        const xmlPresigned = await storageGet(xmlKey, 3600);
        presignedPdf = pdfPresigned.url;
        presignedXml = xmlPresigned.url;
      } catch {
        // Si no funciona presigned, usar URL directa
      }

      console.log(`[Borrador] Generado para ${input.expedienteId}: PDF=${pdfKey}, XML=${xmlKey}`);

      return {
        success: true,
        expedienteId: input.expedienteId,
        pdfUrl: presignedPdf,
        xmlUrl: presignedXml,
        pdfKey,
        xmlKey,
      };
    }),

  /**
   * Generar borrador + enviar email al cliente
   */
  generarYNotificar: publicProcedure
    .input(z.object({
      expedienteId: z.string(),
      resultadoEstimado: z.number().optional(),
      tipoResultado: z.string().optional(),
      ahorroVsBorrador: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [exp] = await db
        .select()
        .from(declaraciones)
        .where(eq(declaraciones.expedienteId, input.expedienteId));

      if (!exp) throw new Error(`Expediente ${input.expedienteId} no encontrado`);

      const datos = (exp.datosContribuyente as any) || {};
      const resultado = (exp.resultadoCalculo as any) || {};
      const contrib = datos.contribuyente || datos;

      // Generar PDF
      const pdfBuffer = await generarInformePDF({
        expedienteId: exp.expedienteId,
        contribuyente: {
          nif: contrib.nif,
          nombre: contrib.nombre,
          apellidos: contrib.apellidos,
        },
        comunidad: datos.comunidad || contrib.comunidad_autonoma,
        resultado,
        precioTotal: exp.precioTotal || 0,
      });

      // Generar XML
      const xml = buildXmlInterno(exp);

      // Subir a S3
      const ts = Date.now();
      const pdfKey = `borradores/${input.expedienteId}/${ts}-modelo100.pdf`;
      const xmlKey = `borradores/${input.expedienteId}/${ts}-modelo100.xml`;

      const { url: pdfUrl } = await storagePut(pdfKey, pdfBuffer, "application/pdf");
      await storagePut(xmlKey, Buffer.from(xml, "utf-8"), "application/xml");

      // Actualizar BD
      await db
        .update(declaraciones)
        .set({
          informePdfUrl: pdfUrl,
          subestado: "borrador_listo",
          estadoUpdatedAt: new Date(),
          estadoUpdatedBy: "borrador_generator",
        })
        .where(eq(declaraciones.expedienteId, input.expedienteId));

      // Enviar email
      const emailCliente = exp.emailContacto;
      if (emailCliente) {
        const nombreCliente = `${contrib.nombre || ""} ${contrib.apellidos || ""}`.trim();
        const baseUrl = process.env.APP_BASE_URL || "https://rentatpymes.aicheckpyme.co";
        const urlMiRenta = `${baseUrl}/mi-renta/${input.expedienteId}`;

        const emailData = buildEmailBorradorListo({
          expedienteId: input.expedienteId,
          nombreCliente,
          urlMiRenta,
          resultadoEstimado: input.resultadoEstimado ?? resultado.resultado_aproximado ?? resultado.resultado,
          tipoResultado: input.tipoResultado ?? resultado.tipo_resultado,
          ahorroVsBorrador: input.ahorroVsBorrador ?? resultado.ahorro_vs_borrador,
        });

        await sendEmail({
          to: emailCliente,
          toName: nombreCliente || undefined,
          subject: emailData.subject,
          htmlContent: emailData.html,
        });
      }

      return { success: true, pdfUrl, emailSent: !!emailCliente };
    }),

  /**
   * Marcar expediente como presentado manualmente ante AEAT
   */
  marcarPresentado: publicProcedure
    .input(z.object({
      expedienteId: z.string(),
      resultadoFinal: z.number(),
      tipoResultado: z.enum(["a_devolver", "a_pagar"]),
      numeroCsvAeat: z.string().optional(),
      fechaPresentacion: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(declaraciones)
        .set({
          estado: "completado",
          subestado: "presentada_aeat",
          estadoUpdatedAt: new Date(),
          estadoUpdatedBy: "asesor_manual",
        })
        .where(eq(declaraciones.expedienteId, input.expedienteId));

      console.log(`[Borrador] Expediente ${input.expedienteId} marcado como presentado (CSV: ${input.numeroCsvAeat || 'N/A'})`);

      return { success: true };
    }),
});

// ============================================================
// Helper: construir XML interno (simplificado del generateXml.ts)
// ============================================================

function buildXmlInterno(exp: any): string {
  const datos = (exp.datosContribuyente as any) || {};
  const resultado = (exp.resultadoCalculo as any) || {};
  const contrib = datos.contribuyente || datos;
  const esc = (v: unknown) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!--
  XML INTERNO — Renta Fácil TPymes
  Ejercicio: 2025 | Modelo: 100
  Generado: ${new Date().toISOString()}
  NOTA: Este XML es para revisión del asesor, NO para presentación directa ante AEAT.
-->
<declaracion ejercicio="2025" modelo="100" tipo="borrador_interno">
  <meta>
    <expediente_id>${esc(exp.expedienteId)}</expediente_id>
    <estado>${esc(exp.estado)}</estado>
    <generado_en>${new Date().toISOString()}</generado_en>
  </meta>
  <contribuyente>
    <nif>${esc(contrib.nif)}</nif>
    <nombre>${esc(contrib.nombre)} ${esc(contrib.apellidos)}</nombre>
    <comunidad>${esc(datos.comunidad || contrib.comunidad_autonoma)}</comunidad>
    <situacion>${esc(datos.situacion)}</situacion>
  </contribuyente>
  <resultado>
    <ingresos_brutos>${esc(resultado.ingresos_brutos || datos.ingresos_brutos || 0)}</ingresos_brutos>
    <retenciones>${esc(resultado.retenciones || datos.retenciones || 0)}</retenciones>
    <base_imponible_general>${esc(resultado.base_imponible_general || 0)}</base_imponible_general>
    <cuota_integra_total>${esc(resultado.cuota_integra_total || 0)}</cuota_integra_total>
    <total_deducciones>${esc(resultado.total_deducciones || 0)}</total_deducciones>
    <cuota_liquida>${esc(resultado.cuota_liquida || 0)}</cuota_liquida>
    <resultado_declaracion>${esc(resultado.resultado || 0)}</resultado_declaracion>
    <resultado_borrador_aeat>${esc(resultado.resultado_borrador || 0)}</resultado_borrador_aeat>
    <ahorro_vs_borrador>${esc(resultado.ahorro_vs_borrador || 0)}</ahorro_vs_borrador>
    <es_complejo>${esc(resultado.es_complejo || false)}</es_complejo>
    <tipo_resultado>${esc(resultado.tipo_resultado || "")}</tipo_resultado>
  </resultado>
</declaracion>`;
}
