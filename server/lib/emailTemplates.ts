/**
 * Plantillas de email transaccional — Renta Fácil TPymes
 *
 * Cada función devuelve { subject, html } para usar con sendEmail().
 * Todos los emails comparten el mismo layout: header azul + contenido + footer.
 */

// ============================================================
// LAYOUT BASE
// ============================================================

function wrapLayout(bannerBg: string, bannerIcon: string, bannerTitle: string, bannerSubtitle: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Renta Fácil TPymes</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <!-- HEADER -->
          <tr>
            <td style="background:#1a365d;padding:28px 40px;text-align:center;">
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.6);letter-spacing:2px;text-transform:uppercase;">Renta Fácil</p>
              <h1 style="margin:8px 0 0;font-size:24px;font-weight:700;color:#ffffff;">by TPymes</h1>
            </td>
          </tr>
          <!-- BANNER -->
          <tr>
            <td style="background:${bannerBg};padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:18px;font-weight:600;color:#ffffff;">${bannerIcon} ${bannerTitle}</p>
              <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">${bannerSubtitle}</p>
            </td>
          </tr>
          <!-- BODY -->
          <tr>
            <td style="padding:36px 40px;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:#718096;">
                ¿Tienes alguna pregunta? Escríbenos a
                <a href="mailto:info@ayudatpymes.com" style="color:#059669;text-decoration:none;">info@ayudatpymes.com</a>
              </p>
              <p style="margin:0;font-size:12px;color:#a0aec0;">Renta Fácil by TPymes · Campaña Renta 2025</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(url: string, text: string, bg = "#059669"): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
    <tr><td align="center">
      <a href="${url}" style="display:inline-block;background:${bg};color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;">${text}</a>
    </td></tr>
  </table>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
      <span style="font-size:13px;color:#718096;">${label}</span>
      <span style="float:right;font-size:13px;font-weight:600;color:#1a365d;">${value}</span>
    </td>
  </tr>`;
}

function infoTable(rows: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:24px;">
    <tr><td style="padding:20px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
    </td></tr>
  </table>`;
}

// ============================================================
// 1. EMAIL DE BIENVENIDA / EXPEDIENTE CREADO
// ============================================================

interface BienvenidaData {
  expedienteId: string;
  nombreCliente: string;
  emailCliente: string;
  comunidad: string;
  situacion: string;
  complejidad: string;
  urlMiRenta: string;
  documentosNecesarios: string[];
  // Resultado fiscal (opcional)
  resultadoFiscal?: number;      // importe en EUR (positivo = a pagar, negativo = a devolver)
  tipoResultado?: string;        // "a_devolver" | "a_pagar" | "sin_resultado"
  precioServicio?: number;       // precio en céntimos
}

