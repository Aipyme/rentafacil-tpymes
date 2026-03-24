/**
 * Router de casos para el Panel del Asesor
 *
 * Lee los casos del Google Sheet via API directa (GOOGLE_SHEETS_API_KEY + GOOGLE_SHEETS_ID)
 * con fallback a webhook de n8n.
 *
 * Columnas de gestión (BA-BJ) — escritura via Service Account o n8n:
 *   BA: prioridad         BB: asesorAsignado    BC: notasAsesor
 *   BD: documentosRecibidos  BE: fechaContacto  BF: fechaRevision
 *   BG: resultadoFinal    BH: importeResultado  BI: fechaPresentacion
 *   BJ: observaciones
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
  // Datos del pagador
  nifPagador?: string;
  nombreEmpresa?: string;
  telefono?: string;
  numPagadores?: string;
  tieneInmuebles?: string;
  tieneActividad?: string;
  // Datos de clasificación IA
  complejidad?: string;
  plan?: string;
  precio?: string;
  // Columnas de gestión del asesor (BA-BJ)
  prioridad?: string;
  asesorAsignado?: string;
  notasAsesor?: string;
  documentosRecibidos?: string;
  fechaContacto?: string;
  fechaRevision?: string;
  resultadoFinal?: string;
  importeResultado?: string;
  fechaPresentacion?: string;
  observaciones?: string;
  // Control de recordatorios
  ultimoRecordatorio?: string;
  // Fila en el sheet (para actualizar)
  rowIndex?: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function leerDesdeGoogleSheetsDirecto(): Promise<CasoGoogleSheets[]> {
  const apiKey = ENV.googleSheetsApiKey;
  const sheetId = ENV.googleSheetsId;

  if (!apiKey || !sheetId) {
    throw new Error("Google Sheets no configurado: falta GOOGLE_SHEETS_API_KEY o GOOGLE_SHEETS_ID");
  }

  // Leer hasta la columna AZ (incluye ultimoRecordatorio en AY)
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:AZ?key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Error al leer Google Sheets: ${response.status} - ${text}`);
  }

  const data = await response.json() as { values?: string[][] };

  if (!data.values || data.values.length < 2) {
    return [];
  }

  const headers = data.values[0].map((h: string) => h.toLowerCase().trim());
  const col = (name: string) => headers.indexOf(name.toLowerCase());

  // Columnas de datos del formulario
  const idCol         = col("id_caso") !== -1 ? col("id_caso") : col("expedienteid");
  const nombreCol     = col("nombrecompleto") !== -1 ? col("nombrecompleto") : col("nombre");
  const emailCol      = col("email");
  const nifCol        = col("nif");
  const comunidadCol  = col("comunidadautonoma") !== -1 ? col("comunidadautonoma") : col("comunidad");
  const situacionCol  = col("situacionlaboral") !== -1 ? col("situacionlaboral") : col("tipo");
  const ingresosCol   = col("ingresosBrutos") !== -1 ? col("ingresosBrutos") : col("rendimientostrabajo");
  const fechaCol      = col("timestamp") !== -1 ? col("timestamp") : col("fecha_creacion");
  const estadoCol     = col("estado");
  const nifPagadorCol     = col("nifpagador");
  const nombreEmpresaCol  = col("nombreempresa");
  const telefonoCol       = col("telefono");
  const numPagadoresCol   = col("numpagadores");
  const tieneInmueblesCol = col("tieneinmueblesalquilados") !== -1 ? col("tieneinmueblesalquilados") : col("tieneinmuebles");
  const tieneActividadCol = col("tieneactividadeconomica") !== -1 ? col("tieneactividadeconomica") : col("tieneactividad");
  const complejidadCol    = col("complejidad");
  const planCol           = col("plan");
  const precioCol         = col("precio");

  // Columnas de gestión del asesor (BA-BJ)
  const prioridadCol          = col("prioridad");
  const asesorAsignadoCol     = col("asesorasignado");
  const notasAsesorCol        = col("notasasesor");
  const documentosRecibidosCol = col("documentosrecibidos");
  const fechaContactoCol      = col("fechacontacto");
  const fechaRevisionCol      = col("fecharevision");
  const resultadoFinalCol     = col("resultadofinal");
  const importeResultadoCol   = col("importeresultado");
  const fechaPresentacionCol  = col("fechapresentacion");
  const observacionesCol          = col("observaciones");
  const ultimoRecordatorioCol     = col("ultimorecordatorio");

  const casos: CasoGoogleSheets[] = [];

  for (let i = 1; i < data.values.length; i++) {
    const row = data.values[i];
    if (!row || row.length === 0) continue;

    const nombre = nombreCol >= 0 ? (row[nombreCol] ?? "") : "";
    if (!nombre) continue;

    casos.push({
      id:        idCol >= 0 ? (row[idCol] ?? `RENTA-2025-${i}`) : `RENTA-2025-${i}`,
      nombre,
      email:     emailCol >= 0 ? (row[emailCol] ?? "") : "",
      nif:       nifCol >= 0 ? (row[nifCol] ?? "") : "",
      comunidad: comunidadCol >= 0 ? (row[comunidadCol] ?? "") : "",
      situacion: situacionCol >= 0 ? (row[situacionCol] ?? "") : "",
      ingresos:  ingresosCol >= 0 ? (row[ingresosCol] ?? "") : "",
      fecha:     fechaCol >= 0 ? (row[fechaCol] ?? "") : "",
      estado:    estadoCol >= 0 ? (row[estadoCol] ?? "Pendiente") : "Pendiente",
      nifPagador:    nifPagadorCol >= 0 ? (row[nifPagadorCol] ?? "") : "",
      nombreEmpresa: nombreEmpresaCol >= 0 ? (row[nombreEmpresaCol] ?? "") : "",
      telefono:      telefonoCol >= 0 ? (row[telefonoCol] ?? "") : "",
      numPagadores:  numPagadoresCol >= 0 ? (row[numPagadoresCol] ?? "1") : "1",
      tieneInmuebles: tieneInmueblesCol >= 0 ? (row[tieneInmueblesCol] ?? "No") : "No",
      tieneActividad: tieneActividadCol >= 0 ? (row[tieneActividadCol] ?? "No") : "No",
      complejidad: complejidadCol >= 0 ? (row[complejidadCol] ?? "") : "",
      plan:        planCol >= 0 ? (row[planCol] ?? "") : "",
      precio:      precioCol >= 0 ? (row[precioCol] ?? "") : "",
      // Columnas de gestión
      prioridad:          prioridadCol >= 0 ? (row[prioridadCol] ?? "") : "",
      asesorAsignado:     asesorAsignadoCol >= 0 ? (row[asesorAsignadoCol] ?? "") : "",
      notasAsesor:        notasAsesorCol >= 0 ? (row[notasAsesorCol] ?? "") : "",
      documentosRecibidos: documentosRecibidosCol >= 0 ? (row[documentosRecibidosCol] ?? "") : "",
      fechaContacto:      fechaContactoCol >= 0 ? (row[fechaContactoCol] ?? "") : "",
      fechaRevision:      fechaRevisionCol >= 0 ? (row[fechaRevisionCol] ?? "") : "",
      resultadoFinal:     resultadoFinalCol >= 0 ? (row[resultadoFinalCol] ?? "") : "",
      importeResultado:   importeResultadoCol >= 0 ? (row[importeResultadoCol] ?? "") : "",
      fechaPresentacion:  fechaPresentacionCol >= 0 ? (row[fechaPresentacionCol] ?? "") : "",
      observaciones:      observacionesCol >= 0 ? (row[observacionesCol] ?? "") : "",
      ultimoRecordatorio: ultimoRecordatorioCol >= 0 ? (row[ultimoRecordatorioCol] ?? "") : "",
      rowIndex: i + 1,
    });
  }

  return casos;
}

async function leerDesdeN8nWebhook(): Promise<CasoGoogleSheets[]> {
  const webhookUrl = ENV.n8nWebhookUrl;
  if (!webhookUrl) throw new Error("n8n webhook no configurado");

  const url = webhookUrl.includes("?")
    ? `${webhookUrl}&action=read_cases`
    : `${webhookUrl}?action=read_cases`;

  const response = await fetch(url, { method: "GET", headers: { "Content-Type": "application/json" } });
  if (!response.ok) throw new Error(`Error al leer casos via n8n: ${response.status}`);

  const data = await response.json();
  const rawCasos = Array.isArray(data) ? data : (data.casos ?? data.data ?? []);

  return rawCasos.map((item: Record<string, string>, i: number) => ({
    id:       item.id ?? item.expediente ?? `RENTA-2025-${i}`,
    nombre:   item.nombre ?? item["Nombre completo"] ?? "",
    email:    item.email ?? item.Email ?? "",
    nif:      item.nif ?? item.NIF ?? item.DNI ?? "",
    comunidad: item.comunidad ?? item.Comunidad ?? "",
    situacion: item.situacion ?? item["Situación laboral"] ?? "",
    ingresos:  item.ingresos ?? item["Tramo de ingresos"] ?? "",
    fecha:     item.fecha ?? item.Fecha ?? "",
    estado:    item.estado ?? item.Estado ?? "Pendiente",
    nifPagador:    item.nifPagador ?? "",
    nombreEmpresa: item.nombreEmpresa ?? "",
    telefono:      item.telefono ?? "",
    numPagadores:  item.numPagadores ?? "1",
    tieneInmuebles: item.tieneInmuebles ?? "No",
    tieneActividad: item.tieneActividad ?? "No",
    complejidad: item.complejidad ?? "",
    plan:        item.plan ?? "",
    precio:      item.precio ?? "",
    prioridad:          item.prioridad ?? "",
    asesorAsignado:     item.asesorAsignado ?? "",
    notasAsesor:        item.notasAsesor ?? "",
    documentosRecibidos: item.documentosRecibidos ?? "",
    fechaContacto:      item.fechaContacto ?? "",
    fechaRevision:      item.fechaRevision ?? "",
    resultadoFinal:     item.resultadoFinal ?? "",
    importeResultado:   item.importeResultado ?? "",
    fechaPresentacion:  item.fechaPresentacion ?? "",
    observaciones:      item.observaciones ?? "",
    ultimoRecordatorio: item.ultimoRecordatorio ?? "",
    rowIndex: item.rowIndex ? Number(item.rowIndex) : i + 2,
  }));
}

// ── Router ─────────────────────────────────────────────────────────────────

export const casosRouter = router({
  /**
   * Obtener todos los casos del Google Sheet
   */
  list: publicProcedure
    .input(z.object({
      filtroEstado: z.string().optional(),
      busqueda: z.string().optional(),
      filtroPrioridad: z.string().optional(),
      filtroAsesor: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      let casos: CasoGoogleSheets[] = [];
      let fuente: "google_sheets" | "n8n" | "mock" = "mock";
      let error: string | null = null;

      if (ENV.googleSheetsApiKey && ENV.googleSheetsId) {
        try {
          casos = await leerDesdeGoogleSheetsDirecto();
          fuente = "google_sheets";
        } catch (e) {
          error = `Google Sheets: ${e instanceof Error ? e.message : String(e)}`;
          console.error("[casos.list] Error Google Sheets:", error);
        }
      }

      if (casos.length === 0 && ENV.n8nWebhookUrl) {
        try {
          casos = await leerDesdeN8nWebhook();
          fuente = "n8n";
          error = null;
        } catch (e) {
          const n8nError = `n8n: ${e instanceof Error ? e.message : String(e)}`;
          console.error("[casos.list] Error n8n:", n8nError);
          error = error ? `${error}; ${n8nError}` : n8nError;
        }
      }

      // Aplicar filtros
      if (input?.filtroEstado && input.filtroEstado !== "todos") {
        casos = casos.filter(c => c.estado === input.filtroEstado);
      }
      if (input?.filtroPrioridad && input.filtroPrioridad !== "todas") {
        casos = casos.filter(c => c.prioridad === input.filtroPrioridad);
      }
      if (input?.filtroAsesor && input.filtroAsesor !== "todos") {
        casos = casos.filter(c => c.asesorAsignado === input.filtroAsesor);
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

      // Ordenar: Alta prioridad primero, luego por fecha desc
      casos.sort((a, b) => {
        const prioridadOrden: Record<string, number> = { "Alta": 0, "Media": 1, "Baja": 2, "": 3 };
        const pa = prioridadOrden[a.prioridad ?? ""] ?? 3;
        const pb = prioridadOrden[b.prioridad ?? ""] ?? 3;
        if (pa !== pb) return pa - pb;
        return (b.fecha ?? "").localeCompare(a.fecha ?? "");
      });

      return {
        casos,
        fuente,
        error,
        total: casos.length,
        configurado: !!(ENV.googleSheetsApiKey || ENV.n8nWebhookUrl),
      };
    }),

  /**
   * Actualizar campos de gestión de un caso via n8n webhook
   * (notas, prioridad, asesor, documentos, fechas, resultado, etc.)
   */
  updateGestion: publicProcedure
    .input(z.object({
      casoId: z.string(),
      rowIndex: z.number().optional(),
      campos: z.object({
        estado: z.enum(["Pendiente", "En proceso", "Completado", "Cancelado", "Revisión pendiente", "Documentación pendiente"]).optional(),
        prioridad: z.enum(["Alta", "Media", "Baja"]).optional(),
        asesorAsignado: z.string().optional(),
        notasAsesor: z.string().optional(),
        documentosRecibidos: z.string().optional(),
        fechaContacto: z.string().optional(),
        fechaRevision: z.string().optional(),
        resultadoFinal: z.enum(["A devolver", "A ingresar", "Negativo/cero"]).optional(),
        importeResultado: z.string().optional(),
        fechaPresentacion: z.string().optional(),
        observaciones: z.string().optional(),
        ultimoRecordatorio: z.string().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const updateUrl = ENV.n8nUpdateWebhookUrl || ENV.n8nWebhookUrl;
      if (!updateUrl) {
        return { success: false, error: "n8n webhook no configurado — no se puede escribir en el Sheet" };
      }

      try {
        const response = await fetch(updateUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_caso: input.casoId,
            rowIndex: input.rowIndex,
            ...input.campos,
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

  /**
   * Actualizar el estado de un caso (shortcut del updateGestion)
   */
  updateEstado: publicProcedure
    .input(z.object({
      casoId: z.string(),
      nuevoEstado: z.enum(["Pendiente", "En proceso", "Completado", "Cancelado", "Revisión pendiente", "Documentación pendiente"]),
      rowIndex: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const updateUrl = ENV.n8nUpdateWebhookUrl || ENV.n8nWebhookUrl;
      if (!updateUrl) {
        return { success: false, error: "n8n webhook no configurado" };
      }

      try {
        const response = await fetch(updateUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_caso: input.casoId,
            estado: input.nuevoEstado,
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

  /**
   * Notificar al asesor responsable por email cuando un caso pasa a "Revisión pendiente"
   * Dispara un webhook de n8n que envía el email.
   */
  notificarRevisionPendiente: publicProcedure
    .input(z.object({
      casoId: z.string(),
      nombreCliente: z.string(),
      emailCliente: z.string(),
      nifCliente: z.string(),
      asesorAsignado: z.string().optional(),
      notasAsesor: z.string().optional(),
      comunidad: z.string().optional(),
      complejidad: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      if (!ENV.n8nWebhookUrl) {
        // Sin n8n, usamos notifyOwner como fallback
        return { success: false, error: "n8n webhook no configurado" };
      }

      try {
        const response = await fetch(ENV.n8nWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "notificar_revision_pendiente",
            casoId: input.casoId,
            nombreCliente: input.nombreCliente,
            emailCliente: input.emailCliente,
            nifCliente: input.nifCliente,
            asesorAsignado: input.asesorAsignado ?? "Sin asignar",
            notasAsesor: input.notasAsesor ?? "",
            comunidad: input.comunidad ?? "",
            complejidad: input.complejidad ?? "",
            timestamp: new Date().toISOString(),
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

  /**
   * Obtener lista de asesores únicos del Sheet (para el filtro)
   */
  listarAsesores: publicProcedure
    .query(async () => {
      if (!ENV.googleSheetsApiKey || !ENV.googleSheetsId) {
        return { asesores: [] as string[] };
      }
      try {
        const casos = await leerDesdeGoogleSheetsDirecto();
        const asesores = Array.from(new Set(
          casos
            .map(c => c.asesorAsignado ?? "")
            .filter(Boolean)
        )).sort();
        return { asesores };
      } catch {
        return { asesores: [] as string[] };
      }
    }),

  /**
   * Listar casos pendientes de documentación para el recordatorio automático de n8n.
   * Devuelve solo los casos con estado "Documentación pendiente" que llevan más de N días
   * sin haber recibido un recordatorio hoy.
   * Este endpoint es público para que n8n pueda consultarlo sin autenticación.
   */
  listarParaRecordatorio: publicProcedure
    .input(z.object({
      diasMinimos: z.number().default(3),
    }).optional())
    .query(async ({ input }) => {
      const diasMinimos = input?.diasMinimos ?? 3;
      let casos: CasoGoogleSheets[] = [];

      if (ENV.googleSheetsApiKey && ENV.googleSheetsId) {
        try {
          casos = await leerDesdeGoogleSheetsDirecto();
        } catch {
          // silencioso
        }
      }

      const ahora = new Date();
      const hoyStr = ahora.toISOString().split("T")[0]; // YYYY-MM-DD

      const casosParaRecordar = casos.filter(c => {
        // Solo casos en estado "Documentación pendiente"
        if (c.estado !== "Documentación pendiente") return false;

        // No enviar si ya se envió un recordatorio hoy
        if (c.ultimoRecordatorio) {
          const fechaUltimoRecordatorio = c.ultimoRecordatorio.split("T")[0];
          if (fechaUltimoRecordatorio === hoyStr) return false;
        }

        // Verificar que lleva más de N días en este estado
        const fechaContacto = c.fechaContacto || c.fecha;
        if (!fechaContacto) return true; // Sin fecha, incluir por seguridad

        try {
          const fechaInicio = new Date(fechaContacto);
          const diasTranscurridos = (ahora.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24);
          return diasTranscurridos >= diasMinimos;
        } catch {
          return false;
        }
      });

      return {
        casos: casosParaRecordar.map(c => ({
          id_caso: c.id,
          nombreCompleto: c.nombre,
          email: c.email,
          nif: c.nif,
          telefono: c.telefono,
          documentosNecesarios: (c as any).documentosNecesarios ?? "",
          estado: c.estado,
          rowIndex: c.rowIndex,
        })),
        total: casosParaRecordar.length,
        fecha: hoyStr,
      };
    }),

  /**
   * Buscar un caso por su ID (para la página de seguimiento del cliente)
   * No devuelve datos sensibles internos del asesor.
   */
  buscarPorId: publicProcedure
    .input(z.object({ casoId: z.string() }))
    .mutation(async ({ input }) => {
      let casos: CasoGoogleSheets[] = [];

      if (ENV.googleSheetsApiKey && ENV.googleSheetsId) {
        try {
          casos = await leerDesdeGoogleSheetsDirecto();
        } catch {
          // silencioso
        }
      }

      if (casos.length === 0 && ENV.n8nWebhookUrl) {
        try {
          casos = await leerDesdeN8nWebhook();
        } catch {
          // silencioso
        }
      }

      const caso = casos.find(c => c.id.toUpperCase() === input.casoId.toUpperCase());

      if (!caso) {
        return { caso: null };
      }

      // Devolver solo los campos que el cliente puede ver (no notas internas del asesor)
      return {
        caso: {
          id: caso.id,
          nombre: caso.nombre,
          email: caso.email,
          nif: caso.nif,
          telefono: caso.telefono,
          comunidad: caso.comunidad,
          estado: caso.estado,
          asesorAsignado: caso.asesorAsignado,
          resultadoFinal: caso.resultadoFinal,
          importeResultado: caso.importeResultado,
          fechaPresentacion: caso.fechaPresentacion,
          // Mensaje público del asesor al cliente (observaciones)
          observaciones: caso.observaciones,
          // Documentos necesarios para que el cliente sepa qué aportar
          documentosNecesarios: (caso as any).documentosNecesarios,
        },
      };
    }),
});
