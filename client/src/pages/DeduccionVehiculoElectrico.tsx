/**
 * Landing SEO: Deducción por vehículo eléctrico IRPF 2025
 * Ruta: /deducciones/vehiculo-electrico-2025
 * Normativa: DA 58ª LIRPF (RDL 5/2023, prorrogado RDL 9/2024)
 */
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  CheckCircle2, ArrowRight, Calculator, Euro,
  AlertTriangle, ChevronRight, Zap, Car, Battery,
  Clock, Shield, HelpCircle
} from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { useState } from "react";

interface FAQItem {
  pregunta: string;
  respuesta: string;
}

const FAQS: FAQItem[] = [
  {
    pregunta: "¿Qué vehículos tienen derecho a la deducción?",
    respuesta: "Turismos eléctricos nuevos (BEV), motocicletas eléctricas nuevas y cuadriciclos eléctricos ligeros nuevos. El vehículo debe ser de uso particular (no comercial ni de empresa). No aplica a vehículos de segunda mano ni a híbridos enchufables (PHEV).",
  },
  {
    pregunta: "¿Cuándo debe haberse comprado el vehículo?",
    respuesta: "La compra debe haberse formalizado entre el 30 de junio de 2023 y el 31 de diciembre de 2025. La fecha que cuenta es la del contrato de compraventa o la matrícula, la que sea anterior.",
  },
  {
    pregunta: "¿Cómo se calcula el 15%? ¿Con o sin IVA?",
    respuesta: "La deducción se aplica sobre el valor de adquisición sin IVA. Por ejemplo, si el coche costó 30.000 € (sin IVA), la deducción es 30.000 × 15% = 4.500 €, pero el límite máximo es 3.000 €, por lo que la deducción efectiva sería 3.000 €.",
  },
  {
    pregunta: "¿Hay límite de renta para aplicar la deducción?",
    respuesta: "No existe límite de renta para esta deducción. Cualquier contribuyente que haya comprado un vehículo eléctrico nuevo en el período indicado puede aplicarla, independientemente de sus ingresos.",
  },
  {
    pregunta: "¿Se puede aplicar si el vehículo es para uso mixto (trabajo y particular)?",
    respuesta: "Solo si el uso particular es predominante. Si el vehículo se usa principalmente para actividades económicas (autónomo, empresa), la deducción no aplica o se aplica de forma proporcional al uso particular.",
  },
  {
    pregunta: "¿Qué documentación necesito para justificar la deducción?",
    respuesta: "Factura de compra del vehículo con el precio sin IVA, contrato de compraventa con fecha, certificado de matrícula y, si aplica, documentación de financiación. Guarda todos estos documentos durante 4 años (plazo de prescripción de Hacienda).",
  },
  {
    pregunta: "¿Puedo aplicar también la deducción por el punto de recarga?",
    respuesta: "Sí. La DA 58ª LIRPF también permite deducir el 15% del coste de instalación de un punto de recarga en tu vivienda habitual, con un límite de 600 € de deducción (base máxima 4.000 €). Ambas deducciones son compatibles.",
  },
];

