/**
 * Handler: POST /api/stripe/webhook
 *
 * FLUJO COMPLETO tras checkout.session.completed:
 *  1. Verificar firma Stripe
 *  2. Idempotencia fuerte por stripeEventId en BD
 *  3. Actualizar estado en BD (pagado + audit trail)
 *  4. Google Sheets upsert directo (si hay Service Account)
 *     → si no hay SA, delegar a n8n WF08 como fallback
 *  5. Google Calendar: crear evento de revisión (WF09/WF10)
 *  6. Email de confirmación al cliente (Brevo)
 *
 * VARIABLES DE ENTORNO:
 *  STRIPE_SECRET_KEY              — clave secreta Stripe
 *  STRIPE_WEBHOOK_SECRET          — secreto del endpoint webhook en Stripe Dashboard
 *  N8N_PAGO_CONFIRMADO_WEBHOOK    — URL del webhook n8n WF08 (fallback si no hay SA)
 *  INTERNAL_WORKFLOW_KEY          — secreto compartido entre backend y n8n
 *  GOOGLE_SERVICE_ACCOUNT_JSON    — JSON de la service account (Sheets + Calendar)
 *  GOOGLE_SHEETS_ID               — ID del spreadsheet
 *  GOOGLE_CALENDAR_ID             — ID del calendario de citas
 *  CALENDAR_ADVISOR_EMAIL         — Email del asesor para añadir como attendee
 *  CALENDAR_DAYS_AHEAD            — Días hábiles adelante para la cita (default: 2)
 *  CALENDAR_DEFAULT_HOUR          — Hora de inicio de la cita (default: "10:00")
 *  CALENDAR_EVENT_DURATION_MIN    — Duración en minutos (default: 30)
 */

