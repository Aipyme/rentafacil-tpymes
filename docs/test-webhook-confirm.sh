#!/bin/bash
# ============================================================
# TEST E2E: Webhook derivacion-confirm
# Ejecutar DESPUÉS de haber creado una derivación con test-webhook-staging.sh
# ============================================================

N8N_CONFIRM_URL="https://autogr.app.n8n.cloud/webhook/derivacion-confirm"
WEBHOOK_KEY="your_test_key"  # Cambiar por la key real configurada en n8n

echo "🚀 Enviando webhook derivacion-confirm a n8n..."
echo ""

curl -X POST "$N8N_CONFIRM_URL" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Key: $WEBHOOK_KEY" \
  -d '{
    "event": "derivacion_confirmed",
    "derivacion_id": "d-456",
    "expediente_id": "TEST-001",
    "assigned_advisor_id": "1",
    "assigned_advisor_email": "asesor@tpymes.com",
    "contribuyente": {
      "nombre": "Juan Pérez",
      "nif": "12345678Z"
    },
    "user_contact": {
      "nombre": "Juan Pérez",
      "email": "juan@test.com",
      "phone": "+34666123456",
      "nif": "12345678Z"
    },
    "motivo": "Actividad económica como autónomo",
    "ahorro_estimado": 527,
    "precio": 84,
    "reserved_slot": "2026-04-02T10:00:00+02:00",
    "es_complejo": true
  }'

echo ""
echo ""
echo "============================================================"
echo "✅ CHECKLIST DE VERIFICACIÓN (derivacion-confirm)"
echo "============================================================"
echo ""
echo "1. GOOGLE CALENDAR:"
echo "   - Evento con ✅ en el título (estado=CONFIRMED, no tentative)"
echo "   - Attendee: asesor@tpymes.com (debe recibir invitación)"
echo "   - Duración: 60 minutos exactos"
echo "   - Hora: 2026-04-02 10:00 - 11:00 (Europe/Madrid)"
echo ""
echo "2. EMAIL CLIENTE:"
echo "   - Destinatario: juan@test.com"
echo "   - Asunto: ✅ Cita confirmada con tu asesor — Renta Fácil"
echo "   - Muestra nombre del asesor: asesor@tpymes.com"
echo "   - Diferente al email provisional (asunto y contenido)"
echo ""
echo "3. GOOGLE SHEETS (hoja Derivaciones):"
echo "   - Nueva fila con estado=confirmed"
echo "   - calendar_event_id NO vacío"
echo "   - asesor_asignado = asesor@tpymes.com"
echo "   - Sin filas duplicadas (idempotencia)"
echo ""
echo "4. SQL VERIFICACIÓN (ejecutar en panel DB de Manus):"
echo "   SELECT id, expediente_id, asesor_asignado, assigned_advisor_id,"
echo "          reserved_slot, slot_status, calendar_event_id"
echo "   FROM solicitudes_asesor"
echo "   WHERE expediente_id = 'TEST-001';"
echo ""
echo "   Resultado esperado: slot_status=confirmed, calendar_event_id presente"
echo "============================================================"
