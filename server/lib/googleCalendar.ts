/**
 * Google Calendar helper — crea eventos automáticamente tras pago confirmado
 *
 * ESTRATEGIA:
 *  Usa la misma Service Account que Google Sheets (GOOGLE_SERVICE_ACCOUNT_JSON).
 *  La Service Account debe tener acceso al calendario destino:
 *    - Opción A: Compartir el calendario con el email de la SA (recomendado)
 *    - Opción B: Usar el Calendar ID de un calendario compartido
 *
 * VARIABLES DE ENTORNO:
 *  GOOGLE_SERVICE_ACCOUNT_JSON  — JSON completo de la service account (compartido con Sheets)
 *  GOOGLE_CALENDAR_ID           — ID del calendario (ej: "primary" o "xxx@group.calendar.google.com")
 *  CALENDAR_EVENT_DURATION_MIN  — Duración del evento en minutos (default: 30)
 *  CALENDAR_ADVISOR_EMAIL       — Email del asesor a añadir como attendee (opcional)
 *  CALENDAR_DAYS_AHEAD          — Días hábiles a partir de hoy para la cita (default: 2)
 *  CALENDAR_DEFAULT_HOUR        — Hora de inicio por defecto en formato HH:MM (default: "10:00")
 *
 * COMPORTAMIENTO:
 *  - Calcula el próximo día hábil (lunes-viernes, sin festivos nacionales básicos)
 *  - Crea el evento con el título "Revisión Renta [expedienteId] — [nombreCliente]"
 *  - Añade descripción con datos del expediente
 *  - Devuelve el calendarEventId para guardarlo en la BD
 */

const CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

export interface CalendarEventParams {
  expedienteId: string;
  nombreCliente: string;
  emailCliente: string;
  planCode: string;
  comunidad: string;
  importe: number;
  paidAt: string;
  urlSeguimiento: string;
}

export interface CalendarEventResult {
  success: boolean;
  eventId?: string;
  eventLink?: string;
  scheduledAt?: string;
  error?: string;
}

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// JWT Service Account (reutiliza la misma lógica que googleSheets.ts)
// ─────────────────────────────────────────────────────────────────────────────

