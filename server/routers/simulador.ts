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
import { buildEmailBienvenida, buildEmailConfirmacionDeducciones, getDocumentosNecesarios } from "../lib/emailTemplates";

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
      const _now = new Date();
      const _nowEs = _now.toLocaleString("es-ES", { timeZone: "Europe/Madrid" });
      const _dedCheck = Array.isArray(datos.deducciones_check) ? (datos.deducciones_check as string[]) : [];
      const _precioEur = (precio.precioTotal / 100).toFixed(2);
      const _desglose = resultado.desglose_deducciones || {};
      const _sheetRow: Record<string, unknown> = {
        // ── Columnas 1-5: Identificación ──
        expediente_id: _sheetExpId,
        environment: process.env.NODE_ENV === "production" ? "production" : "test",
        created_at: _now.toISOString(),
        updated_at: _now.toISOString(),
        source_workflow: "simulador_renta",
        // ── Columnas 6-9: Cliente ──
        cliente_nombre: `${contrib.nombre || ""} ${contrib.apellidos || ""}`.trim(),
        cliente_email: input.emailContacto || "",
        cliente_telefono: input.telefonoContacto || "",
        nif: (contrib.nif as string) || "",
        // ── Columnas 10-30: Datos fiscales ──
        nif_normalizado: (contrib.nif as string) || "",
        nif_valido: contrib.nif ? "Sí" : "No",
        ccaa: (datos.comunidad as string) || "",
        estado_civil: (contrib.estado_civil as string) || "",
        num_hijos: String(datos.n_hijos || "0"),
        tipo_declaracion: "Individual",
        contacto_preferido: "email",
        situacion_laboral: (datos.situacion as string) || "",
        ingresos_brutos: String(datos.ingresos_brutos || "0"),
        num_pagadores: datos.mas_de_un_pagador ? "2+" : "1",
        tiene_actividad_economica: datos.regimen_autonomo ? "Sí" : "No",
        tiene_inmuebles_alquilados: datos.tiene_capital_inmobiliario ? "Sí" : "No",
        tiene_inversiones: datos.tiene_ganancias_patrimoniales ? "Sí" : "No",
        tiene_discapacidad: contrib.discapacidad ? "Sí" : "No",
        porcentaje_discapacidad: String(contrib.porcentaje_discapacidad || "0"),
        realiza_donaciones: _dedCheck.includes("donaciones") ? "Sí" : "No",
        tiene_plan_pensiones: _dedCheck.includes("planes_pensiones") ? "Sí" : "No",
        tipo_vivienda: datos.vivienda_hipoteca ? "Con hipoteca" : "Sin hipoteca",
        hipoteca_anterior_2013: datos.vivienda_hipoteca && datos.vivienda_fecha && new Date(datos.vivienda_fecha as string) < new Date("2013-01-01") ? "Sí" : "No",
        otros_rendimientos_descripcion: "",
        deducciones_conocidas: _dedCheck.join(", "),
        // ── Columnas 31-36: Estado y precio ──
        estado: "simulacion",
        subestado: "pendiente_pago",
        complejidad: resultado.es_complejo ? "Complejo" : "Simple",
        plan_code: resultado.plan_code || (resultado.es_complejo ? "COMPLEJO" : "SIMPLE"),
        precio: _precioEur,
        payment_status: "pending",
        // ── Columnas 37-41: Resultado fiscal ──
        payment_confirmed_at: "",
        resultado_estimado: String(resultado.resultado?.toFixed(2) || "0"),
        tipo_resultado: (resultado.resultado || 0) < 0 ? "A devolver" : "A ingresar",
        resultado_final: "",
        importe_resultado: String(resultado.resultado?.toFixed(2) || "0"),
        // ── Columnas 42-59: Gestión ──
        documentos_necesarios: "",
        documentos_recibidos: "No",
        asesor_asignado: "",
        asesor_email: "",
        prioridad: resultado.es_complejo ? "Alta" : "Normal",
        fecha_contacto: "",
        fecha_revision: "",
        fecha_presentacion: "",
        calendar_event_id: "",
        calendar_start: "",
        calendar_end: "",
        ultimo_recordatorio: "",
        reminder_count: "0",
        flag_revision: resultado.es_complejo ? "Sí" : "No",
        confianza_clasificacion: "Alta",
        razones_clasificacion: resultado.motivo_complejidad || "",
        observaciones: resultado.motivo_complejidad || "",
        raw_id_caso: _sheetExpId,
        // ── Columnas 60-97: Datos fiscales detallados ──
        legacy_timestamp: _nowEs,
        retenciones_trabajo: String(datos.retenciones || "0"),
        retenciones_capital_mob: "0",
        retenciones_arrendamientos: "0",
        retenciones_act_econ: "0",
        pagos_fraccionados: "0",
        total_pagos_cuenta: String(datos.retenciones || "0"),
        base_imponible_general: String(resultado.base_imponible_general?.toFixed(2) || "0"),
        base_imponible_ahorro: "0",
        cuota_resultante: String(resultado.cuota_liquida?.toFixed(2) || "0"),
        resultado_declaracion: String(resultado.resultado?.toFixed(2) || "0"),
        deduccion_vivienda_pre2013: String(resultado.deduccion_vivienda?.toFixed(2) || "0"),
        minimo_contribuyente: "5550.00",
        minimo_descendientes: "0",
        minimo_discapacidad: String(resultado.deduccion_discapacidad?.toFixed(2) || "0"),
        deduccion_donativos: String(resultado.deduccion_donaciones?.toFixed(2) || "0"),
        deducciones_autonomicas: String(resultado.deducciones_autonomicas?.toFixed(2) || "0"),
        segundo_pagador_importe: String(datos.segundo_pagador_importe || "0"),
        tipo_actividad: (datos.regimen_autonomo as string) || "",
        dividendos_recibidos: String(datos.importe_capital_mobiliario || "0"),
        importe_donaciones: String(datos.importe_donaciones || "0"),
        aportacion_pensiones: String(datos.importe_planes || "0"),
        amortizacion_hipoteca: String(datos.vivienda_precio || "0"),
        raw_payload: JSON.stringify({ situacion: datos.situacion, comunidad: datos.comunidad, ingresos: datos.ingresos_brutos }),
        ruta_preguntas: "",
        n8n_execution_id: "",
        estado_updated_by: "simulador_backend",
        deduccion_gym_deporte: String((_desglose as any).gimnasio?.toFixed(2) || "0"),
        deduccion_guarderia: String((_desglose as any).guarderia?.toFixed(2) || "0"),
        deduccion_material_escolar: "0",
        deduccion_alquiler_vivienda: String((_desglose as any).alquiler?.toFixed(2) || "0"),
        deduccion_familia_numerosa: String((_desglose as any).familia_numerosa?.toFixed(2) || "0"),
        deduccion_maternidad: String((_desglose as any).maternidad?.toFixed(2) || "0"),
        deduccion_nacimiento_adopcion: String((_desglose as any).nacimiento?.toFixed(2) || "0"),
        deduccion_dependencia_mayores: "0",
        es_derivacion: resultado.es_complejo ? "Sí" : "No",
        motivo_derivacion: resultado.motivo_complejidad || "",
        derivacion_timestamp: resultado.es_complejo ? _now.toISOString() : "",
        // ── Columnas 98-153: Legacy (uniformidad con n8n) ──
        id_caso: _sheetExpId,
        timestamp: _nowEs,
        nombreCompleto: `${contrib.nombre || ""} ${contrib.apellidos || ""}`.trim(),
        email: input.emailContacto || "",
        telefono: input.telefonoContacto || "",
        comunidadAutonoma: (datos.comunidad as string) || "",
        estadoCivil: (contrib.estado_civil as string) || "",
        numHijos: String(datos.n_hijos || "0"),
        rendimientosTrabajo: String(datos.ingresos_brutos || "0"),
        numPagadores: datos.mas_de_un_pagador ? "2" : "1",
        tieneActividadEconomica: datos.regimen_autonomo ? "Si" : "No",
        tieneInmueblesAlquilados: datos.tiene_capital_inmobiliario ? "Si" : "No",
        tieneInversiones: datos.tiene_ganancias_patrimoniales ? "Si" : "No",
        tieneDiscapacidad: contrib.discapacidad ? "Si" : "No",
        realizaDonaciones: _dedCheck.includes("donaciones") ? "Si" : "No",
        tienePlanPensiones: _dedCheck.includes("planes_pensiones") ? "Si" : "No",
        aceptaPolitica: "Si",
        aceptaTratamiento: "Si",
        fecha_creacion: _nowEs,
        contactoPreferido: "email",
        situacionLaboral: (datos.situacion as string) || "",
        ingresosBrutos: String(datos.ingresos_brutos || "0"),
        tipoVivienda: datos.vivienda_hipoteca ? "Con hipoteca" : "Sin hipoteca",
        hipotecaAnterior2013: datos.vivienda_hipoteca ? "Si" : "No",
        otrosRendimientosDescripcion: "",
        deduccionesConocidas: _dedCheck.join(", "),
        porcentajeDiscapacidad: String(contrib.porcentaje_discapacidad || "0"),
        tipo: resultado.es_complejo ? "Compleja" : "Simple",
        expedienteId: _sheetExpId,
        plan: resultado.plan_code || (resultado.es_complejo ? "COMPLETO" : "BASICO"),
        deduccionesDetectadas: _dedCheck.join(", "),
        documentosNecesarios: "",
        fechaRegistro: _nowEs,
        nombreEmpresa: "",
        nifPagador: (contrib.nif as string) || "",
        asesorAsignado: "",
        notasAsesor: "",
        documentosRecibidos: "No",
        fechaContacto: "",
        fechaRevision: "",
        resultadoFinal: "",
        importeResultado: String(resultado.resultado?.toFixed(2) || "0"),
        fechaPresentacion: "",
        ultimoRecordatorio: "",
        tipoResultado: (resultado.resultado || 0) < 0 ? "A devolver" : "A ingresar",
        resultadoEstimado: String(resultado.resultado?.toFixed(2) || "0"),
        prompt_sistema: "",
        prompt_usuario: "",
        clasificacion: resultado.es_complejo ? "Compleja" : "Simple",
        nivel: resultado.es_complejo ? "alto" : "bajo",
        ruta: "",
        confianza: "Alta",
        razones: resultado.motivo_complejidad || "",
        id_caso_buscar: _sheetExpId,
        contacto: input.emailContacto || "",
        datos_contribuyente: JSON.stringify({ nif: contrib.nif, nombre: contrib.nombre, apellidos: contrib.apellidos, edad: contrib.edad }),
      };
      // Await Sheet write with logging — need to debug why fire-and-forget produces no output
      console.log(`[Simulador] About to call upsertDeclaracionSheet for ${_sheetExpId}`);
      try {
        const sheetResult = await upsertDeclaracionSheet(_sheetRow, "casos_master_v2");
        console.log(`[Simulador] Sheet write SUCCESS for ${_sheetExpId}: ${sheetResult.action}`);
      } catch (sheetErr: any) {
        console.error(`[Simulador] Sheet write ERROR for ${_sheetExpId}:`, sheetErr.message || sheetErr);
      }

      // ── Si es complejo → grabar también en hoja Derivaciones ──
      if (resultado.es_complejo) {
        const _derivRow: Record<string, unknown> = {
          ..._sheetRow,
          hoja: "Derivaciones",
          motivo_derivacion: resultado.motivo_complejidad || "Caso complejo",
          fecha_derivacion: new Date().toISOString(),
          estado_derivacion: "pendiente_asignacion",
          asesor_asignado: "",
          prioridad: resultado.motivo_complejidad?.includes("autónomo") ? "Alta" : "Normal",
        };
        try {
          const derivResult = await upsertDeclaracionSheet(_derivRow, "Derivaciones");
          console.log(`[Simulador] Derivaciones write for ${_sheetExpId}: ${derivResult.action}`);
        } catch (derivErr: any) {
          console.error(`[Simulador] Derivaciones write ERROR for ${_sheetExpId}:`, derivErr.message || derivErr);
        }
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
      // Obtener datos del expediente para el email
      const [expData] = await db
        .select()
        .from(declaraciones)
        .where(eq(declaraciones.expedienteId, input.expedienteId));

      const totalAhorro = input.deducciones.reduce((s, d) => s + d.importe, 0);

      // Notificar al asesor (best-effort)
      try {
        const listaHtml = input.deducciones
          .map(d => `<li><strong>${d.nombre}</strong>: ${d.importe.toLocaleString("es-ES", { style: "currency", currency: "EUR" })} (${d.tipo === "estatal" ? "Estatal" : "Autonómica"})</li>`)
          .join("");
        const { notifyOwner } = await import("../_core/notification");
        await notifyOwner({
          title: `✅ Deducciones confirmadas — Expediente ${input.expedienteId}`,
          content: `El cliente ha confirmado ${input.deducciones.length} deducci${input.deducciones.length === 1 ? "ón" : "ones"} con un ahorro total estimado de <strong>${totalAhorro.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</strong>.<br><br><ul>${listaHtml}</ul>`,
        });
      } catch (notifyErr) {
        console.warn("[confirmarDeducciones] Notificación al asesor fallida (best-effort):", notifyErr);
      }

      // Enviar email de confirmación al cliente (best-effort)
      try {
        const emailCliente = expData?.emailContacto;
        if (emailCliente && input.deducciones.length > 0) {
          const datos = (expData?.datosContribuyente as any) || {};
          const nombreCliente = `${datos?.contribuyente?.nombre || datos?.nombre || ""} ${datos?.contribuyente?.apellidos || datos?.apellidos || ""}`.trim() || "Cliente";
          const baseUrl = process.env.APP_BASE_URL || "https://rentatpymes.aicheckpyme.co";
          const urlMiRenta = `${baseUrl}/mi-renta/${input.expedienteId}`;

          const { subject, html } = buildEmailConfirmacionDeducciones({
            expedienteId: input.expedienteId,
            nombreCliente,
            deducciones: input.deducciones,
            ahorroTotal: totalAhorro,
            urlMiRenta,
          });

          await sendEmail({ to: emailCliente, subject, htmlContent: html });
          console.log(`[confirmarDeducciones] Email enviado a ${emailCliente} para expediente ${input.expedienteId}`);
        }
      } catch (emailErr) {
        console.warn("[confirmarDeducciones] Email al cliente fallido (best-effort):", emailErr);
      }

      return { success: true, total: input.deducciones.length };
    }),

  /**
   * Recalcular resultado fiscal con datos completos del wizard post-pago
   * Permite calcular en tiempo real sin guardar (para preview)
   */
  recalcularConDatos: publicProcedure
    .input(z.object({
      datos: RespuestasSchema.extend({
        segundo_pagador_importe: z.number().optional(),
        tiene_capital_mobiliario: z.boolean().optional(),
        importe_capital_mobiliario: z.number().optional(),
        tiene_capital_inmobiliario: z.boolean().optional(),
        importe_capital_inmobiliario: z.number().optional(),
        tiene_ganancias_patrimoniales: z.boolean().optional(),
        importe_ganancias_patrimoniales: z.number().optional(),
        tiene_prestaciones: z.boolean().optional(),
        tiene_imputacion_rentas: z.boolean().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const resultado = calcularRenta(input.datos as RespuestasSimulador);
      return { resultado };
    }),

  /**
   * Guardar datos completos del wizard post-pago y recalcular
   * Actualiza datosContribuyente y resultadoCalculo en la BD
   */
  actualizarDatosWizard: publicProcedure
    .input(z.object({
      expedienteId: z.string(),
      datos: RespuestasSchema.extend({
        segundo_pagador_importe: z.number().optional(),
        tiene_capital_mobiliario: z.boolean().optional(),
        importe_capital_mobiliario: z.number().optional(),
        tiene_capital_inmobiliario: z.boolean().optional(),
        importe_capital_inmobiliario: z.number().optional(),
        tiene_ganancias_patrimoniales: z.boolean().optional(),
        importe_ganancias_patrimoniales: z.number().optional(),
        tiene_prestaciones: z.boolean().optional(),
        tiene_imputacion_rentas: z.boolean().optional(),
      }),
      resultadoBorrador: z.number().optional(), // resultado del borrador de Hacienda
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const resultado = calcularRenta(input.datos as RespuestasSimulador);

      // Enriquecer resultado con comparación del borrador si se proporcionó
      const resultadoFinal = {
        ...resultado,
        resultado_borrador_hacienda: input.resultadoBorrador ?? resultado.resultado_borrador,
        ahorro_vs_borrador_hacienda: input.resultadoBorrador !== undefined
          ? Math.round((input.resultadoBorrador - resultado.resultado) * 100) / 100
          : resultado.ahorro_vs_borrador,
      };

      // Determinar si hay que derivar automáticamente al asesor
      const esComplejo = resultado.es_complejo || false;
      const motivoComplejidad = resultado.motivo_complejidad || "";
      const nuevoEstado = esComplejo ? "derivado" : undefined;

      await db
        .update(declaraciones)
        .set({
          datosContribuyente: input.datos as any,
          resultadoCalculo: resultadoFinal as any,
          deduccionesConfirmadasAt: new Date(),
          deduccionesSeleccionadas: resultado.desglose_deducciones as any,
          ...(nuevoEstado ? { estado: nuevoEstado } : {}),
        })
        .where(eq(declaraciones.expedienteId, input.expedienteId));

      // Notificar al asesor (best-effort)
      try {
        const { notifyOwner } = await import("../_core/notification");
        const ahorroTotal = resultadoFinal.ahorro_vs_borrador_hacienda;
        const resultadoStr = resultado.resultado < 0
          ? `A devolver: ${Math.abs(resultado.resultado).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}`
          : `A ingresar: ${resultado.resultado.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}`;

        if (esComplejo) {
          // Notificación urgente de derivación
          await notifyOwner({
            title: `🚨 DERIVACIÓN AUTOMÁTICA — Expediente ${input.expedienteId}`,
            content: `El motor fiscal ha detectado complejidad y ha derivado automáticamente este expediente.<br><br><strong>Motivo:</strong> ${motivoComplejidad}<br><strong>Resultado calculado:</strong> ${resultadoStr}<br><strong>Acción requerida:</strong> Revisar el expediente y contactar con el cliente.`,
          });
        } else {
          await notifyOwner({
            title: `🎯 Wizard completado — Expediente ${input.expedienteId}`,
            content: `El cliente ha completado el wizard fiscal.<br><br><strong>Resultado:</strong> ${resultadoStr}<br><strong>Ahorro vs borrador:</strong> ${ahorroTotal.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}<br><strong>Deducciones aplicadas:</strong> ${resultado.desglose_deducciones.length}`,
          });
        }
      } catch (e) {
        console.warn("[actualizarDatosWizard] Notificación fallida:", e);
      }

      return {
        resultado: resultadoFinal,
        success: true,
        derivado: esComplejo,
        motivoDerivacion: motivoComplejidad,
      };
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
