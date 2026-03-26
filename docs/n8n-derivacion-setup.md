# Workflow n8n: derivacion_handler

Guía de configuración completa del workflow de derivación a asesor fiscal para **Renta Fácil TPymes**. Basada en el documento de especificaciones v2 (marzo 2026).

---

## Arquitectura del flujo

```
POST /webhook/derivacion-create
        │
        ▼
  Get Expediente  ──── (HTTP GET a la API de Renta Fácil)
        │
        ▼
  IF Es Complejo  ──── (es_complejo == true OR flag_review == true)
        │
        ├──► Create CRM Lead        (HubSpot — contacto con estado NEW)
        ├──► Create Calendar Event  (Google Calendar — evento tentative, 60 min)
        ├──► Send Email             (SMTP HTML — confirmación provisional al cliente)
        ├──► Slack Notify           (canal #asesores — resumen del caso)
        └──► Append Row Sheets      (hoja "Derivaciones" — registro completo)
```

---

## Importar el workflow

1. Acceder a [autogr.app.n8n.cloud](https://autogr.app.n8n.cloud)
2. Ir a **Workflows → Import from file**
3. Seleccionar el archivo `n8n-workflow-derivacion.json`
4. Configurar las credenciales (ver tabla siguiente)
5. Activar el workflow con el toggle **Active**

---

## Credenciales necesarias

| Nodo | Tipo de credencial | Descripción |
|---|---|---|
| **Create CRM Lead** | HubSpot API | API Key de HubSpot (Settings → Integrations → API Key) |
| **Create Calendar Event** | Google Calendar OAuth2 | OAuth2 con cuenta del asesor (`info@ayudatpymes.com`) |
| **Send Email** | SMTP | Brevo recomendado (smtp-relay.brevo.com:587) |
| **Slack Notify** | Slack API | Bot token con permisos `chat:write` en `#asesores` |
| **Append Row Google Sheets** | Google Sheets OAuth2 | Misma cuenta OAuth que Calendar |

### Configurar Google Calendar OAuth2

1. En [Google Cloud Console](https://console.cloud.google.com): crear proyecto → habilitar **Google Calendar API**
2. Crear credenciales OAuth2 → tipo "Web application" → añadir redirect URI de n8n
3. En n8n: **Credentials → New → Google Calendar OAuth2** → pegar Client ID y Secret → autorizar con `info@ayudatpymes.com`
4. Scopes necesarios: `https://www.googleapis.com/auth/calendar.events`

### Configurar SMTP con Brevo

1. Crear cuenta en [brevo.com](https://brevo.com) (gratis hasta 300 emails/día)
2. En n8n: **Credentials → New → SMTP**
   - Host: `smtp-relay.brevo.com`
   - Port: `587`
   - User: tu email de Brevo
   - Password: tu SMTP API Key de Brevo (Settings → SMTP & API)

### Configurar Slack

**Opción A — Bot Token (recomendado):**
1. Crear app en [api.slack.com/apps](https://api.slack.com/apps) → "From scratch"
2. Añadir permisos OAuth: `chat:write`, `chat:write.public`
3. Instalar en workspace → copiar Bot User OAuth Token
4. En n8n: **Credentials → New → Slack API** → pegar token

**Opción B — Incoming Webhook (más sencillo):**
1. En Slack: **Apps → Incoming Webhooks → Add to Slack** → canal `#asesores`
2. Copiar URL del webhook
3. En el nodo "Slack Notify": cambiar tipo a **HTTP Request** y pegar la URL

### Configurar HubSpot (opcional)

Si no usas HubSpot, desactiva el nodo "Create CRM Lead" o sustitúyelo por tu CRM. Para activarlo:
1. En HubSpot: **Settings → Integrations → API Key** → copiar API Key
2. En n8n: **Credentials → New → HubSpot API** → pegar API Key

---

## Payload del webhook

El backend envía este payload cuando se crea una derivación. Todos los campos son accesibles en n8n como `$json["body"]["campo"]`.

```json
{
  "event": "derivacion_created",
  "derivacion_id": "d-456",
  "expediente_id": "RF2025-0001",
  "expediente_url": "https://rentatpymes.aicheckpyme.co/api/trpc/simulador.getExpediente?input=...",
  "es_complejo": true,
  "flag_review": true,
  "contribuyente": {
    "nombre": "Juan Pérez García",
    "nif": "12345678Z"
  },
  "user_contact": {
    "nombre": "Juan Pérez García",
    "nif": "12345678Z",
    "email": "juan@test.com",
    "phone": "+34666123456"
  },
  "franja_horaria": "manana_temprano",
  "reserved_slot": "2026-04-02T10:00:00+02:00",
  "motivo": "Actividad económica como autónomo requiere revisión especializada",
  "descripcion_situacion": "Texto libre del cliente",
  "ahorro_estimado": 527.00,
  "precio": 84,
  "google_calendar_event": {
    "summary": "Revisión Renta - Juan Pérez García (RF2025-0001)",
    "description": "Expediente: RF2025-0001\nMotivo: ...",
    "start": { "dateTime": "2026-04-02T10:00:00+02:00" },
    "end": { "dateTime": "2026-04-02T11:00:00+02:00" },
    "attendees": [{ "email": "info@ayudatpymes.com" }],
    "status": "tentative"
  },
  "email_template": {
    "to": "juan@test.com",
    "nombre_cliente": "Juan Pérez García",
    "expediente_id": "RF2025-0001",
    "motivo": "Actividad económica como autónomo",
    "ahorro_estimado": 527.00,
    "precio": 84,
    "reserved_slot": "2026-04-02T10:00:00+02:00",
    "link_expediente": "https://rentatpymes.aicheckpyme.co/mi-renta/RF2025-0001"
  },
  "timestamp": "2026-03-26T09:00:00.000Z"
}
```

---

## Hoja "Derivaciones" en Google Sheets

Crear una hoja nueva llamada **Derivaciones** en el Google Sheet con estas columnas (fila 1 como cabecera):

| Columna | Nombre | Descripción |
|---|---|---|
| A | `derivacion_id` | ID único (ej: d-456) |
| B | `expediente_id` | ID del expediente del simulador |
| C | `nombre` | Nombre completo del cliente |
| D | `email` | Email de contacto |
| E | `telefono` | Teléfono de contacto |
| F | `nif` | NIF/NIE del cliente |
| G | `motivo` | Motivo de complejidad |
| H | `ahorro_estimado` | Ahorro estimado en € |
| I | `precio` | Precio estimado en € |
| J | `franja_horaria` | Franja preferida |
| K | `reserved_slot` | Slot ISO reservado |
| L | `estado` | pending / contacted / in_progress / resolved |
| M | `timestamp` | Fecha/hora de creación (Europe/Madrid) |
| N | `calendar_event_id` | ID del evento en Google Calendar |
| O | `notas_asesor` | Notas internas del asesor |
| P | `asesor_asignado` | Nombre del asesor asignado |

---

## Prueba en staging

Ejecutar el script de prueba incluido en el proyecto:

```bash
chmod +x docs/test-webhook-staging.sh
./docs/test-webhook-staging.sh
```

O manualmente con curl:

```bash
curl -s -X POST "https://autogr.app.n8n.cloud/webhook/derivacion-create" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "derivacion_created",
    "derivacion_id": "d-TEST-001",
    "expediente_id": "RF2025-TEST-001",
    "es_complejo": true,
    "flag_review": true,
    "contribuyente": { "nombre": "Juan Pérez García", "nif": "12345678Z" },
    "user_contact": {
      "nombre": "Juan Pérez García",
      "nif": "12345678Z",
      "email": "juan.perez.test@ejemplo.com",
      "phone": "+34666123456"
    },
    "franja_horaria": "manana_temprano",
    "reserved_slot": "2026-04-02T10:00:00+02:00",
    "motivo": "Actividad económica como autónomo",
    "ahorro_estimado": 527.00,
    "precio": 84
  }' | python3 -m json.tool
```

### Verificaciones tras la prueba

Después de ejecutar el curl, comprobar que:

1. El evento aparece en Google Calendar del asesor como **tentative**
2. El email llega a `juan.perez.test@ejemplo.com` con el HTML correcto
3. El canal `#asesores` de Slack recibe la notificación con todos los datos
4. La fila aparece en la hoja "Derivaciones" del Google Sheet con estado `pending`
5. El contacto se crea en HubSpot con estado `NEW` (si está configurado)

---

## Snippet Node.js para Google Calendar

El archivo `google_calendar_create_event.js` incluye el código completo para crear eventos desde Node.js directamente (útil para pruebas locales o integración server-side sin n8n).

```bash
# Instalar dependencia
npm install googleapis

# Ejecutar ejemplo
node docs/google_calendar_create_event.js
```

---

## Próximos pasos recomendados

Según las recomendaciones del documento de especificaciones:

1. **Confirmar o liberar slots**: añadir un job (cron n8n o endpoint de la API) que, si un slot no se confirma en 4 horas, lo libere y notifique al cliente para que elija otro.
2. **Recordatorios automáticos**: crear un segundo workflow `recordatorio_cita` con cron cada hora que envíe recordatorios 24h y 1h antes de la cita confirmada.
3. **Integración CRM completa**: si se usa HubSpot, añadir un nodo de seguimiento que actualice el estado del lead cuando el asesor marca el caso como "Contactado" desde el panel.

---

*Generado automáticamente por Renta Fácil TPymes · Versión 2.1 · Marzo 2026*
