import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { calcularRenta, calcularPrecio, type RespuestasSimulador } from "../lib/motorFiscal";
import { getDb } from "../db";
import { declaraciones } from "../../drizzle/schema";
import { upsertDeclaracionSheet, leerCasosSheet, aplicarFormatoCondicionalSheet } from "../lib/googleSheets";
import { eq } from "drizzle-orm";
import { generarInformePDF } from "../lib/generarPDF";
import { storagePut } from "../storage";
import { sendEmail } from "../lib/email";
import { buildEmailBienvenida, buildEmailConfirmacionDeducciones, buildEmailResultadoSimulacion, getDocumentosNecesarios } from "../lib/emailTemplates";

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
    estado_civil: z.enum(["Soltero/a", "Casado/a", "Divorciado/a", "Viudo/a", "Pareja de hecho"]).optional(),
    // Datos empresa pagadora
    empresa_nombre: z.string().optional(),
    empresa_nif: z.string().optional(),
    // Documentación previa
    tiene_datos_aeat: z.boolean().optional(),
    tiene_referencia_catastral: z.boolean().optional(),
    // Preferencia de contacto
    contacto_preferido: z.string().optional(),
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
      // ── Fila completa para casos_master_v2 (153 columnas exactas del Sheet) ──
      const _nombreCompleto = `${contrib.nombre || ""} ${contrib.apellidos || ""}`.trim();
      const _esHipotecaPre2013 = datos.vivienda_hipoteca && datos.vivienda_fecha &&
        new Date(datos.vivienda_fecha as string) < new Date("2013-01-01");
      const _retenciones = Number(datos.retenciones || resultado.retenciones || 0);
      const _ingresos = Number(datos.ingresos_brutos || resultado.ingresos_brutos || 0);
      const _nHijos = Number(datos.n_hijos || 0);
      const _pctDiscap = Number(contrib.porcentaje_discapacidad || 0);
      const _impteDonaciones = Number(datos.importe_donaciones || 0);
      const _aportPlanes = Number(datos.importe_planes || 0);
      const _rawPayload = JSON.stringify({ situacion: datos.situacion, comunidad: datos.comunidad, ingresos: _ingresos });
      const _contactoJson = JSON.stringify({ nombre: _nombreCompleto, email: input.emailContacto || "", telefono: input.telefonoContacto || "" });
      const _datosContribJson = JSON.stringify({
        nif: (contrib.nif as string) || "",
        nombre: contrib.nombre || "",
        apellidos: contrib.apellidos || "",
        edad: contrib.edad || "",
      });
      const _sheetRow: Record<string, unknown> = {
        // ── BLOQUE 1: Identificación del expediente (cols 1-5) ──
        expediente_id:      _sheetExpId,
        environment:        process.env.NODE_ENV === "production" ? "production" : "test",
        created_at:         _nowEs,
        updated_at:         _nowEs,
        source_workflow:    "simulador_renta",

        // ── BLOQUE 2: Datos del cliente (cols 6-11) ──
        cliente_nombre:     _nombreCompleto,
        cliente_email:      input.emailContacto || "",
        cliente_telefono:   input.telefonoContacto || "",
        nif:                (contrib.nif as string) || "",
        nif_normalizado:    ((contrib.nif as string) || "").toUpperCase().replace(/[^A-Z0-9]/g, ""),
        nif_valido:         contrib.nif ? "Si" : "No",

        // ── BLOQUE 3: Datos personales y fiscales básicos (cols 12-30) ──
        ccaa:               (datos.comunidad as string) || "",
        estado_civil:       (contrib.estado_civil as string) || "",
        num_hijos:          String(_nHijos),
        tipo_declaracion:   "Individual",
        contacto_preferido: input.telefonoContacto ? "telefono" : "email",
        situacion_laboral:  datos.situacion || "",
        ingresos_brutos:    String(_ingresos),
        num_pagadores:      datos.mas_de_un_pagador ? "2+" : "1",
        tiene_actividad_economica:   datos.situacion === "Autónomo" ? "Si" : "No",
        tiene_inmuebles_alquilados:  _dedCheck.includes("alquiler") ? "Si" : "No",
        tiene_inversiones:           _dedCheck.includes("inversiones") ? "Si" : "No",
        tiene_discapacidad:          contrib.discapacidad ? "Si" : "No",
        porcentaje_discapacidad:     String(_pctDiscap),
        realiza_donaciones:          _impteDonaciones > 0 ? "Si" : "No",
        tiene_plan_pensiones:        _aportPlanes > 0 ? "Si" : "No",
        tipo_vivienda:               datos.vivienda_hipoteca ? "Con hipoteca" : "Sin hipoteca",
        hipoteca_anterior_2013:      _esHipotecaPre2013 ? "Si" : "No",
        otros_rendimientos_descripcion: "",
        deducciones_conocidas:       _dedCheck.join(", "),

        // ── BLOQUE 4: Estado del expediente (cols 31-44) ──
        estado:             "simulacion",
        subestado:          "pendiente_pago",
        complejidad:        resultado.es_complejo ? "Complejo" : "Simple",
        plan_code:          resultado.plan_code || (resultado.es_complejo ? "COMPLEJA" : "SIMPLE"),
        precio:             _precioEur,
        payment_status:     "pending",
        payment_confirmed_at: "",
        resultado_estimado: String((resultado.resultado || 0).toFixed(2)),
        tipo_resultado:     (resultado.resultado || 0) < 0 ? "A devolver" : "A ingresar",
        resultado_final:    "",
        importe_resultado:  String((resultado.resultado || 0).toFixed(2)),
        documentos_necesarios: "",
        documentos_recibidos:  "No",
        asesor_asignado:    "",

        // ── BLOQUE 5: Gestión y seguimiento (cols 45-60) ──
        asesor_email:       "",
        prioridad:          resultado.es_complejo ? "Alta" : "Media",
        fecha_contacto:     "",
        fecha_revision:     "",
        fecha_presentacion: "",
        calendar_event_id:  "",
        calendar_start:     "",
        calendar_end:       "",
        ultimo_recordatorio: "",
        reminder_count:     "0",
        flag_revision:      resultado.flag_review ? "Si" : "No",
        confianza_clasificacion: "Alta",
        razones_clasificacion:   resultado.motivo_complejidad || (resultado.flags || []).join(" | ") || "",
        observaciones:      resultado.motivo_complejidad || (resultado.flags || []).join(" | ") || "",
        raw_id_caso:        _sheetExpId,
        legacy_timestamp:   _nowEs,

        // ── BLOQUE 6: Retenciones e importes fiscales detallados (cols 61-82) ──
        retenciones_trabajo:        String(_retenciones.toFixed(2)),
        retenciones_capital_mob:    "0",
        retenciones_arrendamientos: "0",
        retenciones_act_econ:       "0",
        pagos_fraccionados:         "0",
        total_pagos_cuenta:         String(_retenciones.toFixed(2)),
        base_imponible_general:     String((resultado.base_imponible_general || 0).toFixed(2)),
        base_imponible_ahorro:      "0",
        cuota_resultante:           String(((resultado.cuota_liquida || 0)).toFixed(2)),
        resultado_declaracion:      String((resultado.resultado || 0).toFixed(2)),
        deduccion_vivienda_pre2013: String((resultado.deduccion_vivienda || 0).toFixed(2)),
        minimo_contribuyente:       String((resultado.casillas?.minimo_personal || 5550).toFixed(2)),
        minimo_descendientes:       String((_nHijos > 0 ? (_nHijos >= 4 ? 13800 : _nHijos >= 3 ? 9100 : _nHijos >= 2 ? 5100 : 2400) : 0).toFixed(2)),
        minimo_discapacidad:        String((resultado.deduccion_discapacidad || 0).toFixed(2)),
        deduccion_donativos:        String((resultado.deduccion_donaciones || 0).toFixed(2)),
        deducciones_autonomicas:    String((resultado.deducciones_autonomicas || 0).toFixed(2)),
        segundo_pagador_importe:    "0",
        tipo_actividad:             datos.situacion === "Autónomo" ? "Actividad económica" : "",
        dividendos_recibidos:       "0",
        importe_donaciones:         String(_impteDonaciones.toFixed(2)),
        aportacion_pensiones:       String(_aportPlanes.toFixed(2)),
        amortizacion_hipoteca:      String((datos.vivienda_precio ? Number(datos.vivienda_precio) * 0.03 : 0).toFixed(2)),

        // ── BLOQUE 7: Metadatos técnicos (cols 83-97) ──
        raw_payload:        _rawPayload,
        ruta_preguntas:     "",
        n8n_execution_id:   "",
        estado_updated_by:  "simulador_backend",
        deduccion_gym_deporte:          String((resultado.desglose_deducciones?.find((d: any) => d.concepto?.includes("deporte") || d.concepto?.includes("gym"))?.importe || 0).toFixed(2)),
        deduccion_guarderia:            "0",
        deduccion_material_escolar:     "0",
        deduccion_alquiler_vivienda:    "0",
        deduccion_familia_numerosa:     String((resultado.deduccion_familia_numerosa || 0).toFixed(2)),
        deduccion_maternidad:           String((resultado.deduccion_maternidad || 0).toFixed(2)),
        deduccion_nacimiento_adopcion:  "0",
        deduccion_dependencia_mayores:  "0",
        es_derivacion:      resultado.es_complejo ? "Si" : "No",
        motivo_derivacion:  resultado.motivo_complejidad || "",
        derivacion_timestamp: resultado.es_complejo ? _now.toISOString() : "",

        // ── BLOQUE 8: Campos legacy camelCase (cols 98-153) ──
        id_caso:            _sheetExpId,
        timestamp:          _nowEs,
        nombreCompleto:     _nombreCompleto,
        email:              input.emailContacto || "",
        telefono:           input.telefonoContacto || "",
        comunidadAutonoma:  (datos.comunidad as string) || "",
        estadoCivil:        (contrib.estado_civil as string) || "",
        numHijos:           String(_nHijos),
        rendimientosTrabajo: String(_ingresos),
        numPagadores:       datos.mas_de_un_pagador ? "2" : "1",
        tieneActividadEconomica:  datos.situacion === "Autónomo" ? "Si" : "No",
        tieneInmueblesAlquilados: _dedCheck.includes("alquiler") ? "Si" : "No",
        tieneInversiones:         _dedCheck.includes("inversiones") ? "Si" : "No",
        tieneDiscapacidad:        contrib.discapacidad ? "Si" : "No",
        realizaDonaciones:        _impteDonaciones > 0 ? "Si" : "No",
        tienePlanPensiones:       _aportPlanes > 0 ? "Si" : "No",
        aceptaPolitica:     "Si",
        aceptaTratamiento:  "Si",
        fecha_creacion:     _nowEs,
        contactoPreferido:  input.telefonoContacto ? "telefono" : "email",
        situacionLaboral:   datos.situacion || "",
        ingresosBrutos:     String(_ingresos),
        tipoVivienda:       datos.vivienda_hipoteca ? "Con hipoteca" : "Sin hipoteca",
        hipotecaAnterior2013: _esHipotecaPre2013 ? "Si" : "No",
        otrosRendimientosDescripcion: "",
        deduccionesConocidas: _dedCheck.join(", "),
        porcentajeDiscapacidad: String(_pctDiscap),
        tipo:               resultado.es_complejo ? "Compleja" : "Simple",
        expedienteId:       _sheetExpId,
        plan:               resultado.plan_code || (resultado.es_complejo ? "COMPLEJA" : "SIMPLE"),
        deduccionesDetectadas: _dedCheck.join(", "),
        documentosNecesarios: "",
        fechaRegistro:      _nowEs,
        nombreEmpresa:      "",
        nifPagador:         (contrib.nif as string) || "",
        asesorAsignado:     "",
        notasAsesor:        "",
        documentosRecibidos: "No",
        fechaContacto:      "",
        fechaRevision:      "",
        resultadoFinal:     "",
        importeResultado:   String((resultado.resultado || 0).toFixed(2)),
        fechaPresentacion:  "",
        ultimoRecordatorio: "",
        tipoResultado:      (resultado.resultado || 0) < 0 ? "A devolver" : "A ingresar",
        resultadoEstimado:  String((resultado.resultado || 0).toFixed(2)),
        prompt_sistema:     "",
        prompt_usuario:     "",
        clasificacion:      resultado.es_complejo ? "Compleja" : "Simple",
        nivel:              resultado.es_complejo ? "alto" : "bajo",
        ruta:               "",
        confianza:          "Alta",
        razones:            resultado.motivo_complejidad || (resultado.flags || []).join(" | ") || "",
        id_caso_buscar:     _sheetExpId,
        contacto:           input.emailContacto || "",
        datos_contribuyente: _datosContribJson,
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
      // Columnas exactas: derivacion_id | expediente_id | nombre | email | telefono | motivo | reserved_slot | estado | timestamp
      if (resultado.es_complejo) {
        const nombreCompleto = [
          (input.respuestas.contribuyente as any)?.nombre || "",
          (input.respuestas.contribuyente as any)?.apellidos || "",
        ].filter(Boolean).join(" ") || (input.respuestas.contribuyente as any)?.nombreCompleto || "";
        const _derivRow: Record<string, unknown> = {
          derivacion_id: `DRV-${_sheetExpId}`,
          expediente_id: _sheetExpId,
          nombre: nombreCompleto,
          email: input.emailContacto || "",
          telefono: input.telefonoContacto || "",
          motivo: resultado.motivo_complejidad || "Caso complejo",
          reserved_slot: "",
          estado: "pendiente_asignacion",
          timestamp: new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" }),
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

          // Determinar tipo de resultado fiscal
          const _resVal = resultado.resultado;
          const _tipoRes = _resVal < 0 ? "a_devolver" : _resVal > 0 ? "a_pagar" : "sin_resultado";

          const emailData = buildEmailBienvenida({
            expedienteId,
            nombreCliente,
            emailCliente: input.emailContacto,
            comunidad: (datos.comunidad as string) || "",
            situacion: datos.situacion,
            complejidad: resultado.es_complejo ? "Complejo" : "Simple",
            urlMiRenta,
            documentosNecesarios: docsNecesarios,
            resultadoFiscal: _resVal,
            tipoResultado: _tipoRes,
            precioServicio: precio.precioTotal,
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
   * Verificar filas específicas en el Sheet (para testing)
   */
  verifySheetRows: publicProcedure
    .input(z.object({ expedienteIds: z.array(z.string()) }))
    .query(async ({ input }) => {
      const rows = await leerCasosSheet();
      const result: Record<string, unknown> = {};
      for (const expId of input.expedienteIds) {
        const row = rows.find((r: Record<string, string>) => r.expediente_id === expId);
        if (!row) {
          result[expId] = { found: false };
          continue;
        }
        const totalCols = Object.keys(row).length;
        const filledCols = Object.values(row).filter((v: string) => v && v.trim()).length;
        const emptyCols = Object.entries(row)
          .filter(([, v]: [string, string]) => !v || !v.trim())
          .map(([k]: [string, string]) => k)
          .slice(0, 30);
        result[expId] = {
          found: true,
          totalCols,
          filledCols,
          emptyCols,
          keyFields: {
            // Identificación
            expediente_id: row.expediente_id,
            environment: row.environment,
            created_at: row.created_at,
            // Cliente
            cliente_nombre: row.cliente_nombre,
            cliente_email: row.cliente_email,
            cliente_telefono: row.cliente_telefono,
            nif: row.nif,
            ccaa: row.ccaa,
            situacion_laboral: row.situacion_laboral,
            ingresos_brutos: row.ingresos_brutos,
            // Estado expediente
            complejidad: row.complejidad,
            plan_code: row.plan_code,
            precio: row.precio,
            payment_status: row.payment_status,
            resultado_estimado: row.resultado_estimado,
            tipo_resultado: row.tipo_resultado,
            prioridad: row.prioridad,
            // Derivación (cols 95-97)
            es_derivacion: row.es_derivacion,
            motivo_derivacion: row.motivo_derivacion,
            derivacion_timestamp: row.derivacion_timestamp,
            // Fiscal (cols 61-82)
            retenciones_trabajo: row.retenciones_trabajo,
            base_imponible_general: row.base_imponible_general,
            resultado_declaracion: row.resultado_declaracion,
            deduccion_maternidad: row.deduccion_maternidad,
            deduccion_donativos: row.deduccion_donativos,
            // Legacy camelCase (cols 98-153)
            email: row.email,
            telefono: row.telefono,
            nombreCompleto: row.nombreCompleto,
            clasificacion: row.clasificacion,
            nivel: row.nivel,
            confianza: row.confianza,
            datos_contribuyente: row.datos_contribuyente,
            expedienteId: row.expedienteId,
            plan: row.plan,
          },
        };
      }
      return result;
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
   * Crear sesión de pago Stripe (alias de pagos.crearSesionCheckout)
   * @deprecated Usar trpc.pagos.crearSesionCheckout directamente
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

      // Usar Stripe real via la misma lógica que pagos.crearSesionCheckout
      const stripeKey = process.env.STRIPE_SECRET_KEY || "";
      if (!stripeKey) {
        throw new Error("STRIPE_SECRET_KEY no configurada en Railway");
      }

      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeKey, { apiVersion: "2026-02-25.clover" as any });

      const precioTotal = expediente.precioTotal || 3900;
      const nombreCliente = (expediente.datosContribuyente as any)?.contribuyente?.nombre || "Cliente";
      const emailCliente = expediente.emailContacto || undefined;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "eur",
            product_data: {
              name: "Declaración de la Renta 2025",
              description: "Gestión completa de tu declaración de la renta",
              metadata: { expedienteId: input.expedienteId },
            },
            unit_amount: precioTotal,
          },
          quantity: 1,
        }],
        mode: "payment",
        customer_email: emailCliente,
        client_reference_id: input.expedienteId,
        metadata: {
          expedienteId: input.expedienteId,
          customer_name: nombreCliente,
          customer_email: emailCliente || "",
        },
        success_url: `${input.successUrl}?expediente=${input.expedienteId}&paid=1`,
        cancel_url: `${input.cancelUrl}?expediente=${input.expedienteId}&cancelled=1`,
        allow_promotion_codes: true,
        locale: "es",
      });

      await db
        .update(declaraciones)
        .set({ estado: "pendiente_pago", stripeSessionId: session.id })
        .where(eq(declaraciones.expedienteId, input.expedienteId));

      return {
        sessionId: session.id,
        checkoutUrl: session.url,
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
   * Aplicar formato condicional al Sheet casos_master_v2
   * - Rojo: es_derivacion=Si y asesor_asignado vacío
   * - Verde: payment_status=paid
   * - Gris: estado=simulacion
   */
  aplicarFormatoSheet: publicProcedure
    .mutation(async () => {
      const result = await aplicarFormatoCondicionalSheet();
      return result;
    }),

  /**
   * Diagnóstico de email: verifica BREVO_API_KEY y envía un email de prueba
   */
  emailDiag: publicProcedure
    .input(z.object({ to: z.string().email().optional() }))
    .mutation(async ({ input }) => {
      const apiKey = process.env.BREVO_API_KEY;
      const fromEmail = process.env.EMAIL_FROM;
      const fromName = process.env.EMAIL_FROM_NAME;
      const diag: Record<string, unknown> = {
        BREVO_API_KEY: apiKey ? `${apiKey.substring(0, 8)}...` : "NOT SET",
        EMAIL_FROM: fromEmail || "NOT SET",
        EMAIL_FROM_NAME: fromName || "NOT SET",
      };

      if (!apiKey) {
        return { ...diag, test_email: "skipped", error: "BREVO_API_KEY no configurada" };
      }

      const testTo = input.to || fromEmail || "luisguillen@tpymes.es";
      const emailResult = await sendEmail({
        to: testTo,
        subject: "[TEST] Diagnóstico email Renta Fácil TPymes",
        htmlContent: `<h2>Test de email</h2><p>Este es un email de prueba enviado desde el sistema de diagnóstico de Renta Fácil TPymes.</p><p>Si recibes este email, el sistema de envío está funcionando correctamente.</p><p>Fecha: ${new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}</p>`,
      });

      return {
        ...diag,
        test_email_to: testTo,
        test_email_result: emailResult.success ? "sent" : "failed",
        test_email_messageId: emailResult.messageId,
        test_email_error: emailResult.error,
      };
    }),

  /**
   * Migrar columnas faltantes en la DB de producción
   */
  dbMigrate: publicProcedure
    .mutation(async () => {
      const db = await getDb();
      if (!db) return { success: false, error: "DB not connected" };
      const results: Record<string, string> = {};
      const migrations = [
        { col: "deduccionesSeleccionadas", sql: "ALTER TABLE declaraciones ADD COLUMN deduccionesSeleccionadas JSON" },
        { col: "deduccionesConfirmadasAt", sql: "ALTER TABLE declaraciones ADD COLUMN deduccionesConfirmadasAt TIMESTAMP NULL" },
        { col: "informePdfUrl", sql: "ALTER TABLE declaraciones ADD COLUMN informePdfUrl TEXT" },
        { col: "informePdfS3Key", sql: "ALTER TABLE declaraciones ADD COLUMN informePdfS3Key VARCHAR(512)" },
      ];
      for (const m of migrations) {
        try {
          await db.execute(m.sql);
          results[m.col] = "added";
        } catch (e: any) {
          results[m.col] = e.message.includes("Duplicate column") ? "already_exists" : `error: ${e.message}`;
        }
      }
      return { success: true, results };
    }),

  /**
   * Diagnóstico de la base de datos
   */
  dbDiag: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return { db_available: false, error: "DB not connected" };
      try {
        // Obtener columnas de la tabla declaraciones
        const cols = await db.execute(
          `SHOW COLUMNS FROM declaraciones`
        ) as any;
        const colNames = (Array.isArray(cols) ? cols : cols[0] || []).map((c: any) => c.Field || c.COLUMN_NAME || c.field || Object.values(c)[0]);
        // Contar filas
        const count = await db.execute(`SELECT COUNT(*) as total FROM declaraciones`) as any;
        const total = (Array.isArray(count) ? count[0] : count)?.[0]?.total ?? 0;
        // Intentar un insert de prueba para ver el error exacto
        let insertError = null;
        try {
          await db.execute(`SELECT deduccionesSeleccionadas FROM declaraciones LIMIT 1`);
        } catch (e: any) {
          insertError = e.message;
        }
        return { db_available: true, columns: colNames, total_rows: total, deduccionesSeleccionadas_error: insertError };
      } catch (e: any) {
        return { db_available: true, error: e.message };
      }
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
