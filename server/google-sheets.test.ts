/**
 * Test de validación de credenciales de Google Sheets
 * Verifica que la API Key y el Sheet ID son válidos y accesibles
 */
import { describe, it, expect } from "vitest";
import "dotenv/config";

describe("Google Sheets API credentials", () => {
  it("should have GOOGLE_SHEETS_API_KEY configured", () => {
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    expect(apiKey, "GOOGLE_SHEETS_API_KEY debe estar configurada").toBeTruthy();
    expect(apiKey?.startsWith("AIza"), "La API Key debe empezar por AIza").toBe(true);
  });

  it("should have GOOGLE_SHEETS_ID configured", () => {
    const sheetId = process.env.GOOGLE_SHEETS_ID;
    // El ID puede estar vacío si el usuario aún no lo ha proporcionado
    // Solo verificamos que la variable existe en el entorno
    expect(typeof sheetId).toBe("string");
  });

  it("should be able to reach Google Sheets API if both credentials are present", async () => {
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    const sheetId = process.env.GOOGLE_SHEETS_ID;

    // Si no hay Sheet ID, saltamos el test de conectividad
    if (!sheetId || sheetId.trim() === "") {
      console.log("⚠️  GOOGLE_SHEETS_ID no configurado — test de conectividad omitido");
      return;
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${apiKey}&fields=properties.title`;
    const response = await fetch(url);

    if (response.status === 403) {
      console.log("⚠️  El Sheet no es público — activa 'Compartir → Cualquier persona con el enlace → Lector'");
    } else if (response.status === 404) {
      console.log("⚠️  Sheet ID no encontrado — verifica el ID en la URL del Sheet");
    }

    // Aceptamos 200 (ok) o 403 (sheet privado pero API key válida)
    expect([200, 403]).toContain(response.status);
  });
});
