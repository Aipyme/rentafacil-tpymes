/**
 * Router tRPC: xml.generateXml
 * Genera el XML Modelo 100 para un expediente, lo sube a R2 y devuelve URL firmada.
 *
 * Input:  { expedienteId: string }
 * Output: { xmlUrl: string; checksum: string; key: string }
 *
 * Protegido con protectedProcedure (requiere sesión de usuario).
 * Para uso interno desde el panel del asesor.
 */

import { z } from "zod";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import path, { join } from "path";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { declaraciones } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { storagePut, storageGet } from "../storage";
import type { RespuestasSimulador } from "../lib/motorFiscal";

// ── Carga de la plantilla XML ──────────────────────────────────────────────

import { fileURLToPath } from "url";
const __filename_xml = fileURLToPath(import.meta.url);
const __dirname_xml = path.dirname(__filename_xml);

const TEMPLATE_PATH = join(
  __dirname_xml,
  "../lib/xml_templates/modelo100_2025.xml"
);

let _templateCache: string | null = null;
function getTemplate(): string {
  if (!_templateCache) {
    try {
      _templateCache = readFileSync(TEMPLATE_PATH, "utf-8");
    } catch {
      // Ruta alternativa para cuando compilado en dist/
      const altPath = join(
        process.cwd(),
        "server/lib/xml_templates/modelo100_2025.xml"
      );
      _templateCache = readFileSync(altPath, "utf-8");
    }
  }
  return _templateCache;
}

// ── Escape XML ────────────────────────────────────────────────────────────

function escapeXml(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ── Renderizar plantilla ─────────────────────────────────────────────────

interface TemplateVars {
  contribuyente: {
    nif: string;
    nombre: string;
    apellidos: string;
  };
  casillas: Record<string, number>;
  consentimiento: {
    timestamp: string;
    ip: string;
  };
}

function renderTemplate(template: string, vars: TemplateVars): string {
  // Reemplaza todos los {{path}} usando acceso seguro de propiedades anidadas
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path: string) => {
    const parts = path.trim().split(".");
    let value: unknown = vars;
    for (const part of parts) {
      if (value == null || typeof value !== "object") return "0";
      value = (value as Record<string, unknown>)[part];
    }
    return escapeXml(value ?? "0");
  });
}

// ── Extraer datos desde el expediente ────────────────────────────────────

function buildTemplateVars(
  declaracion: {
    expedienteId: string;
    datosContribuyente: unknown;
    resultadoCalculo: unknown;
    emailContacto: string | null;
  }
): TemplateVars {
  const datos = (declaracion.datosContribuyente as RespuestasSimulador) || {};
  const resultado = (declaracion.resultadoCalculo as { casillas?: Record<string, number> }) || {};
  const contribuyente = datos.contribuyente || {};

  // Casillas del motor fiscal (ya calculadas) o ceros
  const casillasMotor: Record<string, number> = resultado.casillas || {};

  // Mapeamos las casillas al formato que espera la plantilla
  const casillas: Record<string, number> = {};
  for (const [key, val] of Object.entries(casillasMotor)) {
    casillas[key] = typeof val === "number" ? Math.round(val * 100) / 100 : 0;
  }

  return {
    contribuyente: {
      nif: escapeXml(contribuyente.nif || ""),
      nombre: escapeXml(contribuyente.nombre || ""),
      apellidos: escapeXml(contribuyente.apellidos || ""),
    },
    casillas,
    consentimiento: {
      timestamp: new Date().toISOString(),
      ip: "",
    },
  };
}

// ── Router ────────────────────────────────────────────────────────────────

export const xmlRouter = router({
  /**
   * Genera el XML Modelo 100 para un expediente dado.
   * Sube el archivo a R2 en declaraciones/{expedienteId}/modelo100.xml
   * y registra xmlUrl + xmlChecksum en el JSON de resultadoCalculo.
   * Devuelve una presigned URL de descarga (1h de validez).
   */
  generateXml: protectedProcedure
    .input(
      z.object({
        expedienteId: z.string().min(1, "expedienteId requerido"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Base de datos no disponible",
        });
      }

      // 1. Cargar el expediente
      const [row] = await db
        .select()
        .from(declaraciones)
        .where(eq(declaraciones.expedienteId, input.expedienteId))
        .limit(1);

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Expediente ${input.expedienteId} no encontrado`,
        });
      }

      // 2. Construir variables de plantilla
      const templateVars = buildTemplateVars({
        expedienteId: row.expedienteId,
        datosContribuyente: row.datosContribuyente,
        resultadoCalculo: row.resultadoCalculo,
        emailContacto: row.emailContacto ?? null,
      });

      // 3. Renderizar la plantilla XML
      const template = getTemplate();
      const xmlContent = renderTemplate(template, templateVars);

      // 4. Calcular checksum SHA-256
      const checksum = createHash("sha256")
        .update(xmlContent, "utf-8")
        .digest("hex");

      // 5. Subir a R2/S3
      const s3Key = `declaraciones/${input.expedienteId}/modelo100.xml`;
      const { url: cdnUrl } = await storagePut(
        s3Key,
        Buffer.from(xmlContent, "utf-8"),
        "application/xml"
      );

      // 6. Obtener presigned URL para descarga
      const { url: presignedUrl } = await storageGet(s3Key, 3600);

      // 7. Registrar xmlUrl + xmlChecksum en el campo resultadoCalculo (JSON)
      const resultadoActual =
        (row.resultadoCalculo as Record<string, unknown>) || {};
      const resultadoActualizado = {
        ...resultadoActual,
        xmlUrl: cdnUrl,
        xmlKey: s3Key,
        xmlChecksum: checksum,
        xmlGeneradoEn: new Date().toISOString(),
      };

      await db
        .update(declaraciones)
        .set({
          resultadoCalculo: resultadoActualizado,
        })
        .where(eq(declaraciones.expedienteId, input.expedienteId));

      console.log(
        `[xml.generateXml] Expediente ${input.expedienteId} | key=${s3Key} | sha256=${checksum.substring(0, 12)}...`
      );

      return {
        ok: true,
        expedienteId: input.expedienteId,
        xmlUrl: presignedUrl,
        xmlKey: s3Key,
        checksum,
        generadoEn: new Date().toISOString(),
      };
    }),
});
