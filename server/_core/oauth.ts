/**
 * OAuth routes — Manus OAuth eliminado.
 * El panel asesor usa autenticación propia con PANEL_PASSWORD.
 * Esta función solo registra el health check de Railway.
 */
import type { Express, Request, Response } from "express";

export function registerOAuthRoutes(app: Express) {
  // Health check para Railway
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Ruta legacy de OAuth — devuelve 404 limpio si alguien la llama
  app.get("/api/oauth/callback", (_req: Request, res: Response) => {
    res.status(404).json({ error: "OAuth not configured" });
  });
}
