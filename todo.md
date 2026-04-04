# Renta Fácil TPymes - TODO

## Completado anteriormente
- [x] Landing page principal (/)
- [x] Simulador de IRPF (/simulador)
- [x] Formulario de triage (/empezar)
- [x] Blog con artículos regionales (/blog)
- [x] Landings regionales: Andalucía, Madrid, Cataluña, Valencia
- [x] Página demo para Alfredo (/demo-alfredo) sin precios
- [x] Panel del Asesor (/panel-asesor) con generador XML Modelo 100
- [x] Integración n8n: formulario → Google Sheets → email confirmación
- [x] Añadir backend (web-db-user) para habilitar API routes
- [x] Corregir errores TypeScript (storage.ts, vite.config.ts)

## Completado en esta sesión
- [x] Crear tRPC procedure para leer casos del Google Sheet (server/routers/casos.ts)
- [x] Añadir variables de entorno GOOGLE_SHEETS_API_KEY y GOOGLE_SHEETS_ID al backend
- [x] Conectar Panel del Asesor con datos reales del Google Sheet (con fallback a n8n)
- [x] Ampliar formulario /empezar con campos del pagador (NIF empresa, nombre empresa)
- [x] Actualizar payload del webhook para incluir nifPagador y nombreEmpresa
- [x] Documentación completa del workflow n8n (docs/n8n-workflow-guia.md)

## Pendiente de configurar (secretos)
- [x] Configurar GOOGLE_SHEETS_API_KEY en Railway/Manus ✅
- [x] Configurar GOOGLE_SHEETS_ID en Railway/Manus ✅
- [ ] Añadir columnas L (nombreEmpresa) y M (nifPagador) al Google Sheet existente
- [ ] Actualizar workflow de n8n para mapear los nuevos campos al Sheet

## Sesión actual
- [x] Configurar GOOGLE_SHEETS_API_KEY en Secretos del panel de Manus
- [x] Configurar GOOGLE_SHEETS_ID en Secretos del panel de Manus
- [x] Corregir scripts de build/start en package.json (fix deploy)
- [x] Añadir columnas AY (nombreEmpresa) y AZ (nifPagador) al Google Sheet existente
- [x] Actualizar backend para leer rango A:BZ y mapear columnas reales del Sheet
- [x] Verificar lectura correcta del Sheet con los nuevos campos

## Urgente - Seguridad y mejoras Panel Asesor
- [x] Proteger /panel-asesor con contraseña (PANEL_PASSWORD) - token diario, expira cada 24h
- [x] Pantalla de login básica en el frontend del panel con botón Salir
- [x] Filtro de búsqueda por empresa pagadora en el sidebar del panel
- [x] Botón exportar tabla a CSV (incluye: ID, Nombre, NIF, Email, Teléfono, Empresa, NIF Pagador, Estado)

## Columnas de gestión y mejoras del panel
- [x] Añadir columnas de gestión al Sheet: BA-BJ (prioridad, asesorAsignado, notasAsesor, documentosRecibidos, fechaContacto, fechaRevision, resultadoFinal, importeResultado, fechaPresentacion, observaciones)
- [x] Actualizar backend para leer rango A:BJ y mapear las 10 nuevas columnas de gestión
- [x] Panel: notas internas editables por el asesor
- [x] Panel: selector de prioridad (Alta/Media/Baja) con indicador visual de color
- [x] Panel: campo de asesor asignado
- [x] Panel: checklist de documentos recibidos (9 tipos predefinidos + campo libre)
- [x] Panel: campos de fecha de contacto, revisión y presentación
- [x] Panel: estado ampliado con 6 opciones (incl. Revisión pendiente, Documentación pendiente)
- [x] Panel: vista tabla alternativa con todas las columnas de gestión
- [x] Panel: filtro por prioridad en el sidebar
- [x] Panel: ordenación automática por prioridad (Alta primero) y fecha