export function buildEmailBienvenida(data: BienvenidaData) {
  const nombre = data.nombreCliente || "Cliente";

  // Bloque de resultado fiscal
  let resultadoHtml = "";
  if (data.resultadoFiscal !== undefined && data.tipoResultado && data.tipoResultado !== "sin_resultado") {
    const esDevolucion = data.tipoResultado === "a_devolver";
    const color = esDevolucion ? "#059669" : "#dc2626";
    const label = esDevolucion ? "Hacienda te devolverá aproximadamente" : "Tendrás que pagar aproximadamente";
    const valor = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Math.abs(data.resultadoFiscal));
    const emoji = esDevolucion ? "💰" : "📋";
    resultadoHtml = `
      <div style="background:${esDevolucion ? '#ecfdf5' : '#fef2f2'};border:2px solid ${color};border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#718096;">${emoji} ${label}</p>
        <p style="margin:8px 0 0;font-size:36px;font-weight:800;color:${color};">${valor}</p>
        <p style="margin:8px 0 0;font-size:12px;color:#a0aec0;">Estimación orientativa. El resultado final puede variar.</p>
      </div>`;
  }

  // Precio del servicio
  let precioHtml = "";
  if (data.precioServicio !== undefined && data.precioServicio > 0) {
    const precioEur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(data.precioServicio / 100);
    precioHtml = `
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:24px;text-align:center;">
        <p style="margin:0;font-size:14px;color:#166534;">Nuestro servicio de gestión completa: <strong>${precioEur}</strong></p>
        <p style="margin:4px 0 0;font-size:12px;color:#4ade80;">Precio cerrado · Sin sorpresas</p>
      </div>`;
  }

  const docsHtml = data.documentosNecesarios.length > 0
    ? `<p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#1a365d;">📄 Documentos que necesitarás</p>
       <ul style="margin:0 0 24px;padding-left:20px;color:#4a5568;font-size:14px;line-height:2;">
         ${data.documentosNecesarios.map(d => `<li>${d}</li>`).join("")}
       </ul>`
    : "";

  const body = `
    <p style="margin:0 0 8px;font-size:16px;color:#1a365d;font-weight:600;">¡Hola, ${nombre}! 👋</p>
    <p style="margin:0 0 24px;font-size:15px;color:#4a5568;line-height:1.6;">
      Hemos calculado el resultado estimado de tu declaración de la renta 2024.
      Aquí tienes tu resumen:
    </p>
    ${resultadoHtml}
    ${precioHtml}
    ${infoTable(
      infoRow("Nº Expediente", `<code style="font-family:monospace;font-weight:700;">${data.expedienteId}</code>`) +
      infoRow("Comunidad autónoma", data.comunidad || "—") +
      infoRow("Situación fiscal", data.situacion || "—") +
      infoRow("Complejidad estimada", data.complejidad || "—")
    )}
    ${docsHtml}
    <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#1a365d;">¿Qué sigue?</p>
    <ol style="margin:0 0 24px;padding-left:20px;color:#4a5568;font-size:14px;line-height:2;">
      <li>Completa el pago en tu área personal</li>
      <li>Sube los documentos necesarios</li>
      <li>Nuestro equipo prepara tu borrador</li>
      <li>Revisa, firma y ¡listo!</li>
    </ol>
    ${ctaButton(data.urlMiRenta, "Acceder a mi expediente →")}
    <p style="margin:0;font-size:13px;color:#a0aec0;text-align:center;">
      Tu enlace personal: <a href="${data.urlMiRenta}" style="color:#059669;">${data.urlMiRenta}</a>
    </p>`;

  return {
    subject: `📊 Tu resultado de la renta: ${data.tipoResultado === 'a_devolver' ? 'te devuelven' : 'a pagar'} — Renta Fácil TPymes`,
    html: wrapLayout("#1a365d", "📊", "Tu resultado estimado", "Declaración de la Renta 2024 (ejercicio 2025)", body),
  };
}

// ============================================================
// 2. EMAIL BORRADOR LISTO PARA REVISAR
// ============================================================

interface BorradorListoData {
  expedienteId: string;
  nombreCliente: string;
  urlMiRenta: string;
  resultadoEstimado?: number;
  tipoResultado?: string; // "a_devolver" | "a_pagar"
  ahorroVsBorrador?: number;
}

