/**
 * Panel del Asesor — Renta Fácil TPymes
 *
 * Protegido con contraseña (PANEL_PASSWORD).
 * Carga casos reales del Google Sheet via tRPC → Google Sheets API.
 *
 * Columnas de gestión (BA-BJ del Sheet):
 *   prioridad, asesorAsignado, notasAsesor, documentosRecibidos,
 *   fechaContacto, fechaRevision, resultadoFinal, importeResultado,
 *   fechaPresentacion, observaciones
 */

import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DocumentosPanel from "@/components/DocumentosPanel";
import ExportarPDF from "@/components/ExportarPDF";
import PanelDeclaraciones from "@/components/PanelDeclaraciones";

// Tipo local del caso (espejo de server/routers/casos.ts)
interface CasoGoogleSheets {
  id: string;
  nombre: string;
  email: string;
  nif: string;
  comunidad: string;
  situacion: string;
  ingresos: string;
  fecha: string;
  estado: string;
  nifPagador?: string;
  nombreEmpresa?: string;
  telefono?: string;
  numPagadores?: string;
  tieneInmuebles?: string;
  tieneActividad?: string;
  complejidad?: string;
  plan?: string;
  precio?: string;
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
  rowIndex?: number;
}

// ── Constantes ─────────────────────────────────────────────────────────────

const ESTADOS = ["Pendiente", "En proceso", "Revisión pendiente", "Documentación pendiente", "Completado", "Cancelado"] as const;
const PRIORIDADES = ["Alta", "Media", "Baja"] as const;
const RESULTADOS_FINALES = ["A devolver", "A ingresar", "Negativo/cero"] as const;

const ESTADO_COLORES: Record<string, string> = {
  "Pendiente": "bg-yellow-100 text-yellow-800",
  "En proceso": "bg-blue-100 text-blue-800",
  "Revisión pendiente": "bg-orange-100 text-orange-800",
  "Documentación pendiente": "bg-purple-100 text-purple-800",
  "Completado": "bg-green-100 text-green-800",
  "Cancelado": "bg-gray-100 text-gray-500",
};

const PRIORIDAD_COLORES: Record<string, string> = {
  "Alta": "bg-red-500",
  "Media": "bg-yellow-400",
  "Baja": "bg-green-400",
  "": "bg-gray-200",
};