## Mejoras panel - filtros y notificaciones
- [x] Filtro por asesor asignado en el sidebar del panel (desplegable dinámico con asesores reales del Sheet)
- [x] Buscador por NIF/CIF del cliente en el sidebar del panel (busca NIF cliente y NIF pagador)
- [x] Botón exportar CSV mejorado (exporta casos filtrados con 28 columnas)
- [x] Notificación por email cuando un caso pasa a estado "Revisión pendiente" (via n8n webhook)
- [x] Backend: tRPC mutation notificarRevisionPendiente + listarAsesores
- [x] Documentación n8n actualizada con sección 8 (notificaciones) y sección 9 (tabla de acciones)

## Notas rápidas en el panel
- [x] Columna "Notas" visible en la vista tabla del panel (con tooltip al pasar el ratón)
- [x] Notas visibles en tarjetas del sidebar con icono 📝
- [x] Botón "Añadir nota" / "Editar nota" inline en el detalle del caso
- [x] Editor de notas con textarea y guardado directo en el Sheet via tRPC

## Validación NIF y fix webhook
- [ ] Validación de NIF/NIE/CIF en el frontend con mensaje de error visual
- [ ] Verificar flujo completo formulario → n8n → Google Sheet

## Sistema de documentos (sesión actual)
- [x] Tabla `documentos` creada en MySQL con migración aplicada (drizzle/schema.ts)
- [x] Corregir drizzle.config.ts para usar MySQL en lugar de PostgreSQL
- [x] Router tRPC `documentos` con: listar, subirBase64, confirmarSubida, eliminar, getDownloadUrl
- [x] Componente reutilizable `DocumentosPanel` (asesor + cliente) con drag & drop, categorías, preview
- [x] Sección "Documentos del caso" integrada en el Panel del Asesor
- [x] Página de seguimiento del cliente `/seguimiento?caso=ID` con verificación por NIF
- [x] Procedimiento `casos.buscarPorId` para la página de seguimiento
- [x] Ruta `/seguimiento` registrada en App.tsx
- [x] Google Sheet: columnas Z-AJ borradas (datos IA obsoletos), mapa de columnas corregido
- [x] Nodo WF02 de n8n actualizado para aceptar campos del formulario (AB-AK) además de gestión
- [x] 8 casos de prueba realistas con todos los campos rellenos en el Sheet

## Mejoras de comunicación y UX (sesión actual)
- [ ] Nodo email WF01 de n8n: incluir enlace de seguimiento en el email de confirmación al cliente
- [x] Backend confirmarSubida: notificación al asesor cuando el cliente sube un documento
- [x] Panel del Asesor: botón "Copiar enlace del cliente" en el detalle de cada caso (con opciones: copiar, WhatsApp, email)

## Mejoras UX panel y comunicación (sesión actual)
- [ ] Email n8n WF01: añadir enlace de seguimiento en el email de confirmación al cliente
- [x] Panel sidebar: badge con contador de documentos subidos por el cliente por caso
- [x] DocumentosPanel: campo de motivo al rechazar/eliminar un documento

## Historial rechazos y recordatorio n8n (sesión actual)
- [x] BD: tabla rechazos_documentos (casoId, nombreArchivo, motivo, fecha)
- [x] Backend: guardar rechazo al eliminar doc del cliente con motivo
- [x] /seguimiento: sección "Documentos rechazados" con motivo visible para el cliente
- [x] n8n: HTML del email de recordatorio preparado (n8n_email_recordatorio.html) + instrucciones de configuración

## Columna ultimoRecordatorio (sesión actual)
- [x] Sheet: añadida columna ultimoRecordatorio en AY (hecho manualmente por el usuario)
- [x] Backend WF02: actualizar nodo para que acepte y escriba ultimoRecordatorio (n8n_actualizar_caso.js v2.1)
- [x] Backend: endpoint casos.listarParaRecordatorio (casos doc. pendiente > 3 días sin recordatorio hoy)
- [x] n8n WF02: nodo actualizado para escribir ultimoRecordatorio (pendiente de pegar en n8n)

