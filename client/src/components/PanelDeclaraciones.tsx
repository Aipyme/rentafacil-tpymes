/**
 * PanelDeclaraciones — Vista de gestión de expedientes del simulador IRPF (/renta)
 * Se integra en el Panel del Asesor como una sección separada.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Declaracion = {
  id: number;
  expedienteId: string;
  estado: string;
  subestado?: string | null;
  environment?: string;
  esComplejo?: boolean;
  motivoComplejidad?: string | null;
  precioTotal?: number;
  emailContacto?: string | null;
  telefonoContacto?: string | null;
  paymentConfirmedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  datosContribuyente?: Record<string, unknown> | null;
  resultadoCalculo?: Record<string, unknown> | null;
  stripePaymentIntentId?: string | null;
};

const ESTADO_COLORES: Record<string, string> = {
  simulacion: "bg-gray-100 text-gray-600",
  pendiente_pago: "bg-yellow-100 text-yellow-700",
  pagado: "bg-green-100 text-green-700",
  en_proceso: "bg-blue-100 text-blue-700",
  derivado_asesor: "bg-purple-100 text-purple-700",
  completado: "bg-emerald-100 text-emerald-700",
  cancelado: "bg-red-100 text-red-600",
  recibido: "bg-orange-100 text-orange-700",
};

const ESTADO_LABELS: Record<string, string> = {
  simulacion: "Simulación",
  pendiente_pago: "Pendiente pago",
  pagado: "Pagado ✓",
  en_proceso: "En proceso",
  derivado_asesor: "Derivado asesor",
  completado: "Completado",
  cancelado: "Cancelado",
  recibido: "Recibido",
  pendiente_documentacion: "Pend. documentación",
  pendiente_clasificacion: "Pend. clasificación",
  clasificado: "Clasificado",
  cita_propuesta: "Cita propuesta",
  cita_confirmada: "Cita confirmada",
  en_preparacion: "En preparación",
  pendiente_validacion_cliente: "Pend. validación",
  cerrado: "Cerrado",
  incidencia: "Incidencia",
};

function getNombreContribuyente(d: Declaracion): string {
  const datos = d.datosContribuyente as Record<string, unknown> | null;
  if (!datos) return d.emailContacto || "Sin datos";
  const contrib = datos.contribuyente as Record<string, string> | undefined;
  if (contrib?.nombre) return `${contrib.nombre} ${contrib.apellidos || ""}`.trim();
  return d.emailContacto || "Sin datos";
}

function getNIF(d: Declaracion): string {
  const datos = d.datosContribuyente as Record<string, unknown> | null;
  if (!datos) return "-";
  const contrib = datos.contribuyente as Record<string, string> | undefined;
  return contrib?.nif || "-";
}

function getComunidad(d: Declaracion): string {
  const datos = d.datosContribuyente as Record<string, unknown> | null;
  if (!datos) return "-";
  return (datos.comunidad as string) || "-";
}

function getSituacion(d: Declaracion): string {
  const datos = d.datosContribuyente as Record<string, unknown> | null;
  if (!datos) return "-";
  return (datos.situacion as string) || "-";
}

function getResultado(d: Declaracion): string {
  const res = d.resultadoCalculo as Record<string, unknown> | null;
  if (!res) return "-";
  const cuota = res.cuota_diferencial as number | undefined;
  if (cuota === undefined) return "-";
  return cuota >= 0 ? `A ingresar: ${cuota.toFixed(2)}€` : `A devolver: ${Math.abs(cuota).toFixed(2)}€`;
}

export default function PanelDeclaraciones() {
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [busqueda, setBusqueda] = useState("");
  const [expedienteAbierto, setExpedienteAbierto] = useState<Declaracion | null>(null);

  const { data: declaraciones = [], isLoading, refetch } = trpc.simulador.listar.useQuery(
    { estado: filtroEstado || undefined, limit: 100, offset: 0 },
    { refetchOnWindowFocus: false }
  );

  const declaracionesFiltradas = (declaraciones as Declaracion[]).filter((d) => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      d.expedienteId.toLowerCase().includes(q) ||
      getNombreContribuyente(d).toLowerCase().includes(q) ||
      getNIF(d).toLowerCase().includes(q) ||
      (d.emailContacto || "").toLowerCase().includes(q)
    );
  });

  // Estadísticas rápidas
  const stats = {
    total: (declaraciones as Declaracion[]).length,
    pagados: (declaraciones as Declaracion[]).filter((d) => d.estado === "pagado").length,
    pendientes: (declaraciones as Declaracion[]).filter((d) => d.estado === "pendiente_pago" || d.estado === "simulacion").length,
    complejos: (declaraciones as Declaracion[]).filter((d) => d.esComplejo).length,
  };

  function exportarCSV() {
    const headers = ["Expediente", "Nombre", "NIF", "Email", "Teléfono", "Comunidad", "Situación", "Estado", "Precio€", "Resultado", "Complejo", "Fecha"];
    const rows = declaracionesFiltradas.map((d) => [
      d.expedienteId,
      getNombreContribuyente(d),
      getNIF(d),
      d.emailContacto || "",
      d.telefonoContacto || "",
      getComunidad(d),
      getSituacion(d),
      ESTADO_LABELS[d.estado] || d.estado,
      d.precioTotal ? (d.precioTotal / 100).toFixed(2) : "0",
      getResultado(d),
      d.esComplejo ? "Sí" : "No",
      new Date(d.createdAt).toLocaleDateString("es-ES"),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `declaraciones_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`CSV exportado: ${declaracionesFiltradas.length} expedientes`);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Barra superior */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          Declaraciones IRPF
          <span className="text-xs font-normal text-gray-400 ml-1">({stats.total} expedientes)</span>
        </h2>

        {/* Stats rápidas */}
        <div className="flex gap-2 ml-2">
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
            ✓ {stats.pagados} pagados
          </span>
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
            ⏳ {stats.pendientes} pendientes
          </span>
          {stats.complejos > 0 && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
              ⚠ {stats.complejos} complejos
            </span>
          )}
        </div>

        <div className="flex-1" />

        {/* Filtros */}
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 bg-white"
        >
          <option value="">Todos los estados</option>
          <option value="simulacion">Simulación</option>
          <option value="pendiente_pago">Pendiente pago</option>
          <option value="pagado">Pagado</option>
          <option value="en_proceso">En proceso</option>
          <option value="derivado_asesor">Derivado asesor</option>
          <option value="completado">Completado</option>
          <option value="cancelado">Cancelado</option>
        </select>

        <input
          type="text"
          placeholder="Buscar expediente, nombre, NIF..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="text-xs border border-gray-200 rounded px-2 py-1 w-48 text-gray-700"
        />

        <button
          onClick={() => refetch()}
          className="text-xs text-gray-500 hover:text-teal-600 border border-gray-200 px-2 py-1 rounded transition-colors"
        >
          ↻ Actualizar
        </button>

        <button
          onClick={exportarCSV}
          className="text-xs text-gray-500 hover:text-teal-600 border border-gray-200 px-2 py-1 rounded transition-colors"
        >
          ↓ CSV
        </button>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <span className="ml-2 text-sm text-gray-400">Cargando expedientes...</span>
          </div>
        ) : declaracionesFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <span className="text-3xl mb-2">📋</span>
            <p className="text-sm">No hay expedientes{filtroEstado ? ` con estado "${ESTADO_LABELS[filtroEstado] || filtroEstado}"` : ""}</p>
            {busqueda && <p className="text-xs mt-1">Prueba con otra búsqueda</p>}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">Expediente</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">Nombre / Email</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium hidden md:table-cell">NIF</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium hidden lg:table-cell">Comunidad</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium hidden lg:table-cell">Situación</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">Estado</th>
                  <th className="text-right px-3 py-2 text-gray-500 font-medium hidden md:table-cell">Precio</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium hidden xl:table-cell">Resultado</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium hidden sm:table-cell">Fecha</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {declaracionesFiltradas.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setExpedienteAbierto(d)}
                  >
                    <td className="px-3 py-2 font-mono font-semibold text-teal-700">{d.expedienteId}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-800 truncate max-w-[160px]">{getNombreContribuyente(d)}</div>
                      {d.emailContacto && <div className="text-gray-400 truncate max-w-[160px]">{d.emailContacto}</div>}
                    </td>
                    <td className="px-3 py-2 text-gray-600 hidden md:table-cell">{getNIF(d)}</td>
                    <td className="px-3 py-2 text-gray-600 hidden lg:table-cell">{getComunidad(d)}</td>
                    <td className="px-3 py-2 text-gray-600 hidden lg:table-cell">{getSituacion(d)}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${ESTADO_COLORES[d.estado] || "bg-gray-100 text-gray-600"}`}>
                        {ESTADO_LABELS[d.estado] || d.estado}
                      </span>
                      {d.esComplejo && (
                        <span className="ml-1 text-xs text-purple-500" title={d.motivoComplejidad || "Caso complejo"}>⚠</span>
                      )}
                      {d.environment === "test" && (
                        <span className="ml-1 text-xs text-gray-400">[test]</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-gray-800 hidden md:table-cell">
                      {d.precioTotal ? `${(d.precioTotal / 100).toFixed(2)}€` : "-"}
                    </td>
                    <td className="px-3 py-2 text-gray-600 hidden xl:table-cell">{getResultado(d)}</td>
                    <td className="px-3 py-2 text-gray-400 hidden sm:table-cell">
                      {new Date(d.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        className="text-teal-600 hover:text-teal-800 text-xs font-medium"
                        onClick={(e) => { e.stopPropagation(); setExpedienteAbierto(d); }}
                      >
                        Ver →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal detalle expediente */}
      {expedienteAbierto && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setExpedienteAbierto(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="font-bold text-gray-900 font-mono">{expedienteAbierto.expedienteId}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Expediente del simulador IRPF</p>
              </div>
              <button onClick={() => setExpedienteAbierto(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="p-6 space-y-5">
              {/* Estado */}
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${ESTADO_COLORES[expedienteAbierto.estado] || "bg-gray-100 text-gray-600"}`}>
                  {ESTADO_LABELS[expedienteAbierto.estado] || expedienteAbierto.estado}
                </span>
                {expedienteAbierto.esComplejo && (
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-700">⚠ Caso complejo</span>
                )}
                {expedienteAbierto.environment === "test" && (
                  <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-500">Test</span>
                )}
              </div>

              {/* Datos personales */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Datos del contribuyente</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-400">Nombre:</span> <span className="font-medium text-gray-800">{getNombreContribuyente(expedienteAbierto)}</span></div>
                  <div><span className="text-gray-400">NIF:</span> <span className="font-medium text-gray-800">{getNIF(expedienteAbierto)}</span></div>
                  <div><span className="text-gray-400">Email:</span> <span className="font-medium text-gray-800">{expedienteAbierto.emailContacto || "-"}</span></div>
                  <div><span className="text-gray-400">Teléfono:</span> <span className="font-medium text-gray-800">{expedienteAbierto.telefonoContacto || "-"}</span></div>
                  <div><span className="text-gray-400">Comunidad:</span> <span className="font-medium text-gray-800">{getComunidad(expedienteAbierto)}</span></div>
                  <div><span className="text-gray-400">Situación:</span> <span className="font-medium text-gray-800">{getSituacion(expedienteAbierto)}</span></div>
                </div>
              </div>

              {/* Resultado fiscal */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Resultado fiscal</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-400">Resultado:</span> <span className="font-semibold text-gray-800">{getResultado(expedienteAbierto)}</span></div>
                  <div><span className="text-gray-400">Precio cobrado:</span> <span className="font-semibold text-emerald-700">{expedienteAbierto.precioTotal ? `${(expedienteAbierto.precioTotal / 100).toFixed(2)}€` : "-"}</span></div>
                  {expedienteAbierto.esComplejo && expedienteAbierto.motivoComplejidad && (
                    <div className="col-span-2"><span className="text-gray-400">Motivo complejidad:</span> <span className="text-gray-700">{expedienteAbierto.motivoComplejidad}</span></div>
                  )}
                </div>
              </div>

              {/* Pago */}
              {expedienteAbierto.stripePaymentIntentId && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pago Stripe</h4>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div><span className="text-gray-400">Payment Intent:</span> <span className="font-mono text-xs text-gray-700">{expedienteAbierto.stripePaymentIntentId}</span></div>
                    {expedienteAbierto.paymentConfirmedAt && (
                      <div><span className="text-gray-400">Confirmado:</span> <span className="text-gray-700">{new Date(expedienteAbierto.paymentConfirmedAt).toLocaleString("es-ES")}</span></div>
                    )}
                  </div>
                </div>
              )}

              {/* Fechas */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Fechas</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-400">Creado:</span> <span className="text-gray-700">{new Date(expedienteAbierto.createdAt).toLocaleString("es-ES")}</span></div>
                  <div><span className="text-gray-400">Actualizado:</span> <span className="text-gray-700">{new Date(expedienteAbierto.updatedAt).toLocaleString("es-ES")}</span></div>
                </div>
              </div>

              {/* Enlace al área de cliente */}
              <div className="pt-2 border-t border-gray-100 flex gap-3">
                <a
                  href={`/mi-renta/${expedienteAbierto.expedienteId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-teal-600 hover:text-teal-800 underline"
                >
                  Ver área de cliente →
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/mi-renta/${expedienteAbierto.expedienteId}`);
                    toast.success("Enlace copiado");
                  }}
                  className="text-xs text-gray-500 hover:text-teal-600"
                >
                  📋 Copiar enlace
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
