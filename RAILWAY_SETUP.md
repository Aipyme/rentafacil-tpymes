# Guía de despliegue en Railway — Renta Fácil TPymes

Este proyecto está preparado para desplegarse en Railway directamente desde GitHub.
No depende de ningún servicio de Manus.

---

## 1. Crear el proyecto en Railway

1. Ve a [railway.app](https://railway.app) y haz login con tu cuenta GitHub (Aipyme).
2. Clic en **New Project → Deploy from GitHub repo**.
3. Selecciona `Aipyme/rentafacil-tpymes`.
4. Railway detectará automáticamente el `railway.toml` y `nixpacks.toml`.

---

## 2. Añadir MySQL

1. En tu proyecto Railway, clic en **+ New → Database → MySQL**.
2. Railway crea la base de datos y añade automáticamente `DATABASE_URL` a las variables de entorno.
3. Una vez desplegado, ejecuta las migraciones:
   ```bash
   railway run pnpm db:push
   ```

---

## 3. Variables de entorno en Railway

Ve a tu servicio → **Variables** y añade:

| Variable | Valor | Descripción |
|---|---|---|
| `NODE_ENV` | `production` | Modo producción |
| `JWT_SECRET` | (genera con `openssl rand -hex 32`) | Clave para firmar sesiones |
| `PANEL_PASSWORD` | tu contraseña | Acceso al panel asesor |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Stripe clave secreta |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Stripe clave pública |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe webhook |
| `S3_BUCKET` | `rentafacil-docs` | Nombre del bucket R2 |
| `S3_REGION` | `auto` | Región Cloudflare R2 |
| `S3_ENDPOINT` | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` | Endpoint R2 |
| `S3_ACCESS_KEY_ID` | (de Cloudflare R2) | Access Key R2 |
| `S3_SECRET_ACCESS_KEY` | (de Cloudflare R2) | Secret Key R2 |
| `S3_CDN_BASE` | `https://docs.tudominio.com` | URL pública del bucket |
| `VITE_WEBHOOK_N8N` | URL de tu webhook n8n | Webhook intake |
| `N8N_UPDATE_WEBHOOK_URL` | URL de tu webhook n8n | Webhook actualización |
| `GOOGLE_SHEETS_API_KEY` | (opcional) | Google Sheets |
| `GOOGLE_SHEETS_ID` | (opcional) | ID del Sheet |

**Variables que YA NO necesitas (Manus eliminado):**
- `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`
- `OWNER_OPEN_ID`, `OWNER_NAME`
- `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`
- `VITE_FRONTEND_FORGE_API_KEY`, `VITE_FRONTEND_FORGE_API_URL`

---

## 4. Cloudflare R2 (almacenamiento de documentos y firmas)

1. Ve a [dash.cloudflare.com](https://dash.cloudflare.com) → **R2**.
2. Crea un bucket llamado `rentafacil-docs`.
3. Ve a **Manage R2 API Tokens** → Create API Token con permisos de lectura/escritura.
4. Copia el `Account ID`, `Access Key ID` y `Secret Access Key` a Railway.
5. Activa el **dominio público** del bucket o usa un subdominio propio (ej. `docs.tudominio.com`).

---

## 5. Dominio personalizado (Namecheap + Cloudflare)

Como tu dominio está en Namecheap con Cloudflare como proxy:

1. En Railway → tu servicio → **Settings → Domains** → Add Custom Domain.
2. Railway te dará un CNAME como `xxx.up.railway.app`.
3. En Cloudflare → DNS → añade:
   ```
   Tipo: CNAME
   Nombre: @ (o www, o rentatpymes)
   Destino: xxx.up.railway.app
   Proxy: ON (nube naranja)
   ```
4. En Railway activa **Force HTTPS**.

---

## 6. Deploy automático desde GitHub

Railway ya está conectado a `Aipyme/rentafacil-tpymes`.
Cada push a `main` despliega automáticamente. No necesitas hacer nada más.

---

## 7. Verificar que funciona

- `https://tudominio.com` → Landing page
- `https://tudominio.com/api/health` → `{"status":"ok"}`
- `https://tudominio.com/panel-asesor` → Panel con contraseña
- `https://tudominio.com/renta` → Formulario guiado

---

## Resumen de independencia

| Servicio | Antes (Manus) | Ahora (tuyo) |
|---|---|---|
| Código | GitHub ✅ | GitHub ✅ |
| Servidor | Manus hosting | Railway ✅ |
| Base de datos | Manus MySQL | Railway MySQL ✅ |
| Almacenamiento | Manus S3 | Cloudflare R2 ✅ |
| Auth | Manus OAuth | JWT propio ✅ |
| Emails | Brevo (tuyo) ✅ | Brevo (tuyo) ✅ |
| Automatizaciones | n8n Cloud (tuyo) ✅ | n8n Cloud (tuyo) ✅ |
| Pagos | Stripe (tuyo) ✅ | Stripe (tuyo) ✅ |
| Dominio | Namecheap/Cloudflare ✅ | Namecheap/Cloudflare ✅ |
