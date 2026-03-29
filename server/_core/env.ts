export const ENV = {
  // Seguridad JWT — firma de sesiones propias
  cookieSecret: process.env.JWT_SECRET ?? "",
  // Base de datos MySQL (Railway MySQL Plugin)
  databaseUrl: process.env.DATABASE_URL ?? "",
  // Modo de ejecución
  isProduction: process.env.NODE_ENV === "production",
  // n8n webhook URL para intake de casos desde Google Sheets
  n8nWebhookUrl: process.env.VITE_WEBHOOK_N8N ?? "",
  // n8n webhook URL para actualización de campos de gestión (WF02)
  n8nUpdateWebhookUrl: process.env.N8N_UPDATE_WEBHOOK_URL ?? "https://autogr.app.n8n.cloud/webhook/renta-update",
  // n8n webhook URL para crear derivación a asesor (WF09 — derivacion-create)
  n8nDerivacionCreateUrl: process.env.N8N_DERIVACION_CREATE_URL ?? "https://autogr.app.n8n.cloud/webhook/derivacion-create",
  // n8n webhook URL para confirmar derivación (WF10 — derivacion-confirm)
  n8nDerivacionConfirmUrl: process.env.N8N_DERIVACION_CONFIRM_URL ?? "https://autogr.app.n8n.cloud/webhook/derivacion-confirm",
  // Google Sheets API (opcional, acceso directo)
  googleSheetsApiKey: process.env.GOOGLE_SHEETS_API_KEY ?? "",
  googleSheetsId: process.env.GOOGLE_SHEETS_ID ?? "",
  // Panel del Asesor — contraseña de acceso
  panelPassword: process.env.PANEL_PASSWORD ?? "",
  // Email transaccional (Brevo API REST)
  brevoApiKey: process.env.BREVO_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "noreply@rentafacil.es",
  emailFromName: process.env.EMAIL_FROM_NAME ?? "Renta Fácil TPymes",
  // URL base de la app (para links en emails)
  appBaseUrl: process.env.APP_BASE_URL ?? "https://rentatpymes.aicheckpyme.co",
  // Google Service Account (Sheets + Calendar escritura directa)
  googleServiceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? "",
  // Google Calendar
  googleCalendarId: process.env.GOOGLE_CALENDAR_ID ?? "",
  calendarAdvisorEmail: process.env.CALENDAR_ADVISOR_EMAIL ?? "",
  calendarDaysAhead: parseInt(process.env.CALENDAR_DAYS_AHEAD || "2", 10),
  calendarDefaultHour: process.env.CALENDAR_DEFAULT_HOUR ?? "10:00",
  calendarEventDurationMin: parseInt(process.env.CALENDAR_EVENT_DURATION_MIN || "30", 10),
};
