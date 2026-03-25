import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { casosRouter } from "./routers/casos";
import { documentosRouter } from "./routers/documentos";
import { firmasRouter } from "./routers/firmas";
import { simuladorRouter } from "./routers/simulador";
import { pagosRouter } from "./routers/pagos";
import { asesorRouter } from "./routers/asesor";
import { ENV } from "./_core/env";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
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
