/**
 * Handler: POST /api/generate-xml
 * Generador de XML interno para exportación MOTOE / pre-volcado PADRE 2025.
 *
 * IMPORTANTE: Este XML es para uso interno (MOTOE, staging, revisión de asesor).
 * NO es el XML homologado AEAT para presentación telemática directa.
 * Para presentación oficial, usar Renta WEB Open con apoderamiento.
 *
 * INTEGRACIÓN:
 *  Registrar en server/_core/index.ts:
 *    import { handleGenerateXml } from "../generateXml";
 *    app.post("/api/generate-xml", express.json(), requireInternalKey, handleGenerateXml);
 *
 * VARIABLES DE ENTORNO:
 *  INTERNAL_API_KEY — clave para autenticar llamadas internas (n8n, panel asesor)
 */

import { Request, Response } from "express";
import { getDb } from "./db";
import { declaraciones } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// ============================================================
// TIPOS
// ============================================================

interface DatosContribuyente {
  nif: string;
  nombre_completo: string;
  comunidad_autonoma: string;
  ingresos_totales?: number;
  retenciones_totales?: number;
  vivienda_pre2013?: boolean;
  base_deduccion_vivienda?: number;
  hijos_num?: number;
  discapacidad_pct?: number;
  donaciones_importe?: number;
  regimen_autonomo?: string;
  tipo_contribuyente?: string;
  varios_pagadores?: boolean;
  segundo_pagador_importe?: number;
  tiene_capital_mobiliario?: boolean;
  importe_capital_mobiliario?: number;
  tiene_capital_inmobiliario?: boolean;
  importe_capital_inmobiliario?: number;
  tiene_ganancias_patrimoniales?: boolean;
  tiene_imputacion_rentas?: boolean;
}

interface Expediente {
  expediente_id: string;
  contacto: {
    nombre: string;
    email: string;
    telefono?: string | null;
  };
  datos_contribuyente: DatosContribuyente;
  plan_code?: string;
  precio?: number | null;
  estado?: string;
}

interface CasillaEntry {
  campo: string;
  casilla: number;
  rango: string;
  valor: string | number | boolean;
  fuente: "calculado" | "usuario" | "importacion_aeat";
}

interface ValidationResult {
  campo: string;
  casilla: number;
  ok: boolean;
  mensaje: string;
}

// ============================================================
// MAPA PADRE 2025 (casillas principales)
// ============================================================

const PADRE_MAP: Record<string, { principal: number; rango: string }> = {
  rendimiento_trabajo:          { principal: 3,   rango: "3-25" },
  retenciones_trabajo:          { principal: 596, rango: "596-599" },
  retenciones_totales:          { principal: 609, rango: "596-609" },
  rendimiento_capital_mobiliario: { principal: 27,  rango: "27-60" },
  rendimiento_capital_inmobiliario: { principal: 102, rango: "61-156" },
  imputacion_rentas_inmobiliarias: { principal: 89,  rango: "83-89" },
  rendimiento_actividades_directa: { principal: 171, rango: "165-200" },
  rendimiento_actividades_objetiva: { principal: 201, rango: "201-240" },
  ganancias_patrimoniales:      { principal: 316, rango: "310-425" },
  base_imponible_general:       { principal: 435, rango: "432-471" },
  minimos_familiares:           { principal: 505, rango: "505-514" },
  discapacidad_minimo:          { principal: 511, rango: "511-513" },
  deduccion_vivienda_pre2013:   { principal: 547, rango: "547-549" },
  donaciones_importe:           { principal: 750, rango: "750-759" },
  pagos_fraccionados:           { principal: 604, rango: "604-605" },
  resultado_economico:          { principal: 610, rango: "595-695" },
  fraccionamiento_60pct:        { principal: 671, rango: "671-672" },
};

// ============================================================
// ESCAPE XML
// ============================================================

