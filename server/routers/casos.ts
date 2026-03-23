/**
 * Router de casos para el Panel del Asesor
 * 
 * Lee los casos del Google Sheet via:
 * 1. API directa de Google Sheets (si GOOGLE_SHEETS_API_KEY y GOOGLE_SHEETS_ID están configurados)
 * 2. Webhook de n8n como intermediario (si VITE_WEBHOOK_N8N está configurado)
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface CasoGoogleSheets {
  id: string;
  nombre: string;
  email: string;
  nif: string;
  comunidad: string;
  situacion: string;
  ingresos: string;
  fecha: string;
  estado: string;
  // Nuevos campos del pagador (añadidos en el formulario ampliado)
  nifPagador?: string;
  nombreEmpresa?: string;
  telefono?: string;
  numPagadores?: string;
  tieneInmuebles?: string;
  tieneActividad?: string;
  // Fila en el sheet (para actualizar estado)
  rowIndex?: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Lee los casos directamente del Google Sheet usando la API de Google Sheets v4
 * Requiere: GOOGLE_SHEETS_API_KEY y GOOGLE_SHEETS_ID
 */
async function leerDesdeGoogleSheetsDirecto(): Promise<CasoGoogleSheets[]> {
  const apiKey = ENV.googleSheetsApiKey;
  const sheetId = ENV.googleSheetsId;
  
  if (!apiKey || !sheetId) {
    throw new Error("Google Sheets no configurado: falta GOOGLE_SHEETS_API_KEY o GOOGLE_SHEETS_ID");
  }

  // Leer el rango A:Z de la primera hoja
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:Z?key=${apiKey}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Error al leer Google Sheets: ${response.status} - ${text}`);
  }

  const data = await response.json() as { values?: string[][] };
  
  if (!data.values || data.values.length < 2) {
    return [];
  }

  // Primera fila = cabeceras
  const headers = data.values[0].map((h: string) => h.toLowerCase().trim());
  
  // Mapear columnas por nombre
  const col = (name: string) => headers.indexOf(name);
  
  // Columnas esperadas en el Google Sheet (ajustar según el sheet real)
  const idCol = col("id") !== -1 ? col("id") : col("expediente");
  const nombreCol = col("nombre") !== -1 ? col("nombre") : col("nombre completo");
  const emailCol = col("email") !== -1 ? col("email") : col("correo");
  const nifCol = col("nif") !== -1 ? col("nif") : col("dni");
  const comunidadCol = col("comunidad") !== -1 ? col("comunidad") : col("comunidad autónoma");
  const situacionCol = col("situacion") !== -1 ? col("situacion") : col("situación laboral");
  const ingresosCol = col("ingresos") !== -1 ? col("ingresos") : col("tramo de ingresos");
  const fechaCol = col("fecha") !== -1 ? col("fecha") : col("fecha envío");
  const estadoCol = col("estado") !== -1 ? col("estado") : col("estado del caso");
  const nifPagadorCol = col("nif pagador") !== -1 ? col("nif pagador") : col("nif empresa");
  const nombreEmpresaCol = col("nombre empresa") !== -1 ? col("nombre empresa") : col("empresa pagadora");
  const telefonoCol = col("telefono") !== -1 ? col("telefono") : col("teléfono");
  const numPagadoresCol = col("num pagadores") !== -1 ? col("num pagadores") : col("número de pagadores");
  const tieneInmueblesCol = col("tiene inmuebles") !== -1 ? col("tiene inmuebles") : col("inmuebles alquilados");
  const tieneActividadCol = col("tiene actividad") !== -1 ? col("tiene actividad") : col("actividad económica");

  const casos: CasoGoogleSheets[] = [];
  
  for (let i = 1; i < data.values.length; i++) {
    const row = data.values[i];
    if (!row || row.length === 0) continue;
    
    const nombre = nombreCol >= 0 ? (row[nombreCol] ?? "") : "";
    if (!nombre) continue; // Saltar filas vacías
    
    casos.push({
      id: idCol >= 0 ? (row[idCol] ?? `RENTA-2025-${i}`) : `RENTA-2025-${i}`,
      nombre,
      email: emailCol >= 0 ? (row[emailCol] ?? "") : "",
      nif: nifCol >= 0 ? (row[nifCol] ?? "") : "",
      comunidad: comunidadCol >= 0 ? (row[comunidadCol] ?? "") : "",
      situacion: situacionCol >= 0 ? (row[situacionCol] ?? "") : "",
      ingresos: ingresosCol >= 0 ? (row[ingresosCol] ?? "") : "",
      fecha: fechaCol >= 0 ? (row[fechaCol] ?? "") : "",
      estado: estadoCol >= 0 ? (row[estadoCol] ?? "Pendiente") : "Pendiente",
      nifPagador: nifPagadorCol >= 0 ? (row[nifPagadorCol] ?? "") : "",
      nombreEmpresa: nombreEmpresaCol >= 0 ? (row[nombreEmpresaCol] ?? "") : "",
      telefono: telefonoCol >= 0 ? (row[telefonoCol] ?? "") : "",
      numPagadores: numPagadoresCol >= 0 ? (row[numPagadoresCol] ?? "1") : "1",
      tieneInmuebles: tieneInmueblesCol >= 0 ? (row[tieneInmueblesCol] ?? "No") : "No",
      tieneActividad: tieneActividadCol >= 0 ? (row[tieneActividadCol] ?? "No") : "No",
      rowIndex: i + 1, // 1-indexed para la API de Sheets
    });
  }
  
  return casos;
}

/**
 * Lee los casos via webhook de n8n
 * n8n se encarga de leer el Google Sheet y devolver los datos en JSON
 */
async function leerDesdeN8nWebhook(): Promise<CasoGoogleSheets[]> {
  const webhookUrl = ENV.n8nWebhookUrl;
  
  if (!webhookUrl) {
    throw new Error("n8n webhook no configurado: falta VITE_WEBHOOK_N8N");
  }

  // Construir URL del webhook de lectura (añadir sufijo /leer-casos si es necesario)
  // El webhook de n8n puede ser el mismo con un parámetro action=read
  const url = webhookUrl.includes("?") 
    ? `${webhookUrl}&action=read_cases`
    : `${webhookUrl}?action=read_cases`;

  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Error al leer casos via n8n: ${response.status}`);
  }

  const data = await response.json();
  
  // n8n puede devolver array directo o { casos: [...] }
  const rawCasos = Array.isArray(data) ? data : (data.casos ?? data.data ?? []);
  
  return rawCasos.map((item: any, i: number) => ({
    id: item.id ?? item.expediente ?? `RENTA-2025-${i}`,
    nombre: item.nombre ?? item["Nombre completo"] ?? "",
    email: item.email ?? item.Email ?? "",
    nif: item.nif ?? item.NIF ?? item.DNI ?? "",
    comunidad: item.comunidad ?? item.Comunidad ?? "",
    situacion: item.situacion ?? item["Situación laboral"] ?? "",
    ingresos: item.ingresos ?? item["Tramo de ingresos"] ?? "",
    fecha: item.fecha ?? item.Fecha ?? "",
    estado: item.estado ?? item.Estado ?? "Pendiente",
    nifPagador: item.nifPagador ?? item["NIF Pagador"] ?? item["NIF empresa"] ?? "",
    nombreEmpresa: item.nombreEmpresa ?? item["Nombre empresa"] ?? item["Empresa pagadora"] ?? "",
    telefono: item.telefono ?? item.Teléfono ?? "",
    numPagadores: item.numPagadores ?? item["Número de pagadores"] ?? "1",
    tieneInmuebles: item.tieneInmuebles ?? item["Inmuebles alquilados"] ?? "No",
    tieneActividad: item.tieneActividad ?? item["Actividad económica"] ?? "No",
    rowIndex: item.rowIndex ?? i + 2,
  }));
}

