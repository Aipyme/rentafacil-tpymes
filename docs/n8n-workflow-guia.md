# Guía del Workflow de n8n — Renta Fácil TPymes

## Resumen del flujo

```
Cliente rellena formulario web
        ↓
Webhook n8n recibe el payload (POST)
        ↓
n8n escribe la fila en Google Sheets
        ↓
Panel del Asesor lee el Sheet (GET)
        ↓
Asesor marca como "Completado" → n8n actualiza el estado en el Sheet
```

---

## 1. Estructura del Google Sheet

El Sheet debe tener **exactamente estas columnas** en la primera fila (fila 1 = cabeceras):

| Columna | Nombre exacto | Descripción |
|---------|--------------|-------------|
| A | `id` | ID de expediente (ej. `RF2503-A1B2`) |
| B | `nombre` | Nombre completo del cliente |
| C | `email` | Email del cliente |
| D | `telefono` | Teléfono del cliente |
| E | `nif` | NIF/NIE del cliente |
| F | `comunidad` | Comunidad autónoma |
| G | `situacion` | Tipo de contribuyente (Asalariado, Pensionista…) |
| H | `ingresos` | Tramo de ingresos (ej. `22k_35k`) |
| I | `numPagadores` | Número de pagadores (1, 2, 3) |
| J | `tieneInmuebles` | Tiene inmuebles (TRUE/FALSE) |
| K | `tieneActividad` | Tiene actividad económica (TRUE/FALSE) |
| L | **`nombreEmpresa`** | **NUEVO** — Nombre de la empresa pagadora |
| M | **`nifPagador`** | **NUEVO** — NIF/CIF de la empresa pagadora |
| N | `complejidad` | Complejidad calculada (simple/medio/complejo) |
| O | `plan` | Plan recomendado (Renta Simple/Estándar/Premium) |
| P | `deduccionesDetectadas` | Deducciones detectadas (separadas por coma) |
| Q | `documentosNecesarios` | Documentos necesarios (separados por coma) |
| R | `estado` | Estado del caso (Pendiente/En proceso/Completado/Cancelado) |
| S | `fechaRegistro` | Fecha y hora de registro (ISO 8601) |
| T | `prefiereContacto` | Canal de contacto preferido (whatsapp/email/telefono) |
| U | `aceptaRGPD` | Acepta política de privacidad (TRUE/FALSE) |

> **Importante:** Las columnas L y M (`nombreEmpresa` y `nifPagador`) son las **nuevas** añadidas en esta versión. Si ya tienes un Sheet existente, añade estas dos columnas antes de `complejidad`.

---

## 2. Workflow de n8n — Recibir formulario (POST)

### Nodo 1: Webhook (trigger)
- **Tipo:** Webhook
- **Método:** POST
- **Path:** `/renta-facil` (o el que ya tengas configurado)
- **Autenticación:** None (o Header Auth si quieres seguridad adicional)
- **Respuesta:** Inmediata (Respond immediately)

### Nodo 2: Set — Preparar datos para el Sheet

Mapea los campos del payload a las columnas del Sheet:

```javascript
// En el nodo "Set" o "Code", mapear así:
{
  id: $json.expedienteId,
  nombre: $json.nombreCompleto,
  email: $json.email,
  telefono: $json.telefono,
  nif: $json.nif,
  comunidad: $json.comunidadAutonoma,
  situacion: $json.tipo,
  ingresos: $json.rendimientosTrabajo,
  numPagadores: $json.numPagadores,
  tieneInmuebles: $json.tieneInmueblesAlquilados,
  tieneActividad: $json.tieneActividadEconomica,
  nombreEmpresa: $json.nombreEmpresa,      // ← NUEVO
  nifPagador: $json.nifPagador,            // ← NUEVO
  complejidad: $json.complejidad,
  plan: $json.plan,
  deduccionesDetectadas: $json.deduccionesDetectadas,
  documentosNecesarios: $json.documentosNecesarios,
  estado: "Pendiente",
  fechaRegistro: $json.fechaRegistro,
  prefiereContacto: $json.prefiereContacto,
  aceptaRGPD: $json.aceptaPolitica
}
```

### Nodo 3: Google Sheets — Append Row
- **Operación:** Append or Update Row
- **Document ID:** ID de tu Google Sheet
- **Sheet Name:** Nombre de la hoja (ej. `Casos`)
- **Columns:** Mapear los campos del nodo Set a las columnas del Sheet

---

## 3. Workflow de n8n — Leer casos para el Panel (GET)

El Panel del Asesor puede leer los casos de dos formas:

### Opción A: API directa de Google Sheets (recomendada)

Configura en los Secretos de la web:
- `GOOGLE_SHEETS_API_KEY` — API Key de Google Cloud Console
- `GOOGLE_SHEETS_ID` — ID del Sheet (de la URL: `https://docs.google.com/spreadsheets/d/**ESTE_ID**/edit`)

