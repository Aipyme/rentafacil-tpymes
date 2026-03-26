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
  // Google Sheets API (opcional, acceso directo)
  googleSheetsApiKey: process.env.GOOGLE_SHEETS_API_KEY ?? "",
  googleSheetsId: process.env.GOOGLE_SHEETS_ID ?? "",
  // Panel del Asesor — contraseña de acceso
  panelPassword: process.env.PANEL_PASSWORD ?? "",
};
