/**
 * Google Sheets helper — lectura y escritura directa via API v4
 *
 * ESTRATEGIA:
 *  - Lectura: API Key (solo Sheets públicos)
 *  - Escritura: Google Service Account (JWT) → permite escribir sin OAuth del usuario
 *    Requiere: GOOGLE_SERVICE_ACCOUNT_JSON (JSON completo de la service account)
 *              GOOGLE_SHEETS_ID (ID del spreadsheet)
 *
 *  Si no hay Service Account configurada, la escritura se delega a n8n WF08
 *  (comportamiento anterior, sin cambios).
 *
 * UPSERT con idempotencia:
 *  1. Buscar fila por stripe_event_id → si existe, no hacer nada (idempotencia)
 *  2. Buscar fila por expediente_id → si existe, actualizar (Update)
 *  3. Si no existe → añadir nueva fila (Append)
 */

const SHEETS_API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

// ─────────────────────────────────────────────────────────────────────────────
// Tipos internos
// ─────────────────────────────────────────────────────────────────────────────

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  project_id?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// JWT para Service Account (sin dependencias externas)
// ─────────────────────────────────────────────────────────────────────────────

function base64urlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function createServiceAccountJwt(sa: ServiceAccountKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64urlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64urlEncode(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );

  const signingInput = `${header}.${payload}`;

  // Importar clave privada RSA
  const pemKey = sa.private_key.replace(/\\n/g, "\n");
  const keyData = pemKey
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const binaryKey = Buffer.from(keyData, "base64");

  const cryptoKey = await globalThis.crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await globalThis.crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    Buffer.from(signingInput)
  );

  const sigB64 = Buffer.from(signature)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return `${signingInput}.${sigB64}`;
}

async function getServiceAccountAccessToken(sa: ServiceAccountKey): Promise<string> {
  const jwt = await createServiceAccountJwt(sa);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`[GoogleSheets] Error obteniendo token SA: ${res.status} ${errText}`);
  }

  const data = await res.json() as { access_token: string };
  return data.access_token;
}

function getServiceAccount(): ServiceAccountKey | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ServiceAccountKey;
  } catch {
    console.warn("[GoogleSheets] GOOGLE_SERVICE_ACCOUNT_JSON no es JSON válido");
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Lectura del Sheet (API Key — solo lectura pública)
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Escritura directa via Service Account
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Busca una fila en el Sheet por el valor de una columna específica.
 * Devuelve el índice de fila (1-based, incluyendo header) o null si no existe.
 */
async function buscarFilaPorCampo(
  token: string,
  sheetId: string,
  campo: string,
  valor: string,
  sheetName = "Sheet1"
): Promise<{ rowIndex: number; headers: string[] } | null> {
  try {
    const url = `${SHEETS_API_BASE}/${sheetId}/values/${encodeURIComponent(sheetName)}!A:BZ?access_token=${token}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;

    const data = await res.json() as { values?: string[][] };
    const rows = data.values || [];
    if (rows.length < 1) return null;

    const headers = rows[0];
    const colIndex = headers.indexOf(campo);
    if (colIndex === -1) return null;

    for (let i = 1; i < rows.length; i++) {
      if ((rows[i][colIndex] || "") === valor) {
        return { rowIndex: i + 1, headers }; // 1-based
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Actualiza una fila existente en el Sheet (Update Row).
 */
async function actualizarFila(
  token: string,
  sheetId: string,
  rowIndex: number,
  headers: string[],
  datos: Record<string, unknown>,
  sheetName = "Sheet1"
): Promise<boolean> {
  // Construir array de valores en el orden de los headers
  const values = headers.map((h) => {
    const v = datos[h];
    if (v === undefined || v === null) return "";
    return String(v);
  });

  const range = `${sheetName}!A${rowIndex}:${columnLetter(headers.length)}${rowIndex}`;
  const url = `${SHEETS_API_BASE}/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ range, majorDimension: "ROWS", values: [values] }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[GoogleSheets] Error actualizando fila ${rowIndex}: ${errText}`);
    return false;
  }
  return true;
}

/**
 * Añade una nueva fila al final del Sheet (Append Row).
 */
async function appendFila(
  token: string,
  sheetId: string,
  headers: string[],
  datos: Record<string, unknown>,
  sheetName = "Sheet1"
): Promise<boolean> {
  const values = headers.map((h) => {
    const v = datos[h];
    if (v === undefined || v === null) return "";
    return String(v);
  });

  const range = `${sheetName}!A:${columnLetter(headers.length)}`;
  const url = `${SHEETS_API_BASE}/${sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ range, majorDimension: "ROWS", values: [values] }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[GoogleSheets] Error haciendo append: ${errText}`);
    return false;
  }
  return true;
}

/**
 * Obtiene los headers del Sheet para poder hacer append con columnas correctas.
 */
async function obtenerHeaders(
  token: string,
  sheetId: string,
  sheetName = "Sheet1"
): Promise<string[]> {
  const url = `${SHEETS_API_BASE}/${sheetId}/values/${encodeURIComponent(sheetName)}!1:1?access_token=${token}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) return [];
  const data = await res.json() as { values?: string[][] };
  return data.values?.[0] || [];
}

