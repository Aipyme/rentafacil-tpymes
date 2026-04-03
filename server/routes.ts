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

  // Diagnostic: test email sending
  app.get("/api/diag/email", async (req, res) => {
    const apiKey = process.env.BREVO_API_KEY;
    const fromEmail = process.env.EMAIL_FROM;
    const fromName = process.env.EMAIL_FROM_NAME;
    const testTo = (req.query.to as string) || "eliaicheckpyme@gmail.com";

    const d: Record<string, unknown> = {
      BREVO_API_KEY_present: !!apiKey,
      BREVO_API_KEY_length: apiKey?.length || 0,
      EMAIL_FROM: fromEmail || "NOT_SET",
      EMAIL_FROM_NAME: fromName || "NOT_SET",
      test_to: testTo,
    };

    if (!apiKey) {
      d.result = "SKIP — BREVO_API_KEY not configured";
      return res.json(d);
    }

    try {
      const payload = {
        sender: { name: fromName || "Renta Fácil TPymes", email: fromEmail || "noreply@rentafacil.es" },
        to: [{ email: testTo }],
        subject: "[DIAG] Test email Renta Fácil TPymes",
        htmlContent: `<p>Email de prueba enviado desde el servidor de diagnóstico. Timestamp: ${new Date().toISOString()}</p>`,
      };
      const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": apiKey },
        body: JSON.stringify(payload),
      });
      const body = await resp.text();
      d.brevo_status = resp.status;
      d.brevo_response = body.substring(0, 300);
      d.result = resp.ok ? "OK" : `FAIL ${resp.status}`;
    } catch (e: any) {
      d.result = `ERROR: ${e.message}`;
    }
    return res.json(d);
  });

  // Diagnostic: test Google Sheet write
  app.get("/api/diag/sheet", async (_req, res) => {
    const sheetId = process.env.GOOGLE_SHEETS_ID;
    const d: Record<string, unknown> = {
      GOOGLE_SHEETS_ID: sheetId ? `${sheetId.substring(0, 15)}...` : "NOT_SET",
      GOOGLE_SHEETS_API_KEY: process.env.GOOGLE_SHEETS_API_KEY ? "SET" : "NOT_SET",
    };
    try {
      const { upsertDeclaracionSheet } = await import("./lib/googleSheets");
      const testRow = {
        expediente_id: `DIAG-${Date.now()}`,
        nombre: "Test Diagnóstico",
        email: "test@diag.com",
        telefono: "600000000",
        comunidad: "Madrid",
        situacion: "asalariado",
        precio_eur: "29.90",
        precio_centimos: "2990",
        precio_base_eur: "29.90",
        suplementos: "[]",
        payment_status: "diag_test",
        resultado_euros: "0",
        resultado_estimado: "0",
        tipo_resultado: "A devolver",
        resultado_borrador: "0",
        ahorro_vs_borrador: "0",
        base_imponible: "0",
        cuota_integra: "0",
        cuota_liquida: "0",
        total_deducciones: "0",
        casilla_001: "0",
        casilla_011: "0",
        casilla_545: "0",
        casilla_620: "0",
        casilla_621: "0",
        casilla_670: "0",
        observaciones: "diag test",
      };
      const result = await upsertDeclaracionSheet(testRow, "casos_master_v2");
      d.result = "OK";
      d.action = result.action;
    } catch (e: any) {
      d.result = `FAIL: ${e.message}`;
    }
    return res.json(d);
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
