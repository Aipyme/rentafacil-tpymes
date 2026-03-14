/**
 * LANDING VALENCIA — Página específica para captar tráfico SEO de la Comunitat Valenciana
 * Deducciones autonómicas valencianas 2025, contexto local, CTA directo
 */

import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Calculator,
  CheckCircle,
  ArrowRight,
  Sun,
  Home,
  GraduationCap,
  Heart,
  Baby,
  Leaf,
  Users,
  Shield,
  Star,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Deduccion {
  icon: React.ReactNode;
  titulo: string;
  importe: string;
  descripcion: string;
  requisitos: string[];
}

const deduccionesValencia: Deduccion[] = [
  {
    icon: <Baby className="w-6 h-6" />,
    titulo: "Nacimiento, adopción o acogimiento",
    importe: "270-800€",
    descripcion: "270€ primer hijo, 550€ segundo, 800€ tercero y sucesivos nacidos o adoptados en el ejercicio.",
    requisitos: [
      "Base imponible < 27.790€ (individual)",
      "Convivencia con el hijo",
      "Acumulable por cada hijo",
    ],
  },
  {
    icon: <Users className="w-6 h-6" />,
    titulo: "Familia numerosa o monoparental",
    importe: "300-600€",
    descripcion: "300€ para familia numerosa de categoría general, 600€ para categoría especial.",
    requisitos: [
      "Título de familia numerosa vigente",
      "Base imponible < 27.790€ (individual)",
      "Convivencia con los hijos",
    ],
  },
  {
    icon: <Heart className="w-6 h-6" />,
    titulo: "Conciliación trabajo y vida familiar",
    importe: "418€",
    descripcion: "Para madres o padres con hijos menores de 3 años cuando ambos progenitores trabajan.",
    requisitos: [
      "Hijos menores de 3 años",
      "Ambos progenitores trabajando",
      "Base imponible < 27.790€ (individual)",
    ],
  },
  {
    icon: <GraduationCap className="w-6 h-6" />,
    titulo: "Gastos de guardería (hijos < 3 años)",
    importe: "Hasta 270€",
    descripcion: "15% de las cantidades satisfechas por custodia en guarderías y centros de primer ciclo de educación infantil.",
    requisitos: [
      "Hijos menores de 3 años",
      "Centros de educación infantil autorizados",
      "Justificantes de pago",
    ],
  },
  {
    icon: <Shield className="w-6 h-6" />,
    titulo: "Discapacidad del contribuyente",
    importe: "179-418€",
    descripcion: "179€ para discapacidad ≥ 33%, 418€ para discapacidad ≥ 65%.",
    requisitos: [
      "Certificado de discapacidad oficial",
      "Grado ≥ 33% para 179€",
      "Grado ≥ 65% para 418€",
    ],
  },
  {
    icon: <Users className="w-6 h-6" />,
    titulo: "Ascendientes mayores de 75 años",
    importe: "179€",
    descripcion: "Por cada ascendiente mayor de 75 años o con discapacidad ≥ 65% que conviva con el contribuyente.",
    requisitos: [
      "Ascendiente > 75 años o discapacidad ≥ 65%",
      "Convivencia con el contribuyente",
      "Rentas del ascendiente < 8.000€ anuales",
    ],
  },
  {
    icon: <Home className="w-6 h-6" />,
    titulo: "Arrendamiento de vivienda habitual",
    importe: "Hasta 550€",
    descripcion: "15% del alquiler pagado, con un máximo de 550€ anuales para jóvenes menores de 35 años.",
    requisitos: [
      "Edad ≤ 35 años o discapacidad ≥ 65%",
      "Base imponible < 25.000€ (individual)",
      "Contrato de alquiler registrado",
    ],
  },
  {
    icon: <Leaf className="w-6 h-6" />,
    titulo: "Primera adquisición de vivienda (jóvenes)",
    importe: "Hasta 150€",
    descripcion: "5% de las cantidades satisfechas para la adquisición de la primera vivienda habitual por menores de 35 años.",
    requisitos: [
      "Menor de 35 años",
      "Primera vivienda habitual",
      "Base imponible < 27.790€ (individual)",
    ],
  },
];

