/**
 * Job de recordatorio 24h
 * ─────────────────────────────────────────────────────────────────────────────
 * Se ejecuta cada hora. Busca expedientes en estado "simulacion" con más de
 * 24h de antigüedad que aún no han pagado, y les envía un email de recordatorio.
 *
 * Para evitar envíos duplicados, se usa el campo `subestado`:
 *   - Si subestado = "recordatorio_enviado" → ya se envió, no repetir.
 *   - Tras enviar, se actualiza subestado = "recordatorio_enviado".
 */

import { getDb } from "../db";
import { declaraciones } from "../../drizzle/schema";
import { and, eq, isNotNull, lt, ne, or, isNull } from "drizzle-orm";
import { sendEmail } from "../lib/email";
import { ENV } from "../_core/env";

// ── Template del email de recordatorio ──────────────────────────────────────

function buildEmailRecordatorio(data: {
  nombreCliente: string;
  emailCliente: string;
  expedienteId: string;
  resultado: number;
  precioTotal: number; // en EUR
  comunidad: string;
  urlPago: string;
}): { subject: string; html: string } {
  const { nombreCliente, expedienteId, resultado, precioTotal, comunidad, urlPago } = data;

  const resultadoFormateado = new Intl.NumberFormat("es-ES", {
    style: "currency", currency: "EUR", minimumFractionDigits: 2,
  }).format(Math.abs(resultado));
  const precioFormateado = new Intl.NumberFormat("es-ES", {
    style: "currency", currency: "EUR", minimumFractionDigits: 2,
  }).format(precioTotal);
  const esDevolucion = resultado < 0;
  const resultadoLabel = esDevolucion ? "a devolver" : "a pagar";
  const resultadoColor = esDevolucion ? "#059669" : "#dc2626";

  const subject = `⏰ Tu simulación de renta está esperando — Expediente ${expedienteId}`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- BANNER -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a365d 0%,#2d5a9e 100%);padding:32px 40px;text-align:center;">
              <p style="margin:0 0 8px;font-size:32px;">⏰</p>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">
                Tu simulación de renta te está esperando
              </h1>
              <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.75);">
                Tienes el resultado listo — solo falta un paso
              </p>
            </td>
          </tr>
          <!-- BODY -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 20px;font-size:16px;color:#4a5568;line-height:1.6;">
                Hola <strong>${nombreCliente}</strong>,
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#4a5568;line-height:1.6;">
                Ayer realizaste una simulación de tu declaración de la renta 2025 y calculamos tu resultado.
                Queremos recordarte que tu expediente sigue disponible y puedes completar el proceso cuando quieras.
              </p>

              <!-- RESULTADO DESTACADO -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;text-align:center;">
                    <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#718096;text-transform:uppercase;letter-spacing:0.5px;">
                      Tu resultado estimado
                    </p>
                    <p style="margin:0;font-size:32px;font-weight:700;color:${resultadoColor};">
                      ${resultadoFormateado}
                    </p>
                    <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:${resultadoColor};text-transform:uppercase;">
                      ${resultadoLabel}
                    </p>
                    ${comunidad ? `<p style="margin:8px 0 0;font-size:13px;color:#718096;">Comunidad: ${comunidad}</p>` : ""}
                  </td>
                </tr>
              </table>

              <!-- PRECIO -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a365d;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="margin:0;font-size:15px;font-weight:600;color:#ffffff;">Gestiona tu declaración</p>
                          <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.65);">
                            Presentamos tu renta con todas las deducciones aplicadas
                          </p>
                        </td>
                        <td align="right">
                          <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">${precioFormateado}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${urlPago}"
                       style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:16px 40px;border-radius:8px;letter-spacing:0.2px;">
                      Completar mi declaración →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#a0aec0;text-align:center;">
                O copia este enlace: <a href="${urlPago}" style="color:#059669;">${urlPago}</a>
              </p>

              <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">

              <p style="margin:0;font-size:13px;color:#718096;line-height:1.6;">
                Si ya no necesitas este servicio o tienes alguna pregunta, escríbenos a
                <a href="mailto:info@ayudatpymes.com" style="color:#059669;">info@ayudatpymes.com</a>.
              </p>
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a0aec0;">
                Renta Fácil by TPymes · Campaña Renta 2025 · Expediente ${expedienteId}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

// ── Función principal del job ────────────────────────────────────────────────

let jobRunning = false;

