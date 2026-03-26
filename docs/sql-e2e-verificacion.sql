-- ============================================================
-- SQL E2E VERIFICACIÓN — Renta Fácil TPymes
-- Ejecutar en el panel Database de Manus o via cliente MySQL
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- A. Verificar derivación de prueba TEST-001
-- ─────────────────────────────────────────────────────────────
SELECT
  id,
  expediente_id,
  nombre,
  email,
  reserved_slot,
  slot_status,
  estado,
  asesor_asignado,
  assigned_advisor_id,
  calendar_event_id,
  calendar_created_by,
  n8n_execution_id,
  created_at
FROM solicitudes_asesor
WHERE expediente_id = 'TEST-001'
ORDER BY created_at DESC;

-- ─────────────────────────────────────────────────────────────
-- B. Detectar duplicados por expediente_id
-- ─────────────────────────────────────────────────────────────
SELECT
  expediente_id,
  COUNT(*) AS total,
  GROUP_CONCAT(id ORDER BY created_at) AS ids,
  GROUP_CONCAT(slot_status ORDER BY created_at) AS estados
FROM solicitudes_asesor
GROUP BY expediente_id
HAVING COUNT(*) > 1;

-- ─────────────────────────────────────────────────────────────
-- C. Solicitudes sin calendar_event_id (posibles fallos Calendar)
-- ─────────────────────────────────────────────────────────────
SELECT
  id,
  expediente_id,
  nombre,
  email,
  reserved_slot,
  slot_status,
  estado,
  n8n_execution_id,
  created_at
FROM solicitudes_asesor
WHERE calendar_event_id IS NULL
  AND slot_status IN ('tentative', 'confirmed')
ORDER BY created_at DESC
LIMIT 50;

-- ─────────────────────────────────────────────────────────────
-- D. Solicitudes pendientes sin asignar (>24h sin gestionar)
-- ─────────────────────────────────────────────────────────────
SELECT
  id,
  expediente_id,
  nombre,
  email,
  telefono,
  franja_horaria,
  reserved_slot,
  slot_status,
  estado,
  TIMESTAMPDIFF(HOUR, created_at, NOW()) AS horas_sin_gestionar,
  created_at
FROM solicitudes_asesor
WHERE estado = 'pendiente'
  AND assigned_advisor_id IS NULL
  AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY created_at ASC;

-- ─────────────────────────────────────────────────────────────
-- E. Resumen de estado del sistema (métricas básicas)
-- ─────────────────────────────────────────────────────────────
SELECT
  estado,
  slot_status,
  COUNT(*) AS total,
  SUM(CASE WHEN calendar_event_id IS NOT NULL THEN 1 ELSE 0 END) AS con_calendar,
  SUM(CASE WHEN assigned_advisor_id IS NOT NULL THEN 1 ELSE 0 END) AS asignadas
FROM solicitudes_asesor
GROUP BY estado, slot_status
ORDER BY estado, slot_status;

-- ─────────────────────────────────────────────────────────────
-- F. Listar asesores activos
-- ─────────────────────────────────────────────────────────────
SELECT
  id,
  nombre,
  email,
  calendar_mode,
  activo,
  created_at
FROM asesores
ORDER BY nombre;

-- ─────────────────────────────────────────────────────────────
-- G. Limpieza segura: marcar duplicados (NO borrar sin revisar)
-- Ejecutar SOLO después de revisar los resultados de B
-- ─────────────────────────────────────────────────────────────
/*
UPDATE solicitudes_asesor s1
JOIN (
  SELECT expediente_id, MAX(id) AS max_id
  FROM solicitudes_asesor
  GROUP BY expediente_id
  HAVING COUNT(*) > 1
) dup ON s1.expediente_id = dup.expediente_id AND s1.id < dup.max_id
SET s1.estado = 'cancelado',
    s1.notas_asesor = CONCAT('DUPLICADO - cancelado automáticamente ', NOW())
WHERE s1.slot_status NOT IN ('confirmed');
*/
-- ─────────────────────────────────────────────────────────────
-- NOTA: La consulta G está comentada por seguridad.
-- Descomenta SOLO si has revisado los duplicados y confirmas que son seguros de cancelar.
-- ─────────────────────────────────────────────────────────────
