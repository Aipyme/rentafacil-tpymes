/**
 * MiRenta - Área de cliente para seguimiento de la declaración
 * Accesible tras el pago: muestra estado, casillas del modelo 100 e informe PDF
 */
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Loader2, CheckCircle2, Clock, FileText, Download,
  AlertTriangle, Phone, Mail, ArrowLeft, Euro,
  TrendingDown, User, Home, Heart, MapPin
} from "lucide-react";

const ESTADO_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock; desc: string }> = {
  simulacion: { label: "Simulación", color: "bg-gray-100 text-gray-600", icon: Clock, desc: "Has completado la simulación" },
  pendiente_pago: { label: "Pendiente de pago", color: "bg-amber-100 text-amber-700", icon: Clock, desc: "Completa el pago para continuar" },
  pagado: { label: "Pago recibido", color: "bg-blue-100 text-blue-700", icon: CheckCircle2, desc: "Hemos recibido tu pago. Estamos revisando tu declaración." },
  en_proceso: { label: "En proceso", color: "bg-purple-100 text-purple-700", icon: Clock, desc: "Tu declaración está siendo preparada por nuestro equipo." },
  completado: { label: "Completado", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2, desc: "Tu declaración está lista para presentar." },
  derivado: { label: "Derivado a asesor", color: "bg-orange-100 text-orange-700", icon: User, desc: "Tu caso ha sido asignado a un asesor especializado." },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-700", icon: AlertTriangle, desc: "El expediente ha sido cancelado." },
};