export function buildEmailBorradorListo(data: BorradorListoData) {
  const nombre = data.nombreCliente || "Cliente";

  let resultadoHtml = "";
  if (data.resultadoEstimado !== undefined) {
    const esDevolucion = data.tipoResultado === "a_devolver";
    const color = esDevolucion ? "#059669" : "#dc2626";
    const label = esDevolucion ? "A devolver" : "A pagar";
    const valor = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Math.abs(data.resultadoEstimado));

    resultadoHtml = `
      <div style="background:${esDevolucion ? '#ecfdf5' : '#fef2f2'};border:2px solid ${color};border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#718096;">${label}</p>
        <p style="margin:8px 0 0;font-size:32px;font-weight:800;color:${color};">${valor}</p>
        ${data.ahorroVsBorrador ? `<p style="margin:8px 0 0;font-size:13px;color:#059669;">💰 Ahorro vs borrador AEAT: ${new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(data.ahorroVsBorrador)}</p>` : ""}
      </div>`;
  }

  const body = `
    <p style="margin:0 0 8px;font-size:16px;color:#1a365d;font-weight:600;">¡${nombre}, tu borrador está listo! 🎉</p>
    <p style="margin:0 0 24px;font-size:15px;color:#4a5568;line-height:1.6;">
      Hemos terminado de preparar tu declaración. Revísala en tu área personal y, si todo está correcto, fírmala para que la presentemos ante la AEAT.
    </p>
    ${resultadoHtml}
    ${infoTable(infoRow("Nº Expediente", data.expedienteId))}
    <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#1a365d;">Lo que necesitas hacer:</p>
    <ol style="margin:0 0 24px;padding-left:20px;color:#4a5568;font-size:14px;line-height:2;">
      <li><strong>Revisa</strong> el borrador y las casillas del Modelo 100</li>
      <li><strong>Firma</strong> digitalmente en tu área personal</li>
      <li>Nosotros nos encargamos de <strong>presentarla ante la AEAT</strong></li>
    </ol>
    ${ctaButton(data.urlMiRenta, "Revisar y firmar mi declaración →")}
    <p style="margin:0;font-size:13px;color:#a0aec0;text-align:center;">
      Accede a: <a href="${data.urlMiRenta}" style="color:#059669;">${data.urlMiRenta}</a>
    </p>`;

  return {
    subject: `🎉 Tu borrador está listo — Expediente ${data.expedienteId} | Renta Fácil`,
    html: wrapLayout("#059669", "✅", "Borrador listo", "Revisa, firma y presentamos tu declaración", body),
  };
}

// ============================================================
// 3. EMAIL DOCUMENTOS RECIBIDOS
// ============================================================

interface DocumentosRecibidosData {
  expedienteId: string;
  nombreCliente: string;
  urlMiRenta: string;
  documentosSubidos: string[];
  documentosPendientes: string[];
}

export function buildEmailDocumentosRecibidos(data: DocumentosRecibidosData) {
  const nombre = data.nombreCliente || "Cliente";

  const subidosHtml = data.documentosSubidos.length > 0
    ? `<p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#059669;">✅ Documentos recibidos:</p>
       <ul style="margin:0 0 16px;padding-left:20px;color:#4a5568;font-size:14px;line-height:1.8;">
         ${data.documentosSubidos.map(d => `<li>${d}</li>`).join("")}
       </ul>`
    : "";

  const pendientesHtml = data.documentosPendientes.length > 0
    ? `<p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#d97706;">⏳ Pendientes de recibir:</p>
       <ul style="margin:0 0 16px;padding-left:20px;color:#4a5568;font-size:14px;line-height:1.8;">
         ${data.documentosPendientes.map(d => `<li>${d}</li>`).join("")}
       </ul>`
    : `<div style="background:#ecfdf5;border-radius:8px;padding:16px;text-align:center;margin-bottom:16px;">
         <p style="margin:0;font-size:14px;color:#059669;font-weight:600;">✅ Toda la documentación está completa</p>
         <p style="margin:4px 0 0;font-size:13px;color:#4a5568;">Nuestro equipo empezará a preparar tu borrador</p>
       </div>`;

  const body = `
    <p style="margin:0 0 8px;font-size:16px;color:#1a365d;font-weight:600;">Hola, ${nombre} 📎</p>
    <p style="margin:0 0 24px;font-size:15px;color:#4a5568;line-height:1.6;">
      Hemos recibido documentación para tu expediente <strong>${data.expedienteId}</strong>. Aquí tienes el estado:
    </p>
    ${subidosHtml}
    ${pendientesHtml}
    ${ctaButton(data.urlMiRenta, "Ver mi expediente →")}`;

  return {
    subject: `📎 Documentos recibidos — Expediente ${data.expedienteId} | Renta Fácil`,
    html: wrapLayout("#2563eb", "📎", "Documentos recibidos", `Expediente ${data.expedienteId}`, body),
  };
}