import { Request, Response } from "express";
import Stripe from "stripe";
import { getDb } from "./db";
import { declaraciones } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { buildSheetRowPayload, upsertDeclaracionSheet } from "./lib/googleSheets";
import { crearEventoCalendar } from "./lib/googleCalendar";
import { sendEmail, buildEmailConfirmacionPago } from "./lib/email";

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
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.error(`[Stripe Webhook] Error notificando a n8n: HTTP ${res.status}`);
    } else {
      console.log(`[Stripe Webhook] n8n notificado correctamente para expediente ${payload.expediente_id}`);
    }
  } catch (err: any) {
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

        // ── Idempotencia fuerte: verificar por stripeEventId en BD ──
        const [yaProcessado] = await db
          .select({ id: declaraciones.id })
          .from(declaraciones)
          .where(eq(declaraciones.stripeEventId, event.id));
        if (yaProcessado) {
          console.log(`[Stripe Webhook] Evento ${event.id} ya procesado — idempotencia OK`);
          break;
        }

        // ── Verificar estado actual del expediente ──
        const [expediente] = await db
          .select({
            id: declaraciones.id,
            estado: declaraciones.estado,
            stripeEventId: declaraciones.stripeEventId,
          })
          .from(declaraciones)
          .where(eq(declaraciones.expedienteId, expedienteId));

        if (expediente?.estado === "pagado" && expediente?.stripeEventId) {
          console.log(`[Stripe Webhook] Expediente ${expedienteId} ya estaba PAGADO — idempotencia OK`);
          break;
        }

        const isTestEvent = !event.livemode;
        const paymentIntentId = (session.payment_intent as string) || "";
        const paidAt = new Date().toISOString();

        // ── Si ya pagado sin audit trail, completarlo ──
        if (expediente?.estado === "pagado" && !expediente?.stripeEventId) {
          await db
            .update(declaraciones)
            .set({
              stripePaymentIntentId: paymentIntentId || null,
              stripeEventId: event.id,
              paymentConfirmedAt: new Date(),
              environment: isTestEvent ? "test" : "prod",
              estadoUpdatedAt: new Date(),
              estadoUpdatedBy: "stripe_webhook",
            })
            .where(eq(declaraciones.expedienteId, expedienteId));
          console.log(`[Stripe Webhook] Audit trail completado para ${expedienteId}`);
          break;
        }

        // ── Actualizar estado en BD ──
        await db
          .update(declaraciones)
          .set({
            estado: "pagado",
            subestado: "pendiente_documentacion",
            stripePaymentIntentId: paymentIntentId || null,
            stripeEventId: event.id,
            paymentConfirmedAt: new Date(),
            environment: isTestEvent ? "test" : "prod",
            estadoUpdatedAt: new Date(),
            estadoUpdatedBy: "stripe_webhook",
          })
          .where(eq(declaraciones.expedienteId, expedienteId));

        console.log(`[Stripe Webhook] Expediente ${expedienteId} marcado como PAGADO`);

        // ── Leer datos del expediente para enriquecer payloads ──
        const [expData] = await db
          .select({
            datosContribuyente: declaraciones.datosContribuyente,
            resultadoCalculo: declaraciones.resultadoCalculo,
            precioTotal: declaraciones.precioTotal,
          })
          .from(declaraciones)
          .where(eq(declaraciones.expedienteId, expedienteId));

        const datosContrib = (expData?.datosContribuyente as Record<string, unknown>) || {};
        const resultadoCalc = (expData?.resultadoCalculo as Record<string, unknown>) || {};
        const comunidad = (datosContrib.comunidadAutonoma as string) || (datosContrib.comunidad as string) || "";
        const situacion = (datosContrib.situacionLaboral as string) || (datosContrib.situacion as string) || "";
        const planCode = (resultadoCalc.plan_code as string) || (resultadoCalc.planCode as string) || "BASICO";
        const precioFromDb = expData?.precioTotal || 0;
        // precioTotal en BD está en céntimos (2900 = 29€). Stripe amount_total también en céntimos.
        const precioFinal = precioFromDb > 100 ? precioFromDb / 100 : precioFromDb; // → EUR
        const amountEur = (session.amount_total || 0) / 100;
        const baseUrl = process.env.APP_BASE_URL || "https://rentatpymes.aicheckpyme.co";
        const urlSeguimiento = `${baseUrl}/mi-renta/${expedienteId}`;

        // ── Construir payload completo para Sheet / n8n ──
        const sheetPayload = buildSheetRowPayload({
          expedienteId,
          emailCliente,
          nombreCliente,
          amountTotal: amountEur,
          currency: session.currency || "eur",
          paidAt,
          stripeEventId: event.id,
          stripePaymentIntentId: paymentIntentId,
          datosContribuyente: datosContrib,
          resultadoCalculo: resultadoCalc,
          precioTotal: expData?.precioTotal || 0,
        });

        // ── PASO A: Google Sheets upsert directo (con idempotencia) ──
        // Si hay Service Account configurada, escribe directamente en el Sheet.
        // Si no, delega a n8n WF08 como fallback.
        const sheetResult = await upsertDeclaracionSheet(sheetPayload, "Declaraciones");
        console.log(`[Stripe Webhook] Sheet result: ${sheetResult.action} para ${expedienteId}`);

        if (sheetResult.action === "delegated_to_n8n") {
          // Fallback: notificar a n8n WF08 para que gestione el Sheet
          await notifyN8n({
            ...sheetPayload,
            event_type: "checkout.session.completed",
          });
        } else if (sheetResult.action === "error") {
          // Error en escritura directa → intentar n8n como fallback
          console.warn(`[Stripe Webhook] Error en Sheet directo (${sheetResult.error}) — intentando n8n como fallback`);
          await notifyN8n({
            ...sheetPayload,
            event_type: "checkout.session.completed",
          });
        }
        // Si action = "skipped_idempotent" | "updated" | "appended" → OK, no notificar n8n

        // ── PASO A2: Actualizar casos_master_v2 con datos de pago ──
        try {
          const casosMasterPayload: Record<string, unknown> = {
            expediente_id: expedienteId,
            estado: "pagado",
            subestado: "pendiente_documentacion",
            payment_status: "paid",
            payment_confirmed_at: paidAt,
            updated_at: new Date().toISOString(),
          };
          await upsertDeclaracionSheet(casosMasterPayload, "casos_master_v2");
          console.log(`[Stripe Webhook] casos_master_v2 actualizado para ${expedienteId}`);
        } catch (cmErr: any) {
          console.warn(`[Stripe Webhook] Error actualizando casos_master_v2: ${cmErr.message}`);
        }

        // ── PASO B: Google Calendar — crear evento de revisión (WF09/WF10) ──
        // Best-effort: no bloquea si falla
        const calendarResult = await crearEventoCalendar({
          expedienteId,
          nombreCliente,
          emailCliente,
          planCode,
          comunidad,
          importe: precioFinal,
          paidAt,
          urlSeguimiento,
        });

        if (calendarResult.success && calendarResult.eventId) {
          console.log(`[Stripe Webhook] Evento Calendar creado: ${calendarResult.eventId} | ${calendarResult.scheduledAt}`);
          // Guardar calendarEventId en BD (best-effort, no bloquea)
          try {
            await db
              .update(declaraciones)
              .set({ subestado: "cita_propuesta" })
              .where(eq(declaraciones.expedienteId, expedienteId));
          } catch {
            // No crítico
          }

          // Actualizar fila en Sheet "Declaraciones" con datos del Calendar
          try {
            const calendarSheetUpdate: Record<string, unknown> = {
              expediente_id: expedienteId,
              calendar_event_id: calendarResult.eventId,
              calendar_start: calendarResult.scheduledAt || "",
              calendar_end: "", // se podría calcular pero no es crítico
              asesor_email: process.env.CALENDAR_ADVISOR_EMAIL || "",
              updated_at: new Date().toISOString(),
            };
            await upsertDeclaracionSheet(calendarSheetUpdate, "Declaraciones");
            console.log(`[Stripe Webhook] Sheet actualizado con calendar_event_id para ${expedienteId}`);
          } catch (calSheetErr: any) {
            console.warn(`[Stripe Webhook] Error actualizando Sheet con Calendar: ${calSheetErr.message}`);
          }
        } else if (calendarResult.error !== "not_configured") {
          console.warn(`[Stripe Webhook] Calendar no creado: ${calendarResult.error}`);
        }

        // ── PASO C: Email de confirmación al cliente (Brevo) ──
        if (emailCliente) {
          const fechaPago = new Date().toLocaleDateString("es-ES", {
            day: "2-digit", month: "long", year: "numeric",
          });

          const htmlContent = buildEmailConfirmacionPago({
            expedienteId,
            nombreCliente,
            emailCliente,
            planNombre: planCode,
            precioTotal: precioFinal, // ya en EUR
            comunidad,
            situacion,
            urlSeguimiento,
            fechaPago,
          });

          const emailResult = await sendEmail({
            to: emailCliente,
            toName: nombreCliente || undefined,
            subject: `✅ Pago confirmado — Expediente ${expedienteId} | Renta Fácil TPymes`,
            htmlContent,
          });

          if (emailResult.success) {
            console.log(`[Stripe Webhook] Email de confirmación enviado a ${emailCliente} (${expedienteId})`);
          } else {
            console.warn(`[Stripe Webhook] Email no enviado: ${emailResult.error}`);
          }
        } else {
          console.warn(`[Stripe Webhook] No hay email del cliente para ${expedienteId} — email omitido`);
        }

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

        // Notificar a n8n como fallback (este evento no tiene session, menos datos)
        await notifyN8n({
          expediente_id: expedienteId,
          expedienteId,
          payment_intent_id: pi.id,
          stripePaymentIntentId: pi.id,
          stripe_event_id: event.id,
          stripeEventId: event.id,
          estado: "pagado",
          payment_status: "paid",
          payment_confirmed_at: new Date().toISOString(),
          amount: (pi.amount_received || pi.amount || 0),
          amount_eur: (pi.amount_received || pi.amount || 0) / 100,
          currency: pi.currency,
          cliente_email: emailCliente,
          email: emailCliente,
          cliente_nombre: nombreCliente,
          nombre: nombreCliente,
          source: "stripe_webhook_backend",
          event_type: "payment_intent.succeeded",
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