## Firma digital y exportar PDF (sesión actual)
- [x] Instalar signature_pad, jspdf, html2canvas
- [x] BD: añadida tabla firmas (casoId, firmaUrl, ip, fecha, nif)
- [x] Backend: procedimiento firmas.guardar (sube PNG a S3, guarda en BD y Sheet)
- [x] /seguimiento: componente FirmaDigital con canvas, botón firmar y confirmación
- [x] Panel asesor: botón "Exportar PDF" que genera resumen del caso (jsPDF, con firma si existe)
- [x] Sheet: columna firmaUrl se registra en BD y se envía al Sheet via WF02

## Deducciones autonómicas todas las CCAA (sesión actual)
- [x] Investigar etiquetas XML AEAT para las 15 CCAA de régimen común (XSD oficial descargado de AEAT)
- [x] generadorXML.ts: tipos TypeScript para cada comunidad (DeduccionMadrid, DeduccionCatalunya, etc.)
- [x] generadorXML.ts: bloques XML <DeduccionAutonomica> para las 15 CCAA con etiquetas oficiales AEAT
- [x] DatosDeclaracion: campos deduccionXxx por comunidad con tipos TypeScript completos
- [x] Triage: bloque dinámico de deducciones autonómicas por comunidad + campos enviados al Sheet
- [x] Tests: 7/7 tests pasan, sin errores TypeScript

## Recordatorio automático y validación NIF (sesión actual)
- [x] Backend: endpoint público casos.listarParaRecordatorio (ya estaba implementado)
- [x] n8n: instrucciones completas para configurar el workflow de recordatorio diario (entregadas al usuario)
- [x] Triage: validación en tiempo real NIF/NIE/CIF con letra de control (ya estaba implementada)
- [x] Triage: mensaje de error visual inline bajo el campo NIF (ya estaba implementado)

## Correcciones pre-demo Luis Guillén (sesión actual)
- [x] Precio estimado en triage: corregido de "Según caso€" a valores reales (desde 39€/69€/99€)
- [x] Bug panel lateral: al clicar un caso, el detalle puede mostrar datos del caso anterior — era error de clic en la prueba, el código es correcto
- [x] Emails de seguimiento: confirmado que van al email del cliente ($json.email) en workflow 01
- [x] Añadir botón eliminar caso en el panel del asesor (para limpiar casos de prueba)
- [ ] Precio en triage: evaluar si mostrar precio orientativo o quitarlo (el precio final lo fija el asesor)

## Demo Luis Guillén - ajustes finales (sesión actual)
- [x] Triage: quitar precio estimado del resultado, sustituir por "Te contactamos en 24h con presupuesto exacto"
- [x] n8n WF01: corregir email confirmación — precio "Según caso" → quitar precio, añadir enlace de seguimiento
- [x] Preparar 3 casos de ejemplo realistas en el Sheet para la demo (María García, Carlos Martínez, Ana Fernández)
- [x] n8n WF01: corregir zona horaria — guardar hora en formato español (UTC+2) en lugar de UTC
- [x] n8n WF01: asegurar que todas las celdas del Sheet se rellenan con valores por defecto (nunca vacías)

## Nueva plataforma renta automatizada (sesión actual)
- [x] Motor fiscal IRPF 2025 (server/lib/motorFiscal.ts) - tramos, deducciones estatales y autonómicas 17 CCAA
- [x] Schema BD: tabla declaraciones y configuracion_precios (drizzle/schema.ts)
- [x] Router tRPC simulador (server/routers/simulador.ts) - calcular, guardar, getExpediente, listar
- [x] Página SimuladorRenta (/renta) - 7 pasos + comparativa + CTA de pago
- [x] Ruta /renta registrada en App.tsx
- [x] Guardar checkpoint y verificar en producción
- [x] Integrar Stripe con Google Pay / Apple Pay (server/routers/pagos.ts + stripeWebhook.ts)
- [x] Página de pago /pago/:expedienteId (client/src/pages/PagoRenta.tsx)
- [x] Área de cliente /mi-renta/:expedienteId (client/src/pages/MiRenta.tsx)
- [x] Generación de informe PDF con casillas modelo 100 (server/lib/generarPDF.ts)
- [x] Botón "Simula gratis" en landing apunta a /renta
- [ ] Panel de administración para gestión de declaraciones
- [ ] Actualizar precios cuando los confirme el cliente
- [x] Prueba E2E completa del flujo: simulador → pago → área cliente → PDF (5/5 PASS)
- [x] Mejoras UX simulador: validación por paso, indicador de pasos visual con círculos, mensajes de error

