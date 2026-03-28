import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
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

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Presupuesto — público, llamado desde n8n y desde el simulador
  app.post("/api/presupuesto", handlePresupuesto);

  // SA diagnostic endpoint (temporary)
  app.get("/api/diag/sa", (_req, res) => {
    const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64;
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const d: Record<string, unknown> = {
      GOOGLE_SHEETS_ID: process.env.GOOGLE_SHEETS_ID ? `${process.env.GOOGLE_SHEETS_ID.substring(0, 10)}...` : "NOT_SET",
      B64_present: !!b64, B64_length: b64?.length || 0,
      RAW_present: !!raw, RAW_length: raw?.length || 0,
    };
    if (b64) { try { const p = JSON.parse(Buffer.from(b64, "base64").toString("utf8")); d.b64_ok = true; d.email = p.client_email; } catch (e: any) { d.b64_err = e.message; } }
    if (raw) { try { JSON.parse(raw); d.raw_direct_ok = true; } catch { d.raw_direct_ok = false; } try { JSON.parse(raw.replace(/\\n/g, "\n")); d.raw_fixed_ok = true; } catch { d.raw_fixed_ok = false; } }
    res.json(d);
  });

  // Generate XML — solo uso interno (n8n, panel asesor)
  app.post("/api/generate-xml", requireInternalKey, handleGenerateXml);

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
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
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
