import type { ViteDevServer } from "vite";
import type { Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: any) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
    root: path.resolve(fileURLToPath(import.meta.url), "../../client"),
  });
  app.use(vite.middlewares);
  return vite;
}