## Funcionalidad casos complejos → Asesor fiscal

- [x] Router server: asesor.ts (crearSolicitud, getSolicitudes, actualizarEstado)
- [x] Schema DB: tabla solicitudes_asesor + db:push
- [x] Página /asesor-fiscal con formulario de contacto especializado y 6 franjas horarias
- [x] Pantalla de confirmación con número de solicitud y próximos pasos
- [x] Notificación automática al asesor (notifyOwner + n8n webhook)
- [x] SimuladorRenta: redirige a /asesor-fiscal con datos pre-rellenados cuando es_complejo=true
- [ ] Panel de gestión de solicitudes en /panel-asesor

## Mejoras trazabilidad y automatización derivaciones (sesión actual)
- [x] Schema BD: añadidos campos reservedSlot, slotStatus, auditLogs, notificacionesSent, ipAddress, userAgent a solicitudes_asesor
- [x] db:push aplicado correctamente (migración 0005)
- [x] Backend asesor.ts: calcularReservedSlot() genera ISO datetime del próximo día hábil según franja
- [x] Backend asesor.ts: audit_log inicial guardado en BD con IP, user agent, timestamp, consent
- [x] Backend asesor.ts: payload webhook enriquecido (google_calendar_event + email_template + reserved_slot)
- [x] Backend asesor.ts: registro de notificaciones_sent en BD con estado del webhook n8n
- [x] Backend asesor.ts: nuevo endpoint adminConfirmarSlot (actualiza a confirmed)
- [x] Frontend /asesor-fiscal: muestra próximo día hábil disponible en el formulario
- [x] Frontend /asesor-fiscal: captura navigator.userAgent para audit log
- [x] Frontend /asesor-fiscal: pantalla confirmación muestra slot reservado formateado en español
- [x] Frontend /asesor-fiscal: muestra derivacion_id y precio estimado en confirmación
- [x] Workflow n8n JSON completo (docs/n8n-workflow-derivacion.json) - todos los nodos
- [x] Guía de configuración n8n (docs/n8n-derivacion-setup.md) - credenciales, payloads, QA queries
- [ ] Configurar credenciales en n8n (Google Calendar, SMTP, Slack, Sheets)
- [ ] Activar workflow derivacion_handler en n8n

## Mejoras seguridad, idempotencia y UX (documento revisión técnica)
- [x] Backend: añadir campo calendarEventId a solicitudes_asesor en schema
- [x] Backend: validación X-Webhook-Key en header del webhook saliente
- [x] Backend: idempotencia por derivacion_id (evitar duplicados si n8n reintenta)
- [x] Backend: guardar calendarEventId en BD cuando n8n confirma el evento
- [x] Workflow n8n: attendee dinámico (assigned_advisor_email del payload)
- [x] Workflow n8n: columnas Sheets sin espacios (telefono, motivo sin espacios delante)
- [x] Workflow n8n: añadir calendar_event_id, calendar_created_by, assigned_advisor_id a Sheets
- [ ] Workflow n8n: configurar reintentos con backoff en nodos Calendar/Email/Sheets
- [ ] Workflow n8n: alerta si derivacion.status pending > 24h
- [ ] UX: añadir link cancelar/reprogramar en email provisional al cliente

## Flujo asignación de asesor (documento pasted_content_5)
- [x] Schema: añadir tabla asesores (id, nombre, email, calendar_mode, working_hours)
- [x] Backend: tRPC procedure adminAsignarAsesor (actualiza derivación + dispara derivacion-confirm)
- [x] Backend: tRPC procedure getAsesores (lista asesores disponibles)
- [x] Workflow n8n: derivacion-confirm JSON completo e importable
- [x] Curl de prueba para endpoint de asignación

