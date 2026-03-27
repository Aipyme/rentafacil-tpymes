/**
 * Handler: POST /api/presupuesto
 * Motor de clasificación y precio — adaptado al stack Express + tRPC del proyecto.
 *
 * DIFERENCIAS respecto al handler Next.js del documento de referencia:
 *  1. Precios leídos de variables de entorno (configurables sin tocar código).
 *  2. `plan_code` devuelto siempre (contrato MOTOE).
 *  3. Documentos necesarios calculados según el plan.
 *  4. Motivos de complejidad explícitos para mostrar en UI.
 *  5. Guardia de `session_id` y validación de tipos.
 *
 * INTEGRACIÓN:
 *  Registrar en server/_core/index.ts ANTES del middleware tRPC:
 *    import { handlePresupuesto } from "../presupuesto";
 *    app.post("/api/presupuesto", express.json(), handlePresupuesto);
 */

import { Request, Response } from "express";

// ============================================================
// TIPOS
// ============================================================

type TipoContribuyente = "trabajador" | "autonomo" | "mixto" | "otro";
type RegimenAutonomo = "ninguno" | "estimacion_directa" | "estimacion_objetiva" | "ambos";
type PlanCode = "SIMPLE" | "SIMPLE_REVIEW" | "COMPLEJA" | "CRM";

interface Answers {
  tipo_contribuyente?: TipoContribuyente;
  ingresos_totales?: number;
  varios_pagadores?: boolean;
  segundo_pagador_importe?: number;
  regimen_autonomo?: RegimenAutonomo;
  vivienda_pre2013?: boolean;
  base_deduccion_vivienda?: number;
  hijos_num?: number;
  discapacidad_pct?: number;
  donaciones_importe?: number;
  retenciones_totales?: number;
  comunidad_autonoma?: string;
  inmuebles_alquilados?: boolean;
  tiene_capital_inmobiliario?: boolean;
  tiene_capital_mobiliario?: boolean;
  tiene_ganancias_patrimoniales?: boolean;
  rendimientos_extranjero?: boolean;
  cripto?: boolean;
  tiene_imputacion_rentas?: boolean;
  tiene_prestaciones?: boolean;
}

interface ClasificacionIA {
  nivel?: string;
  flag_review?: boolean;
  confidence?: number;
  razones?: string[];
}

interface RequestBody {
  session_id: string;
  answers: Answers;
  clasificacion_ia?: ClasificacionIA;
  plan_code?: PlanCode; // override opcional desde n8n
}

interface PresupuestoResponse {
  ok: boolean;
  session_id: string;
  automatable: boolean;
  plan_code: PlanCode;
  plan_label: string;
  precio: number | null; // en euros (no céntimos)
  precio_centimos: number | null;
  estimacion_ahorro: number;
  reason: string;
  flag_review: boolean;
  documentos_necesarios: string[];
  motivos_complejidad: string[];
  derivar_a_asesor: boolean;
}

// ============================================================
// PRECIOS — leídos de variables de entorno para ser configurables
// sin tocar código. Fallback a valores por defecto.
// ============================================================

function getPrices(): Record<PlanCode, number | null> {
  return {
    SIMPLE: parseFloat(process.env.PRECIO_SIMPLE || "29.90"),
    SIMPLE_REVIEW: parseFloat(process.env.PRECIO_SIMPLE_REVIEW || "49.90"),
    COMPLEJA: parseFloat(process.env.PRECIO_COMPLEJA || "79.90"),
    CRM: null, // precio personalizado, no automatizable
  };
}

const PLAN_LABELS: Record<PlanCode, string> = {
  SIMPLE: "Declaración simple",
  SIMPLE_REVIEW: "Declaración con revisión",
  COMPLEJA: "Declaración compleja",
  CRM: "Gestión personalizada",
};

// ============================================================
// MOTOR DE CLASIFICACIÓN
// ============================================================

interface ClasificacionResult {
  plan_code: PlanCode;
  automatable: boolean;
  reason: string;
  flag_review: boolean;
  motivos_complejidad: string[];
  derivar_a_asesor: boolean;
}

