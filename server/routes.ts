import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Temporary diagnostic endpoint — verify SA parsing in production
  app.get("/api/diag/sa", async (_req, res) => {
    const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64;
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const sheetId = process.env.GOOGLE_SHEETS_ID;
    const d: Record<string, unknown> = {
      GOOGLE_SHEETS_ID: sheetId ? `${sheetId.substring(0, 10)}...` : "NOT_SET",
      B64_present: !!b64,
      B64_length: b64?.length || 0,
      RAW_present: !!raw,
      RAW_length: raw?.length || 0,
    };

    // Try B64
    if (b64) {
      try {
        const parsed = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
        d.b64_parse = "OK";
        d.b64_email = parsed.client_email;
      } catch (e: any) { d.b64_parse = `FAIL: ${e.message}`; }
    }
    // Try RAW direct
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        d.raw_direct = "OK";
        d.raw_email = parsed.client_email;
      } catch (e: any) { d.raw_direct = `FAIL: ${e.message}`; }
      // Try RAW with newline fix
      try {
        const parsed = JSON.parse(raw.replace(/\\n/g, "\n"));
        d.raw_fixed = "OK";
      } catch (e: any) { d.raw_fixed = `FAIL: ${e.message}`; }
    }
    res.json(d);
  });

  // Get all declarations
  app.get("/api/declarations", async (_req, res) => {
    const declarations = await storage.getDeclarations();
    res.json(declarations);
  });

  // Get dashboard stats
  app.get("/api/stats", async (_req, res) => {
    const stats = await storage.getStats();
    res.json(stats);
  });

  // Submit a new declaration
  app.post("/api/declarations", async (req, res) => {
    try {
      const data = req.body;
      // Determine tipo based on complexity
      const isComplex =
        data.numPagadores > 1 ||
        data.tieneInmueblesAlquilados ||
        data.tieneActividadEconomica;
      
      const declaration = await storage.createDeclaration({
        ...data,
        tipo: isComplex ? "compleja" : "simple",
        estado: "recibido",
        fecha: new Date().toISOString().split("T")[0],
      });
      res.json({ success: true, id: declaration.id });
    } catch (error) {
      console.error("Error creating declaration:", error);
      res.status(500).json({ success: false, error: "Error al crear la declaración" });
    }
  });

  return httpServer;
}
