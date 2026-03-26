#!/bin/bash
# ============================================================
# test-webhook-staging.sh
# Curl de prueba para el webhook derivacion-create (payload exacto del documento)
#
# Uso:
#   chmod +x test-webhook-staging.sh
#   ./test-webhook-staging.sh
# ============================================================

WEBHOOK_URL="https://autogr.app.n8n.cloud/webhook/derivacion-create"
WEBHOOK_KEY="your_test_key"  # Sustituir por el valor real de N8N_WEBHOOK_KEY

echo "🚀 Enviando payload de prueba al webhook..."
echo "URL: $WEBHOOK_URL"
echo ""

curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Key: $WEBHOOK_KEY" \
  -d '{
    "derivacion_id": "d-456",
    "expediente_id": "TEST-001",
    "contribuyente": {
      "nombre": "Juan Pérez",
      "email": "juan@test.com"
    },
    "user_contact": {
      "nombre": "Juan Pérez",
      "email": "juan@test.com",
      "phone": "+34666123456",
      "nif": "12345678Z"
    },
    "assigned_advisor_email": "asesor@tpymes.com",
    "motivo": "Actividad económica como autónomo requiere revisión especializada",
    "ahorro_estimado": 527,
    "precio": 84,
    "franja_horaria": "manana",
    "reserved_slot": "2026-04-02T10:00:00+02:00",
    "es_complejo": true,
    "flag_review": true
  }' \
  -w "\n\nHTTP Status: %{http_code}\nTiempo total: %{time_total}s\n"

echo ""
echo "============================================================"
echo "✅ CHECKLIST DE VERIFICACIÓN POST-PRUEBA:"
echo "============================================================"
echo ""
echo "[ ] 1. Evento tentative en Google Calendar 'Citas Renta Fácil'"
echo "       - Título: 'Revisión Renta - Juan Pérez (TEST-001)'"
echo "       - Duración: 60 min (10:00 - 11:00 Madrid)"
echo "       - Attendee: asesor@tpymes.com (recibe invitación por email)"
echo "       - Estado: tentative"
echo ""
echo "[ ] 2. Email de confirmación provisional en juan@test.com"
echo "       - Asunto: 'Confirmación provisional de cita — Renta Fácil'"
echo "       - Contiene: slot 2026-04-02T10:00, expediente TEST-001, ahorro 527€"
echo ""
echo "[ ] 3. Fila en Google Sheets → hoja 'Derivaciones'"
echo "       - derivacion_id: d-456"
echo "       - telefono: +34666123456 (SIN espacios delante)"
echo "       - motivo: texto completo (SIN espacios delante)"
echo "       - calendar_event_id: ID del evento (no vacío)"
echo "       - asesor_asignado: asesor@tpymes.com"
echo ""
echo "[ ] 4. TEST IDEMPOTENCIA: reenviar el mismo payload"
echo "       - NO se crea un segundo evento en Calendar"
echo "       - Backend devuelve 'duplicate_skipped' en n8nStatus"
echo ""
echo "[ ] 5. Zona horaria correcta: evento a las 10:00 hora Madrid"
echo ""
echo "============================================================"
echo "Si falla, revisar:"
echo "  - Credenciales en n8n (Google Calendar, SMTP, Sheets)"
echo "  - Workflow ACTIVE en n8n"
echo "  - Logs en n8n → Executions"
echo "============================================================"
