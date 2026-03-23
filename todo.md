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