const DOCUMENTOS_LISTA = [
  "DNI/NIE",
  "Borrador AEAT",
  "Certificado empresa",
  "Certificado pensión",
  "Escritura vivienda",
  "Recibos hipoteca",
  "Certificado banco",
  "Modelo 720",
  "Certificado donativos",
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function exportarCSV(casos: CasoGoogleSheets[]) {
  const cabeceras = [
    "ID", "Nombre", "NIF", "Email", "Teléfono", "Comunidad",
    "Situación", "Ingresos", "Empresa pagadora", "NIF Pagador",
    "Num. Pagadores", "Inmuebles", "Actividad", "Complejidad", "Plan", "Precio",
    "Estado", "Prioridad", "Asesor", "Notas", "Docs recibidos",
    "Fecha contacto", "Fecha revisión", "Resultado final", "Importe",
    "Fecha presentación", "Observaciones", "Fecha registro",
  ];
  const filas = casos.map(c => [
    c.id, c.nombre, c.nif, c.email, c.telefono ?? "",
    c.comunidad, c.situacion, c.ingresos,
    c.nombreEmpresa ?? "", c.nifPagador ?? "",
    c.numPagadores ?? "", c.tieneInmuebles ?? "", c.tieneActividad ?? "",
    c.complejidad ?? "", c.plan ?? "", c.precio ?? "",
    c.estado, c.prioridad ?? "", c.asesorAsignado ?? "",
    c.notasAsesor ?? "", c.documentosRecibidos ?? "",
    c.fechaContacto ?? "", c.fechaRevision ?? "",
    c.resultadoFinal ?? "", c.importeResultado ?? "",
    c.fechaPresentacion ?? "", c.observaciones ?? "", c.fecha,
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));

  const csv = [cabeceras.join(","), ...filas].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `casos-renta-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function generarTokenDiario(password: string): string {
  const hoy = new Date().toISOString().slice(0, 10);
  return btoa(`${password}:${hoy}`);
}

// ── Componente principal ────────────────────────────────────────────────────

export default function PanelAsesor() {
  // Auth
  const [panelToken, setPanelToken] = useState<string | null>(null);
  const [tokenVerificado, setTokenVerificado] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroPrioridad, setFiltroPrioridad] = useState("todas");
  const [filtroAsesor, setFiltroAsesor] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [busquedaNif, setBusquedaNif] = useState("");
  const [busquedaEmpresa, setBusquedaEmpresa] = useState("");

  // Caso seleccionado
  const [casoSeleccionado, setCasoSeleccionado] = useState<CasoGoogleSheets | null>(null);

  // Edición de campos de gestión
  const [editando, setEditando] = useState(false);
  const [camposEdit, setCamposEdit] = useState<Partial<CasoGoogleSheets>>({});

  // Vista
  const [vistaTabla, setVistaTabla] = useState(false);
  // Sección activa: "sheet" = casos del Google Sheet | "declaraciones" = simulador IRPF
  const [seccionActiva, setSeccionActiva] = useState<"sheet" | "declaraciones">("sheet");

  // Verificar token al cargar
  useEffect(() => {
    const token = sessionStorage.getItem("panel_token");
    if (token) {
      setPanelToken(token);
    }
    setTokenVerificado(true);
  }, []);

  // Verificar contraseña via tRPC
  const verificarPasswordMutation = trpc.panel.login.useMutation({
    onSuccess: (data: { success: boolean; token: string | null }) => {
      if (data.success && data.token) {
        sessionStorage.setItem("panel_token", data.token);
        setPanelToken(data.token);
        setLoginError("");
      } else {
        setLoginError("Contraseña incorrecta");
      }
    },
    onError: () => setLoginError("Error al verificar la contraseña"),
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) { setLoginError("Introduce la contraseña"); return; }
    verificarPasswordMutation.mutate({ password: passwordInput });
  };

  // Cargar casos
  const { data: casosData, isLoading, refetch } = trpc.casos.list.useQuery(
    { filtroEstado: "todos", busqueda: "" },
    { enabled: !!panelToken, refetchOnWindowFocus: false }
  );

  // Cargar lista de asesores para el filtro
  const { data: asesoresData } = trpc.casos.listarAsesores.useQuery(
    undefined,
    { enabled: !!panelToken, refetchOnWindowFocus: false }
  );
  const asesores = asesoresData?.asesores ?? [];

  // Conteo de documentos del cliente por caso (para badges en el sidebar)
  const todosLosCasoIds = useMemo(
    () => (casosData?.casos ?? []).map(c => c.id),
    [casosData]
  );
  const { data: conteosData } = trpc.documentos.contarPorCasos.useQuery(
    { casoIds: todosLosCasoIds },
    { enabled: !!panelToken && todosLosCasoIds.length > 0, refetchOnWindowFocus: false }
  );
  const conteosDocumentos: Record<string, number> = conteosData?.conteos ?? {};

  // Notificación por email al pasar a Revisión pendiente
  const notificarRevisionMutation = trpc.casos.notificarRevisionPendiente.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Notificación enviada al asesor por email");
      } else {
        toast.warning(`Cambio guardado, pero no se pudo enviar email: ${data.error}`);
      }
    },
    onError: () => toast.warning("Cambio guardado, pero no se pudo enviar la notificación"),
  });

  // Mutación de gestión
  const updateGestionMutation = trpc.casos.updateGestion.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Cambios guardados en el Sheet");
        refetch();
        setEditando(false);
      } else {
        toast.error(data.error ?? "Error al guardar");
      }
    },
    onError: () => toast.error("Error de conexión"),
  });

  // Mutation para eliminar caso
  const eliminarCasoMutation = trpc.casos.eliminar.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Caso eliminado del Sheet");
        setCasoSeleccionado(null);
        refetch();
      } else {
        toast.error(data.error ?? "Error al eliminar");
      }
    },
    onError: () => toast.error("Error de conexión al eliminar"),
  });
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);

  // Filtrado local
  const casos = useMemo(() => {
    let lista = casosData?.casos ?? [];
    if (filtroEstado !== "todos") lista = lista.filter(c => c.estado === filtroEstado);
    if (filtroPrioridad !== "todas") lista = lista.filter(c => c.prioridad === filtroPrioridad);
    if (filtroAsesor !== "todos") lista = lista.filter(c => c.asesorAsignado === filtroAsesor);
    if (busqueda) {
      const q = busqueda.toLowerCase();
      lista = lista.filter(c =>
        c.nombre.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    }
    if (busquedaNif) {
      const q = busquedaNif.toLowerCase().replace(/[\s-]/g, "");
      lista = lista.filter(c =>
        c.nif.toLowerCase().replace(/[\s-]/g, "").includes(q) ||
        (c.nifPagador ?? "").toLowerCase().replace(/[\s-]/g, "").includes(q)
      );
    }
    if (busquedaEmpresa) {
      const q = busquedaEmpresa.toLowerCase();
      lista = lista.filter(c =>
        (c.nombreEmpresa ?? "").toLowerCase().includes(q) ||
        (c.nifPagador ?? "").toLowerCase().includes(q)
      );
    }
    return lista;
  }, [casosData, filtroEstado, filtroPrioridad, filtroAsesor, busqueda, busquedaNif, busquedaEmpresa]);

  // Indicador de fuente de datos
  const fuente = useMemo(() => {
    if (!casosData) return null;
    if (casosData.fuente === "google_sheets") return { text: "Google Sheets", color: "text-green-600" };
    if (casosData.fuente === "n8n") return { text: "n8n webhook", color: "text-blue-600" };
    return { text: "Sin datos reales", color: "text-gray-400" };
  }, [casosData]);

  // Iniciar edición
  const iniciarEdicion = (caso: CasoGoogleSheets) => {
    setCamposEdit({
      estado: caso.estado as typeof ESTADOS[number],
      prioridad: caso.prioridad,
      asesorAsignado: caso.asesorAsignado,
      notasAsesor: caso.notasAsesor,
      documentosRecibidos: caso.documentosRecibidos,
      fechaContacto: caso.fechaContacto,
      fechaRevision: caso.fechaRevision,
      resultadoFinal: caso.resultadoFinal,
      importeResultado: caso.importeResultado,
      fechaPresentacion: caso.fechaPresentacion,
      observaciones: caso.observaciones,
    });
    setEditando(true);
  };

  const guardarEdicion = () => {
    if (!casoSeleccionado) return;
    const estadoAnterior = casoSeleccionado.estado;
    const nuevoEstado = camposEdit.estado;
    updateGestionMutation.mutate({
      casoId: casoSeleccionado.id,
      rowIndex: casoSeleccionado.rowIndex,
      campos: {
        estado: nuevoEstado as typeof ESTADOS[number] | undefined,
        prioridad: camposEdit.prioridad as typeof PRIORIDADES[number] | undefined,
        asesorAsignado: camposEdit.asesorAsignado,
        notasAsesor: camposEdit.notasAsesor,
        documentosRecibidos: camposEdit.documentosRecibidos,
        fechaContacto: camposEdit.fechaContacto,
        fechaRevision: camposEdit.fechaRevision,
        resultadoFinal: camposEdit.resultadoFinal as typeof RESULTADOS_FINALES[number] | undefined,
        importeResultado: camposEdit.importeResultado,
        fechaPresentacion: camposEdit.fechaPresentacion,
        observaciones: camposEdit.observaciones,
      },
    });
    // Disparar notificación por email si el estado cambia a "Revisión pendiente"
    if (nuevoEstado === "Revisión pendiente" && estadoAnterior !== "Revisión pendiente") {
      notificarRevisionMutation.mutate({
        casoId: casoSeleccionado.id,
        nombreCliente: casoSeleccionado.nombre,
        emailCliente: casoSeleccionado.email,
        nifCliente: casoSeleccionado.nif,
        asesorAsignado: camposEdit.asesorAsignado ?? casoSeleccionado.asesorAsignado,
        notasAsesor: camposEdit.notasAsesor ?? casoSeleccionado.notasAsesor,
        comunidad: casoSeleccionado.comunidad,
        complejidad: casoSeleccionado.complejidad,
      });
    }
  };

  // Toggle documento recibido
  const toggleDocumento = (doc: string) => {
    const actuales = (camposEdit.documentosRecibidos ?? "").split(",").map((d: string) => d.trim()).filter(Boolean);
    const nuevo = actuales.includes(doc)
      ? actuales.filter((d: string) => d !== doc).join(", ")
      : [...actuales, doc].join(", ");
    setCamposEdit((prev: Partial<CasoGoogleSheets>) => ({ ...prev, documentosRecibidos: nuevo }));
  };

  // ── Pantalla de login ──────────────────────────────────────────────────────

  if (!tokenVerificado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!panelToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a365d] to-[#0f2340] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Panel del Asesor</h1>
            <p className="text-sm text-gray-500 mt-1">Renta Fácil TPymes</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña de acceso</label>
              <input
                type="password"
                value={passwordInput}
                onChange={e => { setPasswordInput(e.target.value); setLoginError(""); }}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                autoFocus
              />
              {loginError && <p className="text-red-500 text-xs mt-1">{loginError}</p>}
            </div>
            <button
              type="submit"
              disabled={verificarPasswordMutation.isPending}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {verificarPasswordMutation.isPending ? "Verificando..." : "Acceder al panel"}
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-4">Acceso restringido · Solo asesores autorizados</p>
        </div>
      </div>
    );
  }

  // ── Panel principal ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">Panel del Asesor</h1>
            <p className="text-xs text-gray-400">Renta Fácil TPymes · Campaña 2025</p>
          </div>
          {/* Tabs de sección */}
          <div className="flex items-center gap-1 ml-4 border border-gray-200 rounded-lg p-0.5 bg-gray-50">
            <button
              onClick={() => setSeccionActiva("sheet")}
              className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
                seccionActiva === "sheet"
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              📋 Casos (Sheet)
            </button>
            <button
              onClick={() => setSeccionActiva("declaraciones")}
              className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
                seccionActiva === "declaraciones"
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              🧾 Declaraciones IRPF
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {seccionActiva === "sheet" && fuente && (
            <span className={`text-xs font-medium ${fuente.color} hidden sm:inline`}>
              ● {fuente.text}
            </span>
          )}
          {seccionActiva === "sheet" && (
            <>
              <button
                onClick={() => setVistaTabla(v => !v)}
                className="text-xs text-gray-500 hover:text-teal-600 border border-gray-200 px-2 py-1 rounded transition-colors"
                title={vistaTabla ? "Vista detalle" : "Vista tabla"}
              >
                {vistaTabla ? "☰ Detalle" : "⊞ Tabla"}
              </button>
              <button
                onClick={() => refetch()}
                className="text-xs text-gray-500 hover:text-teal-600 border border-gray-200 px-2 py-1 rounded transition-colors"
              >
                ↻ Actualizar
              </button>
              <button
                onClick={() => {
                  exportarCSV(casos);
                  toast.success(`CSV exportado: ${casos.length} casos`);
                }}
                className="text-xs text-gray-500 hover:text-teal-600 border border-gray-200 px-2 py-1 rounded transition-colors"
                title="Exportar a CSV"
              >
                ↓ CSV
              </button>
            </>
          )}
          <button
            onClick={() => {
              sessionStorage.removeItem("panel_token");
              setPanelToken(null);
            }}
            className="text-xs text-gray-500 hover:text-red-600 border border-gray-200 px-2 py-1 rounded transition-colors"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Sección: Declaraciones IRPF (simulador /renta) */}
      {seccionActiva === "declaraciones" && <PanelDeclaraciones />}

      {/* Sección: Casos Google Sheet */}
      {seccionActiva === "sheet" && vistaTabla ? (
        <div className="flex-1 overflow-auto p-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["ID", "Nombre", "NIF", "Comunidad", "Empresa", "Estado", "Prioridad", "Asesor", "Notas", "Resultado", "Importe", "Presentación"].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={11} className="px-3 py-8 text-center text-gray-400">Cargando...</td></tr>
                ) : casos.length === 0 ? (
                  <tr><td colSpan={11} className="px-3 py-8 text-center text-gray-400">Sin casos</td></tr>
                ) : casos.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => { setCasoSeleccionado(c); setVistaTabla(false); setEditando(false); }}
                    className="border-b border-gray-100 hover:bg-teal-50 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2 font-mono text-gray-500">{c.id}</td>
                    <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">{c.nombre}</td>
                    <td className="px-3 py-2 text-gray-600">{c.nif}</td>
                    <td className="px-3 py-2 text-gray-600">{c.comunidad}</td>
                    <td className="px-3 py-2 text-gray-600">{c.nombreEmpresa || "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${ESTADO_COLORES[c.estado] ?? "bg-gray-100 text-gray-600"}`}>
                        {c.estado}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {c.prioridad ? (
                        <span className={`inline-block w-2 h-2 rounded-full mr-1 ${PRIORIDAD_COLORES[c.prioridad]}`} />
                      ) : null}
                      {c.prioridad || "—"}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{c.asesorAsignado || "—"}</td>
                    <td className="px-3 py-2 max-w-[200px]">
                      {c.notasAsesor ? (
                        <span className="text-gray-600 text-xs line-clamp-2" title={c.notasAsesor}>{c.notasAsesor}</span>
                      ) : (
                        <span className="text-gray-300 italic text-xs">Sin notas</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{c.resultadoFinal || "—"}</td>
                    <td className="px-3 py-2 text-gray-600">{c.importeResultado ? `${c.importeResultado}€` : "—"}</td>
                    <td className="px-3 py-2 text-gray-600">{c.fechaPresentacion || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
            {/* Filtros */}
            <div className="p-3 border-b border-gray-100 space-y-2">
              <div className="flex items-center gap-1.5">
                <select
                  value={filtroEstado}
                  onChange={e => setFiltroEstado(e.target.value)}
                  className="flex-1 text-xs border border-gray-200 rounded px-1.5 py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="todos">Todos los estados</option>
                  {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                <select
                  value={filtroPrioridad}
                  onChange={e => setFiltroPrioridad(e.target.value)}
                  className="flex-1 text-xs border border-gray-200 rounded px-1.5 py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="todas">Todas las prioridades</option>
                  {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {/* Filtro por asesor */}
              <select
                value={filtroAsesor}
                onChange={e => setFiltroAsesor(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded px-1.5 py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="todos">Todos los asesores</option>
                {asesores.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              {/* Buscador por nombre/email */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar nombre, email..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 pl-7 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <svg className="absolute left-2 top-2 w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {busqueda && (
                  <button onClick={() => setBusqueda("")} className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600 text-sm">×</button>
                )}
              </div>
              {/* Buscador por NIF */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por NIF/CIF..."
                  value={busquedaNif}
                  onChange={e => setBusquedaNif(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 pl-7 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <svg className="absolute left-2 top-2 w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
                {busquedaNif && (
                  <button onClick={() => setBusquedaNif("")} className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600 text-sm">×</button>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filtrar por empresa..."
                  value={busquedaEmpresa}
                  onChange={e => setBusquedaEmpresa(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 pl-7 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <svg className="absolute left-2 top-2 w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {busquedaEmpresa && (
                  <button onClick={() => setBusquedaEmpresa("")} className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600 text-sm">×</button>
                )}
              </div>
              <p className="text-xs text-gray-400 text-right">{casos.length} caso{casos.length !== 1 ? "s" : ""}</p>
            </div>

            {/* Lista de casos */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-6 text-center">
                  <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Cargando casos...</p>
                </div>
              ) : casos.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-gray-400">Sin casos</p>
                </div>
              ) : (
                casos.map(caso => (
                  <button
                    key={caso.id}
                    onClick={() => { setCasoSeleccionado(caso); setEditando(false); }}
                    className={`w-full text-left px-3 py-3 border-b border-gray-100 hover:bg-teal-50 transition-colors ${casoSeleccionado?.id === caso.id ? "bg-teal-50 border-l-2 border-l-teal-500" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="text-xs font-semibold text-gray-900 truncate flex-1">{caso.nombre}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {(conteosDocumentos[caso.id] ?? 0) > 0 && (
                          <span
                            className="inline-flex items-center gap-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            title={`${conteosDocumentos[caso.id]} documento${conteosDocumentos[caso.id] !== 1 ? 's' : ''} subido${conteosDocumentos[caso.id] !== 1 ? 's' : ''} por el cliente`}
                          >
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {conteosDocumentos[caso.id]}
                          </span>
                        )}
                        {caso.prioridad && (
                          <span className={`w-2 h-2 rounded-full ${PRIORIDAD_COLORES[caso.prioridad]}`} title={`Prioridad ${caso.prioridad}`} />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ESTADO_COLORES[caso.estado] ?? "bg-gray-100 text-gray-600"}`}>
                        {caso.estado}
                      </span>
                      {caso.comunidad && <span className="text-xs text-gray-400 truncate">{caso.comunidad}</span>}
                    </div>
                    {caso.nombreEmpresa && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">🏢 {caso.nombreEmpresa}</p>
                    )}
                    {caso.asesorAsignado && (
                      <p className="text-xs text-teal-600 mt-0.5">👤 {caso.asesorAsignado}</p>
                    )}
                    {caso.notasAsesor && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate" title={caso.notasAsesor}>📝 {caso.notasAsesor}</p>
                    )}
                  </button>
                ))
              )}
            </div>
          </aside>

          {/* Detalle del caso */}
          <main className="flex-1 overflow-y-auto p-4">
            {!casoSeleccionado ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm">Selecciona un caso para ver el detalle</p>
                  <p className="text-gray-300 text-xs mt-1">o usa la vista tabla para ver todos a la vez</p>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-4">
                {/* Cabecera del caso */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {casoSeleccionado.prioridad && (
                          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${PRIORIDAD_COLORES[casoSeleccionado.prioridad]}`} />
                        )}
                        <h2 className="text-lg font-bold text-gray-900 truncate">{casoSeleccionado.nombre}</h2>
                      </div>
                      <p className="text-sm text-gray-500 font-mono">{casoSeleccionado.id}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${ESTADO_COLORES[casoSeleccionado.estado] ?? "bg-gray-100 text-gray-600"}`}>
                          {casoSeleccionado.estado}
                        </span>
                        {casoSeleccionado.prioridad && (
                          <span className="text-xs text-gray-500">Prioridad {casoSeleccionado.prioridad}</span>
                        )}
                        {casoSeleccionado.asesorAsignado && (
                          <span className="text-xs text-teal-600 font-medium">👤 {casoSeleccionado.asesorAsignado}</span>
                        )}
                        {casoSeleccionado.complejidad && (
                          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{casoSeleccionado.complejidad}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <ExportarPDF
                        caso={{
                          id: casoSeleccionado.id,
                          nombre: casoSeleccionado.nombre,
                          nif: casoSeleccionado.nif,
                          email: casoSeleccionado.email,
                          telefono: casoSeleccionado.telefono,
                          comunidadAutonoma: casoSeleccionado.comunidad,
                          tipo: casoSeleccionado.situacion,
                          plan: casoSeleccionado.plan,
                          precio: casoSeleccionado.precio,
                          complejidad: casoSeleccionado.complejidad,
                          estado: casoSeleccionado.estado,
                          prioridad: casoSeleccionado.prioridad,
                          asesorAsignado: casoSeleccionado.asesorAsignado,
                          notasAsesor: casoSeleccionado.notasAsesor,
                          fechaContacto: casoSeleccionado.fechaContacto,
                          fechaRevision: casoSeleccionado.fechaRevision,
                          resultadoFinal: casoSeleccionado.resultadoFinal,
                          importeResultado: casoSeleccionado.importeResultado,
                          fechaPresentacion: casoSeleccionado.fechaPresentacion,
                          observaciones: casoSeleccionado.observaciones,
                          documentosRecibidos: casoSeleccionado.documentosRecibidos,
                        }}
                      />
                      <CopiarEnlaceCliente casoId={casoSeleccionado.id} />
                      <button
                        onClick={() => editando ? setEditando(false) : iniciarEdicion(casoSeleccionado)}
                        className={`text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors ${editando ? "border-gray-200 text-gray-500 hover:bg-gray-50" : "border-teal-200 text-teal-600 hover:bg-teal-50"}`}
                      >
                        {editando ? "Cancelar" : "✏️ Editar gestión"}
                      </button>
                      {!confirmarEliminar ? (
                        <button
                          onClick={() => setConfirmarEliminar(true)}
                          className="text-sm font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                          title="Eliminar caso del Sheet"
                        >
                          🗑️ Eliminar
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-red-600 font-medium">¿Eliminar?</span>
                          <button
                            onClick={() => {
                              eliminarCasoMutation.mutate({
                                casoId: casoSeleccionado.id,
                                rowIndex: casoSeleccionado.rowIndex ?? 0,
                              });
                              setConfirmarEliminar(false);
                            }}
                            className="text-xs font-bold px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                          >
                            Sí
                          </button>
                          <button
                            onClick={() => setConfirmarEliminar(false)}
                            className="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                          >
                            No
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Datos del cliente */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Datos del cliente</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <InfoField label="NIF/NIE" value={casoSeleccionado.nif} />
                    <InfoField label="Email" value={casoSeleccionado.email} />
                    <InfoField label="Teléfono" value={casoSeleccionado.telefono} />
                    <InfoField label="Comunidad" value={casoSeleccionado.comunidad} />
                    <InfoField label="Situación laboral" value={casoSeleccionado.situacion} />
                    <InfoField label="Ingresos brutos" value={casoSeleccionado.ingresos} />
                    <InfoField label="Num. pagadores" value={casoSeleccionado.numPagadores} />
                    <InfoField label="Fecha registro" value={casoSeleccionado.fecha} />
                  </div>
                </div>

                {/* Empresa pagadora */}
                {(casoSeleccionado.nombreEmpresa || casoSeleccionado.nifPagador) && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Empresa pagadora</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <InfoField label="Nombre empresa" value={casoSeleccionado.nombreEmpresa} />
                      <InfoField label="NIF/CIF empresa" value={casoSeleccionado.nifPagador} />
                    </div>
                  </div>
                )}

                {/* Análisis IA */}
                {(casoSeleccionado.complejidad || casoSeleccionado.plan || casoSeleccionado.precio) && (
                  <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-5">
                    <h3 className="text-sm font-semibold text-indigo-700 mb-3">Análisis IA</h3>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <InfoField label="Complejidad" value={casoSeleccionado.complejidad} />
                      <InfoField label="Plan sugerido" value={casoSeleccionado.plan} />
                      <InfoField label="Precio estimado" value={casoSeleccionado.precio ? `${casoSeleccionado.precio}€` : undefined} />
                    </div>
                  </div>
                )}

                {/* Gestión del asesor */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Gestión del asesor</h3>

                  {editando ? (
                    <div className="space-y-4">
                      {/* Estado y prioridad */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                          <select
                            value={camposEdit.estado ?? ""}
                            onChange={e => setCamposEdit((p: Partial<CasoGoogleSheets>) => ({ ...p, estado: e.target.value as typeof ESTADOS[number] }))}
                            className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          >
                            {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Prioridad</label>
                          <select
                            value={camposEdit.prioridad ?? ""}
                            onChange={e => setCamposEdit((p: Partial<CasoGoogleSheets>) => ({ ...p, prioridad: e.target.value }))}
                            className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          >
                            <option value="">Sin asignar</option>
                            {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Asesor asignado */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Asesor asignado</label>
                        <input
                          type="text"
                          value={camposEdit.asesorAsignado ?? ""}
                          onChange={e => setCamposEdit((p: Partial<CasoGoogleSheets>) => ({ ...p, asesorAsignado: e.target.value }))}
                          placeholder="Nombre del asesor"
                          className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>

                      {/* Notas del asesor */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Notas internas</label>
                        <textarea
                          value={camposEdit.notasAsesor ?? ""}
                          onChange={e => setCamposEdit((p: Partial<CasoGoogleSheets>) => ({ ...p, notasAsesor: e.target.value }))}
                          placeholder="Notas sobre el caso..."
                          rows={3}
                          className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                        />
                      </div>

                      {/* Documentos recibidos */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">Documentos recibidos</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {DOCUMENTOS_LISTA.map(doc => {
                            const actuales = (camposEdit.documentosRecibidos ?? "").split(",").map((d: string) => d.trim()).filter(Boolean);
                            const marcado = actuales.includes(doc);
                            return (
                              <button
                                key={doc}
                                type="button"
                                onClick={() => toggleDocumento(doc)}
                                className={`text-xs text-left px-2.5 py-1.5 rounded-lg border transition-colors ${marcado ? "bg-teal-50 border-teal-300 text-teal-700 font-medium" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                              >
                                {marcado ? "✓ " : ""}{doc}
                              </button>
                            );
                          })}
                        </div>
                        <input
                          type="text"
                          value={camposEdit.documentosRecibidos ?? ""}
                          onChange={e => setCamposEdit((p: Partial<CasoGoogleSheets>) => ({ ...p, documentosRecibidos: e.target.value }))}
                          placeholder="o escribe manualmente..."
                          className="mt-2 w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 text-gray-500"
                        />
                      </div>

                      {/* Fechas */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Fecha contacto</label>
                          <input
                            type="date"
                            value={camposEdit.fechaContacto ?? ""}
                            onChange={e => setCamposEdit((p: Partial<CasoGoogleSheets>) => ({ ...p, fechaContacto: e.target.value }))}
                            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Fecha revisión</label>
                          <input
                            type="date"
                            value={camposEdit.fechaRevision ?? ""}
                            onChange={e => setCamposEdit((p: Partial<CasoGoogleSheets>) => ({ ...p, fechaRevision: e.target.value }))}
                            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Fecha presentación</label>
                          <input
                            type="date"
                            value={camposEdit.fechaPresentacion ?? ""}
                            onChange={e => setCamposEdit((p: Partial<CasoGoogleSheets>) => ({ ...p, fechaPresentacion: e.target.value }))}
                            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                      </div>

                      {/* Resultado final */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Resultado final</label>
                          <select
                            value={camposEdit.resultadoFinal ?? ""}
                            onChange={e => setCamposEdit((p: Partial<CasoGoogleSheets>) => ({ ...p, resultadoFinal: e.target.value }))}
                            className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          >
                            <option value="">Sin resultado</option>
                            {RESULTADOS_FINALES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Importe (€)</label>
                          <input
                            type="text"
                            value={camposEdit.importeResultado ?? ""}
                            onChange={e => setCamposEdit((p: Partial<CasoGoogleSheets>) => ({ ...p, importeResultado: e.target.value }))}
                            placeholder="ej: 450.00"
                            className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>

                      {/* Observaciones */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Observaciones finales</label>
                        <textarea
                          value={camposEdit.observaciones ?? ""}
                          onChange={e => setCamposEdit((p: Partial<CasoGoogleSheets>) => ({ ...p, observaciones: e.target.value }))}
                          placeholder="Observaciones para el expediente..."
                          rows={2}
                          className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                        />
                      </div>

                      {/* Botón guardar */}
                      <button
                        onClick={guardarEdicion}
                        disabled={updateGestionMutation.isPending}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
                      >
                        {updateGestionMutation.isPending ? "Guardando en Sheet..." : "Guardar cambios en Google Sheet"}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <InfoField label="Estado" value={casoSeleccionado.estado} badge badgeClass={ESTADO_COLORES[casoSeleccionado.estado]} />
                      <InfoField label="Prioridad" value={casoSeleccionado.prioridad} />
                      <InfoField label="Asesor asignado" value={casoSeleccionado.asesorAsignado} />
                      <InfoField label="Resultado final" value={casoSeleccionado.resultadoFinal} />
                      <InfoField label="Importe resultado" value={casoSeleccionado.importeResultado ? `${casoSeleccionado.importeResultado}€` : undefined} />
                      <InfoField label="Fecha contacto" value={casoSeleccionado.fechaContacto} />
                      <InfoField label="Fecha revisión" value={casoSeleccionado.fechaRevision} />
                      <InfoField label="Fecha presentación" value={casoSeleccionado.fechaPresentacion} />
                      <div className="col-span-2">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-gray-400">Notas internas</p>
                          <NotasRapidas caso={casoSeleccionado} onGuardado={(notas) => {
                            setCasoSeleccionado(prev => prev ? { ...prev, notasAsesor: notas } : prev);
                          }} />
                        </div>
                        {casoSeleccionado.notasAsesor ? (
                          <p className="text-sm text-gray-700 bg-yellow-50 rounded-lg p-2.5 border border-yellow-100 whitespace-pre-wrap">{casoSeleccionado.notasAsesor}</p>
                        ) : (
                          <p className="text-sm text-gray-300 italic bg-gray-50 rounded-lg p-2.5 border border-dashed border-gray-200">Sin notas — haz clic en "Añadir nota" para escribir</p>
                        )}
                      </div>
                      {casoSeleccionado.documentosRecibidos && (
                        <div className="col-span-2">
                          <p className="text-xs text-gray-400 mb-1">Documentos recibidos</p>
                          <div className="flex flex-wrap gap-1">
                            {casoSeleccionado.documentosRecibidos.split(",").map((d: string) => d.trim()).filter(Boolean).map((doc: string) => (
                              <span key={doc} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-100">✓ {doc}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {casoSeleccionado.observaciones && (
                        <div className="col-span-2">
                          <p className="text-xs text-gray-400 mb-1">Observaciones</p>
                          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-2.5">{casoSeleccionado.observaciones}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Documentos del caso */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Documentos del caso
                    </h3>
                    <span className="text-xs text-gray-400">Asesor y cliente pueden subir documentos</span>
                  </div>
                  <DocumentosPanel
                    casoId={casoSeleccionado.id}
                    subidoPor="asesor"
                    nombreUsuario={casoSeleccionado.asesorAsignado ?? "Asesor"}
                    documentosNecesarios={(casoSeleccionado as any).documentosNecesarios}
                  />
                </div>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}

// ── Componente auxiliar ─────────────────────────────────────────────────────

function InfoField({ label, value, badge, badgeClass }: {
  label: string;
  value?: string;
  badge?: boolean;
  badgeClass?: string;
}) {
  if (!value) return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm text-gray-300">—</p>
    </div>
  );
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      {badge ? (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeClass ?? "bg-gray-100 text-gray-600"}`}>{value}</span>
      ) : (
        <p className="text-sm text-gray-700 font-medium">{value}</p>
      )}
    </div>
  );
}

// ── Componente NotasRapidas ─────────────────────────────────────────────────

function NotasRapidas({ caso, onGuardado }: {
  caso: CasoGoogleSheets;
  onGuardado: (notas: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState(caso.notasAsesor ?? "");
  const [guardando, setGuardando] = useState(false);
  const updateGestion = trpc.casos.updateGestion.useMutation();

  const handleGuardar = async () => {
    if (!caso.rowIndex) return;
    setGuardando(true);
    try {
      await updateGestion.mutateAsync({
        casoId: caso.id,
        rowIndex: caso.rowIndex,
        campos: { notasAsesor: texto },
      });
      onGuardado(texto);
      setAbierto(false);
    } catch {
      // silencioso
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto) {
    return (
      <button
        onClick={() => { setTexto(caso.notasAsesor ?? ""); setAbierto(true); }}
        className="text-xs text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        {caso.notasAsesor ? "Editar nota" : "Añadir nota"}
      </button>
    );
  }

  return (
    <div className="col-span-2 bg-yellow-50 border border-yellow-200 rounded-xl p-3 space-y-2">
      <textarea
        value={texto}
        onChange={e => setTexto(e.target.value)}
        placeholder="Escribe una nota sobre este caso..."
        rows={4}
        autoFocus
        className="w-full text-sm border border-yellow-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white resize-none"
      />
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => setAbierto(false)}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleGuardar}
          disabled={guardando}
          className="text-xs px-3 py-1.5 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center gap-1"
        >
          {guardando ? (
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : null}
          {guardando ? "Guardando..." : "Guardar nota"}
        </button>
      </div>
    </div>
  );
}

// ── Componente CopiarEnlaceCliente ──────────────────────────────────────────

const APP_URL = "https://rentatpymes.aicheckpyme.co";

function CopiarEnlaceCliente({ casoId }: { casoId: string }) {
  const [copiado, setCopiado] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const enlace = `${APP_URL}/seguimiento?caso=${casoId}`;

  const copiarAlPortapapeles = async () => {
    try {
      await navigator.clipboard.writeText(enlace);
      setCopiado(true);
      setMenuAbierto(false);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Fallback para navegadores sin clipboard API
      const el = document.createElement("textarea");
      el.value = enlace;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiado(true);
      setMenuAbierto(false);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  const abrirWhatsApp = () => {
    const texto = encodeURIComponent(
      `Hola, aquí tienes el enlace para hacer seguimiento de tu declaración de la renta y subir los documentos necesarios:\n\n${enlace}`
    );
    window.open(`https://wa.me/?text=${texto}`, "_blank");
    setMenuAbierto(false);
  };

  const abrirEmail = () => {
    const asunto = encodeURIComponent("Seguimiento de tu declaración de la renta — Renta Fácil TPymes");
    const cuerpo = encodeURIComponent(
      `Hola,\n\nPuedes consultar el estado de tu declaración y subir los documentos necesarios en el siguiente enlace:\n\n${enlace}\n\nNecesitarás introducir tu NIF/NIE para acceder.\n\nUn saludo,\nEquipo Renta Fácil TPymes`
    );
    window.open(`mailto:?subject=${asunto}&body=${cuerpo}`, "_blank");
    setMenuAbierto(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setMenuAbierto(!menuAbierto)}
        className={`text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
          copiado
            ? "border-green-200 text-green-600 bg-green-50"
            : "border-gray-200 text-gray-600 hover:bg-gray-50"
        }`}
        title="Enviar enlace de seguimiento al cliente"
      >
        {copiado ? (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            ¡Copiado!
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Enviar enlace
          </>
        )}
      </button>

      {menuAbierto && (
        <>
          {/* Overlay para cerrar */}
          <div className="fixed inset-0 z-10" onClick={() => setMenuAbierto(false)} />
          {/* Menú desplegable */}
          <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden min-w-[200px]">
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-xs text-gray-400 font-medium">Enlace de seguimiento</p>
              <p className="text-xs text-gray-600 font-mono truncate mt-0.5">{enlace}</p>
            </div>
            <button
              onClick={copiarAlPortapapeles}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copiar al portapapeles
            </button>
            <button
              onClick={abrirWhatsApp}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Enviar por WhatsApp
            </button>
            <button
              onClick={abrirEmail}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
            >
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Enviar por Email
            </button>
          </div>
        </>
      )}
    </div>
  );
}