El backend de la web leerá el Sheet directamente sin pasar por n8n.

### Opción B: Via n8n webhook (alternativa)

Si prefieres que n8n gestione la lectura, crea un segundo webhook en n8n:

**Nodo 1: Webhook (trigger)**
- **Método:** GET
- **Path:** `/renta-facil-leer` (diferente al de escritura)
- **Parámetro de query:** `action=read_cases`

**Nodo 2: Google Sheets — Get Rows**
- **Operación:** Get Many Rows
- **Document ID:** ID de tu Google Sheet
- **Sheet Name:** Nombre de la hoja

**Nodo 3: Respond to Webhook**
- **Response Body:** `{{ $json }}` (devuelve el array de filas)

Luego configura en los Secretos de la web la URL de este webhook como `VITE_WEBHOOK_N8N`.

---

## 4. Workflow de n8n — Actualizar estado (POST con action=update_estado)

Cuando el asesor marca un caso como "Completado" desde el Panel, la web envía:

```json
{
  "action": "update_estado",
  "casoId": "RF2503-A1B2",
  "nuevoEstado": "Completado",
  "rowIndex": 5
}
```

### Nodo 1: Webhook (trigger)
- **Método:** POST
- **Path:** `/renta-facil` (el mismo webhook de escritura)

### Nodo 2: IF — Distinguir acción

Condición: `{{ $json.action === "update_estado" }}`

**Rama TRUE (actualizar estado):**

### Nodo 3: Google Sheets — Update Row
- **Operación:** Update Row
- **Document ID:** ID del Sheet
- **Row Number:** `{{ $json.rowIndex }}`
- **Columna `estado`:** `{{ $json.nuevoEstado }}`

**Rama FALSE (nuevo caso):**
→ Continúa con el flujo de escritura normal (Nodo 2 del apartado 2)

---

## 5. Payload completo que envía el formulario web

Este es el JSON completo que el formulario envía al webhook cuando un cliente completa el triage:

```json
{
  "nombreCompleto": "María García López",
  "nif": "12345678A",
  "email": "maria@ejemplo.com",
  "telefono": "612345678",
  "comunidadAutonoma": "Andalucía",
  "estadoCivil": "Sin cargas familiares",
  "numHijos": "0",
  "tipoVivienda": "Sin inmuebles",
  "hipotecaAnterior2013": "FALSE",
  "rendimientosTrabajo": "28000",
  "numPagadores": "1",
  "tieneOtrosRendimientos": "FALSE",
  "otrosRendimientosDescripcion": "",
  "tieneInmueblesAlquilados": "FALSE",
  "tieneInversiones": "FALSE",
  "tieneActividadEconomica": "FALSE",
  "deduccionesConocidas": "Reducción por aportaciones a planes de pensiones",
  "tieneDiscapacidad": "FALSE",
  "porcentajeDiscapacidad": "0",
  "realizaDonaciones": "FALSE",
  "tienePlanPensiones": "TRUE",
  "aceptaPolitica": "TRUE",
  "aceptaTratamiento": "TRUE",
  "estado": "recibido",
  "tipo": "Asalariado",
  "nombreEmpresa": "Mercadona S.A.",
  "nifPagador": "A46103834",
  "expedienteId": "RF2503-A1B2",
  "complejidad": "simple",
  "plan": "Renta Simple",
  "precio": "Según caso",
  "deduccionesDetectadas": "Reducción por aportaciones a planes de pensiones",
  "documentosNecesarios": "DNI/NIE del contribuyente, Datos fiscales de la AEAT, Certificado de retenciones de la empresa",
  "fechaRegistro": "2026-03-23T15:30:00.000Z",
  "prefiereContacto": "whatsapp"
}
```

> Los campos **`nombreEmpresa`** y **`nifPagador`** son los nuevos que se añaden en esta versión del formulario.

---

## 6. Configuración de Secretos en la web

Accede al panel de Manus → Settings → Secrets y añade:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `VITE_WEBHOOK_N8N` | `https://tu-n8n.com/webhook/renta-facil` | URL del webhook de n8n (ya configurado) |
| `GOOGLE_SHEETS_API_KEY` | `AIza...` | API Key de Google Cloud (para lectura directa) |
| `GOOGLE_SHEETS_ID` | `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms` | ID del Google Sheet |

> Si configuras `GOOGLE_SHEETS_API_KEY` y `GOOGLE_SHEETS_ID`, el Panel del Asesor leerá el Sheet directamente (más rápido). Si solo tienes `VITE_WEBHOOK_N8N`, usará n8n como intermediario.

---

## 7. Verificación del flujo completo