// ============================================================
// 4. EMAIL FIRMA RECIBIDA
// ============================================================

interface FirmaRecibidaData {
  expedienteId: string;
  nombreCliente: string;
  urlMiRenta: string;
  fechaFirma: string;
}

export function buildEmailFirmaRecibida(data: FirmaRecibidaData) {
  const nombre = data.nombreCliente || "Cliente";

  const body = `
    <p style="margin:0 0 8px;font-size:16px;color:#1a365d;font-weight:600;">¡Gracias, ${nombre}! ✍️</p>
    <p style="margin:0 0 24px;font-size:15px;color:#4a5568;line-height:1.6;">
      Hemos recibido tu firma digital. Tu declaración está lista para presentar ante la AEAT.
    </p>
    ${infoTable(
      infoRow("Nº Expediente", data.expedienteId) +
      infoRow("Fecha de firma", data.fechaFirma) +
      infoRow("Estado", `<span style="color:#059669;font-weight:700;">Pendiente de presentación</span>`)
    )}
    <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#1a365d;">¿Qué pasa ahora?</p>
    <ol style="margin:0 0 24px;padding-left:20px;color:#4a5568;font-size:14px;line-height:2;">
      <li>Nuestro equipo presenta tu declaración ante la AEAT</li>
      <li>Recibirás un email de confirmación con el justificante</li>
      <li>Si tienes devolución, Hacienda la ingresará en tu cuenta</li>
    </ol>
    ${ctaButton(data.urlMiRenta, "Seguir el estado de mi declaración →")}
    <p style="margin:0;font-size:13px;color:#a0aec0;text-align:center;">
      Ya casi hemos terminado — solo queda la presentación oficial 🚀
    </p>`;

  return {
    subject: `✍️ Firma recibida — Expediente ${data.expedienteId} | Renta Fácil`,
    html: wrapLayout("#7c3aed", "✍️", "Firma recibida", "Tu declaración está lista para presentar", body),
  };
}

// ============================================================
// 5. EMAIL DECLARACIÓN PRESENTADA
// ============================================================

interface DeclaracionPresentadaData {
  expedienteId: string;
  nombreCliente: string;
  urlMiRenta: string;
  fechaPresentacion: string;
  resultadoFinal: number;
  tipoResultado: string; // "a_devolver" | "a_pagar"
  numeroCsvAeat?: string;
}

