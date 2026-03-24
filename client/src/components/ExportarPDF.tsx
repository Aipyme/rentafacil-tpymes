/**
 * ExportarPDF — Genera un PDF resumen del caso para el asesor
 *
 * Usa jsPDF para generar un documento con:
 * - Datos del cliente (nombre, NIF, email, teléfono, comunidad)
 * - Datos de la declaración (tipo, plan, precio, complejidad)
 * - Estado de gestión (asesor, prioridad, fechas, resultado)
 * - Lista de documentos aportados
 * - Firma digital (si existe)
 * - Observaciones del asesor
 */

import { useState } from "react";
import jsPDF from "jspdf";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CasoData {
  id: string;
  nombre: string;
  nif: string;
  email: string;
  telefono?: string;
  comunidadAutonoma?: string;
  tipo?: string;
  plan?: string;
  precio?: string;
  complejidad?: string;
  estado?: string;
  prioridad?: string;
  asesorAsignado?: string;
  notasAsesor?: string;
  fechaContacto?: string;
  fechaRevision?: string;
  resultadoFinal?: string;
  importeResultado?: string;
  fechaPresentacion?: string;
  observaciones?: string;
  documentosNecesarios?: string;
  documentosRecibidos?: string;
}

interface ExportarPDFProps {
  caso: CasoData;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export default function ExportarPDF({ caso, variant = "outline", size = "sm" }: ExportarPDFProps) {
  const [generando, setGenerando] = useState(false);

  // Obtener documentos del caso
  const { data: docsData } = trpc.documentos.listar.useQuery(
    { casoId: caso.id },
    { enabled: !!caso.id }
  );

  // Obtener firma del caso
  const { data: firmaData } = trpc.firmas.obtenerParaAsesor.useQuery(
    { casoId: caso.id },
    { enabled: !!caso.id }
  );

  const handleExportar = async () => {
    setGenerando(true);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentW = pageW - margin * 2;
      let y = margin;

      // ── Colores ──
      const navy = [26, 54, 93] as [number, number, number];
      const emerald = [5, 150, 105] as [number, number, number];
      const gray = [107, 114, 128] as [number, number, number];
      const lightGray = [243, 244, 246] as [number, number, number];

      // ── Cabecera ──
      doc.setFillColor(...navy);
      doc.rect(0, 0, pageW, 40, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Renta Fácil TPymes", margin, 17);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Informe de Caso — Declaración de la Renta 2025", margin, 25);
      doc.setFontSize(8);
      doc.setTextColor(200, 220, 240);
      doc.text(`Generado el ${new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`, margin, 33);

      // ID del caso (derecha)
      doc.setFontSize(9);
      doc.setTextColor(180, 210, 240);
      doc.text(caso.id, pageW - margin, 17, { align: "right" });

      y = 52;

      // ── Helper: sección ──
      const drawSection = (title: string) => {
        doc.setFillColor(...lightGray);
        doc.rect(margin, y, contentW, 8, "F");
        doc.setTextColor(...navy);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(title, margin + 3, y + 5.5);
        y += 12;
      };

      // ── Helper: fila de datos ──
      const drawRow = (label: string, value: string, highlight = false) => {
        if (y > pageH - 30) {
          doc.addPage();
          y = margin;
        }
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...gray);
        doc.text(label + ":", margin, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(highlight ? emerald[0] : 30, highlight ? emerald[1] : 30, highlight ? emerald[2] : 30);
        const lines = doc.splitTextToSize(value, contentW - 55);
        doc.text(lines, margin + 55, y);
        y += Math.max(6, lines.length * 5);
      };

      // ── Datos del cliente ──
      drawSection("DATOS DEL CLIENTE");
      drawRow("Nombre completo", caso.nombre);
      drawRow("NIF / NIE", caso.nif?.toUpperCase() || "—");
      drawRow("Email", caso.email || "—");
      if (caso.telefono) drawRow("Teléfono", caso.telefono);
      if (caso.comunidadAutonoma) drawRow("Comunidad Autónoma", caso.comunidadAutonoma);
      y += 4;

      // ── Datos de la declaración ──
      drawSection("DATOS DE LA DECLARACIÓN");
      if (caso.tipo) drawRow("Tipo de declaración", caso.tipo);
      if (caso.plan) drawRow("Plan contratado", caso.plan);
      if (caso.precio) drawRow("Precio", `${caso.precio} €`);
      if (caso.complejidad) drawRow("Complejidad", caso.complejidad);
      y += 4;

      // ── Estado de gestión ──
      drawSection("ESTADO DE GESTIÓN");
      drawRow("Estado", caso.estado || "Pendiente");
      if (caso.prioridad) drawRow("Prioridad", caso.prioridad);
      if (caso.asesorAsignado) drawRow("Asesor asignado", caso.asesorAsignado);
      if (caso.fechaContacto) drawRow("Fecha de contacto", caso.fechaContacto);
      if (caso.fechaRevision) drawRow("Fecha de revisión", caso.fechaRevision);
      if (caso.resultadoFinal) drawRow("Resultado final", caso.resultadoFinal, true);
      if (caso.importeResultado) drawRow("Importe", `${caso.importeResultado} €`, true);
      if (caso.fechaPresentacion) drawRow("Fecha de presentación", caso.fechaPresentacion);
      y += 4;

      // ── Documentos aportados ──
      drawSection("DOCUMENTOS APORTADOS");
      const docs = docsData?.documentos || [];
      if (docs.length === 0) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(...gray);
        doc.text("No hay documentos aportados", margin, y);
        y += 6;
      } else {
        const docsPorTipo = { asesor: docs.filter(d => d.subidoPor === "asesor"), cliente: docs.filter(d => d.subidoPor === "cliente") };
        if (docsPorTipo.cliente.length > 0) {
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...gray);
          doc.text("Documentos del cliente:", margin, y);
          y += 5;
          docsPorTipo.cliente.forEach(d => {
            if (y > pageH - 30) { doc.addPage(); y = margin; }
            doc.setFont("helvetica", "normal");
            doc.setTextColor(50, 50, 50);
            doc.text(`• ${d.nombreArchivo}${d.categoria ? ` (${d.categoria})` : ""}`, margin + 3, y);
            y += 5;
          });
        }
        if (docsPorTipo.asesor.length > 0) {
          y += 2;
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...gray);
          doc.text("Documentos del asesor:", margin, y);
          y += 5;
          docsPorTipo.asesor.forEach(d => {
            if (y > pageH - 30) { doc.addPage(); y = margin; }
            doc.setFont("helvetica", "normal");
            doc.setTextColor(50, 50, 50);
            doc.text(`• ${d.nombreArchivo}${d.categoria ? ` (${d.categoria})` : ""}`, margin + 3, y);
            y += 5;
          });
        }
      }
      y += 4;

      // ── Firma digital ──
      if (firmaData?.firma) {
        drawSection("AUTORIZACIÓN FIRMADA DIGITALMENTE");
        const firma = firmaData.firma;
        drawRow("Firmante", `${caso.nombre} (${caso.nif?.toUpperCase()})`);
        drawRow("Fecha de firma", new Date(firma.fecha).toLocaleDateString("es-ES", {
          day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
        }));
        if (firma.ip) drawRow("IP registrada", firma.ip);

        // Insertar imagen de la firma
        try {
          const response = await fetch(firma.firmaUrl);
          const blob = await response.blob();
          const reader = new FileReader();
          await new Promise<void>((resolve) => {
            reader.onload = () => {
              if (reader.result && typeof reader.result === "string") {
                if (y > pageH - 50) { doc.addPage(); y = margin; }
                doc.addImage(reader.result, "PNG", margin, y, 60, 20);
                y += 25;
              }
              resolve();
            };
            reader.readAsDataURL(blob);
          });
        } catch {
          // Si no se puede cargar la imagen, continuar sin ella
          drawRow("Firma URL", firma.firmaUrl);
        }
        y += 4;
      }

      // ── Observaciones ──
      if (caso.observaciones || caso.notasAsesor) {
        drawSection("NOTAS Y OBSERVACIONES");
        if (caso.notasAsesor) drawRow("Notas del asesor", caso.notasAsesor);
        if (caso.observaciones) drawRow("Observaciones", caso.observaciones);
        y += 4;
      }

      // ── Pie de página ──
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(...lightGray);
        doc.rect(0, pageH - 12, pageW, 12, "F");
        doc.setFontSize(7);
        doc.setTextColor(...gray);
        doc.setFont("helvetica", "normal");
        doc.text("Renta Fácil TPymes · Documento confidencial · Uso interno", margin, pageH - 5);
        doc.text(`Página ${i} de ${totalPages}`, pageW - margin, pageH - 5, { align: "right" });
      }

      // ── Descargar ──
      const fileName = `caso-${caso.id}-${caso.nombre.replace(/\s+/g, "-").toLowerCase()}.pdf`;
      doc.save(fileName);
      toast.success("PDF generado correctamente");
    } catch (e) {
      console.error("[ExportarPDF] Error:", e);
      toast.error("Error al generar el PDF. Inténtalo de nuevo.");
    } finally {
      setGenerando(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExportar}
      disabled={generando}
      className="gap-2"
    >
      {generando ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Generando PDF...
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4" />
          Exportar PDF
        </>
      )}
    </Button>
  );
}
