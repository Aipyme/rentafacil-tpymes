/*
 * Design: Fintech Institucional
 * Palette: Navy #1a365d, Emerald #059669, Warm gray #f7f5f2
 * Typography: DM Sans (headings) + Source Sans 3 (body)
 * Tone: Claro, honesto, sin venta agresiva
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Shield, Clock, Users, TrendingUp, CheckCircle2,
  ArrowRight, Calculator, FileText, UserCheck, Search,
  ChevronRight, MapPin, Eye, DollarSign, Layers,
  Target, Lightbulb
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useSEO } from "@/hooks/useSEO";

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1500;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {prefix}{display.toLocaleString("es-ES")}{suffix}
    </span>
  );
}

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  useSEO({
    title: "Renta Fácil TPymes — Haz tu declaración de la renta sin complicaciones",
    description: "Haz tu declaración de la renta de forma fácil, clara y sin perder tiempo. Analizamos tu caso, detectamos la complejidad y te mostramos el camino más adecuado para gestionarla con seguridad.",
    canonical: "/",
  });
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* ===== HERO ===== */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663338874301/9cYuQahZqTNwQkcjbW6hjA/hero-bg-EW7UAwQojdw6tZFEvX6PKB.webp)`,
          }}
        />
        <div className="absolute inset-0 bg-[#1a365d]/85" />

        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-white/80">
                  Renta 2025 — Campaña abril 2026
                </span>
              </div>

              <h1 className="font-['DM_Sans'] text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.1] tracking-tight mb-6">
                Haz tu declaración de la renta{" "}
                <span className="text-emerald-400">de forma fácil, clara</span>{" "}
                y sin perder tiempo
              </h1>

              <p className="text-lg text-white/70 leading-relaxed mb-8 max-w-lg">
                Analizamos tu caso, detectamos si tu declaración es sencilla o necesita
                revisión, y te mostramos el camino más adecuado para gestionarla con seguridad.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/simulador">
                  <Button
                    size="lg"
                    className="bg-[#059669] hover:bg-[#047857] text-white font-semibold px-8 h-12 text-base shadow-xl shadow-emerald-900/30 transition-all hover:-translate-y-0.5 w-full sm:w-auto"
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Simula gratis y descubre tu precio
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-6 mt-10 pt-8 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-white/50">Análisis previo sin compromiso</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-white/50">Precio cerrado antes de empezar</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-white/50 hidden sm:inline">Revisión humana cuando hace falta</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:block"
            >
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10">
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663338874301/9cYuQahZqTNwQkcjbW6hjA/simulador-illustration-HVkBRQToeTrP4Rnyjzgaqr.webp"
                  alt="Simulador de renta"
                  className="w-full max-w-sm mx-auto rounded-xl"
                />
                <div className="mt-6 text-center">
                  <p className="text-white/60 text-sm mb-2">Descubre cuánto puedes recuperar</p>
                  <p className="font-['DM_Sans'] text-3xl font-bold text-emerald-400">
                    Simula gratis en 2 min
                  </p>
                  <p className="text-white/40 text-xs mt-1">Sin compromiso · Sin coste</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="bg-white border-b border-gray-100">
        <div className="container py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: 600, suffix: "+", label: "Profesionales", icon: Users },
              { value: 20000, suffix: "+", label: "Clientes confían", icon: Shield },
              { value: 18, suffix: " años", label: "Desde 2008", icon: TrendingUp },
              { value: 98, suffix: "%", label: "Satisfacción", icon: CheckCircle2 },
            ].map((stat, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <div className="text-center">
                  <stat.icon className="w-5 h-5 text-[#059669] mx-auto mb-2" />
                  <p className="font-['DM_Sans'] text-2xl lg:text-3xl font-bold text-[#1a365d]">
                    <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BLOQUE CONFIANZA ===== */}
      <section className="py-14 lg:py-20 bg-[#f7f5f2]">
        <div className="container max-w-3xl text-center">
          <FadeUp>
            <h2 className="font-['DM_Sans'] text-2xl lg:text-3xl font-bold text-[#1a365d] mb-4">
              Un proceso más claro desde el principio
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed">
              No todas las declaraciones son iguales.
              Por eso primero analizamos tu situación y después te indicamos la mejor forma
              de gestionarla, con un precio claro antes de empezar.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ===== CÓMO FUNCIONA ===== */}
      <section id="como-funciona" className="py-16 lg:py-24 bg-white">
        <div className="container">
          <FadeUp>
            <div className="text-center mb-12 lg:mb-16">
              <span className="inline-block text-xs font-semibold text-[#059669] uppercase tracking-widest mb-3">
                Proceso
              </span>
              <h2 className="font-['DM_Sans'] text-3xl lg:text-4xl font-bold text-[#1a365d] mb-4">
                Cómo funciona
              </h2>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                icon: FileText,
                title: "Rellenas tu simulación",
                desc: "Respondes unas preguntas sencillas sobre tu situación personal y fiscal.",
                color: "bg-[#1a365d]",
              },
              {
                step: "02",
                icon: Search,
                title: "Analizamos tu caso",
                desc: "Nuestro sistema detecta el nivel de complejidad de tu declaración y revisa si hay aspectos que requieren más atención.",
                color: "bg-[#059669]",
              },
              {
                step: "03",
                icon: Eye,
                title: "Te mostramos el siguiente paso",
                desc: "Te indicamos la mejor vía para gestionarla y el precio exacto antes de que decidas seguir.",
                color: "bg-[#1a365d]",
              },
              {
                step: "04",
                icon: UserCheck,
                title: "Gestionamos tu renta",
                desc: "Si continúas, tu caso sigue el flujo adecuado: resolución directa cuando es sencillo, revisión especializada cuando hace falta.",
                color: "bg-[#059669]",
              },
            ].map((item, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <Card className="border-0 shadow-lg shadow-gray-200/50 hover:shadow-xl transition-shadow h-full bg-white">
                  <CardContent className="p-7">
                    <div className="flex items-start justify-between mb-5">
                      <div className={`w-11 h-11 rounded-xl ${item.color} flex items-center justify-center`}>
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-['DM_Sans'] text-4xl font-bold text-gray-100">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="font-['DM_Sans'] text-lg font-bold text-[#1a365d] mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </CardContent>
                </Card>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ===== POR QUÉ ES DIFERENTE ===== */}
      <section className="py-16 lg:py-24 bg-[#f7f5f2]">
        <div className="container">
          <FadeUp>
            <div className="text-center mb-12 lg:mb-16">
              <span className="inline-block text-xs font-semibold text-[#059669] uppercase tracking-widest mb-3">
                Diferente
              </span>
              <h2 className="font-['DM_Sans'] text-3xl lg:text-4xl font-bold text-[#1a365d] mb-4">
                No es solo una gestoría
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed">
                En lugar de tratar todos los casos igual, analizamos primero tu situación
                para que el proceso sea más claro, más eficiente y más ajustado a lo que realmente necesitas.
              </p>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: Search,
                title: "Análisis previo",
                desc: "Antes de empezar, evaluamos tu caso para no hacerte perder tiempo.",
              },
              {
                icon: DollarSign,
                title: "Precio claro",
                desc: "Sabes cuánto cuesta antes de continuar.",
              },
              {
                icon: Layers,
                title: "Gestión adecuada según tu caso",
                desc: "Las declaraciones sencillas siguen una vía más ágil. Las más complejas reciben revisión cuando de verdad hace falta.",
              },
            ].map((item, i) => (
              <FadeUp key={i} delay={i * 0.12}>
                <Card className="border-0 shadow-lg shadow-gray-200/50 h-full bg-white">
                  <CardContent className="p-8 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
                      <item.icon className="w-6 h-6 text-[#059669]" />
                    </div>
                    <h3 className="font-['DM_Sans'] text-lg font-bold text-[#1a365d] mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </CardContent>
                </Card>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PARA QUIÉN ES ===== */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <FadeUp>
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663338874301/9cYuQahZqTNwQkcjbW6hjA/trust-section-TwVGpinYHUgi8fYwEqW7Pv.webp"
                alt="Persona gestionando su renta"
                className="rounded-2xl shadow-2xl shadow-gray-200/50 w-full"
              />
            </FadeUp>

            <div>
              <FadeUp>
                <span className="inline-block text-xs font-semibold text-[#059669] uppercase tracking-widest mb-3">
                  Para ti
                </span>
                <h2 className="font-['DM_Sans'] text-3xl lg:text-4xl font-bold text-[#1a365d] mb-5">
                  ¿Para quién es este servicio?
                </h2>
                <p className="text-gray-500 mb-8 leading-relaxed">
                  Este servicio está pensado para personas que quieren resolver su declaración
                  de la renta con más claridad, menos fricción y un proceso bien guiado desde el inicio.
                </p>
              </FadeUp>

              <FadeUp delay={0.15}>
                <p className="font-['DM_Sans'] font-semibold text-[#1a365d] mb-4">
                  Ideal si:
                </p>
                <div className="space-y-4">
                  {[
                    "Quieres saber rápidamente si tu caso es sencillo o no",
                    "No quieres empezar sin saber cuánto te va a costar",
                    "Buscas una forma más clara de gestionar tu renta",
                    "Valoras tener apoyo cuando tu caso lo necesita",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#059669] mt-0.5 shrink-0" />
                      <span className="text-gray-600">{item}</span>
                    </div>
                  ))}
                </div>
              </FadeUp>

              <FadeUp delay={0.3}>
                <div className="mt-8">
                  <Link href="/simulador">
                    <Button className="bg-[#059669] hover:bg-[#047857] text-white font-semibold px-8 h-12 shadow-lg shadow-emerald-200/50">
                      <Calculator className="w-4 h-4 mr-2" />
                      Simula gratis y descubre tu precio
                    </Button>
                  </Link>
                </div>
              </FadeUp>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRECIOS ===== */}
      <section id="precios" className="py-16 lg:py-24 bg-[#f7f5f2]">
        <div className="container max-w-3xl">
          <FadeUp>
            <div className="text-center">
              <span className="inline-block text-xs font-semibold text-[#059669] uppercase tracking-widest mb-3">
                Precios
              </span>
              <h2 className="font-['DM_Sans'] text-3xl lg:text-4xl font-bold text-[#1a365d] mb-5">
                Precio ajustado a tu caso
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
                No todas las declaraciones son iguales. Por eso, primero analizamos tu situación
                y, antes de empezar, te mostramos un precio cerrado según la complejidad de tu caso.
              </p>
            </div>
          </FadeUp>

          <FadeUp delay={0.15}>
            <Card className="border-0 shadow-xl shadow-gray-200/50 bg-white overflow-hidden">
              <CardContent className="p-8 md:p-10">
                <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
                  <div className="flex-1 space-y-4">
                    {[
                      { text: "Precio cerrado antes de empezar" },
                      { text: "Sin sorpresas" },
                      { text: "Sin compromiso inicial" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0" />
                        <span className="text-[#1a365d] font-medium">{item.text}</span>
                      </div>
                    ))}
                  </div>
                  <div className="shrink-0">
                    <Link href="/simulador">
                      <Button
                        size="lg"
                        className="bg-[#059669] hover:bg-[#047857] text-white font-semibold px-8 h-13 text-base shadow-xl shadow-emerald-200/50 transition-all hover:-translate-y-0.5 w-full md:w-auto"
                      >
                        <Calculator className="w-4 h-4 mr-2" />
                        Simula gratis y descubre tu precio
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeUp>
        </div>
      </section>

      {/* ===== TU COMUNIDAD ===== */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container">
          <FadeUp>
            <div className="text-center mb-12 lg:mb-16">
              <span className="inline-block text-xs font-semibold text-[#059669] uppercase tracking-widest mb-3">
                Tu comunidad
              </span>
              <h2 className="font-['DM_Sans'] text-3xl lg:text-4xl font-bold text-[#1a365d] mb-4">
                Expertos en la normativa de tu comunidad
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Cada comunidad autónoma tiene sus propias deducciones y tramos fiscales.
                Nuestros asesores conocen las particularidades de cada una.
              </p>
            </div>
          </FadeUp>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: "Andalucía",
                href: "/andalucia",
                deducciones: 8,
                destacado: "Hasta 600€ por alquiler",
                color: "from-yellow-400 to-orange-500",
                iconBg: "bg-yellow-50",
                iconColor: "text-yellow-600",
              },
              {
                name: "Comunidad de Madrid",
                href: "/madrid",
                deducciones: 8,
                destacado: "Tipos más bajos de España",
                color: "from-red-400 to-red-600",
                iconBg: "bg-red-50",
                iconColor: "text-red-600",
              },
              {
                name: "Catalunya",
                href: "/cataluna",
                deducciones: 8,
                destacado: "Hasta 6.000€ ángel inversor",
                color: "from-amber-400 to-red-500",
                iconBg: "bg-amber-50",
                iconColor: "text-amber-600",
              },
              {
                name: "Comunitat Valenciana",
                href: "/valencia",
                deducciones: 8,
                destacado: "Hasta 800€ por tercer hijo",
                color: "from-orange-400 to-orange-600",
                iconBg: "bg-orange-50",
                iconColor: "text-orange-600",
              },
            ].map((region, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <Link href={region.href}>
                  <Card className="border-0 shadow-lg shadow-gray-200/50 hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer h-full bg-white group overflow-hidden">
                    <div className={`h-1.5 bg-gradient-to-r ${region.color}`} />
                    <CardContent className="p-6">
                      <div className={`w-10 h-10 rounded-lg ${region.iconBg} flex items-center justify-center mb-4`}>
                        <MapPin className={`w-5 h-5 ${region.iconColor}`} />
                      </div>
                      <h3 className="font-['DM_Sans'] font-bold text-[#1a365d] text-lg mb-1 group-hover:text-[#059669] transition-colors">
                        {region.name}
                      </h3>
                      <p className="text-xs text-gray-400 mb-3">
                        {region.deducciones} deducciones autonómicas
                      </p>
                      <p className="text-sm text-[#059669] font-medium mb-4">
                        {region.destacado}
                      </p>
                      <span className="inline-flex items-center text-xs font-semibold text-[#1a365d] group-hover:text-[#059669] transition-colors">
                        Ver deducciones y tramos
                        <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              </FadeUp>
            ))}
          </div>

          <FadeUp delay={0.4}>
            <p className="text-center text-sm text-gray-400 mt-8">
              Próximamente: País Vasco, Galicia, Canarias y más comunidades.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ===== BLOQUE TRANQUILIDAD ===== */}
      <section className="py-14 lg:py-20 bg-[#f7f5f2]">
        <div className="container max-w-3xl text-center">
          <FadeUp>
            <Lightbulb className="w-8 h-8 text-[#059669] mx-auto mb-4" />
            <h2 className="font-['DM_Sans'] text-2xl lg:text-3xl font-bold text-[#1a365d] mb-4">
              Más claridad. Menos dudas. Mejor desde el principio.
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed">
              La mayoría de los problemas en este tipo de servicios empiezan cuando nadie
              distingue bien entre un caso sencillo y uno complejo. Aquí el proceso empieza
              justo al revés: primero analizamos, luego te orientamos, y solo después decides continuar.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="py-16 lg:py-24 bg-[#1a365d] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400 rounded-full blur-[120px]" />
        </div>
        <div className="container relative z-10 text-center">
          <FadeUp>
            <h2 className="font-['DM_Sans'] text-3xl lg:text-5xl font-bold text-white mb-6 max-w-3xl mx-auto leading-tight">
              Descubre en minutos cómo gestionar tu renta y cuánto te costará
            </h2>
            <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
              Haz la simulación gratuita y te diremos cuál es la mejor vía para tu caso,
              con un precio claro antes de empezar.
            </p>
            <Link href="/simulador">
              <Button
                size="lg"
                className="bg-[#059669] hover:bg-[#047857] text-white font-semibold px-10 h-13 text-base shadow-xl shadow-emerald-900/30"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Simular mi renta gratis
              </Button>
            </Link>
            <p className="text-white/40 text-sm mt-4">
              Sin compromiso inicial · Precio claro antes de seguir
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container max-w-3xl">
          <FadeUp>
            <h2 className="font-['DM_Sans'] text-3xl font-bold text-[#1a365d] text-center mb-12">
              Preguntas frecuentes
            </h2>
          </FadeUp>
          <div className="space-y-4">
            {[
              {
                q: "¿La simulación es gratuita?",
                a: "Sí. Puedes completar la simulación sin compromiso para que analicemos tu caso y te indiquemos el siguiente paso.",
              },
              {
                q: "¿Cuándo sabré cuánto cuesta?",
                a: "Antes de empezar. Al finalizar la simulación te mostraremos el precio exacto según la complejidad de tu declaración.",
              },
              {
                q: "¿Todas las rentas cuestan lo mismo?",
                a: "No. Cada caso es diferente, por eso primero analizamos tu situación antes de fijar un precio.",
              },
              {
                q: "¿Qué pasa si mi caso es más complejo?",
                a: "Si tu declaración requiere una revisión más específica, te indicaremos la vía adecuada para gestionarla correctamente.",
              },
              {
                q: "¿Tengo que pagar para saber si me interesa?",
                a: "No. Primero simulas, ves el precio y entiendes el siguiente paso. Después decides.",
              },
              {
                q: "¿Qué necesito para empezar?",
                a: "Solo completar la simulación con tu información básica. Si decides continuar, ya te indicaremos qué documentación hace falta.",
              },
            ].map((faq, i) => (
              <FadeUp key={i} delay={i * 0.05}>
                <details className="group border border-gray-100 rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors">
                    <span className="font-['DM_Sans'] font-semibold text-[#1a365d] text-sm pr-4">
                      {faq.q}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-90 shrink-0" />
                  </summary>
                  <div className="px-5 pb-5 text-sm text-gray-500 leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
