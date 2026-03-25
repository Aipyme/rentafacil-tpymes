# Workflow n8n: derivacion_handler

Guía de configuración del workflow de derivación a asesor fiscal para **Renta Fácil TPymes**.

---

## Resumen del flujo

```
Webhook (POST) → Responder 200 OK
              → ¿Es derivacion_created?
                  ↓ SÍ
                  ├── Crear evento Google Calendar (tentative)
                  │     ↓ OK → Registrar en Google Sheets → Notificar Slack
                  │     ↓ FAIL → Marcar slot como "retrying"
                  └── Email confirmación provisional al cliente

Cron diario 9:00 → Obtener solicitudes pendientes
                 → Por cada una: ¿Lleva >24h sin gestionar?
                     ↓ SÍ → Alerta a operaciones por email
```

---

## Importar el workflow

1. Acceder a [autogr.app.n8n.cloud](https://autogr.app.n8n.cloud)
2. Ir a **Workflows → Import from file**
3. Seleccionar el archivo `n8n-workflow-derivacion.json`
4. Configurar las credenciales (ver sección siguiente)

---

## Credenciales necesarias

| Placeholder en el JSON | Tipo | Descripción |
|---|---|---|
| `PLACEHOLDER_GOOGLE_CALENDAR_CREDENTIAL_ID` | Google Calendar OAuth2 | Cuenta del asesor principal |
| `PLACEHOLDER_SMTP_CREDENTIAL_ID` | SMTP | Servidor de correo (ej: Gmail, SendGrid, Brevo) |
| `PLACEHOLDER_GOOGLE_SHEETS_CREDENTIAL_ID` | Google Sheets OAuth2 | Mismo Google Sheet que el workflow de triage |
| `PLACEHOLDER_SLACK_WEBHOOK_URL` | HTTP Request (Incoming Webhook) | URL del webhook del canal `#asesores` en Slack |
| `PLACEHOLDER_GOOGLE_SHEETS_ID` | String | ID del Google Sheet (de la URL de Sheets) |

### Configurar Google Calendar OAuth2

1. En n8n: **Credentials → New → Google Calendar OAuth2**
2. Usar las mismas credenciales OAuth del proyecto Google Cloud
3. Autorizar con la cuenta del asesor principal (`info@ayudatpymes.com`)

### Configurar SMTP (Brevo recomendado)

1. Crear cuenta en [brevo.com](https://brevo.com) (gratis hasta 300 emails/día)
2. En n8n: **Credentials → New → SMTP**
   - Host: `smtp-relay.brevo.com`
   - Port: `587`
   - User: tu email de Brevo
   - Password: tu API key de Brevo

### Configurar Slack Incoming Webhook

1. En Slack: **Apps → Incoming Webhooks → Add to Slack**
2. Seleccionar canal `#asesores`
3. Copiar la URL del webhook
4. En el nodo "Notificar canal #asesores en Slack": reemplazar `PLACEHOLDER_SLACK_WEBHOOK_URL`

---

## Payload que recibe el webhook

El backend envía este payload cuando se crea una derivación:

```json
{
  "event": "derivacion_created",
  "derivacion_id": "d-456",
  "expediente_id": "RF2025-0001",
  "user_contact": {
    "nombre": "Juan Pérez",
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
    "summary": "Revisión Renta - Juan Pérez (RF2025-0001)",
    "description": "Expediente: RF2025-0001\nMotivo: Actividad económica...",
    "start": { "dateTime": "2026-04-02T10:00:00+02:00" },
    "end": { "dateTime": "2026-04-02T11:00:00+02:00" },
    "attendees": [{ "email": "info@ayudatpymes.com" }],
    "status": "tentative"
  },
  "email_template": {
    "to": "juan@test.com",
    "subject": "Confirmación provisional de cita — Renta Fácil",
    "nombre_cliente": "Juan Pérez",
    "expediente_id": "RF2025-0001",
    "motivo": "Actividad económica como autónomo",
    "ahorro_estimado": 527.00,
    "precio": 84,
    "reserved_slot": "2026-04-02T10:00:00+02:00",
    "link_expediente": "https://rentatpymes.aicheckpyme.co/mi-renta/RF2025-0001"
  },
  "timestamp": "2026-03-25T19:00:00.000Z"
}
```

---

## Hoja "Derivaciones" en Google Sheets

Crear una hoja nueva llamada **Derivaciones** en el mismo Google Sheet con estas columnas:

| Columna | Descripción |
|---|---|
| `derivacion_id` | ID único (ej: d-456) |
| `expediente_id` | ID del expediente del simulador |
| `nombre` | Nombre del cliente |
| `nif` | NIF/NIE del cliente |
| `email` | Email de contacto |
| `telefono` | Teléfono de contacto |
| `motivo` | Motivo de complejidad |
| `ahorro_estimado` | Ahorro estimado en € |
| `precio` | Precio estimado en € |
| `franja_horaria` | Franja preferida |
| `reserved_slot` | Slot ISO reservado |
| `estado` | Pendiente / Contactado / En gestión / Resuelto |
| `timestamp` | Fecha/hora de creación (Europe/Madrid) |
| `calendar_event_id` | ID del evento en Google Calendar |
| `notas_asesor` | Notas internas del asesor |
| `asesor_asignado` | Nombre del asesor asignado |

---

## Verificaciones QA

```sql
-- Verificar estado en DB
SELECT id, expediente_id, estado, reserved_slot, slot_status, assigned_to, created_at
FROM solicitudes_asesor
WHERE expediente_id = 'RF2025-0001';

-- Derivaciones pendientes > 24h (para alerta operaciones)
SELECT id, nombre, email, reserved_slot, created_at,
       TIMESTAMPDIFF(HOUR, created_at, NOW()) AS horas_pendiente
FROM solicitudes_asesor
WHERE estado = 'pendiente'
  AND TIMESTAMPDIFF(HOUR, created_at, NOW()) >= 24
ORDER BY created_at ASC;
```

---

## Política de reintentos

Si el nodo de Google Calendar falla:
1. El nodo "Marcar slot como retrying" actualiza `slot_status = 'retrying'` en la BD
2. El workflow puede reintentarse manualmente desde el panel de ejecuciones de n8n
3. Configurar en n8n: **Settings → Error Workflow** para notificar automáticamente

---

## Recordatorios automáticos (workflow adicional recomendado)

Crear un segundo workflow `recordatorio_cita` con:
- **Trigger**: Cron cada hora (`0 * * * *`)
- **Lógica**: Buscar derivaciones con `slot_status = 'confirmed'` y `reserved_slot` entre 24h y 25h desde ahora → enviar email recordatorio 24h
- **Lógica**: Buscar derivaciones con `slot_status = 'confirmed'` y `reserved_slot` entre 1h y 2h desde ahora → enviar email recordatorio 1h

---

*Generado automáticamente por Renta Fácil TPymes · Versión 2.0 · Marzo 2026*
