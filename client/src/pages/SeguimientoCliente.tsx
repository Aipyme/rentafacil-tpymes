/**
 * SeguimientoCliente — Página pública de seguimiento para el cliente
 *
 * Acceso: /seguimiento?caso=RENTA-2025-XXXXXXXX
 * El cliente introduce su NIF para verificar que el caso le pertenece.
 * Una vez verificado, puede:
 *   - Ver el estado actual de su declaración
 *   - Ver qué documentos necesita aportar
 *   - Subir documentos directamente
 *   - Ver los documentos que ya ha subido
 *
 * No requiere login — solo NIF + ID de caso.
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DocumentosPanel from "@/components/DocumentosPanel";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  User,
  Mail,
  Phone,
  Building2,
  Loader2,
  Search,
  ArrowRight,
  Shield,
} from "lucide-react";

// Colores de estado
const ESTADO_CONFIG: Record<string, { color: string; icon: React.ReactNode; descripcion: string }> = {
  "Pendiente": {
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: <Clock className="w-4 h-4" />,
    descripcion: "Tu declaración está en cola. Te contactaremos pronto.",
  },
  "En proceso": {
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: <Loader2 className="w-4 h-4" />,
    descripcion: "Tu asesor está trabajando en tu declaración.",
  },
  "Revisión pendiente": {
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: <AlertCircle className="w-4 h-4" />,
    descripcion: "Tu declaración necesita revisión por un especialista.",
  },
  "Documentación pendiente": {
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: <FileText className="w-4 h-4" />,
    descripcion: "Necesitamos que aportes algunos documentos para continuar.",
  },
  "Completado": {
    color: "bg-green-100 text-green-800 border-green-200",
    icon: <CheckCircle2 className="w-4 h-4" />,
    descripcion: "Tu declaración ha sido presentada correctamente.",
  },
  "Cancelado": {
    color: "bg-gray-100 text-gray-600 border-gray-200",
    icon: <AlertCircle className="w-4 h-4" />,
    descripcion: "Este caso ha sido cancelado.",
  },
};

export default function SeguimientoCliente() {
  const [location] = useLocation();

  // Extraer casoId de la URL (?caso=RENTA-2025-XXXXXXXX)
  const params = new URLSearchParams(window.location.search);
  const casoIdUrl = params.get("caso") ?? "";

  const [casoId, setCasoId] = useState(casoIdUrl);
  const [nif, setNif] = useState("");
  const [verificado, setVerificado] = useState(false);
  const [casoData, setCasoData] = useState<any>(null);
  const [error, setError] = useState("");
  const [buscando, setBuscando] = useState(false);

  // Buscar caso por ID
  const buscarCasoMutation = trpc.casos.buscarPorId.useMutation({
    onSuccess: (data) => {
      setBuscando(false);
      if (!data.caso) {
        setError("No se encontró ningún caso con ese ID. Verifica el código e inténtalo de nuevo.");
        return;
      }
      // Verificar NIF
      const nifNormalizado = nif.trim().toUpperCase();
      const nifCaso = (data.caso.nif ?? "").trim().toUpperCase();
      if (nifNormalizado !== nifCaso) {
        setError("El NIF introducido no coincide con el registrado en este caso.");
        return;
      }
      setVerificado(true);
      setCasoData(data.caso);
      setError("");
    },
    onError: (err) => {
      setBuscando(false);
      setError(`Error al buscar el caso: ${err.message}`);
    },
  });

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!casoId.trim()) { setError("Introduce el código de tu caso"); return; }
    if (!nif.trim()) { setError("Introduce tu NIF/NIE"); return; }
    setError("");
    setBuscando(true);
    buscarCasoMutation.mutate({ casoId: casoId.trim().toUpperCase() });
  };

  const estadoConfig = casoData ? (ESTADO_CONFIG[casoData.estado] ?? ESTADO_CONFIG["Pendiente"]) : null;

  return (
    <div className="min-h-screen bg-[#f7f5f2]">
      {/* Header */}
      <header className="bg-[#1a365d] text-white py-4 px-6 shadow-md">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight">Renta Fácil TPymes</h1>
            <p className="text-white/60 text-xs">Seguimiento de tu declaración</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {!verificado ? (
          /* ── Formulario de acceso ── */
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#1a365d] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-[#1a365d] mb-2">Consulta tu caso</h2>
              <p className="text-gray-500 text-sm">
                Introduce el código de tu caso y tu NIF/NIE para acceder al seguimiento y subir documentos.
              </p>
            </div>

            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <form onSubmit={handleBuscar} className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Código de caso
                    </Label>
                    <Input
                      placeholder="Ej: RENTA-2025-MN4CXQB8"
                      value={casoId}
                      onChange={(e) => setCasoId(e.target.value.toUpperCase())}
                      className="font-mono text-sm h-10"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Lo encontrarás en el email de confirmación que recibiste.
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Tu NIF/NIE
                    </Label>
                    <Input
                      placeholder="Ej: 12345678Z"
                      value={nif}
                      onChange={(e) => setNif(e.target.value.toUpperCase())}
                      className="font-mono text-sm h-10"
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-[#059669] hover:bg-[#047857] text-white h-10"
                    disabled={buscando || buscarCasoMutation.isPending}
                  >
                    {(buscando || buscarCasoMutation.isPending) ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Buscando...</>
                    ) : (
                      <><Search className="w-4 h-4 mr-2" /> Acceder a mi caso</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <p className="text-center text-xs text-gray-400 mt-6">
              ¿Tienes alguna duda? Escríbenos a{" "}
              <a href="mailto:info@tpymes.com" className="text-[#059669] hover:underline">
                info@tpymes.com
              </a>
            </p>
          </div>
        ) : (
          /* ── Vista del caso verificado ── */
          <div className="space-y-5">
            {/* Cabecera del caso */}
            <Card className="border-0 shadow-md overflow-hidden">
              <div className="bg-[#1a365d] px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-white font-bold text-lg">{casoData.nombre}</h2>
                    <p className="text-white/60 text-xs font-mono mt-0.5">{casoData.id}</p>
                  </div>
                  <Badge
                    className={`flex items-center gap-1.5 px-3 py-1 border text-xs font-medium ${estadoConfig?.color}`}
                  >
                    {estadoConfig?.icon}
                    {casoData.estado}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-5">
                <p className="text-sm text-gray-600 mb-4">{estadoConfig?.descripcion}</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">Email</p>
                      <p className="text-sm text-gray-700 truncate">{casoData.email}</p>
                    </div>
                  </div>
                  {casoData.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">Teléfono</p>
                        <p className="text-sm text-gray-700">{casoData.telefono}</p>
                      </div>
                    </div>
                  )}
                  {casoData.asesorAsignado && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">Tu asesor</p>
                        <p className="text-sm text-gray-700 font-medium">{casoData.asesorAsignado}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Resultado final si está completado */}
                {casoData.estado === "Completado" && casoData.resultadoFinal && (
                  <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <p className="text-xs font-semibold text-emerald-700 mb-1">Resultado de tu declaración</p>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm text-emerald-800 font-medium">{casoData.resultadoFinal}</p>
                      </div>
                      {casoData.importeResultado && (
                        <div className="text-right">
                          <p className="text-2xl font-bold text-emerald-700">{casoData.importeResultado}€</p>
                        </div>
                      )}
                    </div>
                    {casoData.fechaPresentacion && (
                      <p className="text-xs text-emerald-600 mt-1">
                        Presentada el {casoData.fechaPresentacion}
                      </p>
                    )}
                  </div>
                )}

                {/* Notas del asesor para el cliente */}
                {casoData.observaciones && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Mensaje de tu asesor</p>
                    <p className="text-sm text-blue-800">{casoData.observaciones}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sección de documentos */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2 pt-5 px-5">
                <CardTitle className="text-base font-bold text-[#1a365d] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  Documentos de tu caso
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Sube aquí los documentos que necesitamos para gestionar tu declaración.
                  Formatos aceptados: PDF, imágenes (JPG, PNG), Word y Excel. Máx. 20MB por archivo.
                </p>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <DocumentosPanel
                  casoId={casoData.id}
                  subidoPor="cliente"
                  nombreUsuario={casoData.nombre}
                  documentosNecesarios={casoData.documentosNecesarios}
                  filtrarPorTipo={false}
                />
              </CardContent>
            </Card>

            {/* Botón para salir */}
            <div className="text-center pt-2">
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-gray-600 text-sm"
                onClick={() => { setVerificado(false); setCasoData(null); }}
              >
                Cerrar sesión de seguimiento
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
