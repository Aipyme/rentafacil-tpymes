import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic } from "./static";
import { handleStripeWebhook } from "../stripeWebhook";
import { handlePresupuesto } from "../presupuesto";
import { handleGenerateXml, requireInternalKey } from "../generateXml";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Stripe webhook MUST be registered BEFORE express.json() for signature verification
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

  // SA diagnostic endpoint (temporary) — MUST be before body parsers
  app.get("/api/diag/sa", (_req, res) => {
    const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64;
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const d: Record<string, unknown> = {
      ts: new Date().toISOString(),
      GOOGLE_SHEETS_ID: process.env.GOOGLE_SHEETS_ID ? `${process.env.GOOGLE_SHEETS_ID.substring(0, 10)}...` : "NOT_SET",
      B64_present: !!b64, B64_length: b64?.length || 0,
      RAW_present: !!raw, RAW_length: raw?.length || 0,
    };
    if (b64) { try { const p = JSON.parse(Buffer.from(b64, "base64").toString("utf8")); d.b64_ok = true; d.email = p.client_email; } catch (e: any) { d.b64_err = e.message; } }
    if (raw) { try { JSON.parse(raw); d.raw_direct_ok = true; } catch { d.raw_direct_ok = false; } try { JSON.parse(raw.replace(/\\n/g, "\n")); d.raw_fixed_ok = true; } catch { d.raw_fixed_ok = false; } }
    return res.json(d);
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Presupuesto — público, llamado desde n8n y desde el simulador
  app.post("/api/presupuesto", handlePresupuesto);

  // Runtime router introspection - what does the running app actually have?
  // Using POST because Express 5 app.use("/{*path}") catches all GETs
  app.post("/api/diag/router-check", (_req, res) => {
    try {
      const procedures = Object.keys((appRouter as any)._def?.procedures || {});
      const simProcs = procedures.filter(p => p.startsWith("simulador."));
      return res.json({
        ts: new Date().toISOString(),
        totalProcedures: procedures.length,
        simuladorProcedures: simProcs,
        hasSheetDiag: simProcs.includes("simulador.sheetDiag"),
        hasGuardarSimulacion: simProcs.includes("simulador.guardarSimulacion"),
        buildMarker: "EFBEF3C-ROUTERCHECK",
      });
    } catch (e: any) {
      return res.json({ error: e.message });
    }
  });

  // Generate XML — solo uso interno (n8n, panel asesor)
  app.post("/api/generate-xml", requireInternalKey, handleGenerateXml);

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Direct diagnostic endpoint — bypasses tRPC entirely
  app.get("/api/diag/procedures", (_req, res) => {
    const procs = Object.keys((appRouter as any)._def?.procedures || {});
    const dbUrl = process.env.DATABASE_URL;
    res.json({
      total: procs.length,
      hasBorrador: procs.includes("borrador.generar"),
      hasNotificaciones: procs.includes("notificaciones.enviarBorradorListo"),
      hasTestNew: procs.includes("testNew.ping"),
      buildMarker: "DEPLOY-730dd26-DIAG",
      db: {
        hasUrl: !!dbUrl,
        urlPrefix: dbUrl ? dbUrl.substring(0, 30) + "..." : "NOT SET",
      },
      s3: {
        bucket: process.env.S3_BUCKET || "NOT SET",
        region: process.env.S3_REGION || "NOT SET",
        hasAccessKey: !!process.env.S3_ACCESS_KEY_ID,
      },
      stripe: {
        hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      },
      brevo: {
        hasApiKey: !!(process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY),
      },
      procedures: procs,
    });
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Log registered routes for debugging
  const routes: string[] = [];
  app._router?.stack?.forEach((m: any) => {
    if (m.route?.path) routes.push(`${Object.keys(m.route.methods).join(",").toUpperCase()} ${m.route.path}`);
  });
  console.log(`[STARTUP] Commit: 0fa6137-REAL | Routes: ${routes.join(" | ")}`);

  // Log SA status at startup
  const b64Check = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64;
  const rawCheck = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  console.log(`[STARTUP] SA_B64: ${b64Check ? `present (${b64Check.length} chars)` : "NOT SET"}`);
  console.log(`[STARTUP] SA_RAW: ${rawCheck ? `present (${rawCheck.length} chars)` : "NOT SET"}`);
  if (b64Check) {
    try { const p = JSON.parse(Buffer.from(b64Check, "base64").toString("utf8")); console.log(`[STARTUP] SA_B64 parsed OK: ${p.client_email}`); } 
    catch (e: any) { console.log(`[STARTUP] SA_B64 parse FAILED: ${e.message}`); }
  }
  if (rawCheck) {
    try { JSON.parse(rawCheck); console.log("[STARTUP] SA_RAW direct parse: OK"); } 
    catch { 
      try { JSON.parse(rawCheck.replace(/\\n/g, "\n")); console.log("[STARTUP] SA_RAW fixed newlines parse: OK"); }
      catch { console.log("[STARTUP] SA_RAW parse: FAILED (both direct and fixed)"); }
    }
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

// Global error handlers
process.on("unhandledRejection", (r) => console.error("[UNHANDLED_REJECTION]", r));
process.on("uncaughtException", (err) => { console.error("[UNCAUGHT_EXCEPTION]", err); process.exit(1); });

startServer().catch(console.error);
