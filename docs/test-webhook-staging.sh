#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# test-webhook-staging.sh
# Curl de prueba para disparar el webhook derivacion_handler con el payload
# de TEST-001. Úsalo en staging para verificar que el workflow n8n funciona
# correctamente antes de activarlo en producción.
#
# Uso:
#   chmod +x test-webhook-staging.sh
#   ./test-webhook-staging.sh
#
# Sustituye N8N_WEBHOOK_URL por la URL real de tu webhook en n8n.
# ─────────────────────────────────────────────────────────────────────────────

N8N_WEBHOOK_URL="https://autogr.app.n8n.cloud/webhook/derivacion-create"

# Calcular el próximo día hábil a las 10:00 (hora Madrid)
# (Ajustar manualmente si es necesario)
RESERVED_SLOT="2026-04-02T10:00:00+02:00"

echo "🚀 Disparando webhook derivacion_handler con payload TEST-001..."
echo "   URL: $N8N_WEBHOOK_URL"
echo ""

curl -s -X POST "$N8N_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "derivacion_created",
    "derivacion_id": "d-TEST-001",
    "expediente_id": "RF2025-TEST-001",
    "expediente_url": "https://rentatpymes.aicheckpyme.co/api/trpc/simulador.getExpediente?input=%7B%220%22%3A%7B%22json%22%3A%7B%22expedienteId%22%3A%22RF2025-TEST-001%22%7D%7D%7D",
    "es_complejo": true,
    "flag_review": true,
    "contribuyente": {
      "nombre": "Juan Pérez García",
      "nif": "12345678Z"
    },
    "user_contact": {
      "nombre": "Juan Pérez García",
      "nif": "12345678Z",
      "email": "juan.perez.test@ejemplo.com",
      "phone": "+34666123456"
    },
    "franja_horaria": "manana_temprano",
    "reserved_slot": "'"$RESERVED_SLOT"'",
    "motivo": "Actividad económica como autónomo requiere revisión especializada",
    "descripcion_situacion": "Soy autónomo a tiempo parcial y también tengo rendimientos del trabajo. Tengo dudas sobre las deducciones aplicables.",
    "ahorro_estimado": 527.00,
    "precio": 84,
    "google_calendar_event": {
      "summary": "Revisión Renta - Juan Pérez García (RF2025-TEST-001)",
      "description": "Expediente: RF2025-TEST-001\nMotivo: Actividad económica como autónomo\nAhorro estimado: 527 €\nPrecio: 84 €\nLink admin: https://rentatpymes.aicheckpyme.co/panel-asesor",
      "start": { "dateTime": "'"$RESERVED_SLOT"'" },
      "end": { "dateTime": "2026-04-02T11:00:00+02:00" },
      "attendees": [{ "email": "info@ayudatpymes.com" }],
      "status": "tentative"
    },
    "email_template": {
      "to": "juan.perez.test@ejemplo.com",
      "nombre_cliente": "Juan Pérez García",
      "expediente_id": "RF2025-TEST-001",
      "motivo": "Actividad económica como autónomo",
      "ahorro_estimado": 527.00,
      "precio": 84,
      "reserved_slot": "'"$RESERVED_SLOT"'",
      "link_expediente": "https://rentatpymes.aicheckpyme.co/mi-renta/RF2025-TEST-001"
    },
    "timestamp": "'"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"'"
  }' \
  | python3 -m json.tool 2>/dev/null || echo "(respuesta no es JSON válido)"

echo ""
echo "✅ Petición enviada. Verifica en n8n:"
echo "   1. El evento aparece en Google Calendar como 'tentative'"
echo "   2. El email llega a juan.perez.test@ejemplo.com"
echo "   3. El canal #asesores de Slack recibe la notificación"
echo "   4. La fila aparece en la hoja 'Derivaciones' del Google Sheet"
echo "   5. El contacto se crea en HubSpot (si está configurado)"
