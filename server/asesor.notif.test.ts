/**
 * Test: ASESOR_NOTIF_EMAIL configurado correctamente
 */
import { describe, it, expect } from "vitest";

describe("ASESOR_NOTIF_EMAIL", () => {
  it("debe estar configurado como variable de entorno", () => {
    // La variable debe existir y tener formato de email válido
    const email = process.env.ASESOR_NOTIF_EMAIL ?? process.env.CALENDAR_ADVISOR_EMAIL ?? "";
    expect(email).toBeTruthy();
    expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });
});
