/**
 * Stripe Webhook Handler
 * Procesa eventos de Stripe para confirmar pagos automáticamente.
 * IMPORTANTE: debe registrarse ANTES del middleware express.json()
 */

import { Request, Response } from "express";
import Stripe from "stripe";
import { getDb } from "./db";
import { declaraciones } from "../drizzle/schema";
import { eq } from "drizzle-orm";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null as any; // Stripe no configurado aún
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  let event: Stripe.Event;

  try {
    const stripeClient = getStripe();
    if (!stripeClient) {
      return res.status(503).json({ error: "Stripe no configurado" });
    }
    event = stripeClient.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Test events - return verification response
  if (event.id.startsWith("evt_test_")) {
    console.log("[Stripe Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  console.log(`[Stripe Webhook] Event: ${event.type} | ID: ${event.id}`);

  const db = await getDb();
  if (!db) {
    console.error("[Stripe Webhook] Database not available");
    return res.status(500).json({ error: "Database not available" });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const expedienteId = session.client_reference_id || session.metadata?.expedienteId;

        if (expedienteId && session.payment_status === "paid") {
          await db
            .update(declaraciones)
            .set({
              estado: "pagado",
              stripePaymentIntentId: session.payment_intent as string || null,
            })
            .where(eq(declaraciones.expedienteId, expedienteId));

          console.log(`[Stripe Webhook] Expediente ${expedienteId} marcado como PAGADO`);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const expedienteId = paymentIntent.metadata?.expedienteId;

        if (expedienteId) {
          await db
            .update(declaraciones)
            .set({
              estado: "pagado",
              stripePaymentIntentId: paymentIntent.id,
            })
            .where(eq(declaraciones.expedienteId, expedienteId));

          console.log(`[Stripe Webhook] PaymentIntent ${paymentIntent.id} para expediente ${expedienteId} COMPLETADO`);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`[Stripe Webhook] Pago fallido: ${paymentIntent.id}`);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Evento no manejado: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error("[Stripe Webhook] Error procesando evento:", err);
    res.status(500).json({ error: "Error processing webhook" });
  }
}