function classify(a: Answers, iaOverride?: ClasificacionIA): ClasificacionResult {
  const motivos: string[] = [];

  // --- Condiciones de COMPLEJIDAD DIRECTA (derivar a asesor) ---
  const esAutonomo =
    a.tipo_contribuyente === "autonomo" ||
    a.tipo_contribuyente === "mixto" ||
    (a.regimen_autonomo && a.regimen_autonomo !== "ninguno");

  const tieneModulos =
    a.regimen_autonomo === "estimacion_objetiva" || a.regimen_autonomo === "ambos";

  const tieneGanancias = Boolean(a.tiene_ganancias_patrimoniales);
  const tieneExtranjero = Boolean(a.rendimientos_extranjero);
  const tieneCripto = Boolean(a.cripto);
  const tieneCapitalInmobiliario =
    Boolean(a.tiene_capital_inmobiliario) || Boolean(a.inmuebles_alquilados);
  const ingresosAltos = (a.ingresos_totales || 0) > 200000;

  if (esAutonomo) motivos.push("Actividad económica (autónomo o mixto)");
  if (tieneModulos) motivos.push("Régimen de estimación objetiva (módulos)");
  if (tieneGanancias) motivos.push("Ganancias o pérdidas patrimoniales");
  if (tieneExtranjero) motivos.push("Rendimientos del extranjero");
  if (tieneCripto) motivos.push("Criptomonedas u otros activos digitales");
  if (tieneCapitalInmobiliario) motivos.push("Rendimientos del capital inmobiliario");
  if (ingresosAltos) motivos.push("Ingresos superiores a 200.000€");

  // Override por IA si tiene alta confianza
  if (iaOverride?.nivel === "COMPLEJA" && (iaOverride.confidence || 0) >= 0.8) {
    motivos.push(...(iaOverride.razones || []));
  }

  const esCompleja =
    esAutonomo ||
    tieneModulos ||
    tieneGanancias ||
    tieneExtranjero ||
    tieneCripto ||
    tieneCapitalInmobiliario ||
    ingresosAltos ||
    (iaOverride?.nivel === "COMPLEJA" && (iaOverride.confidence || 0) >= 0.8);

  if (esCompleja) {
    return {
      plan_code: "COMPLEJA",
      automatable: false,
      reason: "Caso complejo: requiere revisión de asesor fiscal",
      flag_review: true,
      motivos_complejidad: Array.from(new Set(motivos)),
      derivar_a_asesor: true,
    };
  }

  // --- Condiciones de REVISIÓN (simple pero con flag) ---
  const flagMotivos: string[] = [];

  const variosConImporte =
    Boolean(a.varios_pagadores) &&
    (a.segundo_pagador_importe || 0) > 1500;

  const tieneViviendaPre2013 = Boolean(a.vivienda_pre2013);
  const tieneDiscapacidad = (a.discapacidad_pct || 0) >= 33;
  const tieneDonaciones = (a.donaciones_importe || 0) > 0;
  const tieneImputacion = Boolean(a.tiene_imputacion_rentas);
  const tieneCapitalMobiliario = Boolean(a.tiene_capital_mobiliario);

  if (variosConImporte) flagMotivos.push("Segundo pagador con importe > 1.500€");
  if (tieneViviendaPre2013) flagMotivos.push("Deducción por vivienda habitual pre-2013");
  if (tieneDiscapacidad) flagMotivos.push("Situación de discapacidad (≥33%)");
  if (tieneDonaciones) flagMotivos.push("Deducciones por donativos");
  if (tieneImputacion) flagMotivos.push("Imputación de rentas inmobiliarias");
  if (tieneCapitalMobiliario) flagMotivos.push("Rendimientos del capital mobiliario");

  const flagReview =
    variosConImporte ||
    tieneViviendaPre2013 ||
    tieneDiscapacidad ||
    tieneDonaciones ||
    tieneImputacion ||
    tieneCapitalMobiliario ||
    Boolean(iaOverride?.flag_review);

  if (flagReview) {
    return {
      plan_code: "SIMPLE_REVIEW",
      automatable: true,
      reason: "Caso simple con aspectos que requieren revisión",
      flag_review: true,
      motivos_complejidad: flagMotivos,
      derivar_a_asesor: false,
    };
  }

  return {
    plan_code: "SIMPLE",
    automatable: true,
    reason: "Caso automatizable sin complejidades detectadas",
    flag_review: false,
    motivos_complejidad: [],
    derivar_a_asesor: false,
  };
}

// ============================================================
// ESTIMACIÓN DE AHORRO
// ============================================================

function estimateSavings(a: Answers): number {
  let ahorro = 0;

  // Deducción vivienda pre-2013: 15% sobre base (máx 9.040€ → máx 1.356€)
  if (a.vivienda_pre2013) {
    const base = Math.min(a.base_deduccion_vivienda || 9040, 9040);
    ahorro += Math.round(base * 0.15 * 0.5); // estimación conservadora (50% estatal)
  }

  // Donativos: 80% primeros 250€, 40% resto
  if ((a.donaciones_importe || 0) > 0) {
    const d = Number(a.donaciones_importe || 0);
    ahorro += Math.round(Math.min(d, 250) * 0.8 + Math.max(d - 250, 0) * 0.4);
  }

  // Discapacidad: mínimo adicional
  if ((a.discapacidad_pct || 0) >= 65) {
    ahorro += 1350; // estimación: 9.000€ × 15%
  } else if ((a.discapacidad_pct || 0) >= 33) {
    ahorro += 450; // estimación: 3.000€ × 15%
  }

  // Hijos: mínimo por descendientes
  if ((a.hijos_num || 0) > 0) {
    const hijos = Math.min(Number(a.hijos_num), 4);
    ahorro += Math.round(hijos * 150); // estimación conservadora
  }

  return Math.round(ahorro);
}

