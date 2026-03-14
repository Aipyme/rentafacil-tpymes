import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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