function escapeXml(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ============================================================
// CONSTRUCCIÓN DE CASILLAS
// ============================================================

function buildCasillas(expediente: Expediente): CasillaEntry[] {
  const d = expediente.datos_contribuyente;
  const casillas: CasillaEntry[] = [];

  // Rendimientos del trabajo
  if ((d.ingresos_totales || 0) > 0 && d.tipo_contribuyente !== "autonomo") {
    casillas.push({
      campo: "rendimiento_trabajo",
      casilla: PADRE_MAP.rendimiento_trabajo.principal,
      rango: PADRE_MAP.rendimiento_trabajo.rango,
      valor: Number(d.ingresos_totales || 0),
      fuente: "usuario",
    });
  }

  // Retenciones totales
  if ((d.retenciones_totales || 0) > 0) {
    casillas.push({
      campo: "retenciones_totales",
      casilla: PADRE_MAP.retenciones_totales.principal,
      rango: PADRE_MAP.retenciones_totales.rango,
      valor: Number(d.retenciones_totales || 0),
      fuente: "usuario",
    });
  }

  // Capital mobiliario
  if (d.tiene_capital_mobiliario && (d.importe_capital_mobiliario || 0) > 0) {
    casillas.push({
      campo: "rendimiento_capital_mobiliario",
      casilla: PADRE_MAP.rendimiento_capital_mobiliario.principal,
      rango: PADRE_MAP.rendimiento_capital_mobiliario.rango,
      valor: Number(d.importe_capital_mobiliario || 0),
      fuente: "usuario",
    });
  }

  // Capital inmobiliario
  if (d.tiene_capital_inmobiliario && (d.importe_capital_inmobiliario || 0) > 0) {
    casillas.push({
      campo: "rendimiento_capital_inmobiliario",
      casilla: PADRE_MAP.rendimiento_capital_inmobiliario.principal,
      rango: PADRE_MAP.rendimiento_capital_inmobiliario.rango,
      valor: Number(d.importe_capital_inmobiliario || 0),
      fuente: "usuario",
    });
  }

  // Actividades económicas
  if (d.regimen_autonomo && d.regimen_autonomo !== "ninguno") {
    const mapKey =
      d.regimen_autonomo === "estimacion_objetiva"
        ? "rendimiento_actividades_objetiva"
        : "rendimiento_actividades_directa";
    casillas.push({
      campo: mapKey,
      casilla: PADRE_MAP[mapKey].principal,
      rango: PADRE_MAP[mapKey].rango,
      valor: Number(d.ingresos_totales || 0),
      fuente: "usuario",
    });
    if ((d.retenciones_totales || 0) > 0) {
      casillas.push({
        campo: "pagos_fraccionados",
        casilla: PADRE_MAP.pagos_fraccionados.principal,
        rango: PADRE_MAP.pagos_fraccionados.rango,
        valor: Number(d.retenciones_totales || 0),
        fuente: "usuario",
      });
    }
  }

  // Deducción vivienda pre-2013
  if (d.vivienda_pre2013) {
    const base = Math.min(d.base_deduccion_vivienda || 9040, 9040);
    casillas.push({
      campo: "deduccion_vivienda_pre2013",
      casilla: PADRE_MAP.deduccion_vivienda_pre2013.principal,
      rango: PADRE_MAP.deduccion_vivienda_pre2013.rango,
      valor: base,
      fuente: "usuario",
    });
  }

  // Mínimos familiares (hijos)
  if ((d.hijos_num || 0) > 0) {
    casillas.push({
      campo: "minimos_familiares",
      casilla: PADRE_MAP.minimos_familiares.principal,
      rango: PADRE_MAP.minimos_familiares.rango,
      valor: Number(d.hijos_num || 0),
      fuente: "usuario",
    });
  }

  // Discapacidad
  if ((d.discapacidad_pct || 0) >= 33) {
    casillas.push({
      campo: "discapacidad_minimo",
      casilla: PADRE_MAP.discapacidad_minimo.principal,
      rango: PADRE_MAP.discapacidad_minimo.rango,
      valor: Number(d.discapacidad_pct || 0),
      fuente: "usuario",
    });
  }

  // Donativos
  if ((d.donaciones_importe || 0) > 0) {
    casillas.push({
      campo: "donaciones_importe",
      casilla: PADRE_MAP.donaciones_importe.principal,
      rango: PADRE_MAP.donaciones_importe.rango,
      valor: Number(d.donaciones_importe || 0),
      fuente: "usuario",
    });
  }

  return casillas;
}

// ============================================================
// VALIDACIONES
// ============================================================

function validateCasillas(
  casillas: CasillaEntry[],
  d: DatosContribuyente
): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const c of casillas) {
    let ok = true;
    let mensaje = "OK";

    // Validar que los valores numéricos son positivos
    if (typeof c.valor === "number" && c.valor < 0) {
      ok = false;
      mensaje = `Valor negativo no permitido: ${c.valor}`;
    }

    // Validar límite base deducción vivienda
    if (c.campo === "deduccion_vivienda_pre2013" && Number(c.valor) > 9040) {
      ok = false;
      mensaje = `Base deducción vivienda supera el límite legal de 9.040€ (valor: ${c.valor}€)`;
    }

    // Validar que retenciones no superan ingresos
    if (
      c.campo === "retenciones_totales" &&
      Number(c.valor) > (d.ingresos_totales || 0)
    ) {
      ok = false;
      mensaje = `Retenciones (${c.valor}€) superan los ingresos totales (${d.ingresos_totales}€) — revisar`;
    }

    // Advertencia: discapacidad sin certificado
    if (c.campo === "discapacidad_minimo" && Number(c.valor) >= 33) {
      mensaje = `Requiere certificado de discapacidad para validar tramo (${c.valor}%)`;
    }

    results.push({ campo: c.campo, casilla: c.casilla, ok, mensaje });
  }

  return results;
}

