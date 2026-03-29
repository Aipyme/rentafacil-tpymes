import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { casosRouter } from "./routers/casos";
import { documentosRouter } from "./routers/documentos";
import { firmasRouter } from "./routers/firmas";
import { simuladorRouter } from "./routers/simulador";
console.log("[ROUTERS] simuladorRouter loaded, keys:", Object.keys(simuladorRouter._def.procedures || {}).join(", "));
import { pagosRouter } from "./routers/pagos";
import { asesorRouter } from "./routers/asesor";
import { notificacionesRouter } from "./routers/notificaciones";
import { borradorRouter } from "./routers/borrador";
import { xmlRouter } from "./routers/xml";
import { ENV } from "./_core/env";

console.log("[ROUTERS] ALL imports OK. borrador keys:", Object.keys(borradorRouter._def.procedures || {}).join(", "));
console.log("[ROUTERS] notificaciones keys:", Object.keys(notificacionesRouter._def.procedures || {}).join(", "));

export const appRouter = router({
    // Debug: log ALL registered router keys
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Panel del Asesor - casos del Google Sheet
  casos: casosRouter,

  // Gestión de documentos subidos por asesores y clientes
  documentos: documentosRouter,

  // Firmas digitales del cliente
  firmas: firmasRouter,

  // Simulador de renta automatizado
  simulador: simuladorRouter,

  // Pasarela de pago Stripe
  pagos: pagosRouter,

  // Derivación de casos complejos al asesor
  asesor: asesorRouter,

  // Notificaciones por email al cliente (borrador listo, docs recibidos, presentada)
  notificaciones: notificacionesRouter,

  // Borradores: generar PDF+XML, descargar, marcar presentado
  borrador: borradorRouter,

  // Generación de XML Modelo 100 para expedientes
  xml: xmlRouter,

  // Test: inline procedure to check if new procedures work
  testNew: router({
    ping: publicProcedure.query(() => ({ pong: true, ts: Date.now() })),
  }),

  // Autenticación básica del Panel del Asesor
  panel: router({
    /**
     * Verificar contraseña del panel
     * Devuelve un token simple almacenado en sessionStorage del cliente
     */
    login: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(({ input }) => {
        const panelPassword = ENV.panelPassword;
        if (!panelPassword) {
          // Si no hay contraseña configurada, acceso libre (modo desarrollo)
          return { success: true, token: "dev-mode" };
        }
        if (input.password !== panelPassword) {
          return { success: false, token: null };
        }
        // Token simple: hash del password + timestamp del día (expira cada 24h)
        const today = new Date().toISOString().split("T")[0];
        const token = Buffer.from(`${panelPassword}:${today}`).toString("base64");
        return { success: true, token };
      }),

    /**
     * Verificar si un token de panel es válido
     */
    verify: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(({ input }) => {
        const panelPassword = ENV.panelPassword;
        if (!panelPassword) return { valid: true };
        const today = new Date().toISOString().split("T")[0];
        const expected = Buffer.from(`${panelPassword}:${today}`).toString("base64");
        return { valid: input.token === expected };
      }),
  }),
});

export type AppRouter = typeof appRouter;

// Debug: log all registered tRPC procedures
console.log("[ROUTERS] appRouter procedures:", Object.keys((appRouter as any)._def?.procedures || {}).join(", "));
