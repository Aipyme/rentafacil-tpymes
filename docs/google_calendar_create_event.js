/**
 * google_calendar_create_event.js
 * Snippet Node.js para crear eventos tentative en Google Calendar.
 *
 * Instalación: npm install googleapis
 * Configuración: sustituye CLIENT_ID, CLIENT_SECRET, REDIRECT_URI,
 *   REFRESH_TOKEN y ASESOR_EMAIL con tus credenciales de Google Cloud Console.
 *
 * Scopes necesarios:
 *   https://www.googleapis.com/auth/calendar.events
 *   (y https://www.googleapis.com/auth/calendar si necesitas leer calendarios)
 *
 * CalendarId:
 *   - Para crear en el calendario del asesor: usa su email como calendarId
 *     (requiere que el token tenga permisos sobre ese calendario).
 *   - Para un calendario de servicio compartido: usa un Service Account
 *     con domain-wide delegation y el email del calendario como calendarId.
 *
 * sendUpdates: 'all' → notifica a todos los asistentes por email automáticamente.
 */

const { google } = require('googleapis');

const oAuth2Client = new google.auth.OAuth2(
  'CLIENT_ID',       // ← Sustituir por tu Client ID de Google Cloud Console
  'CLIENT_SECRET',   // ← Sustituir por tu Client Secret
  'REDIRECT_URI'     // ← Sustituir por tu Redirect URI (ej: http://localhost:3000/oauth2callback)
);

// Refresh token para autenticación server-to-server (sin interacción del usuario)
oAuth2Client.setCredentials({ refresh_token: 'REFRESH_TOKEN' }); // ← Sustituir

const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

/**
 * Crea un evento tentative en Google Calendar.
 *
 * @param {object} params
 * @param {string} params.summary - Título del evento (ej: "Revisión Renta - Juan Pérez (RF2025-0001)")
 * @param {string} params.description - Descripción con datos del expediente
 * @param {string} params.startIso - Fecha/hora de inicio en formato ISO 8601 (ej: "2026-04-02T10:00:00+02:00")
 * @param {number} [params.durationMinutes=60] - Duración en minutos (por defecto 60)
 * @param {string} params.attendeeEmail - Email del asesor que recibirá la invitación
 * @returns {Promise<object>} Datos del evento creado (id, htmlLink, status)
 */
async function createTentativeEvent({
  summary,
  description,
  startIso,
  durationMinutes = 60,
  attendeeEmail
}) {
  const endIso = new Date(
    new Date(startIso).getTime() + durationMinutes * 60000
  ).toISOString();

  const event = {
    summary,
    description,
    start: { dateTime: new Date(startIso).toISOString(), timeZone: 'Europe/Madrid' },
    end: { dateTime: endIso, timeZone: 'Europe/Madrid' },
    attendees: [{ email: attendeeEmail }],
    status: 'tentative',
    reminders: { useDefault: true }
  };

  const res = await calendar.events.insert({
    calendarId: attendeeEmail, // ← Crear en el calendario del asesor
    resource: event,
    sendUpdates: 'all'         // ← Notifica al asesor por email
  });

  return res.data; // Contiene: id, htmlLink, status, start, end, attendees
}

// ─── Ejemplo de uso ───────────────────────────────────────────────────────────
(async () => {
  try {
    const ev = await createTentativeEvent({
      summary: 'Revisión Renta - Juan Pérez (TEST-001)',
      description: [
        'Expediente: TEST-001',
        'Motivo: Actividad económica como autónomo',
        'Ahorro estimado: 527 €',
        'Precio: 84 €',
        'Link admin: https://rentatpymes.aicheckpyme.co/panel-asesor'
      ].join('\n'),
      startIso: '2026-04-02T10:00:00+02:00',
      durationMinutes: 60,
      attendeeEmail: 'info@ayudatpymes.com' // ← Sustituir por ASESOR_EMAIL
    });

    console.log('✅ Evento creado:');
    console.log('  ID:', ev.id);
    console.log('  Link:', ev.htmlLink);
    console.log('  Estado:', ev.status); // "tentative"
  } catch (err) {
    console.error('❌ Error al crear evento:', err.message);
    if (err.response) {
      console.error('  Detalles:', JSON.stringify(err.response.data, null, 2));
    }
  }
})();
