/*
 * Design: Fintech Institucional
 * Palette: Navy #1a365d, Emerald #059669, Warm gray #f7f5f2
 * Typography: DM Sans (headings) + Source Sans 3 (body)
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Shield, Clock, Users, TrendingUp, CheckCircle2,
  ArrowRight, Calculator, FileText, UserCheck, Zap,
  Phone, Mail, ChevronRight
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
    description: "Descubre en 2 minutos cuánto te devuelve Hacienda. Simulador gratuito de IRPF 2025 + gestión completa de tu declaración con el respaldo de más de 600 profesionales de Ayuda T Pymes.",
    canonical: "/",
  });
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* ===== HERO ===== */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663338874301/9cYuQahZqTNwQkcjbW6hjA/hero-bg-EW7UAwQojdw6tZFEvX6PKB.webp)`,
          }}
        />
        <div className="absolute inset-0 bg-[#1a365d]/85" />

        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Copy */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-white/80">
                  Campaña Renta 2025 — Desde el 8 de abril
                </span>
              </div>

              <h1 className="font-['DM_Sans'] text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.1] tracking-tight mb-6">
                Descubre en 2 minutos{" "}
                <span className="text-emerald-400">cuánto te devuelve</span>{" "}
                Hacienda
              </h1>

              <p className="text-lg text-white/70 leading-relaxed mb-8 max-w-lg">
                Simulador gratuito + gestión completa de tu declaración. 
                Con el respaldo de más de 600 profesionales de Ayuda T Pymes.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/simulador">
                  <Button
                    size="lg"
                    className="bg-[#059669] hover:bg-[#047857] text-white font-semibold px-8 h-12 text-base shadow-xl shadow-emerald-900/30 transition-all hover:-translate-y-0.5 w-full sm:w-auto"
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Simular gratis
                  </Button>
                </Link>
                <Link href="/empezar">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 font-semibold px-8 h-12 text-base w-full sm:w-auto"
                  >
                    Hacer mi renta
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-6 mt-10 pt-8 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-white/50">Datos protegidos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-white/50">+20.000 clientes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-white/50">Alianza BBVA</span>
                </div>
              </div>
            </motion.div>

            {/* Right: Quick Preview Card */}
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
                  <p className="text-white/60 text-sm mb-2">Devolución media estimada</p>
                  <p className="font-['DM_Sans'] text-4xl font-bold text-emerald-400">
                    <AnimatedNumber value={1847} prefix="€" />
                  </p>
                  <p className="text-white/40 text-xs mt-1">Basado en rentas simples procesadas</p>
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
              { value: 15, suffix: " años", label: "De experiencia", icon: TrendingUp },
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

      {/* ===== CÓMO FUNCIONA ===== */}
      <section id="como-funciona" className="py-16 lg:py-24 bg-[#f7f5f2]">
        <div className="container">
          <FadeUp>
            <div className="text-center mb-12 lg:mb-16">
              <span className="inline-block text-xs font-semibold text-[#059669] uppercase tracking-widest mb-3">
                Proceso
              </span>
              <h2 className="font-['DM_Sans'] text-3xl lg:text-4xl font-bold text-[#1a365d] mb-4">
                Tu renta en 3 pasos simples
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Hemos simplificado el proceso al máximo. Tú pones los datos, 
                nosotros nos encargamos de todo lo demás.
              </p>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                step: "01",
                icon: FileText,
                title: "Comprueba tu caso",
                desc: "Responde unas preguntas rápidas. En 2 minutos sabemos si tu renta es simple y cuánto podrías recuperar.",
                color: "bg-[#1a365d]",
              },
              {
                step: "02",
                icon: Calculator,
                title: "Sube tu documentación",
                desc: "Te decimos exactamente qué documentos necesitas. Súbelos y nuestro sistema los procesa automáticamente.",
                color: "bg-[#059669]",
              },
              {
                step: "03",
                icon: UserCheck,
                title: "Un experto revisa y presenta",
                desc: "Un asesor fiscal profesional revisa tu declaración, la optimiza y la presenta ante la AEAT.",
                color: "bg-[#1a365d]",
              },
            ].map((item, i) => (
              <FadeUp key={i} delay={i * 0.15}>
                <Card className="border-0 shadow-lg shadow-gray-200/50 hover:shadow-xl transition-shadow h-full bg-white">
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center`}>
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-['DM_Sans'] text-5xl font-bold text-gray-100">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="font-['DM_Sans'] text-xl font-bold text-[#1a365d] mb-3">
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

          <FadeUp delay={0.4}>
            <div className="text-center mt-10">
              <Link href="/empezar">
                <Button className="bg-[#059669] hover:bg-[#047857] text-white font-semibold px-8 h-12 shadow-lg shadow-emerald-200/50">
                  Empezar ahora
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ===== POR QUÉ NOSOTROS ===== */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <FadeUp>
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663338874301/9cYuQahZqTNwQkcjbW6hjA/trust-section-TwVGpinYHUgi8fYwEqW7Pv.webp"
                alt="Oficina profesional"
                className="rounded-2xl shadow-2xl shadow-gray-200/50 w-full"
              />
            </FadeUp>

            <div>
              <FadeUp>
                <span className="inline-block text-xs font-semibold text-[#059669] uppercase tracking-widest mb-3">
                  Ventajas
                </span>
                <h2 className="font-['DM_Sans'] text-3xl lg:text-4xl font-bold text-[#1a365d] mb-6">
                  Automatización con respaldo humano real
                </h2>
                <p className="text-gray-500 mb-8 leading-relaxed">
                  A diferencia de otras plataformas, no te dejamos solo con un algoritmo. 
                  Cada declaración es revisada por un asesor fiscal profesional de nuestro equipo.
                </p>
              </FadeUp>

              <div className="space-y-5">
                {[
                  {
                    icon: Zap,
                    title: "Tecnología + Humano",
                    desc: "IA para el análisis rápido, asesor humano para la revisión final.",
                  },
                  {
                    icon: Shield,
                    title: "Máxima seguridad",
                    desc: "Tus datos están protegidos con encriptación de nivel bancario.",
                  },
                  {
                    icon: TrendingUp,
                    title: "Optimización fiscal",
                    desc: "Encontramos deducciones que quizás no conocías. De media, +€340 extra.",
                  },
                  {
                    icon: Phone,
                    title: "Soporte real",
                    desc: "Si tienes dudas, un profesional te atiende. Nada de chatbots.",
                  },
                ].map((item, i) => (
                  <FadeUp key={i} delay={i * 0.1}>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                        <item.icon className="w-5 h-5 text-[#059669]" />
                      </div>
                      <div>
                        <h4 className="font-['DM_Sans'] font-semibold text-[#1a365d] mb-1">
                          {item.title}
                        </h4>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                  </FadeUp>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRECIOS ===== */}
      <section id="precios" className="py-16 lg:py-24 bg-[#f7f5f2]">
        <div className="container">
          <FadeUp>
            <div className="text-center mb-12">
              <span className="inline-block text-xs font-semibold text-[#059669] uppercase tracking-widest mb-3">
                Precios
              </span>
              <h2 className="font-['DM_Sans'] text-3xl lg:text-4xl font-bold text-[#1a365d] mb-4">
                Transparentes y sin sorpresas
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                Precio fijo. Sin letra pequeña. Solo pagas si presentamos tu declaración.
              </p>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                name: "Renta Simple",
                price: "49",
                desc: "1 pagador, sin inmuebles ni inversiones",
                features: [
                  "Simulación gratuita",
                  "Recogida automática de datos",
                  "Revisión por asesor",
                  "Presentación ante AEAT",
                  "Soporte por email",
                ],
                cta: "Empezar",
                popular: false,
              },
              {
                name: "Renta Estándar",
                price: "69",
                desc: "2 pagadores, inmuebles o deducciones especiales",
                features: [
                  "Todo lo de Renta Simple",
                  "Análisis de deducciones autonómicas",
                  "Optimización fiscal avanzada",
                  "Soporte prioritario",
                  "Informe fiscal personalizado",
                ],
                cta: "Empezar",
                popular: true,
              },
              {
                name: "Renta Premium",
                price: "99",
                desc: "Casos complejos, inversiones, alquileres",
                features: [
                  "Todo lo de Renta Estándar",
                  "Asesor fiscal dedicado",
                  "Consulta telefónica incluida",
                  "Planificación fiscal futura",
                  "Revisión de años anteriores",
                ],
                cta: "Empezar",
                popular: false,
              },
            ].map((plan, i) => (
              <FadeUp key={i} delay={i * 0.15}>
                <Card
                  className={`border-0 h-full relative overflow-hidden ${
                    plan.popular
                      ? "shadow-2xl shadow-emerald-200/40 ring-2 ring-[#059669]"
                      : "shadow-lg shadow-gray-200/50"
                  } bg-white`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-[#059669] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                      Popular
                    </div>
                  )}
                  <CardContent className="p-8">
                    <h3 className="font-['DM_Sans'] font-bold text-[#1a365d] text-lg mb-1">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">{plan.desc}</p>
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="font-['DM_Sans'] text-4xl font-bold text-[#1a365d]">
                        €{plan.price}
                      </span>
                      <span className="text-sm text-gray-400">/declaración</span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-2.5 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-[#059669] mt-0.5 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href="/empezar">
                      <Button
                        className={`w-full font-semibold h-11 ${
                          plan.popular
                            ? "bg-[#059669] hover:bg-[#047857] text-white shadow-lg shadow-emerald-200/50"
                            : "bg-[#1a365d] hover:bg-[#1a365d]/90 text-white"
                        }`}
                      >
                        {plan.cta}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </FadeUp>
            ))}
          </div>
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
            <h2 className="font-['DM_Sans'] text-3xl lg:text-5xl font-bold text-white mb-6 max-w-2xl mx-auto leading-tight">
              ¿Listo para recuperar lo que es tuyo?
            </h2>
            <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
              La campaña de la Renta 2025 empieza el 8 de abril. 
              Comprueba gratis cuánto te devuelven.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/simulador">
                <Button
                  size="lg"
                  className="bg-[#059669] hover:bg-[#047857] text-white font-semibold px-10 h-13 text-base shadow-xl shadow-emerald-900/30 w-full sm:w-auto"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Simular gratis
                </Button>
              </Link>
              <Link href="/empezar">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 font-semibold px-10 h-13 text-base w-full sm:w-auto"
                >
                  Contratar servicio
                </Button>
              </Link>
            </div>
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
                q: "¿Quién revisa mi declaración?",
                a: "Un asesor fiscal profesional de Ayuda T Pymes, con más de 15 años de experiencia. No es solo un algoritmo: hay una persona real detrás.",
              },
              {
                q: "¿Qué pasa si mi caso es complejo?",
                a: "Nuestro sistema de triage detecta automáticamente los casos complejos y los deriva a un asesor especializado. Te informamos antes de cobrar nada.",
              },
              {
                q: "¿Cuándo empieza la campaña de la Renta 2025?",
                a: "La presentación online comienza el 8 de abril de 2026 y finaliza el 30 de junio de 2026. Puedes empezar a preparar tu documentación desde ya.",
              },
              {
                q: "¿Es seguro subir mis documentos?",
                a: "Absolutamente. Utilizamos encriptación de nivel bancario y cumplimos con el RGPD. Tus datos nunca se comparten con terceros.",
              },
              {
                q: "¿Puedo hacer la declaración conjunta?",
                a: "Sí. Nuestro sistema analiza si te conviene más la declaración individual o conjunta y te recomienda la opción más favorable.",
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
