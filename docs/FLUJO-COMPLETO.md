# RentaFacil TPymes — Flujo Completo

## PASO 1 — Triage /empezar (7 pasos)

| Paso | Qué recoge |
|------|-----------|
| Perfil | Asalariado / Autónomo / Pensionista / Desempleado |
| Ingresos | Tramo, nº pagadores, NIF/CIF empresa |
| Patrimonio | Inmuebles, alquiler, venta, inversiones |
| Familia | Hijos, monoparental, ascendientes, discapacidad |
| Deducciones | Plan pensiones, donaciones, hipoteca pre-2013 |
| Deducciones CCAA | Según CCAA seleccionada |
| Resultado | Complejidad, plan, precio, deducciones detectadas |

## PASO 2 — Cálculo complejidad (frontend, por puntos)

| Complejidad | Puntos | Plan | Precio |
|-------------|--------|------|--------|
| simple | 0-1 | Renta Simple | desde 39€ |
| medio | 2-4 | Renta Estándar | desde 69€ |
| complejo | 5+ | Renta Premium | desde 99€ |
| no_apto | Autónomo | Consulta personalizada | — |

### Sistema de puntos:
- 2 pagadores: +1
- 3+ pagadores: +2
- Ingresos >60k: +1
- 1 inmueble: +1
- Varios inmuebles: +2
- Inmueble alquilado: +1
- Inversiones: +2
- Venta inmueble: +2
- Hipoteca pre-2013: +1
- Discapacidad: +1

## PASO 3 — Deducciones CCAA (automático según CCAA)

Checkboxes dinámicos según la CCAA del contribuyente.
Ver tab Resumen_CCAA en Google Sheet.

## PASO 4 — "Contratar servicio" (un solo botón)

1. Valida NIF
2. Llama webhook WF1: `https://autogr.app.n8n.cloud/webhook/derivacion-create`
3. Envía ~50 campos
4. Muestra confirmación con RF2025-XXXXXX

**No hay bifurcación en frontend — WF1 bifurca.**

## PASO 5 — WF1 en n8n

1. Escribe fila en `casos_master_v2`
2. Bifurca:
   - simple/medio → email bienvenida + acceso /mi-renta/[id]
   - complejo → derivar a asesor → hoja DERIVACIONES
   - no_apto → derivar a asesor especializado → hoja DERIVACIONES

## PASO 6 — DERIVACIONES

Se activa por 2 vías:
- **Vía A** — Backend: cliente pulsa "Hablar con asesor" en /mi-renta/[id]
- **Vía B** — WF1: complejidad = complejo/no_apto → automático

Campos: derivacion_id, expediente_id, nombre, email, telefono, motivo, reserved_slot, estado, timestamp

## PASO 7 — Pago Stripe → Declaraciones

1. Stripe webhook → backend
2. BD: estado → pagado
3. Hoja Declaraciones (18 cols)
4. Webhook WF8 (pago-confirmado) como fallback
5. WF8 actualiza `casos_master_v2`: estado=pagado, subestado=pendiente_documentacion, payment_status=paid

## PASO 8 — Google Calendar (WF9/WF10)

Tras pago → crear cita automática en Google Calendar.
(Pendiente de configurar)
