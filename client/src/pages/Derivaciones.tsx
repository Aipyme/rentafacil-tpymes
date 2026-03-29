/**
 * Derivaciones — Panel de gestión de expedientes complejos/derivados a asesor
 *
 * Solo accesible para asesores autenticados (misma contraseña que PanelAsesor).
 * Lee de la API: expedientes con esComplejo=true o estado derivado/derivado_asesor.
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ── Tipos ─────────────────────────────────────────────────────────────────

interface Derivacion {
  expedienteId: string;
  clienteNombre: string;
  clienteEmail: string;
  clienteTelefono: string;
  motivoDerivacion: string;
  estado: string;
  esComplejo: boolean | null;
  prioridad: string;
  asesorAsignado: string;
  solicitudId: number | null;
  solicitudEstado: string | null;
  reservedSlot: string | null;
  createdAt: string;
}

// ── Constantes ─────────────────────────────────────────────────────────────

const ESTADO_COLORES: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  contactado: "bg-blue-100 text-blue-800",
  en_gestion: "bg-purple-100 text-purple-800",
  resuelto: "bg-green-100 text-green-800",
  cancelado: "bg-gray-100 text-gray-500",
  derivado: "bg-orange-100 text-orange-800",
  derivado_asesor: "bg-orange-100 text-orange-800",
  cita_propuesta: "bg-sky-100 text-sky-800",
  cita_confirmada: "bg-indigo-100 text-indigo-800",
  en_preparacion: "bg-violet-100 text-violet-800",
};

const PRIORIDAD_COLORES: Record<string, string> = {
  Alta: "bg-red-500",
  Media: "bg-yellow-400",
  Baja: "bg-green-400",
};

function generarTokenDiario(password: string): string {
  const hoy = new Date().toISOString().slice(0, 10);
  return btoa(`${password}:${hoy}`);
}

// ── Componente principal ─────────────────────────────────────────────────

export default function Derivaciones() {
  // Auth (mismo mecanismo que PanelAsesor)
  const [panelToken, setPanelToken] = useState<string | null>(null);
  const [tokenVerificado, setTokenVerificado] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  // Asignación en línea
  const [asignandoId, setAsignandoId] = useState<number | null>(null);
  const [nuevoAsesor, setNuevoAsesor] = useState("");

  // tRPC queries & mutations
  const verifyQuery = trpc.panel.verify.useQuery(
    { token: panelToken || "" },
    { enabled: !!panelToken }
  );

  const loginMutation = trpc.panel.login.useMutation({
    onSuccess: (data) => {
      if (data.success && data.token) {
        sessionStorage.setItem("panel_token_derivaciones", data.token || "");
        setPanelToken(data.token);
        setLoginError("");
      } else {
        setLoginError("Contraseña incorrecta");
      }
    },
  });

  const derivacionesQuery = trpc.asesor.panelListarDerivaciones.useQuery(
    { estado: filtroEstado === "todos" ? undefined : filtroEstado, busqueda: busqueda || undefined },
    { enabled: tokenVerificado, refetchInterval: 30000 }
  );

  const asignarMutation = trpc.asesor.panelAsignarAsesor.useMutation({
    onSuccess: () => {
      toast.success("Asesor asignado correctamente");
      setAsignandoId(null);
      setNuevoAsesor("");
      derivacionesQuery.refetch();
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  });

  const resolverMutation = trpc.asesor.panelMarcarResuelto.useMutation({
    onSuccess: () => {
      toast.success("Marcado como resuelto");
      derivacionesQuery.refetch();
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  });

  // Verificar token almacenado al cargar
  useEffect(() => {
    const stored = sessionStorage.getItem("panel_token_derivaciones");
    if (stored) setPanelToken(stored);
  }, []);

  useEffect(() => {
    if (verifyQuery.data?.valid) {
      setTokenVerificado(true);
    } else if (verifyQuery.data && !verifyQuery.data.valid) {
      sessionStorage.removeItem("panel_token_derivaciones");
      setPanelToken(null);
      setTokenVerificado(false);
    }
  }, [verifyQuery.data]);

  // ── Login ────────────────────────────────────────────────────────────────

  if (!tokenVerificado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow p-8 w-full max-w-sm">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">🔀</span>
            <h1 className="text-xl font-bold text-gray-800">Panel de Derivaciones</h1>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loginMutation.mutate({ password: passwordInput });
            }}
            className="space-y-4"
          >
            <input
              type="password"
              placeholder="Contraseña del panel"
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
            {loginError && <p className="text-red-600 text-sm">{loginError}</p>}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loginMutation.isPending ? "Verificando..." : "Acceder"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Panel principal ──────────────────────────────────────────────────────

  const derivaciones: Derivacion[] = derivacionesQuery.data?.derivaciones || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔀</span>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Panel de Derivaciones</h1>
            <p className="text-sm text-gray-500">
              Expedientes complejos derivados a asesor
              {derivaciones.length > 0 && ` — ${derivaciones.length} expedientes`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href="/panel-asesor"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Volver al Panel
          </a>
          <button
            onClick={() => {
              sessionStorage.removeItem("panel_token_derivaciones");
              setPanelToken(null);
              setTokenVerificado(false);
            }}
            className="text-sm text-gray-500 hover:text-red-600 ml-4"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Filtros */}
      <div className="px-6 py-4 bg-white border-b flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Buscar por nombre, email, expediente, motivo..."
          className="flex-1 min-w-64 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="contactado">Contactado</option>
          <option value="en_gestion">En gestión</option>
          <option value="resuelto">Resuelto</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <button
          onClick={() => derivacionesQuery.refetch()}
          className="text-sm bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Tabla */}
      <div className="px-6 py-4">
        {derivacionesQuery.isLoading ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-3xl mb-2">⏳</div>
            Cargando derivaciones...
          </div>
        ) : derivacionesQuery.isError ? (
          <div className="text-center py-16 text-red-500">
            <div className="text-3xl mb-2">⚠️</div>
            Error al cargar: {derivacionesQuery.error?.message}
          </div>
        ) : derivaciones.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-3xl mb-2">✅</div>
            No hay derivaciones con los filtros actuales.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl shadow bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Expediente</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Motivo derivación</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Prioridad</th>
                  <th className="px-4 py-3 text-left">Asesor asignado</th>
                  <th className="px-4 py-3 text-left">Slot / Fecha</th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {derivaciones.map((d) => (
                  <tr key={d.expedienteId} className="hover:bg-gray-50 transition-colors">
                    {/* Expediente */}
                    <td className="px-4 py-3">
                      <div className="font-mono font-semibold text-blue-700 text-xs">
                        {d.expedienteId}
                      </div>
                      <div className="text-gray-400 text-xs mt-0.5">
                        {new Date(d.createdAt).toLocaleDateString("es-ES")}
                      </div>
                    </td>

                    {/* Cliente */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{d.clienteNombre || "—"}</div>
                      <div className="text-gray-500 text-xs">{d.clienteEmail}</div>
                      {d.clienteTelefono && (
                        <div className="text-gray-400 text-xs">{d.clienteTelefono}</div>
                      )}
                    </td>

                    {/* Motivo */}
                    <td className="px-4 py-3 max-w-xs">
                      <div className="text-gray-700 text-xs leading-relaxed line-clamp-3">
                        {d.motivoDerivacion || "—"}
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          ESTADO_COLORES[d.solicitudEstado || d.estado] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {d.solicitudEstado || d.estado}
                      </span>
                    </td>

                    {/* Prioridad */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${PRIORIDAD_COLORES[d.prioridad] || "bg-gray-300"}`}
                        />
                        <span className="text-xs text-gray-600">{d.prioridad}</span>
                      </div>
                    </td>

                    {/* Asesor asignado */}
                    <td className="px-4 py-3">
                      {asignandoId === d.solicitudId ? (
                        <div className="flex gap-1 items-center">
                          <input
                            type="text"
                            placeholder="Nombre del asesor"
                            className="border rounded px-2 py-1 text-xs w-32 focus:outline-none focus:ring-1 focus:ring-blue-400"
                            value={nuevoAsesor}
                            onChange={(e) => setNuevoAsesor(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && nuevoAsesor.trim() && d.solicitudId) {
                                asignarMutation.mutate({
                                  solicitudId: d.solicitudId,
                                  asesorNombre: nuevoAsesor.trim(),
                                });
                              }
                              if (e.key === "Escape") setAsignandoId(null);
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              if (nuevoAsesor.trim() && d.solicitudId) {
                                asignarMutation.mutate({
                                  solicitudId: d.solicitudId,
                                  asesorNombre: nuevoAsesor.trim(),
                                });
                              }
                            }}
                            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setAsignandoId(null)}
                            className="text-xs text-gray-400 hover:text-gray-700 px-1"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-1 cursor-pointer group"
                          onClick={() => {
                            if (d.solicitudId) {
                              setAsignandoId(d.solicitudId);
                              setNuevoAsesor(d.asesorAsignado || "");
                            }
                          }}
                          title={d.solicitudId ? "Click para editar" : "Sin solicitud de asesor"}
                        >
                          <span className="text-xs text-gray-700">
                            {d.asesorAsignado || (
                              <span className="text-gray-300 italic">Sin asignar</span>
                            )}
                          </span>
                          {d.solicitudId && (
                            <span className="text-gray-300 group-hover:text-blue-500 text-xs transition-colors ml-1">
                              ✏️
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Slot / Fecha */}
                    <td className="px-4 py-3">
                      {d.reservedSlot ? (
                        <div className="text-xs text-gray-600">
                          {new Date(d.reservedSlot).toLocaleString("es-ES", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {d.solicitudId &&
                          d.solicitudEstado !== "resuelto" &&
                          d.solicitudEstado !== "cancelado" && (
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `¿Marcar el expediente ${d.expedienteId} como resuelto?`
                                  )
                                ) {
                                  resolverMutation.mutate({ solicitudId: d.solicitudId! });
                                }
                              }}
                              disabled={resolverMutation.isPending}
                              className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              ✅ Resuelto
                            </button>
                          )}
                        <a
                          href={`/panel-asesor`}
                          className="text-xs text-blue-600 hover:underline text-center"
                        >
                          Ver expediente
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
