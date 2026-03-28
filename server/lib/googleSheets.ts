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
 * cuando se confirma un pago del nuevo simulador /renta
 */
export function buildSheetRowPayload(params: {
  expedienteId: string;
  emailCliente: string;
  nombreCliente: string;
  amountTotal: number;
  currency: string;
  paidAt: string;
  stripeEventId: string;
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
  const comunidad = (datos.comunidad as string) || "";
  const situacion = (datos.situacion as string) || "";
  const ingresos = (datos.ingresos_brutos as number) || 0;
  const esComplejo = (resultado.es_complejo as boolean) || false;
  const planCode = esComplejo ? "COMPLEJO" : "SIMPLE";

  return {
    // === Compatibilidad total: snake_case (nuevo) + camelCase (legacy) ===
    // El nodo "Confirmar Pago API" de n8n lee $json.body.expediente_id
    // El nodo "Actualizar Sheets: Pago" busca por columna expediente_id
    expediente_id: params.expedienteId,
    expedienteId: params.expedienteId,           // legacy compat
    payment_intent_id: params.stripeEventId,     // n8n Confirmar Pago API
    stripePaymentIntentId: params.stripeEventId, // legacy compat
    stripe_event_id: params.stripeEventId,
    estado: "pagado",
    payment_status: "paid",
    payment_confirmed_at: params.paidAt,
    amount: Math.round(params.amountTotal * 100), // en céntimos como Stripe
    currency: (params.currency || "eur").toLowerCase(),
    // Datos del cliente
    nombre,
    email: params.emailCliente,
    nif,
    comunidad,
    situacion,
    ingresos: ingresos.toString(),
    complejidad: esComplejo ? "complejo" : "simple",
    plan: planCode,
    fecha_registro: params.paidAt,
    importe_pagado: params.amountTotal.toFixed(2),
    // Fuente y acción
    fuente: "simulador_renta",
    accion: "nuevo_pago_simulador",
  };
}