## Correcciones críticas pre-demo Luis (26/03/2026)
- [x] Unificar formularios: redirigir /empezar → /renta (o viceversa), menú nav coherente
- [x] Panel asesor: verificado — ya carga datos reales de BD y ya dice Campaña 2025 (no había hardcoded)
- [x] Footer: eliminar "Alianza con BBVA" (riesgo legal si no es real)
- [x] Sección comunidades: mostrar las 15 comunidades reales (excluir País Vasco y Navarra por régimen foral)

## E2E y correcciones post-demo (sesión 27/03/2026)
- [x] Test E2E completo: simulador → pago Stripe → webhook → BD → /mi-renta (PASS)
- [x] Webhook Stripe: corregir idempotencia para completar audit trail (stripeEventId, paymentConfirmedAt) si ya estaba pagado sin eventId
- [x] Footer: añadir sección Comunidades con las 5 comunidades con página propia (Andalucía, Madrid, Cataluña, C. Valenciana, Canarias)
- [x] Home: añadir sección SEO de comunidades autónomas (15 CCAA) entre Precios y FAQs
- [x] BD: audit trail del expediente de test RF2025-989FZU completado manualmente

## Pendientes sesión 28/03/2026
- [ ] Corregir página en blanco /mi-renta/[id] en producción (Railway — bundle JS no carga)
- [ ] Activar WF09/WF10 Calendar en n8n para crear evento de cita tras el pago
- [ ] Idempotencia del Sheet: comprobación previa en n8n para evitar filas duplicadas

## Automatización post-pago: Sheets upsert + Google Calendar (sesión actual)
- [x] googleSheets.ts: función upsertSheetRow con idempotencia por stripe_event_id (buscar → update si existe, append si no)
- [x] googleSheets.ts: función directa de escritura en Sheet via Google Sheets API v4 con Service Account
- [x] googleCalendar.ts: nuevo helper para crear evento en Google Calendar tras pago confirmado
- [x] stripeWebhook.ts: integrar upsert Sheet y creación de evento Calendar tras checkout.session.completed
- [ ] schema.ts: añadir campo calendarEventId a tabla declaraciones
- [x] env.ts: añadir GOOGLE_SERVICE_ACCOUNT_JSON, GOOGLE_CALENDAR_ID, CALENDAR_EVENT_DURATION_MINUTES

## Mejoras estilo TaxDown (sesión 03/04/2026)
- [ ] Triage: rediseño visual por bloques (TaxDown style) con iconos, progreso y preguntas claras
- [ ] Triage: añadir campo ded_actividadFisica a TriageData y buildPayload
- [ ] Triage: mapear todos los campos del Sheet (153 columnas) desde el payload del triage
- [ ] Triage: añadir bloque "Vivienda" separado con preguntas específicas
- [ ] Triage: añadir porcentaje de discapacidad cuando tieneDiscapacidad=si
- [ ] Triage: mostrar desglose de suplementos de precio en resultado
- [ ] /mi-renta: añadir progress bar visual del estado del expediente
- [ ] /mi-renta: integrar DocumentosPanel directamente en la página
- [ ] /mi-renta: integrar FirmaDigital cuando el estado es borrador_listo
- [ ] /mi-renta: corregir teléfono y email de contacto con datos reales de TPymes
- [ ] App.tsx: hacer /empezar la ruta principal del triage (sin redirección a /renta)
- [ ] Navbar: corregir link "Empezar" para que apunte directamente a /empezar
- [ ] Backend simulador.ts: enriquecer payload del Sheet con todos los campos faltantes

## Sesión 04/04/2026 — Integración Google Sheet completa
- [x] Corregir _sheetRow a 44 columnas originales del usuario
- [x] Ampliar _sheetRow a 153 columnas exactas del Sheet casos_master_v2
- [x] Corregir rango de lectura de A:BZ a A:EZ para cubrir las 153 columnas
- [x] Verificar en producción: simulación simple (RF2025-UGFAZS) y compleja (RF2025-YV7ZMM) — 153 cols OK
- [x] Webhook Stripe: actualizar payment_status → paid, payment_confirmed_at y resultado_final en Sheet al confirmar pago
- [x] Añadir estado_civil al formulario del simulador y al _sheetRow
- [x] Crear vista filtrada con formato condicional en Sheet (rojo si es_derivacion=Si y asesor_asignado vacío)
