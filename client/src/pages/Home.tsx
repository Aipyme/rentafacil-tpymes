/*
 * Design: Premium Fintech Institucional v2
 * Palette: Navy #1a365d, Emerald #059669, Warm bg #f6f9fc
 * Copy: Premium definitivo — tono sereno, claro, sin venta agresiva
 */
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import { useState } from "react";
import {
  Shield, Clock, Users, TrendingUp, CheckCircle2,
  ArrowRight, FileText, Search, Eye, UserCheck,
  Briefcase, AlertCircle, ChevronDown,
} from "lucide-react";

function HeroSection() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at top right, rgba(16,185,129,.13), transparent 30%), radial-gradient(circle at left center, rgba(26,54,93,.07), transparent 35%), linear-gradient(180deg,#ffffff 0%,#f7fbff 100%)",
        padding: "72px 0 56px",
      }}
    >
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-10 items-center" style={{ maxWidth: 1180, margin: "0 auto" }}>
          {/* LEFT */}
          <div>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-5"
              style={{ background: "#eaf7f2", color: "#059669" }}
            >
              <Clock className="w-3.5 h-3.5" />
              Simulación inicial gratuita
            </div>

            <h1
              className="font-bold leading-none tracking-tight mb-4"
              style={{ fontSize: "clamp(40px,5vw,64px)", letterSpacing: "-0.05em", color: "#1a365d", lineHeight: 0.98 }}
            >
              Tu renta, clara<br />
              <span style={{ color: "#059669" }}>desde el principio</span>
            </h1>

            <p className="mb-7" style={{ fontSize: 19, color: "#5b677a", maxWidth: 560 }}>
              Descubre si tu caso encaja, qué documentación necesitas y cómo avanzar antes de contratar.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/empezar">
                <Button
                  size="lg"
                  className="font-bold px-7 text-base"
                  style={{
                    background: "linear-gradient(135deg,#059669,#10b981)",
                    color: "#fff",
                    boxShadow: "0 10px 24px rgba(5,150,105,.22)",
                    border: "none",
                    height: 52,
                  }}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Simula gratis y descubre tu precio
                </Button>
              </Link>
              <a href="#como-funciona">
                <Button
                  size="lg"
                  variant="outline"
                  className="font-bold px-7 text-base"
                  style={{ color: "#1a365d", borderColor: "#e6edf5", background: "#fff", height: 52 }}
                >
                  Ver cómo funciona
                </Button>
              </a>
            </div>

            <p className="mt-4 text-sm font-semibold" style={{ color: "#66758b" }}>
              Sin compromiso · Precio claro antes de avanzar · Si tu caso necesita revisión, te lo diremos desde el inicio
            </p>
          </div>

          {/* RIGHT */}
          <div className="hidden lg:block">
            <div
              className="rounded-3xl p-7"
              style={{
                background: "rgba(255,255,255,.86)",
                border: "1px solid rgba(230,237,245,.95)",
                boxShadow: "0 12px 40px rgba(26,54,93,.10)",
              }}
            >
              <h3 className="font-bold mb-5" style={{ fontSize: 22, color: "#1a365d", letterSpacing: "-0.02em" }}>
                ¿Qué vas a conseguir al empezar?
              </h3>
              <div className="flex flex-col gap-3">
                {[
                  { n: "1", title: "Entender si tu caso encaja", desc: "Antes de tomar decisiones, sabrás cómo se puede gestionar tu expediente." },
                  { n: "2", title: "Ver el siguiente paso con claridad", desc: "Te indicaremos la documentación y el recorrido adecuado para avanzar." },
                  { n: "3", title: "Conocer el precio antes de contratar", desc: "Sin sorpresas al final y con revisión cuando el caso lo necesite." },
                ].map(item => (
                  <div
                    key={item.n}
                    className="flex gap-3 items-start p-3.5 rounded-2xl"
                    style={{ border: "1px solid #e6edf5", background: "#fff" }}
                  >
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-xl grid place-items-center font-bold text-sm"
                      style={{ background: "#edf7f3", color: "#059669" }}
                    >
                      {item.n}
                    </div>
                    <div>
                      <strong className="block text-sm mb-0.5" style={{ color: "#1a365d" }}>{item.title}</strong>
                      <span className="text-sm" style={{ color: "#5b677a" }}>{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  const stats = [
    { icon: Users, value: "600+", label: "Profesionales" },
    { icon: Shield, value: "20.000+", label: "Clientes confían" },
    { icon: TrendingUp, value: "18 años", label: "Desde 2008" },
    { icon: CheckCircle2, value: "98%", label: "Satisfacción" },
  ];
  return (
    <section style={{ background: "#fff", borderBottom: "1px solid #e6edf5" }}>
      <div className="container py-8" style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <s.icon className="w-5 h-5 mx-auto mb-2" style={{ color: "#059669" }} />
              <p className="font-bold text-2xl lg:text-3xl" style={{ color: "#1a365d", letterSpacing: "-0.03em" }}>{s.value}</p>
              <p className="text-sm mt-1" style={{ color: "#5b677a" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  const pillars = [
    { icon: "✓", title: "Simulación inicial gratuita", desc: "Empiezas sin compromiso y con una visión clara desde el principio." },
    { icon: "✓", title: "Clasificación del caso", desc: "Valoramos cómo encaja tu expediente antes de pedirte que avances." },
    { icon: "✓", title: "Precio claro antes de continuar", desc: "Sabrás cuál es el siguiente paso y qué implica antes de contratar." },
    { icon: "✓", title: "Revisión cuando hace falta", desc: "Si tu caso necesita una validación adicional, te lo diremos con claridad." },
  ];
  return (
    <section style={{ padding: "84px 0", background: "#f6f9fc" }}>
      <div className="container" style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-5" style={{ background: "#eaf7f2", color: "#059669" }}>
          Confianza y claridad
        </div>
        <h2 className="font-bold mb-4" style={{ fontSize: "clamp(30px,4vw,46px)", letterSpacing: "-0.03em", color: "#1a365d", lineHeight: 1.08 }}>
          Primero entendemos tu caso.<br />Después te decimos cómo avanzar.
        </h2>
        <p className="mb-10" style={{ color: "#5b677a", fontSize: 18, maxWidth: 760 }}>
          Renta Fácil TPymes está pensado para ayudarte a dar el primer paso con claridad. Empiezas con una simulación sencilla, analizamos tu situación y te indicamos si tu caso encaja, qué documentación hará falta y cuál es el siguiente paso.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {pillars.map((p, i) => (
            <div key={i} className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #e6edf5", boxShadow: "0 12px 40px rgba(26,54,93,.07)" }}>
              <div className="w-12 h-12 rounded-2xl grid place-items-center font-bold mb-4 text-lg" style={{ background: "#eef4fb", color: "#1a365d" }}>
                {p.icon}
              </div>
              <h3 className="font-bold mb-2" style={{ fontSize: 18, color: "#1a365d", letterSpacing: "-0.02em" }}>{p.title}</h3>
              <p style={{ color: "#5b677a", fontSize: 15 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: FileText, title: "Nos cuentas tu situación", desc: "Empiezas con una simulación breve para entender tu caso. Sin datos sensibles. Sin login." },
    { icon: Search, title: "Analizamos si encaja", desc: "Revisamos la información y valoramos cómo debe gestionarse tu expediente." },
    { icon: Eye, title: "Te mostramos el siguiente paso", desc: "Te indicamos documentación, encaje y precio exacto antes de contratar." },
    { icon: UserCheck, title: "Seguimos el expediente contigo", desc: "Si avanzas, tendrás un proceso claro, seguimiento ordenado y revisión cuando haga falta." },
  ];
  return (
    <section id="como-funciona" style={{ padding: "84px 0", background: "#fff" }}>
      <div className="container" style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-5" style={{ background: "#eaf7f2", color: "#059669" }}>
          Cómo funciona
        </div>
        <h2 className="font-bold mb-4" style={{ fontSize: "clamp(30px,4vw,46px)", letterSpacing: "-0.03em", color: "#1a365d", lineHeight: 1.08 }}>
          Un proceso pensado para que entiendas<br className="hidden lg:block" /> tu caso antes de decidir
        </h2>
        <p className="mb-10" style={{ color: "#5b677a", fontSize: 18, maxWidth: 760 }}>
          Sin complicaciones innecesarias. Sin avanzar a ciegas. Sin sorpresas al final.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s, i) => (
            <div key={i} className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #e6edf5", boxShadow: "0 12px 40px rgba(26,54,93,.07)" }}>
              <div
                className="w-10 h-10 rounded-xl grid place-items-center font-bold text-white mb-4"
                style={{ background: "linear-gradient(135deg,#1a365d,#243b63)", boxShadow: "0 10px 24px rgba(26,54,93,.18)" }}
              >
                {i + 1}
              </div>
              <h3 className="font-bold mb-2" style={{ fontSize: 18, color: "#1a365d", letterSpacing: "-0.02em" }}>{s.title}</h3>
              <p style={{ color: "#5b677a", fontSize: 15 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ForWhom() {
  const profiles = [
    { Icon: Users, color: "#059669", bg: "#edf7f3", title: "Casos habituales",
      desc: "Asalariados, pensionistas y personas con situaciones fiscales frecuentes y estructura clara.",
      items: ["Asalariados con uno o varios pagadores", "Pensionistas del sistema público o privado", "Propietarios con ingresos de alquiler"],
    },
    { Icon: Search, color: "#1a365d", bg: "#eef4fb", title: "Casos con revisión",
      desc: "Cuando hay circunstancias que requieren validación adicional antes de continuar.",
      items: ["Deducción por vivienda habitual pre-2013", "Segundo pagador con importe superior a 1.500€", "Deducciones por discapacidad o donativos"],
    },
    { Icon: AlertCircle, color: "#b45309", bg: "#fef3c7", title: "Casos fuera de alcance",
      desc: "Si tu caso no encaja en esta fase del servicio, te lo diremos desde el principio y te derivamos al equipo especializado.",
      items: ["Autónomos con actividad económica compleja", "Criptoactivos, herencias, operaciones extranjero", "Módulos o estimación objetiva"],
    },
  ];
  return (
    <section style={{ padding: "84px 0", background: "#f6f9fc" }}>
      <div className="container" style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-5" style={{ background: "#eaf7f2", color: "#059669" }}>
          Pensado para ti
        </div>
        <h2 className="font-bold mb-4" style={{ fontSize: "clamp(30px,4vw,46px)", letterSpacing: "-0.03em", color: "#1a365d", lineHeight: 1.08 }}>
          Claridad antes de empezar
        </h2>
        <p className="mb-10" style={{ color: "#5b677a", fontSize: 18, maxWidth: 760 }}>
          Especialmente útil para perfiles habituales que quieren saber si su caso encaja y cómo avanzar con seguridad.
        </p>
        <div className="grid md:grid-cols-3 gap-5">
          {profiles.map((p, i) => (
            <div key={i} className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #e6edf5", boxShadow: "0 12px 40px rgba(26,54,93,.07)" }}>
              <div className="w-12 h-12 rounded-2xl grid place-items-center mb-4" style={{ background: p.bg }}>
                <p.Icon className="w-6 h-6" style={{ color: p.color }} />
              </div>
              <h3 className="font-bold mb-2" style={{ fontSize: 20, color: "#1a365d", letterSpacing: "-0.02em" }}>{p.title}</h3>
              <p className="mb-4" style={{ color: "#5b677a", fontSize: 15 }}>{p.desc}</p>
              <ul className="flex flex-col gap-2">
                {p.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm" style={{ color: "#314056" }}>
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#059669" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    { badge: "Primer paso", name: "Simulación inicial", price: "Gratis",
      desc: "El primer paso para saber si tu caso encaja dentro del alcance actual del servicio.",
      items: ["Recogida inicial de información", "Clasificación del caso", "Orientación sobre el siguiente paso", "Visión clara antes de decidir"],
      cta: "Empezar gratis", featured: false,
      btnStyle: { background: "#1a365d", color: "#fff", border: "none", boxShadow: "0 6px 18px rgba(26,54,93,.18)" } as React.CSSProperties,
    },
    {
      badge: "Más habitual", name: "Renta Ágil", price: "39 €",
      desc: "Para expedientes con una estructura clara y un proceso de gestión más directo.",
      items: ["Revisión dentro del flujo ágil", "Validación básica del expediente", "Seguimiento del proceso", "Comunicación clara del estado"],
      cta: "Ver si mi caso encaja", featured: true,
      btnStyle: { background: "linear-gradient(135deg,#059669,#10b981)", color: "#fff", border: "none", boxShadow: "0 10px 24px rgba(5,150,105,.22)" } as React.CSSProperties,
    },
    {
      badge: "Con validación adicional", name: "Renta con Revisión", price: "69 €",
      desc: "Para casos que necesitan una validación adicional antes de cerrar la gestión.",
      items: ["Revisión más detallada", "Validación de circunstancias del expediente", "Seguimiento y comunicación del caso", "Mayor acompañamiento en el proceso"],
      cta: "Entender mi siguiente paso", featured: false,
      btnStyle: { background: "linear-gradient(135deg,#0f7a52,#1a365d)", color: "#fff", border: "none", boxShadow: "0 6px 18px rgba(26,54,93,.18)" } as React.CSSProperties,
    },
  ];
  return (
    <section id="precios" style={{ padding: "84px 0", background: "#fff" }}>
      <div className="container" style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-5" style={{ background: "#eaf7f2", color: "#059669" }}>
          Precios claros antes de avanzar
        </div>
        <h2 className="font-bold mb-4" style={{ fontSize: "clamp(30px,4vw,46px)", letterSpacing: "-0.03em", color: "#1a365d", lineHeight: 1.08 }}>
          Empieza sabiendo si tu caso encaja
        </h2>
        <p className="mb-10" style={{ color: "#5b677a", fontSize: 18, maxWidth: 760 }}>
          La simulación inicial te ayuda a entender tu situación antes de avanzar.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <div
              key={i}
              className="rounded-3xl p-7 flex flex-col"
              style={{
                background: "#fff",
                border: plan.featured ? "2px solid rgba(5,150,105,.22)" : "1px solid #e6edf5",
                boxShadow: "0 12px 40px rgba(26,54,93,.10)",
                transform: plan.featured ? "translateY(-4px)" : "none",
              }}
            >
              <div className="inline-block mb-4 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: "#eef7f3", color: "#059669" }}>
                {plan.badge}
              </div>
              <h3 className="font-bold mb-2" style={{ fontSize: 22, color: "#1a365d", letterSpacing: "-0.02em" }}>{plan.name}</h3>
              <div className="font-bold mb-3" style={{ fontSize: 44, color: "#1a365d", letterSpacing: "-0.04em", lineHeight: 1 }}>{plan.price}</div>
              <p className="mb-5" style={{ color: "#5b677a", fontSize: 15, minHeight: 60 }}>{plan.desc}</p>
              <ul className="flex flex-col gap-3 mb-6 flex-1">
                {plan.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm" style={{ color: "#314056" }}>
                    <span style={{ color: "#059669", fontWeight: 800 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/empezar">
                <button className="w-full rounded-2xl font-bold py-3 text-base cursor-pointer" style={plan.btnStyle}>
                  {plan.cta}
                </button>
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm" style={{ color: "#5b677a" }}>
          Si el expediente requiere un tratamiento distinto o queda fuera del alcance actual del servicio, te lo indicaremos antes de contratar.
        </p>
      </div>
    </section>
  );
}

function FAQs() {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    { q: "¿La simulación inicial tiene coste?", a: "No. La simulación inicial es gratuita y sirve para entender si tu caso encaja dentro del servicio." },
    { q: "¿Sabré el precio antes de continuar?", a: "Sí. Antes de avanzar te mostraremos cómo encaja tu caso y cuál es el precio correspondiente. Sin sorpresas." },
    { q: "¿Qué pasa si mi caso necesita revisión?", a: "Te lo indicaremos con claridad antes de seguir avanzando, para que sepas exactamente cuál es el siguiente paso y qué implica." },
    { q: "¿Me pediréis toda la documentación desde el primer momento?", a: "No necesariamente. Primero analizamos el caso y después te indicamos exactamente qué hará falta según tu situación." },
    { q: "¿Este servicio sirve para cualquier tipo de renta?", a: "No. En esta fase está orientado a perfiles habituales: asalariados, pensionistas y arrendadores. Si tu caso no encaja, te lo indicaremos desde el principio y te derivamos al equipo especializado." },
    { q: "¿Puedo empezar sin tenerlo todo claro?", a: "Sí. Precisamente la simulación inicial sirve para ayudarte a entender tu caso antes de tomar una decisión." },
    { q: "¿Podéis presentar la declaración directamente a Hacienda?", a: "Sí, con tu autorización expresa. El proceso incluye la revisión conjunta del borrador antes de cualquier presentación." },
  ];
  return (
    <section id="faqs" style={{ padding: "84px 0", background: "#f6f9fc" }}>
      <div className="container" style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-5" style={{ background: "#eaf7f2", color: "#059669" }}>
          Preguntas frecuentes
        </div>
        <h2 className="font-bold mb-4" style={{ fontSize: "clamp(30px,4vw,46px)", letterSpacing: "-0.03em", color: "#1a365d", lineHeight: 1.08 }}>
          Todo lo que necesitas saber antes de empezar
        </h2>
        <p className="mb-10" style={{ color: "#5b677a", fontSize: 18, maxWidth: 760 }}>
          Resolvemos las dudas más habituales sobre el proceso, el precio, la documentación y el encaje del servicio.
        </p>
        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden"
              style={{ background: "#fff", border: "1px solid #e6edf5", boxShadow: "0 4px 16px rgba(26,54,93,.06)" }}
            >
              <button
                className="w-full flex items-center justify-between p-6 text-left"
                style={{ background: "transparent", border: "none", cursor: "pointer" }}
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-bold pr-4" style={{ fontSize: 17, color: "#1a365d", letterSpacing: "-0.02em" }}>{faq.q}</span>
                <ChevronDown
                  className="flex-shrink-0 w-5 h-5 transition-transform"
                  style={{ color: "#059669", transform: open === i ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-5" style={{ color: "#5b677a", fontSize: 15, lineHeight: 1.7 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTABand() {
  return (
    <section style={{ padding: "84px 0", background: "#fff" }}>
      <div className="container" style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div className="rounded-3xl p-10" style={{ background: "linear-gradient(135deg,#1a365d,#274c7a)", boxShadow: "0 12px 40px rgba(26,54,93,.20)" }}>
          <h2 className="font-bold mb-3 text-white" style={{ fontSize: "clamp(30px,4vw,48px)", letterSpacing: "-0.04em", lineHeight: 1.04 }}>
            Empieza por entender tu caso
          </h2>
          <p className="mb-7" style={{ color: "rgba(255,255,255,.84)", fontSize: 18, maxWidth: 760 }}>
            Te diremos si tu renta encaja, qué hará falta y cómo avanzar. Tecnología para lo que es eficiente. Criterio humano para lo que lo necesita.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/empezar">
              <Button
                size="lg"
                className="font-bold px-7 text-base"
                style={{ background: "linear-gradient(135deg,#059669,#10b981)", color: "#fff", boxShadow: "0 10px 24px rgba(5,150,105,.28)", border: "none", height: 52 }}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Simula gratis y descubre tu precio
              </Button>
            </Link>
            <a href="#como-funciona">
              <Button
                size="lg"
                variant="outline"
                className="font-bold px-7 text-base"
                style={{ background: "#fff", color: "#1a365d", borderColor: "#fff", height: 52 }}
              >
                Ver cómo funciona
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  useSEO({
    title: "Declaración de la Renta 2025 | Renta Fácil TPymes",
    description: "Simula gratis en 3 minutos. Conoce tu precio exacto antes de empezar. Un asesor revisa cuando hace falta. Renta Fácil by Ayuda T Pymes.",
    canonical: "/",
  });
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <StatsBar />
        <TrustSection />
        <HowItWorks />
        <ForWhom />
        <Pricing />
        <FAQs />
        <CTABand />
      </main>
      <Footer />
    </div>
  );
}
