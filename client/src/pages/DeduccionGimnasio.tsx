/**
 * Landing SEO: Deducción por gimnasio y actividad física 2025
 * URL: /deducciones/gimnasio-2025
 * Target: búsquedas "deducción gimnasio renta 2025", "deducir cuota gimnasio hacienda"
 */
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import {
  CheckCircle2, AlertTriangle, ArrowRight, Euro,
  FileText, HelpCircle, TrendingDown, Calculator,
  ChevronRight
} from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "¿Qué gastos de gimnasio puedo deducir en la renta 2025?",
    a: "Puedes deducir las cuotas de gimnasio, centros deportivos, clases de yoga, pilates, natación, padel, tenis, fútbol sala, actividades de fitness y cualquier actividad deportiva reglada. También se incluyen las cuotas de clubes deportivos y las actividades extraescolares deportivas de tus hijos menores de 18 años."
  },
  {
    q: "¿Cuánto me puedo deducir por el gimnasio?",
    a: "El 15% de los gastos anuales en actividad física, con un máximo de base de 1.000 €. Esto significa un ahorro fiscal máximo de 150 € al año. Si tienes hijos menores de 18 años que también practican deporte, puedes incluir sus gastos y el límite sube a 1.000 € por cada miembro de la unidad familiar."
  },
  {
    q: "¿Necesito guardar los recibos del gimnasio?",
    a: "Sí, es imprescindible conservar todos los justificantes de pago: recibos mensuales, facturas del gimnasio, extractos bancarios o cualquier documento que acredite el gasto. La AEAT puede solicitarlos en una comprobación. Guárdalos durante al menos 4 años."
  },
  {
    q: "¿Esta deducción es para todos o solo para algunas comunidades?",
    a: "La deducción estatal por actividad física (RDL 4/2024) aplica en toda España. Adicionalmente, algunas comunidades autónomas como Madrid y la Comunitat Valenciana tienen deducciones autonómicas propias por actividad deportiva que se suman a la estatal."
  },
  {
    q: "¿Puedo deducir el gimnasio si trabajo por cuenta ajena?",
    a: "Sí. Esta deducción es para todos los contribuyentes del IRPF, independientemente de si eres asalariado, pensionista o autónomo. No tiene ningún requisito de tipo de trabajo."
  },
  {
    q: "¿Qué pasa si el gimnasio me lo paga la empresa como beneficio en especie?",
    a: "Si la empresa paga el gimnasio como retribución en especie, ese importe ya tributa como rendimiento del trabajo. En ese caso, no puedes volver a deducirlo como gasto personal. Solo puedes deducir los gastos que hayas pagado tú directamente."
  },
  {
    q: "¿Es lo mismo que la deducción por actividad física que existía antes?",
    a: "No. Antes no existía ninguna deducción estatal por gimnasio. El Real Decreto-Ley 4/2024 la creó por primera vez, aplicable desde el ejercicio 2024 (declaración que se presenta en 2025). Es una novedad importante que muchos contribuyentes desconocen."
  },
];