export function buildEmailDeclaracionPresentada(data: DeclaracionPresentadaData) {
  const nombre = data.nombreCliente || "Cliente";
  const esDevolucion = data.tipoResultado === "a_devolver";
  const color = esDevolucion ? "#059669" : "#dc2626";
  const label = esDevolucion ? "A devolver" : "A pagar";
  const valor = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Math.abs(data.resultadoFinal));

  const body = `
    <p style="margin:0 0 8px;font-size:16px;color:#1a365d;font-weight:600;">¡${nombre}, ya está! 🎉🎉🎉</p>
    <p style="margin:0 0 24px;font-size:15px;color:#4a5568;line-height:1.6;">
      Tu declaración de la renta ha sido <strong>presentada ante la Agencia Tributaria</strong>. ¡Enhorabuena!
    </p>
    <div style="background:${esDevolucion ? '#ecfdf5' : '#fef2f2'};border:2px solid ${color};border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:#718096;">Resultado de tu declaración</p>
      <p style="margin:8px 0 0;font-size:36px;font-weight:800;color:${color};">${label}: ${valor}</p>
    </div>
    ${infoTable(
      infoRow("Nº Expediente", data.expedienteId) +
      infoRow("Fecha de presentación", data.fechaPresentacion) +
      (data.numeroCsvAeat ? infoRow("CSV AEAT", `<code style="font-family:monospace;">${data.numeroCsvAeat}</code>`) : "")
    )}
    ${esDevolucion
      ? `<div style="background:#f0fdf4;border-left:4px solid #059669;border-radius:4px;padding:16px;margin-bottom:24px;">
           <p style="margin:0;font-size:14px;color:#166534;"><strong>💰 ¿Cuándo recibiré la devolución?</strong></p>
           <p style="margin:8px 0 0;font-size:13px;color:#4a5568;line-height:1.6;">
             La AEAT suele tramitar las devoluciones en un plazo de 1 a 6 meses. Te llegará por transferencia a la cuenta que tienes registrada en Hacienda.
           </p>
         </div>`
      : `<div style="background:#fef2f2;border-left:4px solid #dc2626;border-radius:4px;padding:16px;margin-bottom:24px;">
           <p style="margin:0;font-size:14px;color:#991b1b;"><strong>📅 ¿Cómo pago?</strong></p>
           <p style="margin:8px 0 0;font-size:13px;color:#4a5568;line-height:1.6;">
             Si tu resultado es a ingresar, puedes pagar en un solo plazo (antes del 30 de junio) o fraccionarlo: <strong>60% en junio</strong> y <strong>40% en noviembre</strong>, sin intereses.
           </p>
         </div>`
    }
    ${ctaButton(data.urlMiRenta, "Ver justificante de presentación →")}
    <p style="margin:0;font-size:14px;color:#4a5568;text-align:center;line-height:1.6;">
      Gracias por confiar en <strong>Renta Fácil by TPymes</strong>.<br/>
      Si conoces a alguien que necesite hacer la renta, ¡comparte nuestro servicio! 💙
    </p>`;

  return {
    subject: `🎉 ¡Declaración presentada! — Expediente ${data.expedienteId} | Renta Fácil`,
    html: wrapLayout("#059669", "🎉", "¡Declaración presentada!", "Tu renta 2025 ha sido presentada ante la AEAT", body),
  };
}

// ============================================================
// HELPER: Documentos necesarios según situación
// ============================================================

export function getDocumentosNecesarios(situacion: string, opciones?: {
  hipoteca?: boolean;
  alquiler?: boolean;
  autonomo?: boolean;
  donaciones?: boolean;
  discapacidad?: boolean;
}): string[] {
  const docs: string[] = [
    "DNI/NIE vigente (ambas caras)",
    "Datos fiscales de la AEAT (si los tienes)",
    "Certificado de retenciones de tu empresa",
  ];

  if (situacion === "Autónomo" || opciones?.autonomo) {
    docs.push("Libro de ingresos y gastos del ejercicio");
    docs.push("Modelo 130 (pagos fraccionados trimestrales)");
    docs.push("Facturas de gastos deducibles");
  }

  if (situacion === "Pensionista") {
    docs.push("Certificado de prestaciones de la Seguridad Social");
  }

  if (opciones?.hipoteca) {
    docs.push("Certificado del banco sobre la hipoteca (intereses pagados)");
  }

  if (opciones?.alquiler) {
    docs.push("Contrato de alquiler y justificantes de pago");
  }

  if (opciones?.donaciones) {
    docs.push("Certificados de donativos (ONGs, fundaciones, etc.)");
  }

  if (opciones?.discapacidad) {
    docs.push("Certificado de discapacidad (grado ≥33%)");
  }

  return docs;
}

// ============================================================
// 3. EMAIL DE CONFIRMACIÓN DE DEDUCCIONES
// ============================================================

interface DeduccionItem {
  id: string;
  nombre: string;
  importe: number;
  tipo: "estatal" | "autonomica";
  normativa?: string;
}