export default function MiRenta() {
  const { expedienteId } = useParams<{ expedienteId: string }>();
  const [, navigate] = useLocation();

  const { data: expediente, isLoading } = trpc.simulador.getExpediente.useQuery(
    { expedienteId: expedienteId || "" },
    { enabled: !!expedienteId }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f7f5f2]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#059669] mx-auto mb-3" />
            <p className="text-gray-500">Cargando tu expediente...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!expediente) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f7f5f2]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#1a365d] mb-2">Expediente no encontrado</h2>
            <p className="text-gray-500 mb-4">No hemos podido encontrar tu declaración.</p>
            <Button onClick={() => navigate("/renta")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver al simulador
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const datos = expediente.datosContribuyente as any;
  const resultado = expediente.resultadoCalculo as any;
  const suplementos = (expediente.suplementos as any[]) || [];
  const estadoInfo = ESTADO_CONFIG[expediente.estado] || ESTADO_CONFIG.simulacion;
  const EstadoIcon = estadoInfo.icon;
  const nombre = datos?.contribuyente?.nombre || "Cliente";
  const apellidos = datos?.contribuyente?.apellidos || "";
  const nif = datos?.contribuyente?.nif || "";
  const comunidad = datos?.comunidad || "";
  const precioTotal = (expediente.precioTotal || 0) / 100;

  const esPagado = ["pagado", "en_proceso", "completado", "derivado"].includes(expediente.estado);

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f5f2]">
      <Navbar />

      <main className="flex-1 pt-20 pb-16">
        <div className="container max-w-2xl">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${estadoInfo.color}`}>
                <EstadoIcon className="w-4 h-4" />
                {estadoInfo.label}
              </span>
              <span className="text-xs text-gray-400">Exp. {expedienteId}</span>
            </div>
            <h1 className="font-['DM_Sans'] text-3xl font-bold text-[#1a365d]">
              Tu declaración de la Renta 2025
            </h1>
            <p className="text-gray-500 mt-1">{estadoInfo.desc}</p>
          </div>

          {/* Alerta si no está pagado */}
          {!esPagado && expediente.estado !== "completado" && (
            <Card className="border-amber-200 bg-amber-50 mb-6">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800">Pago pendiente</p>
                  <p className="text-xs text-amber-600">Completa el pago para que gestionemos tu declaración.</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate(`/pago/${expedienteId}`)}
                  className="bg-[#059669] hover:bg-[#047857] text-white"
                >
                  Pagar ahora
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Resultado fiscal */}
          {resultado && (
            <Card className="border-0 shadow-xl shadow-gray-200/60 bg-white mb-6">
              <CardContent className="p-6">
                <h2 className="font-['DM_Sans'] text-lg font-bold text-[#1a365d] mb-4">
                  Resultado de tu declaración
                </h2>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Borrador AEAT</p>
                    <p className={`font-['DM_Sans'] text-2xl font-bold ${resultado.resultado_borrador < 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {resultado.resultado_borrador?.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                    </p>
                    <p className={`text-xs font-semibold mt-1 ${resultado.resultado_borrador < 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {resultado.resultado_borrador < 0 ? "A DEVOLVER" : "A PAGAR"}
                    </p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-4 text-center border-2 border-emerald-200">
                    <p className="text-xs text-emerald-600 uppercase tracking-wide mb-1">Con Renta Fácil</p>
                    <p className={`font-['DM_Sans'] text-2xl font-bold ${resultado.resultado < 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {resultado.resultado?.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                    </p>
                    <p className={`text-xs font-semibold mt-1 ${resultado.resultado < 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {resultado.resultado < 0 ? "A DEVOLVER" : "A PAGAR"}
                    </p>
                  </div>
                </div>

                {resultado.ahorro_vs_borrador > 0 && (
                  <div className="bg-emerald-600 rounded-xl p-4 text-white text-center">
                    <TrendingDown className="w-5 h-5 mx-auto mb-1 opacity-80" />
                    <p className="text-sm opacity-80">Ahorro conseguido</p>
                    <p className="font-['DM_Sans'] text-3xl font-bold">
                      {resultado.ahorro_vs_borrador?.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                    </p>
                  </div>
                )}

                {/* Deducciones aplicadas */}
                {resultado.desglose_deducciones?.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-[#1a365d] mb-3">Deducciones aplicadas:</h3>
                    <div className="space-y-2">
                      {resultado.desglose_deducciones.map((d: any, i: number) => (
                        <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-100">
                          <span className="text-sm text-gray-600">{d.concepto}</span>
                          <span className="text-sm font-semibold text-emerald-600">
                            -{d.importe?.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Datos del contribuyente */}
          <Card className="border-0 shadow-xl shadow-gray-200/60 bg-white mb-6">
            <CardContent className="p-6">
              <h2 className="font-['DM_Sans'] text-lg font-bold text-[#1a365d] mb-4">
                Datos del expediente
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Contribuyente</p>
                  <p className="font-semibold text-[#1a365d]">{nombre} {apellidos}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">NIF/NIE</p>
                  <p className="font-semibold text-[#1a365d]">{nif || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Comunidad</p>
                  <p className="font-semibold text-[#1a365d]">{comunidad || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Importe pagado</p>
                  <p className="font-semibold text-[#1a365d]">{precioTotal.toFixed(2)} €</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informe PDF (si está completado) */}
          {expediente.estado === "completado" && expediente.informePdfUrl && (
            <Card className="border-0 shadow-xl shadow-gray-200/60 bg-white mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#1a365d]">Informe de tu declaración</p>
                      <p className="text-xs text-gray-400">Casillas del Modelo 100 IRPF 2025</p>
                    </div>
                  </div>
                  <a href={expediente.informePdfUrl} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-[#059669] hover:bg-[#047857] text-white">
                      <Download className="w-4 h-4 mr-2" /> Descargar
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contacto */}
          <Card className="border-0 shadow-xl shadow-gray-200/60 bg-white">
            <CardContent className="p-6">
              <h2 className="font-['DM_Sans'] text-lg font-bold text-[#1a365d] mb-4">
                ¿Necesitas ayuda?
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="tel:+34900000000"
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-[#059669] hover:bg-emerald-50 transition-all"
                >
                  <Phone className="w-5 h-5 text-[#059669]" />
                  <div>
                    <p className="text-xs text-gray-400">Teléfono</p>
                    <p className="text-sm font-semibold text-[#1a365d]">900 000 000</p>
                  </div>
                </a>
                <a
                  href="mailto:info@rentafacil.es"
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-[#059669] hover:bg-emerald-50 transition-all"
                >
                  <Mail className="w-5 h-5 text-[#059669]" />
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-sm font-semibold text-[#1a365d]">info@rentafacil.es</p>
                  </div>
                </a>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>

      <Footer />
    </div>
  );
}
