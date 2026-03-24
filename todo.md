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
- [ ] Configurar GOOGLE_SHEETS_API_KEY en Secretos del panel de Manus
- [ ] Configurar GOOGLE_SHEETS_ID en Secretos del panel de Manus
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
