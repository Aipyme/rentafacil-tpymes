/**
 * Panel del Asesor - Renta Fácil TPymes
 * 
 * Design: Clean professional dashboard
 * - Sidebar navigation with case list (loaded from Google Sheets via tRPC)
 * - Form to complete fiscal data
 * - XML generation and download
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { descargarXML, DatosDeclaracion, Pagador } from "@/lib/generadorXML";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

// ─────────────────────────────────────────────
// Pantalla de login del panel
// ─────────────────────────────────────────────

function PanelLogin({ onSuccess }: { onSuccess: (token: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const loginMutation = trpc.panel.login.useMutation({
    onSuccess: (result) => {
      if (result.success && result.token) {
        sessionStorage.setItem("panel_token", result.token);
        onSuccess(result.token);
      } else {
        setError("Contraseña incorrecta. Inténtalo de nuevo.");
        setPassword("");
        inputRef.current?.focus();
      }
    },
    onError: () => {
      setError("Error de conexión. Inténtalo de nuevo.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setError("");
    loginMutation.mutate({ password });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-lg font-bold">RF</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Panel del Asesor</h1>
          <p className="text-sm text-gray-500 mt-1">Renta Fácil TPymes — Acceso restringido</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña de acceso</label>
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={loginMutation.isPending || !password.trim()}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loginMutation.isPending ? "Verificando..." : "Acceder al panel"}
          </button>
        </form>
        <p className="text-xs text-gray-400 text-center mt-4">
          Acceso exclusivo para asesores de Renta Fácil TPymes
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Función de exportar a CSV
// ─────────────────────────────────────────────

function exportarCSV(casos: CasoSimple[]) {
  const cabeceras = [
    "ID", "Nombre", "NIF", "Email", "Teléfono", "Comunidad",
    "Situación", "Ingresos", "Num. Pagadores", "Empresa Pagadora",
    "NIF Pagador", "Estado", "Fecha"
  ];
  const filas = casos.map(c => [
    c.id, c.nombre, c.nif, c.email, c.telefono ?? "",
    c.comunidad, c.situacion, c.ingresos, c.numPagadores ?? "1",
    c.nombreEmpresa ?? "", c.nifPagador ?? "", c.estado, c.fecha
  ]);
  const csv = [cabeceras, ...filas]
    .map(fila => fila.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `casos_renta_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────
// Tipos internos
// ─────────────────────────────────────────────

interface CasoSimple {
  id: string;
  nombre: string;
  email: string;
  nif: string;
  comunidad: string;
  situacion: string;
  ingresos: string;
  fecha: string;
  estado: string;
  // Datos del pagador (del formulario ampliado)
  nifPagador?: string;
  nombreEmpresa?: string;
  telefono?: string;
  numPagadores?: string;
  tieneInmuebles?: string;
  tieneActividad?: string;
  rowIndex?: number;
}

const CCAA_CODIGO: Record<string, string> = {
  "Andalucía": "01",
  "Aragón": "02",
  "Asturias": "03",
  "Baleares": "04",
  "Canarias": "05",
  "Cantabria": "06",
  "Castilla-La Mancha": "07",
  "Castilla y León": "08",
  "Cataluña": "09",
  "Extremadura": "10",
  "Galicia": "11",
  "Madrid": "13",
  "Murcia": "14",
  "Navarra": "15",
  "País Vasco": "16",
  "La Rioja": "17",
  "Comunidad Valenciana": "18",
  "Ceuta": "19",
  "Melilla": "20",
};

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────

export default function PanelAsesor() {
  // ─── Autenticación del panel ───
  const [panelToken, setPanelToken] = useState<string | null>(() => {
    return sessionStorage.getItem("panel_token");
  });
  const [tokenVerificado, setTokenVerificado] = useState(false);

  // Verificar token al cargar
  const verifyQuery = trpc.panel.verify.useQuery(
    { token: panelToken ?? "" },
    { enabled: !!panelToken, retry: false }
  );

  useEffect(() => {
    if (!panelToken) {
      setTokenVerificado(true); // No hay token → mostrar login
      return;
    }
    if (verifyQuery.data !== undefined) {
      if (!verifyQuery.data.valid) {
        // Token inválido o expirado → limpiar y mostrar login
        sessionStorage.removeItem("panel_token");
        setPanelToken(null);
      }
      setTokenVerificado(true);
    }
  }, [verifyQuery.data, panelToken]);

  // Mostrar login si no hay token válido
  if (!tokenVerificado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!panelToken || (verifyQuery.data && !verifyQuery.data.valid)) {
    return <PanelLogin onSuccess={(token) => { setPanelToken(token); setTokenVerificado(true); }} />;
  }

  // ─── Panel principal ───
  const [casoSeleccionado, setCasoSeleccionado] = useState<CasoSimple | null>(null);
  const [tab, setTab] = useState<"datos" | "xml">("datos");
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [busquedaEmpresa, setBusquedaEmpresa] = useState("");
  
  // Cargar casos desde Google Sheets via tRPC
  const { data: casosData, isLoading, error: queryError, refetch } = trpc.casos.list.useQuery(
    { filtroEstado: filtroEstado !== "todos" ? filtroEstado : undefined, busqueda: busqueda || undefined },
    { refetchInterval: 60_000 } // Recargar cada minuto
  );

  // Mutación para actualizar estado
  const updateEstado = trpc.casos.updateEstado.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Estado actualizado en Google Sheets");
        refetch();
      } else {
        toast.error(`Error al actualizar: ${result.error}`);
      }
    },
    onError: () => toast.error("Error al actualizar el estado"),
  });

  const casosRaw = useMemo(() => casosData?.casos ?? [], [casosData]);

  // Filtro adicional por empresa (client-side sobre los casos ya cargados)
  const casos = useMemo(() => {
    if (!busquedaEmpresa.trim()) return casosRaw;
    const q = busquedaEmpresa.toLowerCase();
    return casosRaw.filter(c =>
      (c.nombreEmpresa ?? "").toLowerCase().includes(q) ||
      (c.nifPagador ?? "").toLowerCase().includes(q)
    );
  }, [casosRaw, busquedaEmpresa]);
  
  // Formulario de datos fiscales
  const [form, setForm] = useState({
    apellidosNombre: "",
    fechaNacimiento: "",
    sexo: "H" as "H" | "M",
    estadoCivil: "1" as "1" | "2" | "3" | "4" | "5",
    
    // Pagador 1
    importeIntegro1: "",
    retenciones1: "",
    cuotasSS1: "",
    
    // Pagador 2 (opcional)
    tienePagador2: false,
    importeIntegro2: "",
    retenciones2: "",
    cuotasSS2: "",
    
    // Capital mobiliario
    tieneCapitalMob: false,
    capitalMobIntegro: "",
    capitalMobRetenciones: "",
    
    // Plan de pensiones
    aportacionesPP: "",
    
    // Situación familiar
    numHijos: "0",
    ascendientes: "0",
    discapacidad: "0",
    
    // Resultado
    resultadoTipo: "D" as "D" | "I" | "N",
    resultadoImporte: "",
    iban: "",
    
    // Deducciones Andalucía
    andAlquiler: "",
    andNacimiento: "",
  });

  const handleCasoClick = (caso: CasoSimple) => {
    setCasoSeleccionado(caso);
    setForm(prev => ({
      ...prev,
      apellidosNombre: caso.nombre.toUpperCase().split(" ").reverse().slice(0, 2).join(" ") + " " + caso.nombre.split(" ")[0],
    }));
    setTab("datos");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleGenerarXML = () => {
    if (!casoSeleccionado) return;
    
    if (!form.apellidosNombre || !form.fechaNacimiento || !form.importeIntegro1 || !form.retenciones1) {
      toast.error("Completa los campos obligatorios: apellidos, fecha de nacimiento, importe íntegro y retenciones.");
      return;
    }

    const pagadores: Pagador[] = [
      {
        importeIntegro: parseFloat(form.importeIntegro1) || 0,
        retenciones: parseFloat(form.retenciones1) || 0,
        cuotasSS: parseFloat(form.cuotasSS1) || 0,
      },
    ];

    if (form.tienePagador2 && form.importeIntegro2) {
      pagadores.push({
        importeIntegro: parseFloat(form.importeIntegro2) || 0,
        retenciones: parseFloat(form.retenciones2) || 0,
        cuotasSS: parseFloat(form.cuotasSS2) || 0,
      });
    }

    const ccaa = CCAA_CODIGO[casoSeleccionado.comunidad] || "13";

    const declaracion: DatosDeclaracion = {
      nif: casoSeleccionado.nif,
      apellidosNombre: form.apellidosNombre,
      fechaNacimiento: form.fechaNacimiento,
      sexo: form.sexo,
      estadoCivil: form.estadoCivil,
      comunidadAutonoma: ccaa,
      tipoTributacion: "1",
      pagadores,
      capitalMobiliario: form.tieneCapitalMob && form.capitalMobIntegro ? {
        importeIntegro: parseFloat(form.capitalMobIntegro) || 0,
        retenciones: parseFloat(form.capitalMobRetenciones) || 0,
      } : undefined,
      aportacionesPP: parseFloat(form.aportacionesPP) || 0,
      numHijos: parseInt(form.numHijos) || 0,
      ascendientesCargo: parseInt(form.ascendientes) || 0,
      gradoDiscapacidad: parseInt(form.discapacidad) || 0,
      deduccionAndalucia: ccaa === "01" ? {
        alquilerVivienda: parseFloat(form.andAlquiler) || 0,
        nacimientoAdopcion: parseFloat(form.andNacimiento) || 0,
      } : undefined,
      resultadoTipo: form.resultadoTipo,
      resultadoImporte: parseFloat(form.resultadoImporte) || 0,
      cuentaDevolucion: form.iban,
    };

    descargarXML(declaracion, `Modelo100_${casoSeleccionado.nif}_2024.xml`);
    toast.success(`XML generado: Modelo100_${casoSeleccionado.nif}_2024.xml`);
    setTab("xml");
  };

  const handleMarcarCompletado = () => {
    if (!casoSeleccionado) return;
    updateEstado.mutate({
      casoId: casoSeleccionado.id,
      nuevoEstado: "Completado",
      rowIndex: casoSeleccionado.rowIndex,
    });
  };

  const estadoColor = (estado: string) => {
    switch (estado) {
      case "Pendiente": return "bg-amber-100 text-amber-700";
      case "En proceso": return "bg-blue-100 text-blue-700";
      case "Completado": return "bg-green-100 text-green-700";
      case "Cancelado": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const fuenteLabel = () => {
    if (!casosData) return null;
    if (casosData.fuente === "google_sheets") return { text: "Google Sheets directo", color: "text-green-600" };
    if (casosData.fuente === "n8n") return { text: "via n8n webhook", color: "text-blue-600" };
    return { text: "Datos de ejemplo", color: "text-amber-600" };
  };

  const fuente = fuenteLabel();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-600 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">RF</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Panel del Asesor</h1>
            <p className="text-xs text-gray-500">Renta Fácil TPymes — Campaña 2024</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {fuente && (
            <span className={`text-xs font-medium ${fuente.color}`}>
              ● {fuente.text}
            </span>
          )}
          <button
            onClick={() => refetch()}
            className="text-xs text-gray-500 hover:text-teal-600 border border-gray-200 px-2 py-1 rounded transition-colors"
          >
            ↻ Actualizar
          </button>
          <button
            onClick={() => {
              sessionStorage.removeItem("panel_token");
              setPanelToken(null);
              setTokenVerificado(true);
            }}
            className="text-xs text-gray-500 hover:text-red-600 border border-gray-200 px-2 py-1 rounded transition-colors"
            title="Cerrar sesión del panel"
          >
            Salir
          </button>
          <span className="bg-teal-50 text-teal-700 text-xs px-2 py-1 rounded font-medium">
            Generador XML v1.0
          </span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Lista de casos */}
        <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Casos ({casos.length}{casosData?.total && casos.length !== casosData.total ? `/${casosData.total}` : ""})
              </h2>
              <div className="flex items-center gap-1">
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="text-xs border border-gray-200 rounded px-1.5 py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="todos">Todos</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="En proceso">En proceso</option>
                  <option value="Completado">Completado</option>
                </select>
                {/* Botón exportar CSV */}
                <button
                  onClick={() => {
                    if (casos.length === 0) { toast.error("No hay casos para exportar"); return; }
                    exportarCSV(casos);
                    toast.success(`CSV exportado: ${casos.length} casos`);
                  }}
                  title="Exportar tabla a CSV"
                  className="text-xs border border-gray-200 rounded px-1.5 py-1 text-gray-500 hover:text-teal-600 hover:border-teal-300 transition-colors"
                >
                  ↓ CSV
                </button>
              </div>
            </div>
            {/* Búsqueda por nombre o NIF */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre o NIF..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 pl-8 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <svg className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {/* Búsqueda por empresa pagadora */}
            <div className="relative">
              <input
                type="text"
                placeholder="Filtrar por empresa..."
                value={busquedaEmpresa}
                onChange={(e) => setBusquedaEmpresa(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 pl-8 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <svg className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {busquedaEmpresa && (
                <button
                  onClick={() => setBusquedaEmpresa("")}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="p-6 text-center">
                <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-400">Cargando casos...</p>
              </div>
            )}

            {!isLoading && queryError && (
              <div className="p-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-red-700 mb-1">Error al cargar casos</p>
                  <p className="text-xs text-red-500">{queryError.message}</p>
                </div>
              </div>
            )}

            {!isLoading && !queryError && casosData?.error && (
              <div className="p-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-amber-700 mb-1">⚠ Google Sheets no configurado</p>
                  <p className="text-xs text-amber-600">{casosData.error}</p>
                  <p className="text-xs text-amber-500 mt-1">Configura GOOGLE_SHEETS_API_KEY y GOOGLE_SHEETS_ID en los secretos.</p>
                </div>
              </div>
            )}

            {!isLoading && casos.length === 0 && !casosData?.error && (
              <div className="p-4 text-center">
                <p className="text-xs text-gray-400">No hay casos que mostrar.</p>
              </div>
            )}

            {casos.map((caso) => (
              <button
                key={caso.id}
                onClick={() => handleCasoClick(caso)}
                className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                  casoSeleccionado?.id === caso.id ? "bg-teal-50 border-l-2 border-l-teal-500" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 truncate">{caso.nombre}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ml-2 shrink-0 ${estadoColor(caso.estado)}`}>
                    {caso.estado}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{caso.nif}</p>
                <p className="text-xs text-gray-400 mt-1">{caso.comunidad} · {caso.fecha}</p>
                {caso.nombreEmpresa && (
                  <p className="text-xs text-teal-600 mt-0.5 truncate">{caso.nombreEmpresa}</p>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {!casoSeleccionado ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Selecciona un caso</h3>
              <p className="text-sm text-gray-400 max-w-sm">
                Elige un expediente de la lista para completar los datos fiscales y generar el XML Modelo 100 para Renta Web.
              </p>
              {!casosData?.configurado && (
                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-sm text-left">
                  <p className="text-xs font-semibold text-amber-700 mb-2">Configuración pendiente</p>
                  <p className="text-xs text-amber-600">Para cargar casos reales del Google Sheet, configura en Secretos:</p>
                  <ul className="text-xs text-amber-600 mt-2 space-y-1">
                    <li>• <code className="bg-amber-100 px-1 rounded">GOOGLE_SHEETS_API_KEY</code> — API Key de Google</li>
                    <li>• <code className="bg-amber-100 px-1 rounded">GOOGLE_SHEETS_ID</code> — ID del Google Sheet</li>
                  </ul>
                  <p className="text-xs text-amber-500 mt-2">O usa el webhook de n8n ya configurado (<code className="bg-amber-100 px-1 rounded">VITE_WEBHOOK_N8N</code>).</p>
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-2xl">
              {/* Cabecera del caso */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{casoSeleccionado.nombre}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{casoSeleccionado.nif} · {casoSeleccionado.email}</p>
                    {casoSeleccionado.telefono && (
                      <p className="text-xs text-gray-400 mt-0.5">📞 {casoSeleccionado.telefono}</p>
                    )}
                  </div>
                  <span className={`text-sm px-2.5 py-1 rounded-full font-medium ${estadoColor(casoSeleccionado.estado)}`}>
                    {casoSeleccionado.estado}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400">Comunidad</p>
                    <p className="text-sm font-medium text-gray-700">{casoSeleccionado.comunidad}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Situación</p>
                    <p className="text-sm font-medium text-gray-700">{casoSeleccionado.situacion}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Ingresos estimados</p>
                    <p className="text-sm font-medium text-gray-700">{casoSeleccionado.ingresos}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Expediente</p>
                    <p className="text-sm font-medium text-gray-700 font-mono">{casoSeleccionado.id}</p>
                  </div>
                  {casoSeleccionado.numPagadores && casoSeleccionado.numPagadores !== "1" && (
                    <div>
                      <p className="text-xs text-gray-400">Pagadores</p>
                      <p className="text-sm font-medium text-amber-600">{casoSeleccionado.numPagadores} pagadores</p>
                    </div>
                  )}
                </div>
                
                {/* Datos del pagador (si los hay) */}
                {(casoSeleccionado.nifPagador || casoSeleccionado.nombreEmpresa) && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Datos del pagador (del formulario)</p>
                    <div className="flex flex-wrap gap-4">
                      {casoSeleccionado.nombreEmpresa && (
                        <div>
                          <p className="text-xs text-gray-400">Empresa pagadora</p>
                          <p className="text-sm font-medium text-gray-700">{casoSeleccionado.nombreEmpresa}</p>
                        </div>
                      )}
                      {casoSeleccionado.nifPagador && (
                        <div>
                          <p className="text-xs text-gray-400">NIF/CIF empresa</p>
                          <p className="text-sm font-medium text-gray-700 font-mono">{casoSeleccionado.nifPagador}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
                <button
                  onClick={() => setTab("datos")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    tab === "datos" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Datos fiscales
                </button>
                <button
                  onClick={() => setTab("xml")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    tab === "xml" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Generar XML
                </button>
              </div>

              {tab === "datos" && (
                <div className="space-y-6">
                  {/* Datos personales */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Datos personales</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Apellidos y nombre <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="apellidosNombre"
                          value={form.apellidosNombre}
                          onChange={handleChange}
                          placeholder="GARCIA LOPEZ JUAN"
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase"
                        />
                        <p className="text-xs text-gray-400 mt-1">Formato: APELLIDO1 APELLIDO2 NOMBRE</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Fecha de nacimiento <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="fechaNacimiento"
                          value={form.fechaNacimiento}
                          onChange={handleChange}
                          placeholder="DD/MM/AAAA"
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Sexo</label>
                        <select
                          name="sexo"
                          value={form.sexo}
                          onChange={handleChange}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="H">Hombre</option>
                          <option value="M">Mujer</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Estado civil</label>
                        <select
                          name="estadoCivil"
                          value={form.estadoCivil}
                          onChange={handleChange}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="1">Soltero/a</option>
                          <option value="2">Casado/a</option>
                          <option value="3">Viudo/a</option>
                          <option value="4">Separado/a</option>
                          <option value="5">Divorciado/a</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Rendimientos del trabajo */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Rendimientos del trabajo — Pagador 1</h3>
                    {casoSeleccionado.nombreEmpresa && (
                      <p className="text-xs text-teal-600 mb-4">
                        Empresa: <strong>{casoSeleccionado.nombreEmpresa}</strong>
                        {casoSeleccionado.nifPagador && ` (${casoSeleccionado.nifPagador})`}
                      </p>
                    )}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Importe íntegro (€) <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="importeIntegro1"
                          value={form.importeIntegro1}
                          onChange={handleChange}
                          placeholder="28500.00"
                          type="number"
                          step="0.01"
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <p className="text-xs text-gray-400 mt-1">Casilla 0001</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Retenciones (€) <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="retenciones1"
                          value={form.retenciones1}
                          onChange={handleChange}
                          placeholder="4275.00"
                          type="number"
                          step="0.01"
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <p className="text-xs text-gray-400 mt-1">Casilla 0002</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Cuotas SS (€)</label>
                        <input
                          name="cuotasSS1"
                          value={form.cuotasSS1}
                          onChange={handleChange}
                          placeholder="1710.00"
                          type="number"
                          step="0.01"
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <p className="text-xs text-gray-400 mt-1">Casilla 0014</p>
                      </div>
                    </div>
                    
                    {/* Pagador 2 */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="tienePagador2"
                          checked={form.tienePagador2}
                          onChange={handleChange}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-600">Añadir segundo pagador</span>
                        {casoSeleccionado.numPagadores && parseInt(casoSeleccionado.numPagadores) > 1 && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                            Cliente indicó {casoSeleccionado.numPagadores} pagadores
                          </span>
                        )}
                      </label>
                      
                      {form.tienePagador2 && (
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Importe íntegro 2 (€)</label>
                            <input
                              name="importeIntegro2"
                              value={form.importeIntegro2}
                              onChange={handleChange}
                              placeholder="5000.00"
                              type="number"
                              step="0.01"
                              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Retenciones 2 (€)</label>
                            <input
                              name="retenciones2"
                              value={form.retenciones2}
                              onChange={handleChange}
                              placeholder="750.00"
                              type="number"
                              step="0.01"
                              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Cuotas SS 2 (€)</label>
                            <input
                              name="cuotasSS2"
                              value={form.cuotasSS2}
                              onChange={handleChange}
                              placeholder="300.00"
                              type="number"
                              step="0.01"
                              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Capital mobiliario */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-900">Capital mobiliario</h3>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="tieneCapitalMob"
                          checked={form.tieneCapitalMob}
                          onChange={handleChange}
                          className="rounded"
                        />
                        <span className="text-xs text-gray-500">Tiene intereses/dividendos</span>
                      </label>
                    </div>
                    {form.tieneCapitalMob && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Importe íntegro (€)</label>
                          <input
                            name="capitalMobIntegro"
                            value={form.capitalMobIntegro}
                            onChange={handleChange}
                            placeholder="320.00"
                            type="number"
                            step="0.01"
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                          <p className="text-xs text-gray-400 mt-1">Casilla 0023</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Retenciones (€)</label>
                          <input
                            name="capitalMobRetenciones"
                            value={form.capitalMobRetenciones}
                            onChange={handleChange}
                            placeholder="48.00"
                            type="number"
                            step="0.01"
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                          <p className="text-xs text-gray-400 mt-1">Casilla 0025</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Situación familiar y reducciones */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Situación familiar y reducciones</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Hijos a cargo</label>
                        <select
                          name="numHijos"
                          value={form.numHijos}
                          onChange={handleChange}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          {[0, 1, 2, 3, 4, 5].map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Ascendientes a cargo</label>
                        <select
                          name="ascendientes"
                          value={form.ascendientes}
                          onChange={handleChange}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          {[0, 1, 2].map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Plan de pensiones (€)</label>
                        <input
                          name="aportacionesPP"
                          value={form.aportacionesPP}
                          onChange={handleChange}
                          placeholder="0.00"
                          type="number"
                          step="0.01"
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Discapacidad (%)</label>
                        <select
                          name="discapacidad"
                          value={form.discapacidad}
                          onChange={handleChange}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="0">Sin discapacidad</option>
                          <option value="33">33%</option>
                          <option value="65">65%</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Deducciones autonómicas Andalucía */}
                  {casoSeleccionado.comunidad === "Andalucía" && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">Deducciones autonómicas — Andalucía</h3>
                      <p className="text-xs text-gray-400 mb-4">Solo si aplican al caso concreto</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Alquiler vivienda habitual (€)</label>
                          <input
                            name="andAlquiler"
                            value={form.andAlquiler}
                            onChange={handleChange}
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Nacimiento/adopción (€)</label>
                          <input
                            name="andNacimiento"
                            value={form.andNacimiento}
                            onChange={handleChange}
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Resultado */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Resultado de la declaración</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de resultado</label>
                        <select
                          name="resultadoTipo"
                          value={form.resultadoTipo}
                          onChange={handleChange}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="D">A devolver</option>
                          <option value="I">A ingresar</option>
                          <option value="N">Negativo/cero</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Importe (€)</label>
                        <input
                          name="resultadoImporte"
                          value={form.resultadoImporte}
                          onChange={handleChange}
                          placeholder="350.00"
                          type="number"
                          step="0.01"
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      {form.resultadoTipo === "D" && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">IBAN devolución</label>
                          <input
                            name="iban"
                            value={form.iban}
                            onChange={handleChange}
                            placeholder="ES91 2100 0418 4502..."
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {tab === "xml" && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Generar XML Modelo 100</h3>
                    <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                      Genera el fichero XML listo para importar en <strong>Renta Web</strong> de la AEAT. 
                      El asesor solo necesita importarlo y revisar antes de presentar.
                    </p>
                    
                    <div className="bg-gray-50 rounded-lg p-4 text-left mb-6 max-w-sm mx-auto">
                      <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Cómo importar en Renta Web</h4>
                      <ol className="text-xs text-gray-500 space-y-1.5">
                        <li className="flex gap-2"><span className="font-semibold text-teal-600">1.</span> Descarga el XML con el botón de abajo</li>
                        <li className="flex gap-2"><span className="font-semibold text-teal-600">2.</span> Abre Renta Web en la AEAT con el certificado del cliente</li>
                        <li className="flex gap-2"><span className="font-semibold text-teal-600">3.</span> Haz clic en "Importar declaración" → selecciona el XML</li>
                        <li className="flex gap-2"><span className="font-semibold text-teal-600">4.</span> Revisa los datos importados y presenta</li>
                      </ol>
                    </div>
                    
                    <button
                      onClick={handleGenerarXML}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 py-3 rounded-lg transition-colors flex items-center gap-2 mx-auto"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      </svg>
                      Descargar XML Modelo 100
                    </button>
                    
                    <p className="text-xs text-gray-400 mt-3">
                      Fichero: <code className="bg-gray-100 px-1 rounded">Modelo100_{casoSeleccionado.nif}_2024.xml</code>
                    </p>
                  </div>
                </div>
              )}

              {/* Botón generar XML siempre visible en tab datos */}
              {tab === "datos" && (
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleGenerarXML}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    Generar y descargar XML
                  </button>
                  <button
                    onClick={handleMarcarCompletado}
                    disabled={updateEstado.isPending}
                    className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {updateEstado.isPending ? "Actualizando..." : "Marcar como completado"}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