export default function DeduccionGimnasio() {
  useSEO({
    title: "Deducción Gimnasio Renta 2025 — ¿Puedo deducir el gimnasio? | Renta Fácil",
    description: "Nueva deducción del 15% por gimnasio y actividad física en la renta 2025 (RDL 4/2024). Hasta 150 € de ahorro. Te explicamos quién puede aplicarla, qué gastos incluye y cómo declararla.",
    canonical: "/deducciones/gimnasio-2025",
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f5f2]">
      <Navbar />

      <main className="flex-1 pt-20">

        {/* ── HERO ── */}
        <section className="bg-gradient-to-br from-[#1a365d] to-[#2d4a7a] text-white py-16 lg:py-24">
          <div className="container max-w-4xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full">
                🆕 Nueva deducción 2025
              </span>
              <span className="text-xs text-white/40">RDL 4/2024 · Aplicable desde IRPF 2024</span>
            </div>
            <h1 className="font-['DM_Sans'] text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
              ¿Puedo deducir el gimnasio<br />
              <span className="text-emerald-400">en la declaración de la renta?</span>
            </h1>
            <p className="text-lg text-white/70 leading-relaxed mb-8 max-w-2xl">
              Sí. Desde 2024 existe una nueva deducción estatal del <strong className="text-white">15% sobre los gastos
              en actividad física</strong>, incluyendo cuotas de gimnasio, clases deportivas y clubes.
              El ahorro máximo es de <strong className="text-emerald-400">150 € al año</strong>.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/renta">
                <Button
                  size="lg"
                  className="bg-[#059669] hover:bg-[#047857] text-white font-bold px-8 h-12 gap-2 w-full sm:w-auto"
                >
                  <Calculator className="w-5 h-5" />
                  Simula gratis y aplica esta deducción
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Stats rápidos */}
            <div className="grid grid-cols-3 gap-4 mt-10 pt-8 border-t border-white/10">
              {[
                { valor: "15%", label: "Porcentaje de deducción" },
                { valor: "150 €", label: "Ahorro máximo anual" },
                { valor: "1.000 €", label: "Base máxima de gastos" },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <p className="font-['DM_Sans'] text-2xl font-bold text-emerald-400">{s.valor}</p>
                  <p className="text-xs text-white/50 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── QUÉ GASTOS INCLUYE ── */}
        <section className="py-14 bg-white">
          <div className="container max-w-4xl">
            <h2 className="font-['DM_Sans'] text-2xl lg:text-3xl font-bold text-[#1a365d] mb-2">
              ¿Qué gastos puedes deducir?
            </h2>
            <p className="text-gray-500 mb-8">
              El RDL 4/2024 incluye una amplia variedad de actividades físicas y deportivas:
            </p>

            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {[
                { icono: "🏋️", label: "Cuotas mensuales de gimnasio", desc: "Cualquier centro deportivo o fitness" },
                { icono: "🧘", label: "Yoga, pilates, crossfit", desc: "Clases en estudio o centro deportivo" },
                { icono: "🎾", label: "Padel, tenis, squash", desc: "Cuotas de club o abonos de pistas" },
                { icono: "🏊", label: "Natación y acuáticas", desc: "Piscinas municipales y privadas" },
                { icono: "⚽", label: "Fútbol sala, baloncesto", desc: "Equipos federados y ligas locales" },
                { icono: "🚴", label: "Ciclismo, running, senderismo", desc: "Clubes y actividades organizadas" },
                { icono: "👶", label: "Actividades deportivas de hijos", desc: "Menores de 18 años a cargo" },
                { icono: "🥊", label: "Artes marciales, boxeo", desc: "Academias y gimnasios especializados" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-2xl shrink-0">{item.icono}</span>
                  <div>
                    <p className="text-sm font-semibold text-[#1a365d]">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-auto" />
                </div>
              ))}
            </div>

            {/* Qué NO incluye */}
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <p className="text-sm font-bold text-amber-800">¿Qué NO se puede deducir?</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {[
                  "Ropa deportiva (camisetas, zapatillas, etc.)",
                  "Equipamiento deportivo (raquetas, pesas, etc.)",
                  "Aplicaciones de fitness o streaming deportivo",
                  "Gastos de nutrición deportiva o suplementos",
                  "Gimnasio pagado por la empresa como beneficio en especie",
                  "Actividades no regladas o sin justificante de pago",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-amber-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CÓMO CALCULAR EL AHORRO ── */}
        <section className="py-14 bg-[#f7f5f2]">
          <div className="container max-w-4xl">
            <h2 className="font-['DM_Sans'] text-2xl lg:text-3xl font-bold text-[#1a365d] mb-2">
              ¿Cuánto me ahorro exactamente?
            </h2>
            <p className="text-gray-500 mb-8">
              El cálculo es sencillo: el 15% de lo que hayas gastado en actividad física durante 2025,
              con un máximo de 1.000 € de base.
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                {
                  gasto: "360 €/año",
                  desc: "30 €/mes de gimnasio",
                  ahorro: "54 €",
                  color: "border-blue-200 bg-blue-50",
                  textColor: "text-blue-700",
                },
                {
                  gasto: "600 €/año",
                  desc: "50 €/mes de gimnasio",
                  ahorro: "90 €",
                  color: "border-emerald-200 bg-emerald-50",
                  textColor: "text-emerald-700",
                  destacado: true,
                },
                {
                  gasto: "1.000 €/año",
                  desc: "Máximo deducible",
                  ahorro: "150 €",
                  color: "border-[#1a365d]/20 bg-[#1a365d]/5",
                  textColor: "text-[#1a365d]",
                },
              ].map((item, i) => (
                <Card key={i} className={`border-2 ${item.color} shadow-none`}>
                  <CardContent className="p-5 text-center">
                    <p className="text-xs text-gray-500 mb-1">Gastos anuales</p>
                    <p className="font-['DM_Sans'] text-xl font-bold text-[#1a365d] mb-1">{item.gasto}</p>
                    <p className="text-xs text-gray-400 mb-4">{item.desc}</p>
                    <div className={`rounded-lg p-3 ${item.color}`}>
                      <p className="text-xs font-semibold text-gray-500 mb-1">Ahorro fiscal</p>
                      <p className={`font-['DM_Sans'] text-2xl font-bold ${item.textColor}`}>
                        <TrendingDown className="w-4 h-4 inline mr-1" />
                        {item.ahorro}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start gap-3">
                <Euro className="w-5 h-5 text-[#059669] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-[#1a365d] mb-1">
                    Consejo: combina con deducciones autonómicas
                  </p>
                  <p className="text-sm text-gray-500">
                    Si resides en <strong>Madrid</strong> o la <strong>Comunitat Valenciana</strong>, además de la
                    deducción estatal puedes aplicar la deducción autonómica propia por actividad física.
                    En Madrid, es el 15% hasta 1.000 € adicionales. El ahorro total puede superar los 300 €.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CÓMO DECLARARLO ── */}
        <section className="py-14 bg-white">
          <div className="container max-w-4xl">
            <h2 className="font-['DM_Sans'] text-2xl lg:text-3xl font-bold text-[#1a365d] mb-2">
              ¿Cómo se declara en el Modelo 100?
            </h2>
            <p className="text-gray-500 mb-8">
              La deducción por actividad física se recoge en la casilla específica del Modelo 100 de IRPF 2025:
            </p>

            <div className="space-y-4 mb-8">
              {[
                {
                  paso: "1",
                  titulo: "Reúne los justificantes de pago",
                  desc: "Recibos mensuales del gimnasio, facturas de clases deportivas, extractos bancarios. Guárdalos todos.",
                },
                {
                  paso: "2",
                  titulo: "Suma el total de gastos del año",
                  desc: "Suma todos los pagos realizados en 2025 por actividad física. El máximo deducible es 1.000 €.",
                },
                {
                  paso: "3",
                  titulo: "Incluye el importe en la casilla correspondiente",
                  desc: "En Renta Web, busca la sección 'Deducciones generales' → 'Gastos en actividad física y deportiva' (RDL 4/2024).",
                },
                {
                  paso: "4",
                  titulo: "La deducción se aplica automáticamente",
                  desc: "El programa calculará el 15% del importe declarado y lo restará de tu cuota íntegra.",
                },
              ].map((item) => (
                <div key={item.paso} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-[#1a365d] text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {item.paso}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1a365d] mb-1">{item.titulo}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-blue-800 mb-1">Normativa de referencia</p>
                  <p className="text-sm text-blue-700">
                    Real Decreto-Ley 4/2024, de 26 de junio, por el que se prorrogan y modifican
                    determinadas medidas para hacer frente a situaciones de vulnerabilidad social y económica.
                    Disposición adicional quincuagésima octava de la LIRPF.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-14 bg-[#f7f5f2]">
          <div className="container max-w-4xl">
            <h2 className="font-['DM_Sans'] text-2xl lg:text-3xl font-bold text-[#1a365d] mb-8">
              Preguntas frecuentes
            </h2>
            <div className="space-y-4">
              {FAQ_ITEMS.map((item, i) => (
                <Card key={i} className="border-0 shadow-sm bg-white">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <HelpCircle className="w-4 h-4 text-[#059669] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-[#1a365d] mb-2">{item.q}</p>
                        <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="py-16 bg-gradient-to-br from-[#1a365d] to-[#2d4a7a] text-white">
          <div className="container max-w-2xl text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🏋️</span>
            </div>
            <h2 className="font-['DM_Sans'] text-2xl lg:text-3xl font-bold mb-4">
              ¿Tienes cuota de gimnasio?<br />
              <span className="text-emerald-400">No pierdas esta deducción.</span>
            </h2>
            <p className="text-white/70 mb-8 leading-relaxed">
              Nuestros asesores aplican automáticamente todas las deducciones a las que tienes derecho,
              incluyendo la nueva deducción por actividad física. Precio desde 39 €.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/renta">
                <Button
                  size="lg"
                  className="bg-[#059669] hover:bg-[#047857] text-white font-bold px-8 h-12 gap-2 w-full sm:w-auto"
                >
                  <Calculator className="w-5 h-5" />
                  Empezar mi declaración
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/simulador">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 h-12 gap-2 w-full sm:w-auto"
                >
                  Simular mi ahorro gratis
                </Button>
              </Link>
            </div>
            <p className="text-xs text-white/30 mt-6">
              Sin compromiso · Precio cerrado antes de empezar · Revisión humana incluida
            </p>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