function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export default function Valencia() {
  const [expandedDeduccion, setExpandedDeduccion] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Valencia */}
      <div className="bg-navy text-white pt-24 pb-16 md:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 right-20 w-96 h-96 rounded-full bg-emerald blur-3xl" />
          <div className="absolute bottom-10 left-10 w-64 h-64 rounded-full bg-orange-400 blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sun className="w-4 h-4" />
              Campaña Renta 2025 — Comunitat Valenciana
            </div>

            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Declaración de la Renta
              <br />
              <span className="text-emerald">en la Comunitat Valenciana</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/70 max-w-3xl leading-relaxed mb-8">
              Aprovecha todas las deducciones de la Generalitat Valenciana.
              Nuestros asesores conocen cada beneficio fiscal de tu comunidad.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/simulador"
                className="inline-flex items-center justify-center gap-2 bg-emerald hover:bg-emerald-dark text-white font-bold py-4 px-8 rounded-xl transition-colors text-lg"
              >
                <Calculator className="w-5 h-5" />
                Simular mi renta gratis
              </Link>
              <Link
                href="/empezar"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-xl transition-colors text-lg border border-white/20"
              >
                Empezar mi declaración
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Datos de Valencia */}
      <Section className="py-16 bg-warm-gray">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { value: "8", label: "deducciones autonómicas", suffix: "" },
              { value: "550", label: "máximo por alquiler", suffix: "€" },
              { value: "800", label: "por tercer hijo", suffix: "€" },
              { value: "418", label: "conciliación familiar", suffix: "€" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100"
              >
                <p className="text-3xl md:text-4xl font-heading font-bold text-navy">
                  {stat.value}{stat.suffix}
                </p>
                <p className="text-gray-600 text-sm mt-2">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* Deducciones autonómicas */}
      <Section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-navy mb-4">
            Deducciones autonómicas de la Comunitat Valenciana 2025
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl">
            Estas son las deducciones específicas de la Generalitat Valenciana
            que puedes aplicar en tu declaración. Muchos contribuyentes las desconocen.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {deduccionesValencia.map((ded, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                className={`bg-gray-50 rounded-xl p-6 border transition-all cursor-pointer ${
                  expandedDeduccion === i
                    ? "border-emerald shadow-md"
                    : "border-gray-100 hover:border-emerald/30"
                }`}
                onClick={() => setExpandedDeduccion(expandedDeduccion === i ? null : i)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald/10 rounded-lg flex items-center justify-center text-emerald flex-shrink-0">
                    {ded.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-heading text-lg font-bold text-navy">
                        {ded.titulo}
                      </h3>
                      <span className="text-emerald font-bold text-lg whitespace-nowrap ml-2">
                        {ded.importe}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">{ded.descripcion}</p>

                    {expandedDeduccion === i && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 pt-4 border-t border-gray-200"
                      >
                        <p className="text-sm font-medium text-navy mb-2">Requisitos:</p>
                        <ul className="space-y-1">
                          {ded.requisitos.map((req, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                              <CheckCircle className="w-4 h-4 text-emerald flex-shrink-0 mt-0.5" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* Por qué elegirnos en Valencia */}
      <Section className="py-20 bg-warm-gray">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-navy mb-4">
            ¿Por qué hacer tu renta con nosotros en la Comunitat Valenciana?
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl">
            No somos una app genérica. Somos asesores fiscales que conocen
            la normativa valenciana al detalle.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Star className="w-8 h-8" />,
                title: "Asesores especializados en la Comunitat Valenciana",
                desc: "Nuestro equipo conoce cada deducción autonómica, cada particularidad de la Generalitat. No dejamos dinero sobre la mesa.",
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Respaldo de +600 profesionales",
                desc: "Ayuda T Pymes tiene más de 20.000 clientes y 600 profesionales. Tu declaración está en buenas manos.",
              },
              {
                icon: <Calculator className="w-8 h-8" />,
                title: "Simulador con tramos valencianos",
                desc: "Nuestro simulador calcula con los tramos autonómicos reales de la Comunitat Valenciana, no con aproximaciones genéricas.",
              },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <div className="w-14 h-14 bg-emerald/10 rounded-xl flex items-center justify-center text-emerald mb-5">
                  {item.icon}
                </div>
                <h3 className="font-heading text-xl font-bold text-navy mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Tramos IRPF Valencia */}
      <Section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-navy mb-4">
            Tramos IRPF autonómicos de la Comunitat Valenciana 2025
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl">
            La cuota autonómica se calcula con estos tramos. Junto con la estatal,
            determinan tu tipo efectivo total.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-navy/10">
                  <th className="px-6 py-4 text-navy font-heading font-bold text-sm">Base liquidable</th>
                  <th className="px-6 py-4 text-navy font-heading font-bold text-sm">Tipo autonómico</th>
                  <th className="px-6 py-4 text-navy font-heading font-bold text-sm">Tipo estatal</th>
                  <th className="px-6 py-4 text-navy font-heading font-bold text-sm">Tipo total</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { base: "Hasta 12.450€", auto: "10,00%", estatal: "9,50%", total: "19,50%" },
                  { base: "12.450 - 17.707€", auto: "11,00%", estatal: "12,00%", total: "23,00%" },
                  { base: "17.707 - 33.007€", auto: "13,90%", estatal: "15,00%", total: "28,90%" },
                  { base: "33.007 - 53.407€", auto: "18,00%", estatal: "18,50%", total: "36,50%" },
                  { base: "53.407 - 80.000€", auto: "23,50%", estatal: "22,50%", total: "46,00%" },
                  { base: "80.000 - 120.000€", auto: "24,50%", estatal: "22,50%", total: "47,00%" },
                  { base: "120.000 - 175.000€", auto: "25,00%", estatal: "24,50%", total: "49,50%" },
                  { base: "Más de 175.000€", auto: "25,50%", estatal: "24,50%", total: "50,00%" },
                ].map((row, i) => (
                  <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-6 py-3 text-gray-700 font-medium">{row.base}</td>
                    <td className="px-6 py-3 text-emerald font-bold">{row.auto}</td>
                    <td className="px-6 py-3 text-gray-500">{row.estatal}</td>
                    <td className="px-6 py-3 text-navy font-bold">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* CTA Final */}
      <Section className="py-20 bg-navy text-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Sun className="w-12 h-12 text-orange-400 mx-auto mb-6" />
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">
            No dejes dinero sobre la mesa.
            <br />
            <span className="text-emerald">Haz tu renta con expertos en la Comunitat Valenciana.</span>
          </h2>
          <p className="text-xl text-white/60 mb-10">
            Desde 49€. Asesores que conocen cada deducción valenciana.
            Simulador gratuito para ver cuánto te devuelven.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/simulador"
              className="inline-flex items-center justify-center gap-2 bg-emerald hover:bg-emerald-dark text-white font-bold py-4 px-8 rounded-xl transition-colors text-lg"
            >
              <Calculator className="w-5 h-5" />
              Simular mi renta gratis
            </Link>
            <Link
              href="/empezar"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-xl transition-colors text-lg border border-white/20"
            >
              Hacer mi declaración
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </Section>

      <Footer />
    </div>
  );
}