function base64urlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function createCalendarJwt(sa: ServiceAccountKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64urlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64urlEncode(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/calendar",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );

  const signingInput = `${header}.${payload}`;
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

async function getCalendarAccessToken(sa: ServiceAccountKey): Promise<string> {
  const jwt = await createCalendarJwt(sa);
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
    throw new Error(`[GoogleCalendar] Error obteniendo token SA: ${res.status} ${errText}`);
  }

  const data = await res.json() as { access_token: string };
  return data.access_token;
}

function getServiceAccount(): ServiceAccountKey | null {
  // Try GOOGLE_SERVICE_ACCOUNT_JSON_B64 first (base64-encoded, most reliable)
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64;
  if (b64) {
    try {
      const decoded = Buffer.from(b64, "base64").toString("utf8");
      return JSON.parse(decoded) as ServiceAccountKey;
    } catch {}
  }

  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;

  // Try direct parse
  try { return JSON.parse(raw) as ServiceAccountKey; } catch {}

  // Try replacing escaped newlines
  try { return JSON.parse(raw.replace(/\\n/g, "\n")) as ServiceAccountKey; } catch {}

  // Try base64 decode
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf8")) as ServiceAccountKey;
  } catch {}

  console.warn("[GoogleCalendar] SA present but unparseable");
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cálculo de próximo día hábil
// ─────────────────────────────────────────────────────────────────────────────

/** Festivos nacionales España 2026 (formato YYYY-MM-DD) */
const FESTIVOS_NACIONALES_2026 = new Set([
  "2026-01-01", // Año Nuevo
  "2026-01-06", // Reyes
  "2026-04-02", // Jueves Santo
  "2026-04-03", // Viernes Santo
  "2026-05-01", // Día del Trabajo
  "2026-08-15", // Asunción
  "2026-10-12", // Fiesta Nacional
  "2026-11-01", // Todos los Santos
  "2026-12-06", // Constitución
  "2026-12-08", // Inmaculada
  "2026-12-25", // Navidad
]);

function esDiaHabil(fecha: Date): boolean {
  const diaSemana = fecha.getDay(); // 0=Dom, 6=Sab
  if (diaSemana === 0 || diaSemana === 6) return false;
  const fechaStr = fecha.toISOString().split("T")[0];
  return !FESTIVOS_NACIONALES_2026.has(fechaStr);
}

function calcularFechaCita(diasHabilesAdelante: number, horaInicio: string): { start: string; end: string } {
  const duracionMin = parseInt(process.env.CALENDAR_EVENT_DURATION_MIN || "30", 10);
  const parts = horaInicio.split(":");
  const hora = parseInt(parts[0], 10) || 10;
  const minuto = parseInt(parts[1], 10) || 0;

  // Calcular próximo día hábil
  let fecha = new Date();
  fecha.setHours(hora, minuto, 0, 0);
  let diasContados = 0;

  while (diasContados < diasHabilesAdelante) {
    fecha.setDate(fecha.getDate() + 1);
    if (esDiaHabil(fecha)) {
      diasContados++;
    }
  }

  // Si el día calculado ya pasó la hora, avanzar un día hábil más
  if (diasHabilesAdelante === 0 && fecha < new Date()) {
    fecha.setDate(fecha.getDate() + 1);
    while (!esDiaHabil(fecha)) {
      fecha.setDate(fecha.getDate() + 1);
    }
  }

  const startISO = fecha.toISOString();
  const endDate = new Date(fecha.getTime() + duracionMin * 60_000);
  const endISO = endDate.toISOString();

  return { start: startISO, end: endISO };
}

// ─────────────────────────────────────────────────────────────────────────────
// Crear evento en Google Calendar
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crea un evento de revisión de renta en Google Calendar tras pago confirmado.
 *
 * Si GOOGLE_SERVICE_ACCOUNT_JSON o GOOGLE_CALENDAR_ID no están configurados,
 * devuelve { success: false, error: "not_configured" } sin lanzar excepción.
 */
export async function crearEventoCalendar(params: CalendarEventParams): Promise<CalendarEventResult> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) {
    console.warn("[GoogleCalendar] GOOGLE_CALENDAR_ID no configurado — omitiendo creación de evento");
    return { success: false, error: "not_configured" };
  }

  const sa = getServiceAccount();
  if (!sa) {
    console.warn("[GoogleCalendar] GOOGLE_SERVICE_ACCOUNT_JSON no configurado — omitiendo creación de evento");
    return { success: false, error: "not_configured" };
  }

  let token: string;
  try {
    token = await getCalendarAccessToken(sa);
  } catch (err: any) {
    console.error("[GoogleCalendar] Error obteniendo token:", err.message);
    return { success: false, error: err.message };
  }

  // Calcular fecha/hora de la cita
  const diasAdelante = parseInt(process.env.CALENDAR_DAYS_AHEAD || "2", 10);
  const horaDefault = process.env.CALENDAR_DEFAULT_HOUR || "10:00";
  const { start, end } = calcularFechaCita(diasAdelante, horaDefault);

  // Construir el evento
  // NOTA: No incluimos attendees porque la SA sin Domain-Wide Delegation
  // no puede invitar a usuarios externos. El asesor ve el evento porque
  // es owner del calendario. El cliente recibe notificación via email Brevo.
  const advisorEmail = process.env.CALENDAR_ADVISOR_EMAIL;

  const planLabel = params.planCode === "BASICO" ? "Básico" :
    params.planCode === "COMPLEJO" ? "Complejo" : params.planCode;

  const eventBody = {
    summary: `📋 Revisión Renta ${params.expedienteId} — ${params.nombreCliente}`,
    description: [
      `Expediente: ${params.expedienteId}`,
      `Cliente: ${params.nombreCliente} (${params.emailCliente})`,
      `Plan: ${planLabel}`,
      `Comunidad: ${params.comunidad}`,
      `Importe pagado: ${params.importe.toFixed(2)} €`,
      `Fecha de pago: ${new Date(params.paidAt).toLocaleDateString("es-ES")}`,
      ``,
      `Seguimiento: ${params.urlSeguimiento}`,
      ``,
      `Evento creado automáticamente por Renta Fácil TPymes al confirmar el pago.`,
    ].join("\n"),
    start: {
      dateTime: start,
      timeZone: "Europe/Madrid",
    },
    end: {
      dateTime: end,
      timeZone: "Europe/Madrid",
    },
    // No attendees — SA sin Domain-Wide Delegation no puede invitar.
    // El asesor ve los eventos porque es owner del calendario.
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 },  // 24h antes
        { method: "popup", minutes: 30 },         // 30min antes
      ],
    },
    colorId: "2", // Verde (Sage) — indica "confirmado"
    status: "confirmed",
  };

  try {
    const url = `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventBody),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[GoogleCalendar] Error creando evento: ${res.status} ${errText}`);
      return { success: false, error: `HTTP ${res.status}: ${errText}` };
    }

    const createdEvent = await res.json() as { id: string; htmlLink: string };
    console.log(`[GoogleCalendar] Evento creado: ${createdEvent.id} para expediente ${params.expedienteId}`);

    return {
      success: true,
      eventId: createdEvent.id,
      eventLink: createdEvent.htmlLink,
      scheduledAt: start,
    };
  } catch (err: any) {
    console.error("[GoogleCalendar] Error en fetch:", err.message);
    return { success: false, error: err.message };
  }
}
