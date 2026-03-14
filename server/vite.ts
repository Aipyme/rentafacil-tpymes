import type { Express } from "express";
import { createServer as createViteServer, createLogger, loadConfigFromFile, mergeConfig } from "vite";
import { fileURLToPath } from "url";
import path from "path";

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
  const projectRoot = path.resolve(fileURLToPath(import.meta.url), "../..");
  const configFile = path.resolve(projectRoot, "vite.config.ts");

  const loadedConfig = await loadConfigFromFile(
    { command: "serve", mode: "development" },
    configFile
  );

  const baseConfig = loadedConfig?.config || {};

  // Override server.allowedHosts to allow all hosts (needed for proxy access)
  if (baseConfig.server) {
    baseConfig.server.allowedHosts = true as any;
  }

  const vite = await createViteServer(
    mergeConfig(baseConfig, {
      server: {
        middlewareMode: true,
        allowedHosts: true as any,
        hmr: { server },
      },
      appType: "spa",
    })
  );

  app.use(vite.middlewares);
  return vite;
}