// ============================================================
// DOCUMENTOS NECESARIOS
// ============================================================

function getDocumentosNecesarios(a: Answers, plan_code: PlanCode): string[] {
  const docs: string[] = [
    "DNI/NIE en vigor",
    "Borrador IRPF 2025 (descargado de la sede AEAT)",
    "Certificado de retenciones del empleador (Modelo 190)",
  ];

  if (a.vivienda_pre2013) {
    docs.push("Certificado de préstamo hipotecario (amortización + intereses 2025)");
  }
  if ((a.donaciones_importe || 0) > 0) {
    docs.push("Certificado de donativo (entidad beneficiaria)");
  }
  if ((a.discapacidad_pct || 0) >= 33) {
    docs.push("Certificado de discapacidad (resolución IMSERSO o CCAA)");
  }
  if (a.regimen_autonomo && a.regimen_autonomo !== "ninguno") {
    docs.push("Libro de ingresos y gastos 2025");
    docs.push("Modelos 130/131 presentados en 2025");
  }
  if (a.inmuebles_alquilados || a.tiene_capital_inmobiliario) {
    docs.push("Contratos de arrendamiento vigentes");
    docs.push("Recibos de gastos deducibles del inmueble (IBI, comunidad, seguros)");
  }
  if (a.tiene_ganancias_patrimoniales) {
    docs.push("Documentación de compraventa de activos (escrituras, extractos de broker)");
  }
  if (a.rendimientos_extranjero) {
    docs.push("Certificados de retención de fuente extranjera");
    docs.push("Formulario W-8BEN o equivalente si aplica");
  }
  if (plan_code === "COMPLEJA" || plan_code === "CRM") {
    docs.push("Cualquier otro documento fiscal relevante del ejercicio 2025");
  }

  return docs;
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================

export async function handlePresupuesto(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as RequestBody;

    if (!body?.session_id) {
      res.status(400).json({ ok: false, error: "session_id requerido" });
      return;
    }

    const answers: Answers = body.answers || {};
    const iaOverride = body.clasificacion_ia;

    // Si n8n ya calculó el plan_code con alta confianza, respetarlo
    let result: ClasificacionResult;
    if (
      body.plan_code &&
      ["SIMPLE", "SIMPLE_REVIEW", "COMPLEJA", "CRM"].includes(body.plan_code)
    ) {
      const prices = getPrices();
      const precio = prices[body.plan_code];
      const estimacion_ahorro = estimateSavings(answers);
      const documentos = getDocumentosNecesarios(answers, body.plan_code);

      const response: PresupuestoResponse = {
        ok: true,
        session_id: body.session_id,
        automatable: body.plan_code === "SIMPLE" || body.plan_code === "SIMPLE_REVIEW",
        plan_code: body.plan_code,
        plan_label: PLAN_LABELS[body.plan_code],
        precio,
        precio_centimos: precio !== null ? Math.round(precio * 100) : null,
        estimacion_ahorro,
        reason: `Plan ${body.plan_code} confirmado por clasificación IA`,
        flag_review: body.plan_code === "SIMPLE_REVIEW",
        documentos_necesarios: documentos,
        motivos_complejidad: iaOverride?.razones || [],
        derivar_a_asesor: body.plan_code === "COMPLEJA" || body.plan_code === "CRM",
      };

      res.json(response);
      return;
    }

    // Clasificación propia del motor
    result = classify(answers, iaOverride);

    const prices = getPrices();
    const precio = prices[result.plan_code];
    const estimacion_ahorro = estimateSavings(answers);
    const documentos = getDocumentosNecesarios(answers, result.plan_code);

    const response: PresupuestoResponse = {
      ok: true,
      session_id: body.session_id,
      automatable: result.automatable,
      plan_code: result.plan_code,
      plan_label: PLAN_LABELS[result.plan_code],
      precio,
      precio_centimos: precio !== null ? Math.round(precio * 100) : null,
      estimacion_ahorro,
      reason: result.reason,
      flag_review: result.flag_review,
      documentos_necesarios: documentos,
      motivos_complejidad: result.motivos_complejidad,
      derivar_a_asesor: result.derivar_a_asesor,
    };

    res.json(response);
  } catch (error: any) {
    console.error("[/api/presupuesto] Error:", error);
    res.status(500).json({ ok: false, error: "Error procesando presupuesto" });
  }
}
