/**
 * Handler: POST /api/stripe/webhook
 * Versión mejorada del stripeWebhook.ts existente.
 *
 * MEJORAS respecto al handler actual (server/stripeWebhook.ts):
 *  1. Guardia explícita si STRIPE_WEBHOOK_SECRET está vacío → 503.
 *  2. Guardia explícita si stripe-signature header está ausente → 400.
 *  3. Notificación a n8n WF08 (pago_confirmado) con payload enriquecido.
 *  4. Log estructurado con event.id, type y expediente_id.
 *  5. Idempotencia: no actualiza si el estado ya es "pagado".
 *
 * INTEGRACIÓN:
 *  Este archivo reemplaza server/stripeWebhook.ts.
 *  El registro en _core/index.ts ya es correcto:
 *    app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);
 *
 * VARIABLES DE ENTORNO REQUERIDAS:
 *  STRIPE_SECRET_KEY          — clave secreta Stripe
 *  STRIPE_WEBHOOK_SECRET      — secreto del endpoint webhook en Stripe Dashboard
 *  N8N_PAGO_CONFIRMADO_WEBHOOK — URL del webhook n8n WF08
 *  INTERNAL_WORKFLOW_KEY      — secreto compartido entre backend y n8n
 */

import { Request, Response } from "express";
import Stripe from "stripe";
import { getDb } from "./db";
import { declaraciones } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// ============================================================
// HELPERS
// ============================================================

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

async function notifyN8n(payload: Record<string, unknown>): Promise<void> {
  const webhookUrl = process.env.N8N_PAGO_CONFIRMADO_WEBHOOK;
  const internalKey = process.env.INTERNAL_WORKFLOW_KEY;

  if (!webhookUrl) {
    console.warn("[Stripe Webhook] N8N_PAGO_CONFIRMADO_WEBHOOK no configurado — omitiendo notificación");
    return;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(internalKey ? { "x-internal-key": internalKey } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000), // 10s timeout
    });

    if (!res.ok) {
      console.error(`[Stripe Webhook] Error notificando a n8n: HTTP ${res.status}`);
    } else {
      console.log(`[Stripe Webhook] n8n notificado correctamente para expediente ${payload.expediente_id}`);
    }
  } catch (err: any) {
    // No lanzar — la notificación a n8n es best-effort, no debe bloquear la respuesta a Stripe
    console.error("[Stripe Webhook] Error en notificación a n8n:", err.message);
  }
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================