export async function runRecordatorio24hJob(): Promise<void> {
  if (jobRunning) {
    console.log("[Job 24h] Ya hay una ejecución en curso, saltando...");
    return;
  }
  jobRunning = true;

  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Job 24h] DB no disponible, saltando job");
      return;
    }

    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const hace72h = new Date(Date.now() - 72 * 60 * 60 * 1000); // No enviar después de 72h

    // Buscar simulaciones pendientes de pago, con email, sin recordatorio enviado
    const pendientes = await db
      .select({
        id: declaraciones.id,
        expedienteId: declaraciones.expedienteId,
        emailContacto: declaraciones.emailContacto,
        datosContribuyente: declaraciones.datosContribuyente,
        resultadoCalculo: declaraciones.resultadoCalculo,
        precioTotal: declaraciones.precioTotal,
        subestado: declaraciones.subestado,
        createdAt: declaraciones.createdAt,
      })
      .from(declaraciones)
      .where(
        and(
          eq(declaraciones.estado, "simulacion"),
          isNotNull(declaraciones.emailContacto),
          lt(declaraciones.createdAt, hace24h),
          // No enviar si ya se envió recordatorio
          or(
            isNull(declaraciones.subestado),
            ne(declaraciones.subestado, "recordatorio_enviado")
          )
        )
      );

    // Filtrar también los que tienen más de 72h (ya es demasiado tarde)
    const candidatos = pendientes.filter(p => p.createdAt >= hace72h);

    console.log(`[Job 24h] ${candidatos.length} simulaciones pendientes de recordatorio (de ${pendientes.length} totales)`);

    const baseUrl = ENV.appBaseUrl;

    for (const exp of candidatos) {
      try {
        const emailCliente = exp.emailContacto!;
        const datosContrib = (exp.datosContribuyente as Record<string, unknown>) || {};
        const resultadoCalc = (exp.resultadoCalculo as Record<string, unknown>) || {};

        const nombreCliente = String(
          datosContrib.nombreCompleto ||
          `${datosContrib.nombre || ""} ${datosContrib.apellidos || ""}`.trim() ||
          (datosContrib.contribuyente as any)?.nombre ||
          "Cliente"
        );
        const resultado = Number(resultadoCalc.resultado || 0);
        const comunidad = String(
          datosContrib.comunidad ||
          datosContrib.comunidadAutonoma ||
          ""
        );
        const precioTotal = (exp.precioTotal || 0) / 100; // céntimos → EUR

        const urlPago = `${baseUrl}/pago/${exp.expedienteId}`;

        const { subject, html } = buildEmailRecordatorio({
          nombreCliente,
          emailCliente,
          expedienteId: exp.expedienteId,
          resultado,
          precioTotal,
          comunidad,
          urlPago,
        });

        const emailResult = await sendEmail({
          to: emailCliente,
          toName: nombreCliente,
          subject,
          htmlContent: html,
        });

        if (emailResult.success) {
          // Marcar como recordatorio enviado
          await db
            .update(declaraciones)
            .set({ subestado: "recordatorio_enviado" })
            .where(eq(declaraciones.id, exp.id));
          console.log(`[Job 24h] Recordatorio enviado a ${emailCliente} (${exp.expedienteId})`);
        } else {
          console.warn(`[Job 24h] Error enviando recordatorio a ${emailCliente}: ${emailResult.error}`);
        }

        // Pequeña pausa para no saturar la API de Brevo
        await new Promise(r => setTimeout(r, 500));
      } catch (err: any) {
        console.error(`[Job 24h] Error procesando ${exp.expedienteId}: ${err.message}`);
      }
    }
  } finally {
    jobRunning = false;
  }
}

// ── Iniciar el job con setInterval ──────────────────────────────────────────

export function startRecordatorio24hJob(): void {
  console.log("[Job 24h] Job de recordatorio iniciado — se ejecuta cada hora");

  // Primera ejecución a los 5 minutos del arranque (no inmediatamente)
  setTimeout(() => {
    runRecordatorio24hJob().catch(err =>
      console.error("[Job 24h] Error en primera ejecución:", err)
    );
  }, 5 * 60 * 1000);

  // Luego cada hora
  setInterval(() => {
    runRecordatorio24hJob().catch(err =>
      console.error("[Job 24h] Error en ejecución periódica:", err)
    );
  }, 60 * 60 * 1000);
}
