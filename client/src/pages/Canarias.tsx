/**
 * LANDING CANARIAS — Página específica para captar tráfico SEO de Canarias
 * Deducciones autonómicas canarias 2025, contexto local, CTA directo
 * Fuente: Decreto Legislativo 1/2009 (TRLIRPF Canarias) + Ley 4/2012 de medidas fiscales
 */
import { useState } from "react";
import { Link } from "wouter";
import {
  Calculator,
  CheckCircle,
  ArrowRight,
  Home,
  GraduationCap,
  Heart,
  Baby,
  Leaf,
  Users,
  Shield,
  Star,
  Briefcase,
  Sun,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";

interface Deduccion {
  icon: React.ReactNode;
  titulo: string;
  importe: string;
  descripcion: string;
  requisitos: string[];
}

const deduccionesCanarias: Deduccion[] = [
  {
    icon: <Home className="w-6 h-6" />,
    titulo: "Alquiler de vivienda habitual",
    importe: "Hasta 1.200€",
    descripcion:
      "Deducción del 20% de las cantidades satisfechas por alquiler de vivienda habitual en Canarias. Uno de los límites más altos de España.",
    requisitos: [
      "Base imponible general + del ahorro menor de 20.000€ (individual) o 30.000€ (conjunta)",
      "Que el alquiler supere el 10% de la base imponible",
      "Contrato de arrendamiento en vigor y justificante de pago",
    ],
  },
  {
    icon: <Baby className="w-6 h-6" />,
    titulo: "Nacimiento o adopción de hijos",
    importe: "200€ – 400€ por hijo",
    descripcion:
      "200€ por el primer hijo, 400€ por el segundo y siguientes. Importes que se duplican si el nacimiento es múltiple.",
    requisitos: [
      "Nacimiento o adopción en el período impositivo",
      "Convivencia con el menor",
      "Base imponible inferior a 30.000€ (individual) o 40.000€ (conjunta)",
    ],
  },
  {
    icon: <GraduationCap className="w-6 h-6" />,
    titulo: "Gastos de estudios",
    importe: "Hasta 1.800€",
    descripcion:
      "Por gastos de enseñanza universitaria o de formación profesional de grado superior de hijos o del propio contribuyente.",
    requisitos: [
      "Estudios en centros oficiales o reconocidos",
      "Hijos menores de 25 años o el propio contribuyente",
      "Gastos de matrícula, libros y transporte",
    ],
  },
  {
    icon: <Heart className="w-6 h-6" />,
    titulo: "Discapacidad",
    importe: "Hasta 300€",
    descripcion:
      "Para contribuyentes con discapacidad o con ascendientes o descendientes con discapacidad reconocida a cargo.",
    requisitos: [
      "Grado de discapacidad igual o superior al 33%",
      "180€ para discapacidad entre 33% y 64%",
      "300€ para discapacidad igual o superior al 65%",
    ],
  },
  {
    icon: <Users className="w-6 h-6" />,
    titulo: "Familia numerosa",
    importe: "Hasta 1.200€",
    descripcion:
      "Deducción adicional para familias numerosas de categoría general (500€) y especial (1.200€), complementaria a la estatal.",
    requisitos: [
      "Título de familia numerosa en vigor",
      "500€ para categoría general (3 o más hijos)",
      "1.200€ para categoría especial (5 o más hijos, o 4 con alguno con discapacidad)",
    ],
  },
  {
    icon: <Leaf className="w-6 h-6" />,
    titulo: "Inversión en energías renovables",
    importe: "Hasta 750€",
    descripcion:
      "Por instalación de sistemas de energía solar térmica, fotovoltaica o de biomasa en vivienda habitual.",
    requisitos: [
      "Instalación en vivienda habitual ubicada en Canarias",
      "Sistemas homologados y certificados",
      "15% del importe invertido con límite de 750€",
    ],
  },
  {
    icon: <Briefcase className="w-6 h-6" />,
    titulo: "Inversión en empresas de nueva creación",
    importe: "Hasta 4.000€",
    descripcion:
      "Deducción del 20% de las cantidades invertidas en la suscripción de acciones o participaciones en empresas de nueva creación.",
    requisitos: [
      "Empresa de nueva o reciente creación (menos de 3 años)",
      "Participación inferior al 40% del capital",
      "Mantenimiento de la inversión al menos 3 años",
    ],
  },
  {
    icon: <Sun className="w-6 h-6" />,
    titulo: "Donaciones a entidades canarias",
    importe: "Hasta 300€",
    descripcion:
      "Por donaciones a fundaciones, asociaciones y entidades sin ánimo de lucro con actividad en Canarias.",
    requisitos: [
      "Entidad inscrita en el registro de la Comunidad Autónoma",
      "Justificante de donación",
      "25% del importe donado con límite de 300€",
    ],
  },
  {
    icon: <Shield className="w-6 h-6" />,
    titulo: "Gastos de guardería",
    importe: "Hasta 1.000€",
    descripcion:
      "Por gastos de custodia de hijos menores de 3 años en guarderías o centros de educación infantil autorizados.",
    requisitos: [
      "Hijos menores de 3 años",
      "Centro autorizado por la Consejería de Educación",
      "15% de los gastos con límite de 1.000€ por hijo",
    ],
  },
];

const faqs = [
  {
    q: "¿Qué hace especial la fiscalidad de Canarias?",
    a: "Canarias tiene un régimen económico y fiscal especial (REF) que incluye el IGIC (tipo general del 7%, frente al 21% del IVA peninsular) y deducciones autonómicas propias del IRPF más generosas que la media nacional, especialmente en alquiler de vivienda y familia.",
  },
  {
    q: "¿Puedo aplicar la deducción por alquiler si mi contrato es antiguo?",
    a: "Sí. La deducción canaria por alquiler se aplica con independencia de la fecha del contrato, siempre que cumplas los requisitos de base imponible y que el alquiler supere el 10% de tu base imponible general.",
  },
  {
    q: "¿Las deducciones canarias son compatibles con las estatales?",
    a: "En general sí, salvo que la normativa específica indique lo contrario. Las deducciones autonómicas se aplican sobre la cuota íntegra autonómica, mientras que las estatales se aplican sobre la cuota íntegra estatal.",
  },
  {
    q: "¿Qué documentación necesito para justificar las deducciones?",
    a: "Depende de cada deducción: contratos de alquiler y recibos, certificados de discapacidad, títulos de familia numerosa, facturas de obras o instalaciones, certificados de donación, etc. En nuestro simulador te indicamos exactamente qué necesitas según tu caso.",
  },
  {
    q: "¿Puedo aplicar la deducción por inversión en empresas si soy autónomo?",
    a: "Sí, siempre que la inversión sea en una empresa distinta a la tuya y cumplas los requisitos de participación y permanencia. Es una de las deducciones más interesantes para autónomos con capacidad de inversión.",
  },
];

export default function Canarias() {
  useSEO({
    title: "Declaración de la Renta 2025 en Canarias | Renta Fácil TPymes",
    description:
      "Deducciones autonómicas de Canarias 2025: alquiler, familia, discapacidad, energías renovables y más. Simula gratis y descubre cuánto puedes recuperar.",
    canonical: "/canarias",
  });

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* HERO */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "radial-gradient(circle at top right, rgba(16,185,129,.13), transparent 30%), linear-gradient(180deg,#ffffff 0%,#f7fbff 100%)",
          padding: "72px 0 56px",
        }}
      >
        <div className="container" style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-5"
                style={{ background: "#eaf7f2", color: "#059669" }}
              >
                <Sun className="w-3.5 h-3.5" />
                Canarias · Campaña Renta 2025
              </div>

              <h1
                className="font-bold leading-none tracking-tight mb-4"
                style={{
                  fontSize: "clamp(36px,5vw,58px)",
                  letterSpacing: "-0.04em",
                  color: "#1a365d",
                  lineHeight: 1.0,
                }}
              >
                Declaración de la Renta<br />
                <span style={{ color: "#059669" }}>en Canarias 2025</span>
              </h1>

              <p className="mb-7" style={{ fontSize: 19, color: "#5b677a", maxWidth: 560 }}>
                Canarias tiene deducciones autonómicas propias que muchos contribuyentes no aplican.
                Simula gratis y descubre si te corresponden antes de presentar.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/renta">
                  <button
                    className="inline-flex items-center gap-2 font-bold px-7 rounded-xl text-white"
                    style={{
                      background: "linear-gradient(135deg,#059669,#10b981)",
                      boxShadow: "0 10px 24px rgba(5,150,105,.22)",
                      height: 52,
                      fontSize: 16,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <Calculator className="w-4 h-4" />
                    Simula gratis tu caso
                  </button>
                </Link>
                <a href="#deducciones">
                  <button
                    className="inline-flex items-center gap-2 font-bold px-7 rounded-xl"
                    style={{
                      background: "#fff",
                      border: "1.5px solid #e6edf5",
                      color: "#1a365d",
                      height: 52,
                      fontSize: 16,
                      cursor: "pointer",
                    }}
                  >
                    Ver deducciones
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </a>
              </div>

              <p className="mt-4 text-sm font-semibold" style={{ color: "#66758b" }}>
                Sin compromiso · Precio claro antes de avanzar · Régimen económico especial canario
              </p>
            </div>

            <div className="hidden lg:block">
              <div
                className="rounded-3xl p-7"
                style={{
                  background: "rgba(255,255,255,.9)",
                  border: "1px solid rgba(230,237,245,.95)",
                  boxShadow: "0 12px 40px rgba(26,54,93,.10)",
                }}
              >
                <h3
                  className="font-bold mb-5"
                  style={{ fontSize: 20, color: "#1a365d", letterSpacing: "-0.02em" }}
                >
                  Lo que hace diferente a Canarias
                </h3>
                <div className="flex flex-col gap-3">
                  {[
                    { title: "IGIC al 7%", desc: "Tipo general muy inferior al IVA peninsular (21%)" },
                    { title: "Alquiler hasta 1.200€", desc: "Una de las deducciones por alquiler más altas de España" },
                    { title: "Inversión empresarial", desc: "Deducción del 20% por invertir en empresas de nueva creación" },
                    { title: "Régimen Económico Especial", desc: "Normativa fiscal propia que puede beneficiarte significativamente" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex gap-3 items-start p-3.5 rounded-2xl"
                      style={{ border: "1px solid #e6edf5", background: "#fff" }}
                    >
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-xl grid place-items-center font-bold text-sm"
                        style={{ background: "#edf7f3", color: "#059669" }}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="block text-sm mb-0.5" style={{ color: "#1a365d" }}>
                          {item.title}
                        </strong>
                        <span className="text-sm" style={{ color: "#5b677a" }}>
                          {item.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEDUCCIONES */}
      <section id="deducciones" style={{ padding: "84px 0", background: "#f6f9fc" }}>
        <div className="container" style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-5"
            style={{ background: "#eaf7f2", color: "#059669" }}
          >
            Deducciones autonómicas 2025
          </div>
          <h2
            className="font-bold mb-4"
            style={{
              fontSize: "clamp(28px,4vw,42px)",
              letterSpacing: "-0.03em",
              color: "#1a365d",
              lineHeight: 1.1,
            }}
          >
            Deducciones autonómicas de Canarias
          </h2>
          <p className="mb-10" style={{ color: "#5b677a", fontSize: 17, maxWidth: 760 }}>
            Estas son las principales deducciones que puedes aplicar en tu declaración si eres residente fiscal en Canarias.
            Muchas se pierden por desconocimiento.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {deduccionesCanarias.map((d, i) => (
              <div
                key={i}
                className="rounded-2xl p-6"
                style={{
                  background: "#fff",
                  border: "1px solid #e6edf5",
                  boxShadow: "0 8px 32px rgba(26,54,93,.06)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl grid place-items-center mb-4"
                  style={{ background: "#edf7f3", color: "#059669" }}
                >
                  {d.icon}
                </div>
                <div
                  className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3"
                  style={{ background: "#eef4fb", color: "#1a365d" }}
                >
                  {d.importe}
                </div>
                <h3
                  className="font-bold mb-2"
                  style={{ fontSize: 17, color: "#1a365d", letterSpacing: "-0.02em" }}
                >
                  {d.titulo}
                </h3>
                <p className="mb-4" style={{ color: "#5b677a", fontSize: 14, lineHeight: 1.6 }}>
                  {d.descripcion}
                </p>
                <ul className="flex flex-col gap-1.5">
                  {d.requisitos.map((r, j) => (
                    <li key={j} className="flex gap-2 items-start text-xs" style={{ color: "#5b677a" }}>
                      <CheckCircle
                        className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                        style={{ color: "#059669" }}
                      />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA INTERMEDIO */}
      <section style={{ padding: "64px 0", background: "#1a365d" }}>
        <div className="container text-center" style={{ maxWidth: 760, margin: "0 auto" }}>
          <Star className="w-8 h-8 mx-auto mb-4" style={{ color: "#10b981" }} />
          <h2
            className="font-bold mb-4"
            style={{ fontSize: "clamp(26px,4vw,38px)", color: "#fff", letterSpacing: "-0.03em" }}
          >
            ¿Sabes si te corresponden estas deducciones?
          </h2>
          <p className="mb-8" style={{ color: "rgba(255,255,255,.7)", fontSize: 17 }}>
            En 2 minutos analizamos tu situación y te decimos exactamente qué deducciones canarias puedes aplicar
            y cuánto puedes recuperar.
          </p>
          <Link href="/renta">
            <button
              className="inline-flex items-center gap-2 font-bold px-8 rounded-xl text-white"
              style={{
                background: "linear-gradient(135deg,#059669,#10b981)",
                boxShadow: "0 10px 24px rgba(5,150,105,.30)",
                height: 52,
                fontSize: 16,
                border: "none",
                cursor: "pointer",
              }}
            >
              <Calculator className="w-4 h-4" />
              Simula gratis tu caso en Canarias
            </button>
          </Link>
          <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,.45)" }}>
            Sin registro · Sin datos bancarios · Precio claro antes de avanzar
          </p>
        </div>
      </section>

      {/* FAQS */}
      <section style={{ padding: "84px 0", background: "#fff" }}>
        <div className="container" style={{ maxWidth: 860, margin: "0 auto" }}>
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-5"
            style={{ background: "#eaf7f2", color: "#059669" }}
          >
            Preguntas frecuentes
          </div>
          <h2
            className="font-bold mb-10"
            style={{
              fontSize: "clamp(26px,4vw,38px)",
              letterSpacing: "-0.03em",
              color: "#1a365d",
            }}
          >
            Dudas sobre la renta en Canarias
          </h2>

          <div className="flex flex-col gap-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid #e6edf5" }}
              >
                <button
                  className="w-full flex items-center justify-between gap-4 p-5 text-left font-bold"
                  style={{
                    background: openFaq === i ? "#f6f9fc" : "#fff",
                    color: "#1a365d",
                    fontSize: 16,
                    border: "none",
                    cursor: "pointer",
                  }}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{faq.q}</span>
                  <span
                    style={{
                      fontSize: 20,
                      color: "#059669",
                      transform: openFaq === i ? "rotate(45deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                      flexShrink: 0,
                    }}
                  >
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5" style={{ color: "#5b677a", fontSize: 15, lineHeight: 1.7 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section
        style={{
          padding: "84px 0",
          background:
            "radial-gradient(circle at top right, rgba(16,185,129,.10), transparent 40%), #f6f9fc",
        }}
      >
        <div className="container text-center" style={{ maxWidth: 760, margin: "0 auto" }}>
          <h2
            className="font-bold mb-4"
            style={{
              fontSize: "clamp(28px,4vw,42px)",
              letterSpacing: "-0.03em",
              color: "#1a365d",
            }}
          >
            Empieza con tu simulación gratuita
          </h2>
          <p className="mb-8" style={{ color: "#5b677a", fontSize: 17 }}>
            Descubre si tu caso encaja, qué deducciones canarias te corresponden y cuál es el precio
            exacto antes de contratar.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/renta">
              <button
                className="inline-flex items-center gap-2 font-bold px-8 rounded-xl text-white"
                style={{
                  background: "linear-gradient(135deg,#059669,#10b981)",
                  boxShadow: "0 10px 24px rgba(5,150,105,.22)",
                  height: 52,
                  fontSize: 16,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <ArrowRight className="w-4 h-4" />
                Simula gratis y descubre tu precio
              </button>
            </Link>
          </div>
          <p className="mt-4 text-sm font-semibold" style={{ color: "#66758b" }}>
            Sin compromiso · Precio claro antes de avanzar · Revisión cuando hace falta
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
