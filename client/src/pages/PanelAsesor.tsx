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
  const [busqueda, setBusqueda] = useState("");
  const [busquedaEmpresa, setBusquedaEmpresa] = useState("");

  // Caso seleccionado
  const [casoSeleccionado, setCasoSeleccionado] = useState<CasoGoogleSheets | null>(null);

  // Edición de campos de gestión
  const [editando, setEditando] = useState(false);
  const [camposEdit, setCamposEdit] = useState<Partial<CasoGoogleSheets>>({});

  // Vista
  const [vistaTabla, setVistaTabla] = useState(false);

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

  // Filtrado local
  const casos = useMemo(() => {
    let lista = casosData?.casos ?? [];
    if (filtroEstado !== "todos") lista = lista.filter(c => c.estado === filtroEstado);
    if (filtroPrioridad !== "todas") lista = lista.filter(c => c.prioridad === filtroPrioridad);
    if (busqueda) {
      const q = busqueda.toLowerCase();
      lista = lista.filter(c =>
        c.nombre.toLowerCase().includes(q) ||
        c.nif.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
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
  }, [casosData, filtroEstado, filtroPrioridad, busqueda, busquedaEmpresa]);

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
    updateGestionMutation.mutate({
      casoId: casoSeleccionado.id,
      rowIndex: casoSeleccionado.rowIndex,
      campos: {
        estado: camposEdit.estado as typeof ESTADOS[number] | undefined,
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
        </div>
        <div className="flex items-center gap-2">
          {fuente && (
            <span className={`text-xs font-medium ${fuente.color} hidden sm:inline`}>
              ● {fuente.text}
            </span>
          )}
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

      {/* Vista tabla */}
      {vistaTabla ? (
        <div className="flex-1 overflow-auto p-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["ID", "Nombre", "NIF", "Comunidad", "Empresa", "Estado", "Prioridad", "Asesor", "Resultado", "Importe", "Presentación"].map(h => (
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
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar nombre, NIF, email..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 pl-7 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <svg className="absolute left-2 top-2 w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
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
                      {caso.prioridad && (
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${PRIORIDAD_COLORES[caso.prioridad]}`} title={`Prioridad ${caso.prioridad}`} />
                      )}
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
                    <button
                      onClick={() => editando ? setEditando(false) : iniciarEdicion(casoSeleccionado)}
                      className={`flex-shrink-0 text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors ${editando ? "border-gray-200 text-gray-500 hover:bg-gray-50" : "border-teal-200 text-teal-600 hover:bg-teal-50"}`}
                    >
                      {editando ? "Cancelar" : "✏️ Editar gestión"}
                    </button>
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
                      {casoSeleccionado.notasAsesor && (
                        <div className="col-span-2">
                          <p className="text-xs text-gray-400 mb-1">Notas internas</p>
                          <p className="text-sm text-gray-700 bg-yellow-50 rounded-lg p-2.5 border border-yellow-100">{casoSeleccionado.notasAsesor}</p>
                        </div>
                      )}
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