interface ConfirmacionDeduccionesData {
  expedienteId: string;
  nombreCliente: string;
  deducciones: DeduccionItem[];
  ahorroTotal: number;
  urlMiRenta: string;
}

export function buildEmailConfirmacionDeducciones(data: ConfirmacionDeduccionesData) {
  const nombre = data.nombreCliente || "Cliente";
  const fmt = (n: number) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

  const estatales = data.deducciones.filter(d => d.tipo === "estatal");
  const autonomicas = data.deducciones.filter(d => d.tipo === "autonomica");

  const buildList = (items: DeduccionItem[]) => items.length === 0 ? "" : `
    <ul style="margin:0 0 20px;padding-left:0;list-style:none;">
      ${items.map(d => `
        <li style="display:flex;justify-content:space-between;align-items:flex-start;padding:10px 0;border-bottom:1px solid #e2e8f0;">
          <div>
            <span style="font-size:14px;color:#1a365d;font-weight:600;">${d.nombre}</span>
            ${d.normativa ? `<br><span style="font-size:12px;color:#718096;">${d.normativa}</span>` : ""}
          </div>
          <span style="font-size:14px;font-weight:700;color:#059669;white-space:nowrap;margin-left:16px;">${fmt(d.importe)}</span>
        </li>`).join("")}
    </ul>`;

  const body = `
    <p style="margin:0 0 8px;font-size:16px;color:#1a365d;font-weight:600;">¡Hola, ${nombre}! 🎉</p>
    <p style="margin:0 0 24px;font-size:15px;color:#4a5568;line-height:1.6;">
      Has confirmado tus deducciones para la declaración de la renta 2025.
      Tu asesor ya las tiene en cuenta y las revisará con tu documentación.
    </p>

    <!-- Resumen ahorro -->
    <div style="background:linear-gradient(135deg,#059669,#047857);border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
      <p style="margin:0 0 4px;font-size:13px;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:1px;">Ahorro estimado mínimo</p>
      <p style="margin:0;font-size:36px;font-weight:800;color:#ffffff;">${fmt(data.ahorroTotal)}</p>
      <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.7);">Tu asesor verificará cada deducción con tu documentación</p>
    </div>

    ${estatales.length > 0 ? `
    <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#1a365d;">📋 Deducciones estatales detectadas</p>
    ${buildList(estatales)}` : ""}

    ${autonomicas.length > 0 ? `
    <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#1a365d;">🏛️ Deducciones autonómicas detectadas</p>
    ${buildList(autonomicas)}` : ""}

    <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#1a365d;">¿Qué sigue ahora?</p>
    <ol style="margin:0 0 24px;padding-left:20px;color:#4a5568;font-size:14px;line-height:2;">
      <li>Sube los documentos necesarios en tu área personal</li>
      <li>Tu asesor prepara el borrador de tu declaración</li>
      <li>Revisas el borrador, lo firmas y ¡listo!</li>
    </ol>

    ${ctaButton(data.urlMiRenta, "Ver mi expediente →")}

    <p style="margin:0;font-size:13px;color:#718096;text-align:center;">
      Expediente: <code style="font-family:monospace;font-weight:700;">${data.expedienteId}</code>
    </p>`;

  return {
    subject: `✅ Deducciones confirmadas — Ahorro estimado ${fmt(data.ahorroTotal)} | Expediente ${data.expedienteId}`,
    html: wrapLayout(
      "#059669",
      "✅",
      "Deducciones confirmadas",
      `${data.deducciones.length} deducción${data.deducciones.length !== 1 ? "es" : ""} detectada${data.deducciones.length !== 1 ? "s" : ""} · Ahorro estimado ${fmt(data.ahorroTotal)}`,
      body
    ),
  };
}

// ============================================================
// 6. EMAIL RESULTADO DE SIMULACIÓN (enviado al ver el resultado)
// ============================================================

