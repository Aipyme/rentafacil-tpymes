import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { calcularRenta, calcularPrecio, type RespuestasSimulador } from "../lib/motorFiscal";
import { getDb } from "../db";
import { declaraciones } from "../../drizzle/schema";
import { upsertDeclaracionSheet } from "../lib/googleSheets";
import { eq } from "drizzle-orm";
import { generarInformePDF } from "../lib/generarPDF";
import { storagePut } from "../storage";
import { sendEmail } from "../lib/email";
import { buildEmailBienvenida, getDocumentosNecesarios } from "../lib/emailTemplates";

// ============================================================
// Zod schema para las respuestas del simulador
// ============================================================
const RespuestasSchema = z.object({
  // Sección A - Clasificación
  situacion: z.enum(["Asalariado", "Pensionista", "Autónomo", "Desempleado"]),
  mas_de_un_pagador: z.boolean().optional(),
  compra_vivienda: z.boolean().optional(),
  personas_a_cargo: z.boolean().optional(),
  deducciones_check: z.array(z.string()).optional(),

  // Sección B - Cuantificación
  ingresos_brutos: z.number().min(0).optional(),
  retenciones: z.number().min(0).optional(),
  vivienda_fecha: z.string().optional(),
  vivienda_precio: z.number().min(0).optional(),
  vivienda_hipoteca: z.boolean().optional(),
  n_hijos: z.number().min(0).max(20).optional(),
  gasto_gimnasio: z.number().min(0).optional(),
  importe_donaciones: z.number().min(0).optional(),
  importe_planes: z.number().min(0).optional(),

  // Sección C - Comunidad
  comunidad: z.string().optional(),
  autonomica_checks: z.record(z.string(), z.union([z.boolean(), z.number(), z.string()])).optional(),

  // Datos personales
  contribuyente: z.object({
    nif: z.string().optional(),
    nombre: z.string().optional(),
    apellidos: z.string().optional(),
    edad: z.number().optional(),
    discapacidad: z.boolean().optional(),
    porcentaje_discapacidad: z.number().optional(),
  }).optional(),
});

// ============================================================
// In-memory expediente cache (fallback when MySQL is unavailable)
// ============================================================
const expedienteCache = new Map<string, any>();