// ============================================================
// GENERADOR XML
// ============================================================

function buildXml(
  expediente: Expediente,
  casillas: CasillaEntry[],
  generatedAt: string
): string {
  const d = expediente.datos_contribuyente;
  const casillaNodes = casillas
    .map(
      (c) => `
    <casilla numero="${c.casilla}" rango="${c.rango}" fuente="${c.fuente}">
      <campo>${escapeXml(c.campo)}</campo>
      <valor>${escapeXml(c.valor)}</valor>
    </casilla>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!--
  XML INTERNO MOTOE — Renta Fácil TPymes
  Ejercicio: 2025 | Modelo: 100
  Generado: ${generatedAt}
  ADVERTENCIA: Este XML es para uso interno y revisión de asesor.
  NO es el XML homologado AEAT para presentación telemática directa.
  Para presentación oficial, usar Renta WEB Open con apoderamiento.
-->
<declaracion ejercicio="2025" modelo="100" tipo="borrador_interno">
  <meta>
    <expediente_id>${escapeXml(expediente.expediente_id)}</expediente_id>
    <plan_code>${escapeXml(expediente.plan_code || "DESCONOCIDO")}</plan_code>
    <estado>${escapeXml(expediente.estado || "pendiente")}</estado>
    <generado_en>${escapeXml(generatedAt)}</generado_en>
    <borrador_source>interno</borrador_source>
  </meta>
  <contribuyente>
    <nif>${escapeXml(d.nif)}</nif>
    <nombre>${escapeXml(d.nombre_completo)}</nombre>
    <comunidad_autonoma>${escapeXml(d.comunidad_autonoma)}</comunidad_autonoma>
    <tipo_contribuyente>${escapeXml(d.tipo_contribuyente || "trabajador")}</tipo_contribuyente>
    <regimen_autonomo>${escapeXml(d.regimen_autonomo || "ninguno")}</regimen_autonomo>
  </contribuyente>
  <contacto>
    <email>${escapeXml(expediente.contacto.email)}</email>
    <telefono>${escapeXml(expediente.contacto.telefono || "")}</telefono>
    <nombre>${escapeXml(expediente.contacto.nombre)}</nombre>
  </contacto>
  <casillas total="${casillas.length}">${casillaNodes}
  </casillas>
</declaracion>`;
}

// ============================================================
// MIDDLEWARE: verificar clave interna
// ============================================================

export function requireInternalKey(
  req: Request,
  res: Response,
  next: () => void
): void {
  const internalKey = process.env.INTERNAL_API_KEY || process.env.INTERNAL_WORKFLOW_KEY;
  if (!internalKey) {
    // Si no hay clave configurada, permitir en desarrollo
    if (process.env.NODE_ENV === "development") {
      next();
      return;
    }
    res.status(503).json({ ok: false, error: "Internal API not configured" });
    return;
  }

  const provided =
    req.headers["x-internal-key"] || req.headers["X-Internal-Key"];
  if (provided !== internalKey) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  next();
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================

export async function handleGenerateXml(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body;

    if (!body?.expediente_id) {
      res.status(400).json({ ok: false, error: "expediente_id requerido" });
      return;
    }

    // Intentar cargar desde BD si solo se pasa el ID
    let expediente: Expediente | null = null;

    if (body.datos_contribuyente) {
      // Payload completo enviado directamente (desde n8n o panel asesor)
      expediente = body as Expediente;
    } else {
      // Cargar desde BD por expedienteId
      const db = await getDb();
      if (!db) {
        res.status(500).json({ ok: false, error: "Database not available" });
        return;
      }

      const [row] = await db
        .select()
        .from(declaraciones)
        .where(eq(declaraciones.expedienteId, body.expediente_id));

      if (!row) {
        res.status(404).json({ ok: false, error: "Expediente no encontrado" });
        return;
      }

      const datos = row.datosContribuyente as any || {};
      const contribuyente = datos.contribuyente || datos;

      expediente = {
        expediente_id: row.expedienteId,
        contacto: {
          nombre: contribuyente.nombre || contribuyente.nombre_completo || "",
          email: row.emailContacto || contribuyente.email || "",
          telefono: row.telefonoContacto || contribuyente.telefono || null,
        },
        datos_contribuyente: {
          nif: contribuyente.nif || "",
          nombre_completo: contribuyente.nombre || contribuyente.nombre_completo || "",
          comunidad_autonoma: contribuyente.comunidad_autonoma || contribuyente.comunidad || "",
          ingresos_totales: Number(datos.ingresos_brutos || datos.ingresos_totales || 0),
          retenciones_totales: Number(datos.retenciones || datos.retenciones_totales || 0),
          vivienda_pre2013: Boolean(datos.vivienda_pre2013 || datos.compra_vivienda),
          base_deduccion_vivienda: Number(datos.vivienda_precio || 9040),
          hijos_num: Number(datos.n_hijos || datos.hijos_num || 0),
          discapacidad_pct: Number(contribuyente.porcentaje_discapacidad || datos.discapacidad_pct || 0),
          donaciones_importe: Number(datos.importe_donaciones || datos.donaciones_importe || 0),
          regimen_autonomo: datos.regimen_autonomo || "ninguno",
          tipo_contribuyente: datos.situacion?.toLowerCase() || "trabajador",
          varios_pagadores: Boolean(datos.mas_de_un_pagador || datos.varios_pagadores),
          segundo_pagador_importe: Number(datos.segundo_pagador_importe || 0),
        },
        plan_code: row.esComplejo ? "COMPLEJA" : "SIMPLE",
        precio: row.precioTotal ? row.precioTotal / 100 : null,
        estado: row.estado,
      };
    }

    const generatedAt = new Date().toISOString();
    const casillas = buildCasillas(expediente);
    const validaciones = validateCasillas(casillas, expediente.datos_contribuyente);
    const xml = buildXml(expediente, casillas, generatedAt);
    const xml_base64 = Buffer.from(xml, "utf-8").toString("base64");

    const hayErrores = validaciones.some((v) => !v.ok);

    console.log(
      `[/api/generate-xml] Expediente ${expediente.expediente_id} | ` +
      `${casillas.length} casillas | ${hayErrores ? "CON ERRORES" : "OK"}`
    );

    res.json({
      ok: true,
      expediente_id: expediente.expediente_id,
      xml_base64,
      xml_preview: xml.substring(0, 500) + "...",
      casillas_mapeadas: casillas,
      validaciones,
      hay_errores: hayErrores,
      generado_en: generatedAt,
      advertencia: "XML para uso interno MOTOE. No usar para presentación oficial AEAT.",
    });
  } catch (error: any) {
    console.error("[/api/generate-xml] Error:", error);
    res.status(500).json({ ok: false, error: "Error generando XML" });
  }
}