function CalculadoraVehiculo() {
  const [precio, setPrecio] = useState("");
  const precioNum = parseFloat(precio.replace(",", ".")) || 0;
  const deduccion = Math.min(precioNum * 0.15, 3000);
  const tieneResultado = precioNum > 0;

  return (
    <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-emerald-600" />
        <h3 className="font-['DM_Sans'] text-lg font-bold text-[#1a365d]">
          Calcula tu deducción
        </h3>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Precio del vehículo sin IVA (€)
        </label>
        <div className="relative">
          <input
            type="number"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            placeholder="Ej: 28.000"
            className="w-full h-12 px-4 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-400 text-lg font-semibold text-[#1a365d]"
          />
          <Euro className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>
      {tieneResultado && (
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-emerald-700">Deducción (15%)</span>
            <span className="font-bold text-emerald-700">
              {(precioNum * 0.15).toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
            </span>
          </div>
          {precioNum * 0.15 > 3000 && (
            <div className="flex items-center justify-between mb-2 text-amber-600">
              <span className="text-xs">Límite máximo aplicado</span>
              <span className="text-xs font-semibold">3.000 €</span>
            </div>
          )}
          <div className="border-t border-emerald-200 pt-2 mt-2 flex items-center justify-between">
            <span className="text-sm font-bold text-emerald-800">Tu deducción efectiva</span>
            <span className="font-['DM_Sans'] text-2xl font-bold text-emerald-700">
              {deduccion.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
            </span>
          </div>
          <p className="text-xs text-emerald-600 mt-2">
            * Estimación orientativa. El ahorro real depende de tu tipo marginal y situación fiscal.
          </p>
        </div>
      )}
      {!tieneResultado && (
        <p className="text-sm text-gray-400 text-center py-2">
          Introduce el precio para ver tu deducción estimada
        </p>
      )}
    </div>
  );
}

export default function DeduccionVehiculoElectrico() {
  const [faqAbierta, setFaqAbierta] = useState<number | null>(null);

  useSEO({
    title: "Deducción Vehículo Eléctrico IRPF 2025 | Hasta 3.000€ | Renta Fácil TPymes",
    description: "¿Has comprado un coche eléctrico en 2023-2025? Dedúcete hasta 3.000€ en la declaración de la renta. Calculadora gratuita + asesor fiscal incluido.",
    canonical: "/deducciones/vehiculo-electrico-2025",
  });

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-20 overflow-hidden bg-gradient-to-br from-[#1a365d] to-[#0f2744]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-emerald-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-48 h-48 bg-blue-400 rounded-full blur-3xl" />
        </div>
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-300">
                Nueva deducción IRPF 2025 — DA 58ª LIRPF
              </span>
            </div>
            <h1 className="font-['DM_Sans'] text-4xl sm:text-5xl lg:text-[3.2rem] font-bold text-white leading-[1.1] tracking-tight mb-6">
              Deducción por{" "}
              <span className="text-emerald-400">vehículo eléctrico</span>{" "}
              en la Renta 2025
            </h1>
            <p className="text-lg text-white/70 leading-relaxed mb-8 max-w-2xl mx-auto">
              Si compraste un coche, moto o cuadriciclo eléctrico nuevo entre el{" "}
              <strong className="text-white">30 de junio de 2023</strong> y el{" "}
              <strong className="text-white">31 de diciembre de 2025</strong>,
              puedes deducirte el <strong className="text-emerald-400">15% del precio sin IVA</strong>,
              con un máximo de <strong className="text-emerald-400">3.000 €</strong>.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/simulador">
                <Button
                  size="lg"
                  className="bg-[#059669] hover:bg-[#047857] text-white font-semibold px-8 h-12 text-base shadow-xl shadow-emerald-900/30 w-full sm:w-auto"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Simula gratis tu declaración
                </Button>
              </Link>
              <Link href="/renta">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 h-12 px-8 w-full sm:w-auto"
                >
                  Empezar ahora
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-[#f7f5f2] border-b border-gray-100">
        <div className="container py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { icono: "⚡", valor: "15%", label: "Del precio sin IVA" },
              { icono: "💰", valor: "3.000 €", label: "Máximo de deducción" },
              { icono: "🔌", valor: "600 €", label: "Adicionales por punto de recarga" },
              { icono: "📅", valor: "2023–2025", label: "Período de compra válido" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl mb-2">{stat.icono}</div>
                <p className="font-['DM_Sans'] text-2xl font-bold text-[#1a365d]">{stat.valor}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contenido principal ── */}
      <section className="py-16 lg:py-20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start max-w-5xl mx-auto">
            {/* Columna izquierda: info */}
            <div>
              <h2 className="font-['DM_Sans'] text-2xl lg:text-3xl font-bold text-[#1a365d] mb-6">
                ¿Qué vehículos dan derecho a la deducción?
              </h2>

              <div className="space-y-4 mb-8">
                {[
                  {
                    icono: <Car className="w-5 h-5 text-emerald-600" />,
                    titulo: "Turismos eléctricos nuevos (BEV)",
                    desc: "Solo vehículos 100% eléctricos de batería. Los híbridos enchufables (PHEV) no tienen derecho a esta deducción.",
                  },
                  {
                    icono: <Zap className="w-5 h-5 text-emerald-600" />,
                    titulo: "Motocicletas eléctricas nuevas",
                    desc: "Motos eléctricas de uso particular. Deben ser nuevas (no de segunda mano).",
                  },
                  {
                    icono: <Battery className="w-5 h-5 text-emerald-600" />,
                    titulo: "Cuadriciclos eléctricos ligeros",
                    desc: "Vehículos de 4 ruedas de uso particular con motor eléctrico.",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                      {item.icono}
                    </div>
                    <div>
                      <p className="font-semibold text-[#1a365d] text-sm">{item.titulo}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800 mb-1">Vehículos excluidos</p>
                    <ul className="text-xs text-amber-700 space-y-1">
                      <li>• Híbridos enchufables (PHEV) — no aplica</li>
                      <li>• Vehículos de segunda mano — no aplica</li>
                      <li>• Vehículos de empresa o uso comercial — no aplica</li>
                      <li>• Compras antes del 30/06/2023 — fuera del período</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha: calculadora */}
            <div>
              <CalculadoraVehiculo />

              <div className="mt-6 space-y-3">
                <h3 className="font-['DM_Sans'] text-lg font-bold text-[#1a365d]">
                  También puedes deducir el punto de recarga
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-800">
                        +600 € adicionales por instalar un punto de recarga
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        15% del coste de instalación de un punto de recarga en tu vivienda habitual,
                        con un máximo de 600 € (base máxima 4.000 €). Compatible con la deducción del vehículo.
                      </p>
                      <p className="text-xs text-blue-500 mt-1">DA 58ª LIRPF</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cómo declararlo ── */}
      <section className="py-14 lg:py-20 bg-[#f7f5f2]">
        <div className="container max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="font-['DM_Sans'] text-2xl lg:text-3xl font-bold text-[#1a365d] mb-3">
              Cómo declarar la deducción paso a paso
            </h2>
            <p className="text-gray-500">
              En el modelo 100 (declaración de la renta), la deducción por vehículo eléctrico
              se incluye en las casillas de deducciones estatales.
            </p>
          </div>
          <div className="space-y-4">
            {[
              {
                paso: "01",
                titulo: "Reúne la documentación",
                desc: "Factura de compra con precio sin IVA, contrato de compraventa con fecha y certificado de matrícula.",
              },
              {
                paso: "02",
                titulo: "Verifica que cumples los requisitos",
                desc: "Compra entre 30/06/2023 y 31/12/2025, vehículo nuevo 100% eléctrico, uso particular predominante.",
              },
              {
                paso: "03",
                titulo: "Calcula el importe",
                desc: "Precio sin IVA × 15%. Si supera 3.000 €, aplica el límite máximo de 3.000 €.",
              },
              {
                paso: "04",
                titulo: "Incluye la deducción en tu renta",
                desc: "En el apartado de deducciones estatales del modelo 100. Nuestro asesor lo gestiona por ti si contratas el servicio.",
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-5 p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
                <span className="font-['DM_Sans'] text-3xl font-bold text-gray-100 shrink-0 w-12 text-right">
                  {item.paso}
                </span>
                <div>
                  <p className="font-semibold text-[#1a365d] mb-1">{item.titulo}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQs ── */}
      <section className="py-14 lg:py-20 bg-white">
        <div className="container max-w-3xl">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <HelpCircle className="w-5 h-5 text-[#059669]" />
              <span className="text-xs font-semibold text-[#059669] uppercase tracking-widest">
                Preguntas frecuentes
              </span>
            </div>
            <h2 className="font-['DM_Sans'] text-2xl lg:text-3xl font-bold text-[#1a365d]">
              Todo lo que necesitas saber
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setFaqAbierta(faqAbierta === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-[#1a365d] text-sm pr-4">{faq.pregunta}</span>
                  <ChevronRight
                    className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${faqAbierta === i ? "rotate-90" : ""}`}
                  />
                </button>
                {faqAbierta === i && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-gray-600 leading-relaxed">{faq.respuesta}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="py-14 bg-gradient-to-r from-[#1a365d] to-[#2d4a7a]">
        <div className="container max-w-2xl text-center">
          <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Shield className="w-7 h-7 text-emerald-400" />
          </div>
          <h2 className="font-['DM_Sans'] text-2xl lg:text-3xl font-bold text-white mb-4">
            ¿Compraste un vehículo eléctrico en 2023–2025?
          </h2>
          <p className="text-white/70 mb-8 leading-relaxed">
            No dejes escapar hasta 3.600 € entre el vehículo y el punto de recarga.
            Simula gratis en 2 minutos y descubre exactamente cuánto puedes recuperar.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/simulador">
              <Button
                size="lg"
                className="bg-[#059669] hover:bg-[#047857] text-white font-semibold px-8 h-12 text-base w-full sm:w-auto"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Simula gratis — 2 minutos
              </Button>
            </Link>
            <Link href="/renta">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 h-12 px-8 w-full sm:w-auto"
              >
                Empezar con un asesor
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8">
            {[
              { icono: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, texto: "Análisis previo sin compromiso" },
              { icono: <Clock className="w-4 h-4 text-emerald-400" />, texto: "Precio cerrado antes de empezar" },
              { icono: <Shield className="w-4 h-4 text-emerald-400" />, texto: "Revisión humana incluida" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                {item.icono}
                <span className="text-xs text-white/50">{item.texto}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
