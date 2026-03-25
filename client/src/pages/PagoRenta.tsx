/**
 * PagoRenta - Página de pago para la declaración de la renta
 * Conecta con Stripe Checkout (Google Pay, Apple Pay, tarjeta)
 */
import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Loader2, CreditCard, CheckCircle2, AlertTriangle,
  Shield, Lock, ArrowLeft, Euro
} from "lucide-react";

export default function PagoRenta() {
  const { expedienteId } = useParams<{ expedienteId: string }>();
  const [, navigate] = useLocation();
  const [redirecting, setRedirecting] = useState(false);

  // Verificar estado del pago (por si vuelve de Stripe)
  const { data: estadoPago, isLoading: loadingEstado } = trpc.pagos.verificarPago.useQuery(
    { expedienteId: expedienteId || "" },
    { enabled: !!expedienteId }
  );

  // Obtener datos del expediente
  const { data: expediente, isLoading: loadingExpediente } = trpc.simulador.getExpediente.useQuery(
    { expedienteId: expedienteId || "" },
    { enabled: !!expedienteId }
  );

  const crearSesionMutation = trpc.pagos.crearSesionCheckout.useMutation();

  // Si ya está pagado, redirigir al área de cliente
  useEffect(() => {
    if (estadoPago?.pagado) {
      navigate(`/mi-renta/${expedienteId}`);
    }
  }, [estadoPago?.pagado]);

  const handlePagar = async () => {
    if (!expedienteId) return;
    setRedirecting(true);
    try {
      const origin = window.location.origin;
      const res = await crearSesionMutation.mutateAsync({
        expedienteId,
        successUrl: `${origin}/mi-renta/${expedienteId}`,
        cancelUrl: `${origin}/pago/${expedienteId}`,
      });
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      }
    } catch (e) {
      console.error(e);
      setRedirecting(false);
    }
  };

  if (loadingEstado || loadingExpediente) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f7f5f2]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#059669]" />
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
            <p className="text-gray-500 mb-4">No hemos podido encontrar tu simulación.</p>
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
  const precioTotal = (expediente.precioTotal || 3900) / 100;
  const precioBase = (expediente.precioBase || 3900) / 100;
  const nombre = datos?.contribuyente?.nombre || "Cliente";

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f5f2]">
      <Navbar />

      <main className="flex-1 pt-20 pb-16">
        <div className="container max-w-lg">

          {/* Back */}
          <button
            onClick={() => navigate("/renta")}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a365d] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al simulador
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-emerald-100 rounded-full px-4 py-1.5 mb-4">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">Pago 100% seguro</span>
            </div>
            <h1 className="font-['DM_Sans'] text-3xl font-bold text-[#1a365d] mb-2">
              Finaliza tu declaración
            </h1>
            <p className="text-gray-500">
              Hola {nombre}, ya tenemos tu simulación lista. Completa el pago para que gestionemos tu declaración.
            </p>
          </div>

          {/* Resumen del pedido */}
          <Card className="border-0 shadow-xl shadow-gray-200/60 bg-white mb-6">
            <CardContent className="p-6">
              <h2 className="font-['DM_Sans'] text-lg font-bold text-[#1a365d] mb-4">
                Resumen del pedido
              </h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Declaración de la Renta 2025</span>
                  <span className="font-semibold text-[#1a365d]">{precioBase.toFixed(2)} €</span>
                </div>

                {suplementos.map((s: any, i: number) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">{s.descripcion}</span>
                    <span className="text-gray-600 text-sm">+{(s.importe / 100).toFixed(2)} €</span>
                  </div>
                ))}

                <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                  <span className="font-bold text-[#1a365d]">Total</span>
                  <span className="font-['DM_Sans'] text-2xl font-bold text-[#1a365d]">
                    {precioTotal.toFixed(2)} €
                  </span>
                </div>
              </div>

              {/* Resultado estimado */}
              {resultado && (
                <div className="bg-emerald-50 rounded-xl p-4 mb-4">
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">
                    Tu resultado estimado
                  </p>
                  <div className="flex justify-between">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-1">Borrador AEAT</p>
                      <p className={`font-bold text-lg ${resultado.resultado_borrador < 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {resultado.resultado_borrador < 0 ? "" : "+"}{resultado.resultado_borrador?.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-1">Con nosotros</p>
                      <p className={`font-bold text-lg ${resultado.resultado < 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {resultado.resultado < 0 ? "" : "+"}{resultado.resultado?.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                      </p>
                    </div>
                    {resultado.ahorro_vs_borrador > 0 && (
                      <div className="text-center">
                        <p className="text-xs text-gray-400 mb-1">Te ahorramos</p>
                        <p className="font-bold text-lg text-emerald-600">
                          {resultado.ahorro_vs_borrador?.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Botón de pago */}
              <Button
                onClick={handlePagar}
                disabled={redirecting || crearSesionMutation.isPending}
                className="w-full bg-[#059669] hover:bg-[#047857] text-white font-semibold h-14 text-base shadow-lg shadow-emerald-900/20"
              >
                {redirecting || crearSesionMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Redirigiendo al pago...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pagar {precioTotal.toFixed(2)} € ahora
                  </>
                )}
              </Button>

              {/* Métodos de pago */}
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                  <span className="text-base">G</span>
                  <span>Google Pay</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                  <span className="text-base">🍎</span>
                  <span>Apple Pay</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Tarjeta</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Garantías */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { icon: Lock, text: "Pago cifrado SSL" },
              { icon: Shield, text: "Datos protegidos RGPD" },
              { icon: CheckCircle2, text: "Garantía de satisfacción" },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-3 shadow-sm">
                <item.icon className="w-5 h-5 text-[#059669] mx-auto mb-1" />
                <p className="text-xs text-gray-500">{item.text}</p>
              </div>
            ))}
          </div>

          {/* Expediente ID */}
          <p className="text-center text-xs text-gray-300 mt-4">
            Expediente: {expedienteId}
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
