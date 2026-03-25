/**
 * Router: pagos
 * Gestiona la pasarela de pago Stripe para las declaraciones de renta.
 * Soporta Google Pay, Apple Pay y tarjeta.
 */

import { z } from "zod";
import Stripe from "stripe";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { declaraciones } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "../_core/env";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-02-25.clover",
});

export const pagosRouter = router({
  /**
   * Crear sesión de pago Stripe Checkout para un expediente
   */
  crearSesionCheckout: publicProcedure
    .input(z.object({
      expedienteId: z.string(),
      successUrl: z.string(),
      cancelUrl: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [expediente] = await db
        .select()
        .from(declaraciones)
        .where(eq(declaraciones.expedienteId, input.expedienteId));

      if (!expediente) {
        throw new Error("Expediente no encontrado");
      }

      const precioTotal = expediente.precioTotal || 3900; // 39€ por defecto
      const nombreCliente = (expediente.datosContribuyente as any)?.contribuyente?.nombre || "Cliente";
      const emailCliente = expediente.emailContacto || undefined;

      // Construir descripción de los suplementos
      const suplementos = (expediente.suplementos as any[]) || [];
      const descripcionItems = suplementos.length > 0
        ? suplementos.map((s: any) => s.descripcion).join(", ")
        : "Declaración de la Renta 2025";

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        payment_method_options: {
          card: {
            request_three_d_secure: "automatic",
          },
        },
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: "Declaración de la Renta 2025",
                description: descripcionItems,
                metadata: {
                  expedienteId: input.expedienteId,
                },
              },
              unit_amount: precioTotal,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        customer_email: emailCliente,
        client_reference_id: input.expedienteId,
        metadata: {
          expedienteId: input.expedienteId,
          customer_name: nombreCliente,
          customer_email: emailCliente || "",
        },
        success_url: `${input.successUrl}?expediente=${input.expedienteId}&paid=1`,
        cancel_url: `${input.cancelUrl}?expediente=${input.expedienteId}&cancelled=1`,
        allow_promotion_codes: true,
        locale: "es",
      });

      // Guardar el session ID en la BD
      await db
        .update(declaraciones)
        .set({
          estado: "pendiente_pago",
          stripeSessionId: session.id,
        })
        .where(eq(declaraciones.expedienteId, input.expedienteId));

      return {
        sessionId: session.id,
        checkoutUrl: session.url,
      };
    }),

  /**
   * Verificar estado del pago por expediente
   */
  verificarPago: publicProcedure
    .input(z.object({ expedienteId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { pagado: false, estado: "desconocido" };

      const [expediente] = await db
        .select()
        .from(declaraciones)
        .where(eq(declaraciones.expedienteId, input.expedienteId));

      if (!expediente) return { pagado: false, estado: "no_encontrado" };

      return {
        pagado: expediente.estado === "pagado" || expediente.estado === "en_proceso" || expediente.estado === "completado",
        estado: expediente.estado,
        expediente,
      };
    }),
});