// ── Router ─────────────────────────────────────────────────────────────────

export const casosRouter = router({
  /**
   * Obtener todos los casos del Google Sheet
   * Intenta primero la API directa, luego n8n como fallback
   */
  list: publicProcedure
    .input(z.object({
      filtroEstado: z.string().optional(),
      busqueda: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      let casos: CasoGoogleSheets[] = [];
      let fuente: "google_sheets" | "n8n" | "mock" = "mock";
      let error: string | null = null;

      // Intentar Google Sheets directo primero
      if (ENV.googleSheetsApiKey && ENV.googleSheetsId) {
        try {
          casos = await leerDesdeGoogleSheetsDirecto();
          fuente = "google_sheets";
        } catch (e) {
          error = `Google Sheets directo: ${e instanceof Error ? e.message : String(e)}`;
          console.error("[casos.list] Error Google Sheets:", error);
        }
      }

      // Si no hay datos, intentar via n8n
      if (casos.length === 0 && ENV.n8nWebhookUrl) {
        try {
          casos = await leerDesdeN8nWebhook();
          fuente = "n8n";
          error = null;
        } catch (e) {
          const n8nError = `n8n webhook: ${e instanceof Error ? e.message : String(e)}`;
          console.error("[casos.list] Error n8n:", n8nError);
          error = error ? `${error}; ${n8nError}` : n8nError;
        }
      }

      // Aplicar filtros
      if (input?.filtroEstado && input.filtroEstado !== "todos") {
        casos = casos.filter(c => c.estado === input.filtroEstado);
      }
      
      if (input?.busqueda) {
        const q = input.busqueda.toLowerCase();
        casos = casos.filter(c => 
          c.nombre.toLowerCase().includes(q) ||
          c.nif.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
        );
      }

      return {
        casos,
        fuente,
        error,
        total: casos.length,
        configurado: !!(ENV.googleSheetsApiKey || ENV.n8nWebhookUrl),
      };
    }),

  /**
   * Actualizar el estado de un caso en Google Sheets
   * Usa n8n webhook para escribir de vuelta al sheet
   */
  updateEstado: publicProcedure
    .input(z.object({
      casoId: z.string(),
      nuevoEstado: z.enum(["Pendiente", "En proceso", "Completado", "Cancelado"]),
      rowIndex: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      if (!ENV.n8nWebhookUrl) {
        return { success: false, error: "n8n webhook no configurado" };
      }

      try {
        const response = await fetch(ENV.n8nWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update_estado",
            casoId: input.casoId,
            nuevoEstado: input.nuevoEstado,
            rowIndex: input.rowIndex,
          }),
        });

        if (!response.ok) {
          return { success: false, error: `Error ${response.status}` };
        }

        return { success: true };
      } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : String(e) };
      }
    }),
});
