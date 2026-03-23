export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // n8n webhook URL for reading cases from Google Sheets
  n8nWebhookUrl: process.env.VITE_WEBHOOK_N8N ?? "",
  // Google Sheets API key for direct access (optional)
  googleSheetsApiKey: process.env.GOOGLE_SHEETS_API_KEY ?? "",
  googleSheetsId: process.env.GOOGLE_SHEETS_ID ?? "",
  // Panel del Asesor password protection
  panelPassword: process.env.PANEL_PASSWORD ?? "",
};
