/**
 * Google Sheets helper — escribe filas en el Sheet de casos
 * Usa la API de Google Sheets v4 con API Key (solo lectura pública)
 * Para escritura usa Service Account o el webhook de n8n.
 *
 * NOTA: La API Key solo permite lectura de Sheets públicos.
 * Para escritura directa necesitamos OAuth2 / Service Account.
 * Por eso usamos el webhook de n8n (WF08) para escribir en el Sheet
 * cuando se produce un pago, y la API Key solo para leer casos en el panel.
 *
 * Este helper centraliza la lógica de escritura via n8n y lectura via API Key.
 */

const SHEETS_API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

/**
 * Lee todas las filas del Sheet de casos (lectura pública con API Key)
 */
export async function leerCasosSheet(): Promise<Record<string, string>[]> {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const sheetId = process.env.GOOGLE_SHEETS_ID;

  if (!apiKey || !sheetId) {
    console.warn("[GoogleSheets] GOOGLE_SHEETS_API_KEY o GOOGLE_SHEETS_ID no configurados");
    return [];
  }

  try {
    const url = `${SHEETS_API_BASE}/${sheetId}/values/A:BZ?key=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });

    if (!res.ok) {
      console.error(`[GoogleSheets] Error leyendo Sheet: HTTP ${res.status}`);
      return [];
    }

    const data = await res.json() as { values?: string[][] };
    const rows = data.values || [];

    if (rows.length < 2) return [];

    const headers = rows[0];
    return rows.slice(1).map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] ?? "";
      });
      return obj;
    });
  } catch (err: any) {
    console.error("[GoogleSheets] Error en leerCasosSheet:", err.message);
    return [];
  }
}

/**
 * Construye el payload para n8n WF08 que escribe una fila en el Sheet
 * cuando se confirma un pago del nuevo simulador /renta.
 *
 * Payload final según especificación WF08:
 * - snake_case para n8n actual
 * - camelCase temporal por compatibilidad legacy
 * - suficientes campos para confirmar pago, actualizar Sheet y enviar email
 * - idempotencia por stripe_event_id / payment_intent_id
 */
export function buildSheetRowPayload(params: {
  expedienteId: string;
  emailCliente: string;
  nombreCliente: string;
  amountTotal: number;      // en EUR (ej: 29.00)
  currency: string;
  paidAt: string;
  stripeEventId: string;
  stripePaymentIntentId?: string;
  datosContribuyente?: Record<string, unknown>;
  resultadoCalculo?: Record<string, unknown>;
  precioTotal?: number;
}): Record<string, unknown> {
  const datos = params.datosContribuyente || {};
  const resultado = params.resultadoCalculo || {};

  // Extraer datos del contribuyente
  const contribuyente = (datos.contribuyente as Record<string, unknown>) || {};
  const nombre = params.nombreCliente ||
    `${contribuyente.nombre || ""} ${contribuyente.apellidos || ""}`.trim() ||
    "Sin nombre";
  const nif = (contribuyente.nif as string) || "";
  const comunidad = (datos.comunidad as string) || (datos.comunidadAutonoma as string) || "";
  const situacion = (datos.situacion as string) || (datos.situacionLaboral as string) || "";
  const ingresos = (datos.ingresos_brutos as number) || 0;

  // Plan y precio
  const esComplejo = (resultado.es_complejo as boolean) || false;
  const planCode = (resultado.plan_code as string) || (resultado.planCode as string) ||
    (esComplejo ? "COMPLEJO" : "BASICO");
  const precioFinal = params.precioTotal || params.amountTotal;

  // Importe en céntimos (como Stripe) y en EUR
  const amountCentimos = Math.round(params.amountTotal * 100);
  const amountEur = params.amountTotal;

  const environment = process.env.NODE_ENV === "production" ? "production" : "test";

  return {
    // ── Identificadores del expediente ──────────────────────────
    expediente_id: params.expedienteId,
    expedienteId: params.expedienteId,                      // camelCase compat

    // ── Identificadores de pago Stripe ──────────────────────────
    payment_intent_id: params.stripePaymentIntentId || "",
    stripePaymentIntentId: params.stripePaymentIntentId || "", // camelCase compat
    stripe_event_id: params.stripeEventId,
    stripeEventId: params.stripeEventId,                    // camelCase compat

    // ── Estado del pago ─────────────────────────────────────────
    estado: "pagado",
    payment_status: "paid",
    paymentConfirmedAt: params.paidAt,
    payment_confirmed_at: params.paidAt,

    // ── Importes ────────────────────────────────────────────────
    amount: amountCentimos,                                 // céntimos (Stripe standard)
    amount_eur: amountEur,                                  // EUR para legibilidad
    currency: (params.currency || "eur").toLowerCase(),

    // ── Datos del cliente ────────────────────────────────────────
    cliente_nombre: nombre,
    nombre,                                                 // legacy compat
    cliente_email: params.emailCliente,
    email: params.emailCliente,                             // legacy compat

    // ── Datos fiscales ───────────────────────────────────────────
    nif,
    comunidad,
    situacion,
    ingresos: ingresos.toString(),
    complejidad: esComplejo ? "complejo" : "simple",

    // ── Plan y precio ────────────────────────────────────────────
    plan_code: planCode,
    plan: planCode,                                         // legacy compat
    precio: precioFinal,
    importe_pagado: amountEur.toFixed(2),                   // legacy compat

    // ── Metadatos ────────────────────────────────────────────────
    source: "stripe_webhook_backend",
    environment,
    fuente: "simulador_renta",                              // legacy compat
    accion: "nuevo_pago_simulador",                         // legacy compat
    fecha_registro: params.paidAt,
  };
}