1. **Formulario web** → Rellena el triage en `/empezar` y completa los datos de empresa pagadora
2. **n8n recibe** → Verifica en n8n que llega el payload con `nombreEmpresa` y `nifPagador`
3. **Google Sheet** → Comprueba que se añade la fila con las columnas L y M rellenas
4. **Panel del Asesor** → Accede a `/panel-asesor` y verifica que aparece el caso con los datos de la empresa
5. **Marcar completado** → Haz clic en "Marcar como completado" y verifica que el estado cambia en el Sheet

---

## 8. Workflow de n8n — Notificación por email "Revisión pendiente"

Cuando el asesor cambia el estado de un caso a **"Revisión pendiente"** desde el Panel, la web envía automáticamente este payload al webhook de n8n:

```json
{
  "action": "notificar_revision_pendiente",
  "casoId": "RF2503-A1B2",
  "nombreCliente": "María García López",
  "emailCliente": "maria@ejemplo.com",
  "nifCliente": "12345678A",
  "asesorAsignado": "Carlos Martínez",
  "notasAsesor": "Tiene inmuebles alquilados, revisar modelo 100",
  "comunidad": "Andalucía",
  "complejidad": "complejo",
  "timestamp": "2026-03-23T15:30:00.000Z"
}
```

### Configuración en n8n

En el mismo webhook que ya tienes (el de `update_estado`), añade una nueva rama en el nodo IF:

**Nodo IF — Añadir condición para notificación:**

```
Condición 1: $json.action === "update_estado"     → Rama: Actualizar estado en Sheet
Condición 2: $json.action === "notificar_revision_pendiente"  → Rama: Enviar email
Condición 3 (default): nuevo caso                 → Rama: Escribir fila en Sheet
```

**Nodo Email (rama notificación):**

Puedes usar el nodo **Send Email** de n8n (Gmail, SMTP, Brevo, etc.) con esta plantilla:

- **Para:** `{{ $json.asesorAsignado }}@tudominio.com` (o un email fijo del equipo)
- **Asunto:** `⚠️ Revisión pendiente: {{ $json.nombreCliente }} ({{ $json.casoId }})`
- **Cuerpo HTML:**

```html
<h2>Caso requiere revisión</h2>
<p>El caso <strong>{{ $json.casoId }}</strong> ha sido marcado como <strong>Revisión pendiente</strong>.</p>

<table>
  <tr><td><strong>Cliente:</strong></td><td>{{ $json.nombreCliente }}</td></tr>
  <tr><td><strong>NIF:</strong></td><td>{{ $json.nifCliente }}</td></tr>
  <tr><td><strong>Email cliente:</strong></td><td>{{ $json.emailCliente }}</td></tr>
  <tr><td><strong>Comunidad:</strong></td><td>{{ $json.comunidad }}</td></tr>
  <tr><td><strong>Complejidad:</strong></td><td>{{ $json.complejidad }}</td></tr>
  <tr><td><strong>Asesor asignado:</strong></td><td>{{ $json.asesorAsignado }}</td></tr>
  <tr><td><strong>Notas del asesor:</strong></td><td>{{ $json.notasAsesor }}</td></tr>
  <tr><td><strong>Fecha:</strong></td><td>{{ $json.timestamp }}</td></tr>
</table>

<p><a href="https://rentafacil-9cyuqahz.manus.space/panel-asesor">Abrir Panel del Asesor →</a></p>
```

### Flujo completo actualizado

```
Panel del Asesor cambia estado a "Revisión pendiente"
        ↓
Web envía POST al webhook n8n con action=notificar_revision_pendiente
        ↓
n8n IF: detecta la acción
        ↓
n8n Send Email → asesor responsable recibe el email
        ↓
n8n Respond to Webhook → confirma éxito a la web
        ↓
Panel muestra toast: "Notificación enviada al asesor por email"
```

> **Nota:** Si n8n no está configurado o el webhook falla, el cambio de estado se guarda igualmente en el Sheet. La notificación es un paso adicional, no bloquea el flujo principal.

---

## 9. Resumen de acciones disponibles en el webhook

El webhook de n8n recibe todos los eventos de la web. Usa el campo `action` para distinguirlos:

| `action` | Cuándo se dispara | Qué hace n8n |
|----------|-------------------|--------------|
| *(sin action)* | Cliente completa el formulario | Escribe nueva fila en el Sheet |
| `update_estado` | Asesor cambia el estado desde el panel | Actualiza columna `estado` en el Sheet |
| `update_gestion` | Asesor guarda cambios de gestión | Actualiza columnas BA-BJ en el Sheet |
| `notificar_revision_pendiente` | Estado cambia a "Revisión pendiente" | Envía email de alerta al asesor |
| `read_cases` (GET) | Panel carga los casos | Devuelve filas del Sheet (solo si no hay API Key directa) |
