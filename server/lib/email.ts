/**
 * Email helper — envío de emails transaccionales via Brevo API REST
 *
 * No requiere nodemailer ni dependencias adicionales.
 * Usa fetch nativo de Node.js 18+ con la API REST de Brevo (Sendinblue).
 *
 * VARIABLES DE ENTORNO REQUERIDAS:
 *   BREVO_API_KEY   — clave API de Brevo (Settings → API Keys)
 *   EMAIL_FROM      — dirección remitente (ej: noreply@rentafacil.es)
 *   EMAIL_FROM_NAME — nombre del remitente (ej: Renta Fácil TPymes)
 */

interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<EmailResult> {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "noreply@rentafacil.es";
  const fromName = process.env.EMAIL_FROM_NAME || "Renta Fácil TPymes";

  if (!apiKey) {
    console.warn("[Email] BREVO_API_KEY no configurada — email no enviado");
    return { success: false, error: "BREVO_API_KEY not configured" };
  }

  const payload = {
    sender: { name: fromName, email: fromEmail },
    to: [{ email: opts.to, name: opts.toName || opts.to }],
    subject: opts.subject,
    htmlContent: opts.htmlContent,
    ...(opts.textContent ? { textContent: opts.textContent } : {}),
  };

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Email] Error Brevo API ${res.status}: ${errorText}`);
      return { success: false, error: `Brevo API error ${res.status}: ${errorText}` };
    }

    const data = await res.json() as { messageId?: string };
    console.log(`[Email] Enviado a ${opts.to} — messageId: ${data.messageId}`);
    return { success: true, messageId: data.messageId };
  } catch (err: any) {
    console.error("[Email] Error enviando email:", err.message);
    return { success: false, error: err.message };
  }
}

// ============================================================
// PLANTILLA: Confirmación de pago
// ============================================================

interface ConfirmacionPagoData {
  expedienteId: string;
  nombreCliente: string;
  emailCliente: string;
  planNombre: string;
  precioTotal: number;
  comunidad: string;
  situacion: string;
  urlSeguimiento: string;
  fechaPago: string;
}

export function buildEmailConfirmacionPago(data: ConfirmacionPagoData): string {
  const {
    expedienteId,
    nombreCliente,
    planNombre,
    precioTotal,
    comunidad,
    situacion,
    urlSeguimiento,
    fechaPago,
  } = data;

  const nombreMostrar = nombreCliente || "Cliente";
  const precioFormateado = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(precioTotal);

  const planLabel: Record<string, string> = {
    SIMPLE: "Declaración Simple",
    COMPLEJA: "Declaración Compleja",
    PREMIUM: "Declaración Premium",
  };
  const planMostrar = planLabel[planNombre] || planNombre || "Declaración de la Renta";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmación de pago — Renta Fácil TPymes</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background:#1a365d;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.6);letter-spacing:2px;text-transform:uppercase;">Renta Fácil</p>
              <h1 style="margin:8px 0 0;font-size:26px;font-weight:700;color:#ffffff;">by TPymes</h1>
            </td>
          </tr>

          <!-- BANNER VERDE -->
          <tr>
            <td style="background:#059669;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:18px;font-weight:600;color:#ffffff;">✅ Pago confirmado</p>
              <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">Tu declaración de la renta está en marcha</p>
            </td>
          </tr>

          <!-- CUERPO -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:16px;color:#1a365d;font-weight:600;">Hola, ${nombreMostrar} 👋</p>
              <p style="margin:0 0 24px;font-size:15px;color:#4a5568;line-height:1.6;">
                Hemos recibido tu pago correctamente. A continuación tienes el resumen de tu expediente:
              </p>

              <!-- RESUMEN EXPEDIENTE -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
                          <span style="font-size:13px;color:#718096;">Nº Expediente</span>
                          <span style="float:right;font-size:13px;font-weight:700;color:#1a365d;font-family:monospace;">${expedienteId}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
                          <span style="font-size:13px;color:#718096;">Servicio</span>
                          <span style="float:right;font-size:13px;font-weight:600;color:#1a365d;">${planMostrar}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
                          <span style="font-size:13px;color:#718096;">Comunidad autónoma</span>
                          <span style="float:right;font-size:13px;color:#4a5568;">${comunidad}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
                          <span style="font-size:13px;color:#718096;">Situación fiscal</span>
                          <span style="float:right;font-size:13px;color:#4a5568;">${situacion}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
                          <span style="font-size:13px;color:#718096;">Fecha de pago</span>
                          <span style="float:right;font-size:13px;color:#4a5568;">${fechaPago}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0 0;">
                          <span style="font-size:14px;color:#718096;font-weight:600;">Total pagado</span>
                          <span style="float:right;font-size:20px;font-weight:700;color:#059669;">${precioFormateado}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- PRÓXIMOS PASOS -->
              <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#1a365d;">¿Qué ocurre ahora?</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
                    <span style="display:inline-block;width:28px;height:28px;background:#1a365d;border-radius:50%;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#fff;vertical-align:middle;">1</span>
                    <span style="margin-left:12px;font-size:14px;color:#4a5568;vertical-align:middle;">Nuestro equipo revisará tu expediente en las próximas horas.</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
                    <span style="display:inline-block;width:28px;height:28px;background:#1a365d;border-radius:50%;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#fff;vertical-align:middle;">2</span>
                    <span style="margin-left:12px;font-size:14px;color:#4a5568;vertical-align:middle;">Te contactaremos si necesitamos documentación adicional.</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;">
                    <span style="display:inline-block;width:28px;height:28px;background:#059669;border-radius:50%;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#fff;vertical-align:middle;">3</span>
                    <span style="margin-left:12px;font-size:14px;color:#4a5568;vertical-align:middle;">Presentaremos tu declaración y recibirás confirmación de la AEAT.</span>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${urlSeguimiento}"
                       style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;">
                      Ver estado de mi expediente →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#a0aec0;text-align:center;">
                También puedes acceder en cualquier momento a <a href="${urlSeguimiento}" style="color:#059669;">${urlSeguimiento}</a>
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:#718096;">
                ¿Tienes alguna pregunta? Escríbenos a
                <a href="mailto:info@ayudatpymes.com" style="color:#059669;text-decoration:none;">info@ayudatpymes.com</a>
              </p>
              <p style="margin:0;font-size:12px;color:#a0aec0;">
                Renta Fácil by TPymes · Campaña Renta 2025
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