export const simuladorRouter = router({
  /**
   * Calcular resultado de la declaración (gratis, sin registro)
   */
  calcular: publicProcedure
    .input(RespuestasSchema)
    .mutation(async ({ input }) => {
      const datos = input as RespuestasSimulador;
      const resultado = calcularRenta(datos);
      const precio = calcularPrecio(datos, undefined);
      return { resultado, precio };
    }),

  /**
   * Guardar simulación y crear expediente
   */
  guardarSimulacion: publicProcedure
    .input(z.object({
      respuestas: RespuestasSchema,
      emailContacto: z.string().email().optional(),
      telefonoContacto: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const datos = input.respuestas as RespuestasSimulador;
      const resultado = calcularRenta(datos);
      const precio = calcularPrecio(datos, undefined);

      // Generar ID de expediente
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const randomPart = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      const expedienteId = `RF2025-${randomPart}`;

      const db = await getDb();
      if (db) {
        try {
          await db.insert(declaraciones).values({
            expedienteId,
            estado: "simulacion",
            datosContribuyente: datos as unknown as Record<string, unknown>,
            resultadoCalculo: resultado as unknown as Record<string, unknown>,
            precioBase: precio.precioBase,
            suplementos: precio.suplementos as unknown as Record<string, unknown>,
            precioTotal: precio.precioTotal,
            esComplejo: resultado.es_complejo,
            motivoComplejidad: resultado.motivo_complejidad,
            emailContacto: input.emailContacto,
            telefonoContacto: input.telefonoContacto,
          });
        } catch (dbErr: any) {
          console.warn(`[Simulador] DB insert failed (continuing with Sheet): ${dbErr.message}`);
        }
      } else {
        console.warn(`[Simulador] DB not available, skipping DB insert for ${expedienteId}`);
      }

      // Cache expediente in memory (fallback for getExpediente when DB is down)
      expedienteCache.set(expedienteId, {
        expedienteId,
        estado: "simulacion",
        subestado: "pendiente_pago",
        datosContribuyente: datos,
        resultadoCalculo: resultado,
        precioBase: precio.precioBase,
        suplementos: precio.suplementos,
        precioTotal: precio.precioTotal,
        esComplejo: resultado.es_complejo,
        motivoComplejidad: resultado.motivo_complejidad,
        emailContacto: input.emailContacto,
        telefonoContacto: input.telefonoContacto,
        createdAt: new Date(),
      });

      // ── Escribir en Google Sheet casos_master_v2 (fire-and-forget, no bloquea respuesta) ──
      const _sheetExpId = expedienteId;
      const contrib = (datos.contribuyente as Record<string, unknown>) || {};
      const _sheetRow: Record<string, unknown> = {
        expediente_id: _sheetExpId,
        environment: process.env.NODE_ENV === "production" ? "production" : "test",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source_workflow: "simulador_renta",
        cliente_nombre: `${contrib.nombre || ""} ${contrib.apellidos || ""}`.trim(),
        cliente_email: input.emailContacto || "",
        cliente_telefono: input.telefonoContacto || "",
        nif: (contrib.nif as string) || "",
        ccaa: (datos.comunidad as string) || "",
        situacion_laboral: (datos.situacion as string) || "",
        ingresos_brutos: String(datos.ingresos_brutos || "0"),
        retenciones: String(datos.retenciones || "0"),
        num_pagadores: datos.mas_de_un_pagador ? "2+" : "1",
        num_hijos: String(datos.n_hijos || "0"),
        realiza_donaciones: Array.isArray(datos.deducciones_check) && (datos.deducciones_check as string[]).includes("donaciones") ? "Sí" : "No",
        importe_donaciones: String(datos.importe_donaciones || "0"),
        planes_pensiones: Array.isArray(datos.deducciones_check) && (datos.deducciones_check as string[]).includes("planes_pensiones") ? "Sí" : "No",
        importe_planes: String(datos.importe_planes || "0"),
        compra_vivienda: datos.compra_vivienda ? "Sí" : "No",
        personas_a_cargo: datos.personas_a_cargo ? "Sí" : "No",
        discapacidad: contrib.discapacidad ? "Sí" : "No",
        edad: String(contrib.edad || ""),
        estado: "simulacion",
        subestado: "pendiente_pago",
        complejidad: resultado.es_complejo ? "Complejo" : "Simple",
        motivo_complejidad: resultado.motivo_complejidad || "",
        plan_code: resultado.plan_code || (resultado.es_complejo ? "COMPLEJO" : "SIMPLE"),
        precio_eur: String((precio.precioTotal / 100).toFixed(2)),
        precio_centimos: String(precio.precioTotal),
        precio_base_eur: String((precio.precioBase / 100).toFixed(2)),
        suplementos: JSON.stringify(precio.suplementos || []),
        payment_status: "pending",
        // Resultado del cálculo
        resultado_euros: String(resultado.resultado?.toFixed(2) || "0"),
        resultado_estimado: String(resultado.resultado || ""),
        tipo_resultado: (resultado.resultado || 0) < 0 ? "A devolver" : "A ingresar",
        resultado_borrador: String(resultado.resultado_borrador?.toFixed(2) || "0"),
        ahorro_vs_borrador: String(resultado.ahorro_vs_borrador?.toFixed(2) || "0"),
        base_imponible: String(resultado.base_imponible_general?.toFixed(2) || "0"),
        cuota_integra: String(resultado.cuota_integra_total?.toFixed(2) || "0"),
        cuota_liquida: String(resultado.cuota_liquida?.toFixed(2) || "0"),
        total_deducciones: String(resultado.total_deducciones?.toFixed(2) || "0"),
        // Casillas clave
        casilla_001: String(resultado.casillas?.["001"] || "0"),
        casilla_011: String(resultado.casillas?.["011"] || "0"),
        casilla_545: String(resultado.casillas?.["545"] || "0"),
        casilla_620: String(resultado.casillas?.["620"] || "0"),
        casilla_621: String(resultado.casillas?.["621"] || "0"),
        casilla_670: String(resultado.casillas?.["670"] || "0"),
        observaciones: resultado.motivo_complejidad || "",
      };
      // Await Sheet write with logging — need to debug why fire-and-forget produces no output
      console.log(`[Simulador] About to call upsertDeclaracionSheet for ${_sheetExpId}`);
      try {
        const sheetResult = await upsertDeclaracionSheet(_sheetRow, "casos_master_v2");
        console.log(`[Simulador] Sheet write SUCCESS for ${_sheetExpId}: ${sheetResult.action}`);
      } catch (sheetErr: any) {
        console.error(`[Simulador] Sheet write ERROR for ${_sheetExpId}:`, sheetErr.message || sheetErr);
      }

      // ── Email de bienvenida al cliente (best-effort) ──
      if (input.emailContacto) {
        try {
          const baseUrl = process.env.APP_BASE_URL || "https://rentatpymes.aicheckpyme.co";
          const urlMiRenta = `${baseUrl}/mi-renta/${expedienteId}`;
          const contrib = (datos.contribuyente as Record<string, unknown>) || {};
          const nombreCliente = `${contrib.nombre || ""} ${contrib.apellidos || ""}`.trim();

          const docsNecesarios = getDocumentosNecesarios(datos.situacion, {
            hipoteca: datos.vivienda_hipoteca,
            autonomo: datos.situacion === "Autónomo",
            donaciones: (datos.importe_donaciones || 0) > 0,
            discapacidad: datos.contribuyente?.discapacidad,
          });

          const emailData = buildEmailBienvenida({
            expedienteId,
            nombreCliente,
            emailCliente: input.emailContacto,
            comunidad: (datos.comunidad as string) || "",
            situacion: datos.situacion,
            complejidad: resultado.es_complejo ? "Complejo" : "Simple",
            urlMiRenta,
            documentosNecesarios: docsNecesarios,
          });

          const emailResult = await sendEmail({
            to: input.emailContacto,
            toName: nombreCliente || undefined,
            subject: emailData.subject,
            htmlContent: emailData.html,
          });

          if (emailResult.success) {
            console.log(`[Simulador] Email bienvenida enviado a ${input.emailContacto} (${expedienteId})`);
          } else {
            console.warn(`[Simulador] Email bienvenida no enviado: ${emailResult.error}`);
          }
        } catch (emailErr: any) {
          console.warn(`[Simulador] Error enviando email bienvenida: ${emailErr.message}`);
        }
      }

      return { expedienteId, resultado, precio };
    }),

  /**
   * Diagnóstico: verificar que la SA y Sheet están configurados
   */
  sheetDiag: publicProcedure.query(async () => {
    const sheetId = process.env.GOOGLE_SHEETS_ID;
    const saRaw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const diag: Record<string, unknown> = {
      GOOGLE_SHEETS_ID: sheetId ? `${sheetId.substring(0, 10)}...` : "NOT SET",
      SA_JSON_present: !!saRaw,
      SA_JSON_length: saRaw?.length || 0,
    };
    if (saRaw) {
      try {
        const parsed = JSON.parse(saRaw);
        diag.SA_email = parsed.client_email;
        diag.SA_project = parsed.project_id;
        diag.SA_has_private_key = !!parsed.private_key;
      } catch (e: any) {
        diag.SA_parse_error = e.message;
      }
    }
    // Try a quick Sheet read
    try {
      const result = await upsertDeclaracionSheet(
        { expediente_id: "DIAG-TEST", estado: "test", source_workflow: "diag" },
        "casos_master_v2"
      );
      diag.upsert_result = result;
    } catch (e: any) {
      diag.upsert_error = e.message;
    }
    return diag;
  }),

  /**
   * Obtener expediente por ID
   */
  getExpediente: publicProcedure
    .input(z.object({ expedienteId: z.string() }))
    .query(async ({ input }) => {
      // Try MySQL first
      const db = await getDb();
      if (db) {
        const [expediente] = await db
          .select()
          .from(declaraciones)
          .where(eq(declaraciones.expedienteId, input.expedienteId));
        if (expediente) return expediente;
      }
      // Fallback: in-memory cache (when DB is unavailable)
      const cached = expedienteCache.get(input.expedienteId);
      if (cached) return cached;
      return null;
    }),

  /**
   * Crear sesión de pago Stripe
   */
  crearSesionPago: publicProcedure
    .input(z.object({
      expedienteId: z.string(),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [expediente] = await db
        .select()
        .from(declaraciones)
        .where(eq(declaraciones.expedienteId, input.expedienteId));

      if (!expediente) {
        throw new Error("Expediente no encontrado");
      }

      // TODO: Integrar Stripe cuando se añada la feature
      // Por ahora devolvemos un mock para desarrollo
      const mockSessionId = `cs_test_${Date.now()}`;

      await db!
        .update(declaraciones)
        .set({
          estado: "pendiente_pago",
          stripeSessionId: mockSessionId,
        })
        .where(eq(declaraciones.expedienteId, input.expedienteId));

      return {
        sessionId: mockSessionId,
        checkoutUrl: `${input.successUrl}?expediente=${input.expedienteId}&paid=1`,
      };
    }),

  /**
   * Confirmar pago (llamado desde webhook o redirect)
   */
  confirmarPago: publicProcedure
    .input(z.object({ expedienteId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .update(declaraciones)
        .set({ estado: "pagado" })
        .where(eq(declaraciones.expedienteId, input.expedienteId));
      return { success: true };
    }),

  /**
   * Generar informe PDF con casillas del Modelo 100
   */
  generarPDF: publicProcedure
    .input(z.object({ expedienteId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [expediente] = await db
        .select()
        .from(declaraciones)
        .where(eq(declaraciones.expedienteId, input.expedienteId));

      if (!expediente) throw new Error("Expediente no encontrado");

      const datos = expediente.datosContribuyente as any;
      const resultado = expediente.resultadoCalculo as any;

      const pdfBuffer = await generarInformePDF({
        expedienteId: expediente.expedienteId,
        contribuyente: datos?.contribuyente || {},
        comunidad: datos?.comunidad,
        resultado: resultado || {},
        precioTotal: expediente.precioTotal || 0,
      });

      // Subir a S3
      const fileKey = `informes/${expediente.expedienteId}-modelo100.pdf`;
      const { url } = await storagePut(fileKey, pdfBuffer, "application/pdf");

      // Guardar URL en base de datos
      await db
        .update(declaraciones)
        .set({ informePdfUrl: url })
        .where(eq(declaraciones.expedienteId, input.expedienteId));

      return { url };
    }),

  /**
   * Confirmar deducciones seleccionadas por el cliente
   * Guarda en BD y notifica al asesor asignado
   */
  confirmarDeducciones: publicProcedure
    .input(z.object({
      expedienteId: z.string(),
      deducciones: z.array(z.object({
        id: z.string(),
        nombre: z.string(),
        importe: z.number(),
        tipo: z.enum(["estatal", "autonomica"]),
        normativa: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // Guardar en BD
      await db
        .update(declaraciones)
        .set({
          deduccionesSeleccionadas: input.deducciones as any,
          deduccionesConfirmadasAt: new Date(),
        })
        .where(eq(declaraciones.expedienteId, input.expedienteId));
      // Notificar al asesor (best-effort)
      try {
        const totalAhorro = input.deducciones.reduce((s, d) => s + d.importe, 0);
        const listaHtml = input.deducciones
          .map(d => `<li><strong>${d.nombre}</strong>: ${d.importe.toLocaleString("es-ES", { style: "currency", currency: "EUR" })} (${d.tipo === "estatal" ? "Estatal" : "Auton\u00f3mica"})</li>`)
          .join("");
        const { notifyOwner } = await import("../_core/notification");
        await notifyOwner({
          title: `\u2705 Deducciones confirmadas \u2014 Expediente ${input.expedienteId}`,
          content: `El cliente ha confirmado ${input.deducciones.length} deducci${input.deducciones.length === 1 ? "\u00f3n" : "ones"} con un ahorro total estimado de <strong>${totalAhorro.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</strong>.<br><br><ul>${listaHtml}</ul>`,
        });
      } catch (notifyErr) {
        console.warn("[confirmarDeducciones] Notificaci\u00f3n al asesor fallida (best-effort):", notifyErr);
      }
      return { success: true, total: input.deducciones.length };
    }),

  /**
   * Listar declaraciones (para panel admin)
   */
  listar: publicProcedure
    .input(z.object({
      estado: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(declaraciones)
        .limit(input.limit)
        .offset(input.offset)
        .orderBy(declaraciones.createdAt);
      return rows;
    }),
});
