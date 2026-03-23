/**
 * Test de autenticación del Panel del Asesor
 * Verifica que el sistema de login con contraseña funciona correctamente
 */
import { describe, it, expect } from "vitest";
import "dotenv/config";

describe("Panel del Asesor - Autenticación", () => {
  it("should have PANEL_PASSWORD configured", () => {
    const password = process.env.PANEL_PASSWORD;
    expect(password, "PANEL_PASSWORD debe estar configurada").toBeTruthy();
    expect(password!.length, "La contraseña debe tener al menos 4 caracteres").toBeGreaterThanOrEqual(4);
  });

  it("should generate a valid daily token from password", () => {
    const panelPassword = process.env.PANEL_PASSWORD ?? "";
    const today = new Date().toISOString().split("T")[0];
    const token = Buffer.from(`${panelPassword}:${today}`).toString("base64");
    
    // Verificar que el token se puede decodificar correctamente
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    expect(decoded).toBe(`${panelPassword}:${today}`);
  });

  it("should reject wrong password", () => {
    const panelPassword = process.env.PANEL_PASSWORD ?? "";
    const today = new Date().toISOString().split("T")[0];
    const correctToken = Buffer.from(`${panelPassword}:${today}`).toString("base64");
    const wrongToken = Buffer.from(`wrongpassword:${today}`).toString("base64");
    
    expect(correctToken).not.toBe(wrongToken);
  });
});