export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  // 1. Verificar que el secret está configurado
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  if (!webhookSecret) {
    console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET no configurado — rechazando petición");
    res.status(503).json({ error: "Webhook not configured" });
    return;
  }

  // 2. Verificar que el header de firma está presente
  const sig = req.headers["stripe-signature"] as string | undefined;
  if (!sig) {
    console.error("[Stripe Webhook] stripe-signature header ausente");
    res.status(400).json({ error: "Missing stripe-signature header" });
    return;
  }

  // 3. Verificar que Stripe está configurado
  const stripeClient = getStripe();
  if (!stripeClient) {
    console.error("[Stripe Webhook] STRIPE_SECRET_KEY no configurado");
    res.status(503).json({ error: "Stripe not configured" });
    return;
  }

  // 4. Verificar firma del evento
  let event: Stripe.Event;
  try {
    event = stripeClient.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    res.status(400).json({ error: `Webhook Error: ${err.message}` });
    return;
  }

  // 5. Detectar test events (Stripe CLI o Dashboard test)
  if (event.id.startsWith("evt_test_")) {
    console.log("[Stripe Webhook] Test event detected, returning verification response");
    res.json({ verified: true });
    return;
  }

  console.log(`[Stripe Webhook] Event: ${event.type} | ID: ${event.id}`);

  // 6. Obtener BD
  const db = await getDb();
  if (!db) {
    console.error("[Stripe Webhook] Database not available");
    res.status(500).json({ error: "Database not available" });
    return;
  }

  try {
    switch (event.type) {
      // -------------------------------------------------------
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const expedienteId =
          session.client_reference_id || session.metadata?.expedienteId;
        const emailCliente =
          session.customer_details?.email || session.metadata?.email_cliente || "";
        const nombreCliente = session.metadata?.nombre_cliente || "";

        if (!expedienteId) {
          console.warn("[Stripe Webhook] checkout.session.completed sin expedienteId — ignorando");
          break;
        }

        if (session.payment_status !== "paid") {
          console.log(`[Stripe Webhook] Session ${session.id} no está pagada (${session.payment_status}) — ignorando`);
          break;
        }

        // Idempotencia fuerte: verificar por stripeEventId (evita duplicados aunque Stripe reintente)
        const [yaProcessado] = await db
          .select({ id: declaraciones.id })
          .from(declaraciones)
          .where(eq(declaraciones.stripeEventId, event.id));
        if (yaProcessado) {
          console.log(`[Stripe Webhook] Evento ${event.id} ya procesado — idempotencia OK`);
          break;
        }

        // Verificar estado actual del expediente
        const [expediente] = await db
          .select({ estado: declaraciones.estado })
          .from(declaraciones)
          .where(eq(declaraciones.expedienteId, expedienteId));

        if (expediente?.estado === "pagado") {
          console.log(`[Stripe Webhook] Expediente ${expedienteId} ya estaba en estado PAGADO — idempotencia OK`);
          break;
        }

        const isTestEvent = !event.livemode;
        // Actualizar estado en BD con audit trail completo
        await db
          .update(declaraciones)
          .set({
            estado: "pagado",
            subestado: "pendiente_documentacion",
            stripePaymentIntentId: (session.payment_intent as string) || null,
            stripeEventId: event.id,
            paymentConfirmedAt: new Date(),
            environment: isTestEvent ? "test" : "prod",
            estadoUpdatedAt: new Date(),
            estadoUpdatedBy: "stripe_webhook",
          })
          .where(eq(declaraciones.expedienteId, expedienteId));

        console.log(`[Stripe Webhook] Expediente ${expedienteId} marcado como PAGADO`);

        // Notificar a n8n WF08
        await notifyN8n({
          expediente_id: expedienteId,
          payment_intent_id: session.payment_intent as string || "",
          amount_total: (session.amount_total || 0) / 100,
          currency: session.currency,
          email_cliente: emailCliente,
          nombre_cliente: nombreCliente,
          paid_at: new Date().toISOString(),
          event_type: "checkout.session.completed",
          stripe_event_id: event.id,
        });

        break;
      }

      // -------------------------------------------------------
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const expedienteId = pi.metadata?.expedienteId || pi.metadata?.expediente_id;
        const emailCliente = pi.metadata?.email_cliente || pi.metadata?.customer_email || "";
        const nombreCliente = pi.metadata?.nombre_cliente || pi.metadata?.customer_name || "";

        if (!expedienteId) {
          console.warn("[Stripe Webhook] payment_intent.succeeded sin expedienteId — ignorando");
          break;
        }

        // Idempotencia
        const [expediente] = await db
          .select({ estado: declaraciones.estado })
          .from(declaraciones)
          .where(eq(declaraciones.expedienteId, expedienteId));

        if (expediente?.estado === "pagado") {
          console.log(`[Stripe Webhook] Expediente ${expedienteId} ya estaba PAGADO — idempotencia OK`);
          break;
        }

        await db
          .update(declaraciones)
          .set({
            estado: "pagado",
            stripePaymentIntentId: pi.id,
          })
          .where(eq(declaraciones.expedienteId, expedienteId));

        console.log(`[Stripe Webhook] PaymentIntent ${pi.id} para expediente ${expedienteId} COMPLETADO`);

        await notifyN8n({
          expediente_id: expedienteId,
          payment_intent_id: pi.id,
          amount_total: (pi.amount_received || pi.amount || 0) / 100,
          currency: pi.currency,
          email_cliente: emailCliente,
          nombre_cliente: nombreCliente,
          paid_at: new Date().toISOString(),
          event_type: "payment_intent.succeeded",
          stripe_event_id: event.id,
        });

        break;
      }

      // -------------------------------------------------------
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const expedienteId = pi.metadata?.expedienteId || pi.metadata?.expediente_id;
        console.log(`[Stripe Webhook] Pago fallido: ${pi.id} | Expediente: ${expedienteId || "desconocido"}`);
        break;
      }

      // -------------------------------------------------------
      default:
        console.log(`[Stripe Webhook] Evento no manejado: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error("[Stripe Webhook] Error procesando evento:", err);
    res.status(500).json({ error: "Error processing webhook" });
  }
}