/** Convierte número de columna (1-based) a letra(s) de columna Excel */
function columnLetter(n: number): string {
  let result = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// UPSERT principal con idempotencia
// ─────────────────────────────────────────────────────────────────────────────

export type UpsertSheetResult =
  | { action: "skipped_idempotent"; reason: string }
  | { action: "updated"; rowIndex: number }
  | { action: "appended" }
  | { action: "delegated_to_n8n" }
  | { action: "error"; error: string };

/**
 * Upsert con idempotencia en el Sheet de declaraciones IRPF.
 *
 * Lógica:
 *  1. Si hay Service Account → escritura directa
 *     a. Buscar por stripe_event_id → si existe, skip (idempotencia)
 *     b. Buscar por expediente_id → si existe, Update Row
 *     c. Si no existe → Append Row con observaciones
 *  2. Si NO hay Service Account → devuelve "delegated_to_n8n"
 *     (el llamador debe notificar a n8n WF08)
 */
export async function upsertDeclaracionSheet(
  datos: Record<string, unknown>,
  sheetName = "Declaraciones"
): Promise<UpsertSheetResult> {
  const sheetId = process.env.GOOGLE_SHEETS_ID;
  if (!sheetId) {
    return { action: "error", error: "GOOGLE_SHEETS_ID no configurado" };
  }

  const sa = getServiceAccount();
  if (!sa) {
    // Sin Service Account → delegar a n8n
    return { action: "delegated_to_n8n" };
  }

  let token: string;
  try {
    token = await getServiceAccountAccessToken(sa);
  } catch (err: any) {
    console.error("[GoogleSheets] Error obteniendo token SA:", err.message);
    return { action: "error", error: err.message };
  }

  const stripeEventId = String(datos.stripe_event_id || "");
  const expedienteId = String(datos.expediente_id || "");

  // 1. Idempotencia: buscar por stripe_event_id
  if (stripeEventId) {
    const found = await buscarFilaPorCampo(token, sheetId, "stripe_event_id", stripeEventId, sheetName);
    if (found) {
      console.log(`[GoogleSheets] Idempotencia: stripe_event_id ${stripeEventId} ya existe en fila ${found.rowIndex} — skip`);
      return { action: "skipped_idempotent", reason: `stripe_event_id ${stripeEventId} ya existe` };
    }
  }

  // 2. Buscar por expediente_id
  if (expedienteId) {
    const found = await buscarFilaPorCampo(token, sheetId, "expediente_id", expedienteId, sheetName);
    if (found) {
      // Update Row — mezclar datos existentes con los nuevos
      const mergedData = { ...datos };
      const ok = await actualizarFila(token, sheetId, found.rowIndex, found.headers, mergedData, sheetName);
      if (ok) {
        console.log(`[GoogleSheets] Update Row: expediente ${expedienteId} actualizado en fila ${found.rowIndex}`);
        return { action: "updated", rowIndex: found.rowIndex };
      }
      return { action: "error", error: `Error actualizando fila ${found.rowIndex}` };
    }
  }

  // 3. Append Row — expediente no existe en el Sheet
  const headers = await obtenerHeaders(token, sheetId, sheetName);
  if (headers.length === 0) {
    return { action: "error", error: "No se pudieron obtener los headers del Sheet" };
  }

  const appendData = {
    ...datos,
    observaciones: datos.observaciones || "Fila creada por backend al no existir expediente previo en Sheet",
    source_workflow: datos.source_workflow || "stripe_webhook_backend",
  };

  const ok = await appendFila(token, sheetId, headers, appendData, sheetName);
  if (ok) {
    console.log(`[GoogleSheets] Append Row: expediente ${expedienteId} añadido al Sheet`);
    return { action: "appended" };
  }
  return { action: "error", error: "Error haciendo append en el Sheet" };
}

// ─────────────────────────────────────────────────────────────────────────────
// Payload para n8n WF08 (cuando no hay Service Account)
// ─────────────────────────────────────────────────────────────────────────────

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
