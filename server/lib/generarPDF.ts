/**
 * Generador de informe PDF con casillas del Modelo 100 IRPF 2025
 * Usa PDFKit para generar el informe en el servidor
 */

import PDFDocument from "pdfkit";

interface DatosContribuyente {
  nif?: string;
  nombre?: string;
  apellidos?: string;
}

interface ResultadoCalculo {
  ingresos_brutos?: number;
  retenciones?: number;
  reduccion_trabajo?: number;
  base_imponible_general?: number;
  cuota_integra_total?: number;
  total_deducciones?: number;
  cuota_liquida?: number;
  resultado?: number;
  resultado_borrador?: number;
  ahorro_vs_borrador?: number;
  casillas?: Record<string, number>;
  desglose_deducciones?: Array<{ concepto: string; importe: number }>;
  es_complejo?: boolean;
}

interface DatosDeclaracion {
  expedienteId: string;
  contribuyente: DatosContribuyente;
  comunidad?: string;
  resultado: ResultadoCalculo;
  precioTotal: number;
}

export async function generarInformePDF(datos: DatosDeclaracion): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const NAVY = "#1a365d";
    const EMERALD = "#059669";
    const GRAY = "#6b7280";
    const LIGHT_GRAY = "#f3f4f6";

    // ============================================================
    // CABECERA
    // ============================================================
    doc.rect(0, 0, 595, 80).fill(NAVY);
    doc
      .fillColor("white")
      .font("Helvetica-Bold")
      .fontSize(20)
      .text("RENTA FÁCIL TPYMES", 50, 25);
    doc
      .fillColor("white")
      .font("Helvetica")
      .fontSize(10)
      .text("Informe de Declaración de la Renta 2025 — Modelo 100 IRPF", 50, 50);

    doc.moveDown(3);

    // ============================================================
    // DATOS DEL CONTRIBUYENTE
    // ============================================================
    doc
      .fillColor(NAVY)
      .font("Helvetica-Bold")
      .fontSize(13)
      .text("DATOS DEL CONTRIBUYENTE", 50, 100);

    doc.moveTo(50, 116).lineTo(545, 116).strokeColor(EMERALD).lineWidth(2).stroke();

    const nombre = `${datos.contribuyente.nombre || ""} ${datos.contribuyente.apellidos || ""}`.trim() || "—";
    const nif = datos.contribuyente.nif || "—";
    const comunidad = datos.comunidad || "—";

    doc.fillColor(GRAY).font("Helvetica").fontSize(10);
    doc.text(`Nombre y apellidos: ${nombre}`, 50, 125);
    doc.text(`NIF/NIE: ${nif}`, 50, 140);
    doc.text(`Comunidad Autónoma: ${comunidad}`, 50, 155);
    doc.text(`Expediente: ${datos.expedienteId}`, 50, 170);
    doc.text(`Ejercicio fiscal: 2025 (Renta 2025)`, 300, 125);
    doc.text(`Fecha del informe: ${new Date().toLocaleDateString("es-ES")}`, 300, 140);

    // ============================================================
    // RESULTADO COMPARATIVO
    // ============================================================
    doc
      .fillColor(NAVY)
      .font("Helvetica-Bold")
      .fontSize(13)
      .text("RESULTADO COMPARATIVO", 50, 200);

    doc.moveTo(50, 216).lineTo(545, 216).strokeColor(EMERALD).lineWidth(2).stroke();

    // Caja borrador AEAT
    doc.rect(50, 225, 230, 80).fill(LIGHT_GRAY);
    doc
      .fillColor(GRAY)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text("BORRADOR AEAT (sin optimizar)", 60, 235);

    const resultadoBorrador = datos.resultado.resultado_borrador || 0;
    const colorBorrador = resultadoBorrador < 0 ? EMERALD : "#ef4444";
    doc
      .fillColor(colorBorrador)
      .font("Helvetica-Bold")
      .fontSize(22)
      .text(
        `${resultadoBorrador < 0 ? "" : "+"}${resultadoBorrador.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`,
        60, 255
      );
    doc
      .fillColor(colorBorrador)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(resultadoBorrador < 0 ? "A DEVOLVER" : "A PAGAR", 60, 283);

    // Caja con Renta Fácil
    doc.rect(295, 225, 250, 80).fill("#d1fae5");
    doc
      .fillColor(EMERALD)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text("CON RENTA FÁCIL (optimizado)", 305, 235);

    const resultadoOptimizado = datos.resultado.resultado || 0;
    const colorOptimizado = resultadoOptimizado < 0 ? EMERALD : "#ef4444";
    doc
      .fillColor(colorOptimizado)
      .font("Helvetica-Bold")
      .fontSize(22)
      .text(
        `${resultadoOptimizado < 0 ? "" : "+"}${resultadoOptimizado.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`,
        305, 255
      );
    doc
      .fillColor(colorOptimizado)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(resultadoOptimizado < 0 ? "A DEVOLVER" : "A PAGAR", 305, 283);

    // Ahorro
    const ahorro = datos.resultado.ahorro_vs_borrador || 0;
    if (ahorro > 0) {
      doc.rect(50, 315, 495, 40).fill(EMERALD);
      doc
        .fillColor("white")
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(
          `AHORRO CONSEGUIDO: ${ahorro.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`,
          50, 330,
          { align: "center", width: 495 }
        );
    }

    // ============================================================
    // CASILLAS DEL MODELO 100
    // ============================================================
    const casillasY = ahorro > 0 ? 375 : 325;

    doc
      .fillColor(NAVY)
      .font("Helvetica-Bold")
      .fontSize(13)
      .text("CASILLAS DEL MODELO 100 IRPF 2025", 50, casillasY);

    doc.moveTo(50, casillasY + 16).lineTo(545, casillasY + 16).strokeColor(EMERALD).lineWidth(2).stroke();

    const casillasDefinidas: Array<{ num: string; desc: string; valor: number }> = [
      { num: "001", desc: "Rendimientos íntegros del trabajo", valor: datos.resultado.ingresos_brutos || 0 },
      { num: "003", desc: "Reducción por rendimientos del trabajo", valor: datos.resultado.reduccion_trabajo || 0 },
      { num: "007", desc: "Reducción por planes de pensiones", valor: 0 },
      { num: "011", desc: "Base imponible general", valor: datos.resultado.base_imponible_general || 0 },
      { num: "019", desc: "Cuota íntegra estatal", valor: (datos.resultado.cuota_integra_total || 0) / 2 },
      { num: "020", desc: "Cuota íntegra autonómica", valor: (datos.resultado.cuota_integra_total || 0) / 2 },
      { num: "545", desc: "Deducción por inversión en vivienda habitual", valor: datos.resultado.casillas?.["545"] || 0 },
      { num: "547", desc: "Deducción por maternidad", valor: datos.resultado.casillas?.["547"] || 0 },
      { num: "563", desc: "Deducción por familia numerosa", valor: datos.resultado.casillas?.["563"] || 0 },
      { num: "588", desc: "Deducción por discapacidad", valor: datos.resultado.casillas?.["588"] || 0 },
      { num: "590", desc: "Deducción por donativos", valor: datos.resultado.casillas?.["590"] || 0 },
      { num: "620", desc: "Cuota líquida total", valor: datos.resultado.cuota_liquida || 0 },
      { num: "621", desc: "Retenciones e ingresos a cuenta del trabajo", valor: datos.resultado.retenciones || 0 },
      { num: "670", desc: "RESULTADO DE LA DECLARACIÓN", valor: resultadoOptimizado },
    ];

    let yPos = casillasY + 25;
    const lineHeight = 22;

    // Cabecera tabla
    doc.rect(50, yPos, 495, 18).fill(NAVY);
    doc
      .fillColor("white")
      .font("Helvetica-Bold")
      .fontSize(9)
      .text("CASILLA", 55, yPos + 5)
      .text("CONCEPTO", 110, yPos + 5)
      .text("IMPORTE (€)", 430, yPos + 5);

    yPos += 18;

    casillasDefinidas.forEach((casilla, i) => {
      const bgColor = i % 2 === 0 ? "white" : LIGHT_GRAY;
      const isTotal = casilla.num === "670";

      if (isTotal) {
        doc.rect(50, yPos, 495, lineHeight).fill("#1a365d");
        doc.fillColor("white").font("Helvetica-Bold").fontSize(10);
      } else {
        doc.rect(50, yPos, 495, lineHeight).fill(bgColor);
        doc.fillColor(GRAY).font("Helvetica").fontSize(9);
      }

      doc.text(casilla.num, 55, yPos + 7);
      doc.text(casilla.desc, 110, yPos + 7, { width: 310 });

      const valorStr = casilla.valor.toLocaleString("es-ES", { minimumFractionDigits: 2 });
      const colorValor = isTotal
        ? "white"
        : casilla.valor < 0
          ? EMERALD
          : casilla.valor > 0
            ? "#374151"
            : GRAY;

      doc.fillColor(colorValor).text(valorStr, 430, yPos + 7, { width: 110, align: "right" });

      yPos += lineHeight;
    });

    // ============================================================
    // DEDUCCIONES APLICADAS
    // ============================================================
    if (datos.resultado.desglose_deducciones && datos.resultado.desglose_deducciones.length > 0) {
      yPos += 15;

      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
      }

      doc
        .fillColor(NAVY)
        .font("Helvetica-Bold")
        .fontSize(13)
        .text("DEDUCCIONES APLICADAS", 50, yPos);

      doc.moveTo(50, yPos + 16).lineTo(545, yPos + 16).strokeColor(EMERALD).lineWidth(2).stroke();
      yPos += 25;

      datos.resultado.desglose_deducciones.forEach((d, i) => {
        const bgColor = i % 2 === 0 ? "white" : LIGHT_GRAY;
        doc.rect(50, yPos, 495, 20).fill(bgColor);
        doc.fillColor(GRAY).font("Helvetica").fontSize(9);
        doc.text(d.concepto, 55, yPos + 6, { width: 380 });
        doc
          .fillColor(EMERALD)
          .font("Helvetica-Bold")
          .text(
            `-${d.importe.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`,
            430, yPos + 6,
            { width: 110, align: "right" }
          );
        yPos += 20;
      });
    }

    // ============================================================
    // PIE DE PÁGINA
    // ============================================================
    const pageHeight = doc.page.height;
    doc.rect(0, pageHeight - 60, 595, 60).fill(LIGHT_GRAY);
    doc
      .fillColor(GRAY)
      .font("Helvetica")
      .fontSize(8)
      .text(
        "Este informe es orientativo y no constituye una declaración oficial. Los valores son estimaciones basadas en los datos proporcionados.",
        50, pageHeight - 50,
        { width: 495, align: "center" }
      );
    doc
      .fillColor(NAVY)
      .font("Helvetica-Bold")
      .fontSize(8)
      .text("Renta Fácil TPymes | www.rentafacil.es | info@rentafacil.es", 50, pageHeight - 35, {
        width: 495,
        align: "center",
      });

    doc.end();
  });
}