interface ResultadoSimulacionData {
  nombreCliente: string;
  emailCliente: string;
  expedienteId: string;
  resultado: number;           // positivo = a pagar, negativo = a devolver
  resultadoBorrador: number;
  ahorroVsBorrador: number;
  comunidad: string;
  situacion: string;
  complejidad: string;         // "Simple" | "Complejo"
  precioTotal: number;         // en céntimos
  urlSimulador: string;
}

export function buildEmailResultadoSimulacion(data: ResultadoSimulacionData) {
  const nombre = data.nombreCliente || "Cliente";
  const esDevolucion = data.resultado < 0;
  const colorResultado = esDevolucion ? "#059669" : "#dc2626";
  const labelResultado = esDevolucion ? "💰 TE DEVUELVEN" : "⚠️ TIENES QUE PAGAR";
  const valorResultado = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Math.abs(data.resultado));
  const precioServicio = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(data.precioTotal / 100);

  const ahorroHtml = data.ahorroVsBorrador > 0
    ? `<p style="margin:8px 0 0;font-size:13px;color:#059669;font-weight:600;">💰 Ahorro vs. borrador AEAT: ${new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(data.ahorroVsBorrador)} menos</p>`
    : "";

  const complejidadLabel = data.complejidad === "Complejo"
    ? `<span style="background:#fef3c7;color:#d97706;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;">Revisión especializada</span>`
    : `<span style="background:#ecfdf5;color:#059669;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;">Declaración Simple</span>`;

  const body = `
    <p style="margin:0 0 8px;font-size:16px;color:#1a365d;font-weight:600;">Hola, ${nombre} 👋</p>
    <p style="margin:0 0 24px;font-size:15px;color:#4a5568;line-height:1.6;">
      Aquí tienes el resultado estimado de tu declaración de la renta 2025. Recuerda que es una estimación basada en los datos que nos has proporcionado.
    </p>

    <!-- RESULTADO GRANDE -->
    <div style="background:${esDevolucion ? '#ecfdf5' : '#fef2f2'};border:2px solid ${colorResultado};border-radius:12px;padding:28px;text-align:center;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#718096;text-transform:uppercase;letter-spacing:1px;">${labelResultado}</p>
      <p style="margin:8px 0 0;font-size:40px;font-weight:800;color:${colorResultado};font-family:'Segoe UI',Arial,sans-serif;">${valorResultado}</p>
      ${ahorroHtml}
    </div>

    <!-- DETALLES -->
    ${infoTable(
      infoRow("Nº Expediente", `<code style="font-family:monospace;">${data.expedienteId}</code>`) +
      infoRow("Comunidad autónoma", data.comunidad || "—") +
      infoRow("Situación fiscal", data.situacion || "—") +
      infoRow("Tipo de declaración", complejidadLabel) +
      infoRow("Precio del servicio", `<strong style="color:#1a365d;">${precioServicio}</strong>`)
    )}

    <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#1a365d;">¿Quieres que lo gestionemos nosotros?</p>
    <p style="margin:0 0 20px;font-size:14px;color:#4a5568;line-height:1.6;">
      Por solo <strong>${precioServicio}</strong> nos encargamos de todo: preparamos tu declaración, la revisamos y la presentamos ante la AEAT. Precio cerrado, sin sorpresas.
    </p>

    ${ctaButton(data.urlSimulador, "Contratar gestión de mi declaración →")}

    <p style="margin:0;font-size:12px;color:#a0aec0;text-align:center;">
      Esta es una estimación orientativa. El resultado final puede variar según la información completa de tu declaración.
    </p>`;

  return {
    subject: `📊 Tu resultado estimado: ${valorResultado} ${esDevolucion ? "a devolver" : "a pagar"} — Renta Fácil`,
    html: wrapLayout(esDevolucion ? "#059669" : "#1a365d", "📊", "Tu resultado de la simulación", "Declaración de la Renta 2025", body),
  };
}
