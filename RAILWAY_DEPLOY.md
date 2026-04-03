# Despliegue en Railway — Renta Fácil TPymes

## Pasos para desplegar

### 1. Crear proyecto en Railway

1. Ve a [railway.app](https://railway.app) y crea un nuevo proyecto
2. Selecciona **"Deploy from GitHub repo"**
3. Conecta el repositorio `renta-facil-tpymes`

### 2. Añadir base de datos MySQL

1. En el proyecto de Railway, haz clic en **"+ New"**
2. Selecciona **"Database" → "MySQL"**
3. Railway generará automáticamente la variable `DATABASE_URL`

### 3. Configurar variables de entorno

En Railway → Settings → Variables, añade estas variables:

```
# Seguridad
JWT_SECRET=<clave aleatoria larga, mínimo 32 caracteres>
PANEL_PASSWORD=<contraseña del panel asesor>

# Google Sheets (lectura de casos)
GOOGLE_SHEETS_API_KEY=<tu API key de Google>
GOOGLE_SHEETS_ID=<ID del Google Sheet>

# Google Service Account (escritura en Sheets + Calendar)
GOOGLE_SERVICE_ACCOUNT_JSON=<JSON completo en una sola línea>
GOOGLE_CALENDAR_ID=<ID del calendario>
CALENDAR_ADVISOR_EMAIL=<email del asesor>

# n8n Webhooks
VITE_WEBHOOK_N8N=https://autogr.app.n8n.cloud/webhook/renta-intake
N8N_UPDATE_WEBHOOK_URL=https://autogr.app.n8n.cloud/webhook/renta-update
N8N_DERIVACION_CREATE_URL=https://autogr.app.n8n.cloud/webhook/derivacion-create
N8N_DERIVACION_CONFIRM_URL=https://autogr.app.n8n.cloud/webhook/derivacion-confirm
N8N_PAGO_CONFIRMADO_WEBHOOK=https://autogr.app.n8n.cloud/webhook/pago-confirmado

# Email (Brevo)
BREVO_API_KEY=<tu API key de Brevo>
EMAIL_FROM=noreply@rentafacil.es
EMAIL_FROM_NAME=Renta Fácil TPymes

# Stripe
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# URL base (para links en emails)
APP_BASE_URL=https://rentatpymes.aicheckpyme.co

# Entorno
NODE_ENV=production
```

### 4. Dominio personalizado

1. En Railway → Settings → Networking → **"+ Custom Domain"**
2. Añade `rentatpymes.aicheckpyme.co`
3. Configura el CNAME en tu DNS apuntando al dominio de Railway

### 5. Migraciones de base de datos

Después del primer despliegue, ejecuta desde Railway → Shell:
```bash
pnpm db:push
```

### 6. Webhook de Stripe

En el dashboard de Stripe → Developers → Webhooks:
- Endpoint URL: `https://rentatpymes.aicheckpyme.co/api/stripe/webhook`
- Eventos: `checkout.session.completed`, `payment_intent.succeeded`

---

## Comandos de build

El `railway.toml` ya está configurado:
- **Build**: `pnpm install --frozen-lockfile && pnpm build`
- **Start**: `pnpm start`
- **Health check**: `GET /api/health`

## Notas importantes

- El proyecto NO usa autenticación OAuth de Manus. El panel asesor usa contraseña propia (`PANEL_PASSWORD`).
- La base de datos MySQL de Railway se conecta automáticamente via `DATABASE_URL`.
- El frontend se sirve como archivos estáticos desde el mismo servidor Express.
