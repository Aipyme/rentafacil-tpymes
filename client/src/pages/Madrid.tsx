/**
 * LANDING MADRID — Página específica para captar tráfico SEO de la Comunidad de Madrid
 * Deducciones autonómicas madrileñas 2025, contexto local, CTA directo
 */

import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Calculator,
  CheckCircle,
  ArrowRight,
  Building2,
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

const deduccionesMadrid: Deduccion[] = [
  {
    icon: <Baby className="w-6 h-6" />,
    titulo: "Nacimiento o adopción",
    importe: "Hasta 900€",
    descripcion: "Por nacimiento o adopción de hijos, con importes crecientes.",
    requisitos: [
      "600€ primer hijo, 750€ segundo, 900€ tercero y sucesivos",
      "Convivencia con el hijo",
      "Base imponible < 30.000€ (individual) o 36.200€ (conjunta)",
    ],
  },
  {
    icon: <Star className="w-6 h-6" />,
    titulo: "Adopción internacional",
    importe: "600€",
    descripcion: "Ayuda específica para gastos de adopciones constituidas en el extranjero.",
    requisitos: [
      "600€ por cada hijo adoptado internacionalmente",
      "Adopción constituida según la legislación vigente",
    ],
  },
  {
    icon: <Users className="w-6 h-6" />,
    titulo: "Acogimiento familiar de menores",
    importe: "Hasta 900€",
    descripcion: "Deducción por acogimiento familiar de menores, sin contraprestación económica.",
    requisitos: [
      "600€ primer menor, 750€ segundo, 900€ tercero",
      "Acogimiento no remunerado",
      "Convivencia mínima de 183 días con el menor",
    ],
  },
  {
    icon: <Home className="w-6 h-6" />,
    titulo: "Arrendamiento de vivienda habitual",
    importe: "Hasta 1.000€",
    descripcion: "Para jóvenes menores de 35 años que vivan de alquiler.",
    requisitos: [
      "30% de las cantidades satisfechas, con un máximo de 1.000€",
      "Tener menos de 35 años",
      "Base imponible < 25.620€ (individual) o 36.200€ (conjunta)",
    ],
  },
  {
    icon: <GraduationCap className="w-6 h-6" />,
    titulo: "Gastos educativos",
    importe: "Hasta 400€",
    descripcion: "Cubre gastos de escolaridad, enseñanza de idiomas y adquisición de vestuario escolar.",
    requisitos: [
      "15% gastos de escolaridad (máx. 400€/hijo)",
      "10% gastos de idiomas (máx. 400€/hijo)",
      "5% gastos de vestuario (máx. 150€/hijo)",
      "Hijos menores de 18 años en centros autorizados",
    ],
  },
  {
    icon: <Heart className="w-6 h-6" />,
    titulo: "Cuidado de hijos menores de 3 años",
    importe: "Hasta 400€",
    descripcion: "Para padres que trabajan y tienen gastos de cuidado para sus hijos pequeños.",
    requisitos: [
      "20% de los gastos de guardería o cuidadores, máximo 400€",
      "Ambos padres deben estar trabajando",
      "El hijo debe ser menor de 3 años",
    ],
  },
  {
    icon: <Users className="w-6 h-6" />,
    titulo: "Familias con 2+ descendientes",
    importe: "10% Mínimo Desc.",
    descripcion: "Deducción para familias con dos o más hijos y rentas bajas.",
    requisitos: [
      "10% del importe del mínimo por descendientes",
      "Tener 2 o más descendientes",
      "Base imponible < 24.000€",
    ],
  },
  {
    icon: <Leaf className="w-6 h-6" />,
    titulo: "Inversión en vivienda rural",
    importe: "10% Inversión",
    descripcion: "Por la adquisición de vivienda habitual de nueva construcción en zonas rurales.",
    requisitos: [
      "10% de las cantidades invertidas",
      "La vivienda debe estar en un municipio de menos de 10.000 habitantes",
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

export default function Madrid() {
  const [expandedDeduccion, setExpandedDeduccion] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Madrid */}
      <div className="bg-navy text-white pt-24 pb-16 md:pb-24 relative overflow-hidden">
        {/* Patrón sutil de fondo */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 right-20 w-96 h-96 rounded-full bg-blue-500 blur-3xl" />
          <div className="absolute bottom-10 left-10 w-64 h-64 rounded-full bg-red-400 blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-red-600/20 text-red-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Building2 className="w-4 h-4" />
              Campaña Renta 2025 — Comunidad de Madrid
            </div>

            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Declaración de la Renta
              <br />
              <span className="text-emerald">en Madrid</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/70 max-w-3xl leading-relaxed mb-8">
              Madrid tiene los tipos autonómicos más bajos de España. Nuestros asesores te ayudan a aprovechar cada deducción madrileña.
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

      {/* Datos de Madrid */}
      <Section className="py-16 bg-warm-gray">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { value: "8", label: "deducciones autonómicas", suffix: "" },
              { value: "1.000", label: "máximo por alquiler", suffix: "€" },
              { value: "900", label: "por tercer hijo", suffix: "€" },
              { value: "400", label: "gastos educativos", suffix: "€" },
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
      <Section className="py-20 bg-white" id="deducciones">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-navy mb-4">
            Deducciones autonómicas de Madrid 2025
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl">
            Estas son las deducciones específicas de la Comunidad de Madrid que puedes aplicar en tu declaración. Muchos contribuyentes las desconocen.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {deduccionesMadrid.map((ded, i) => (
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

      {/* Por qué nosotros */}
      <Section className="py-20 bg-warm-gray">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-navy mb-4">
              La forma más fácil de hacer tu Renta en Madrid
            </h2>
            <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
              Te asignamos un asesor personal que conoce a fondo la normativa fiscal madrileña para maximizar tu ahorro.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <CheckCircle className="w-12 h-12 text-emerald mx-auto mb-4" />
              <h3 className="font-heading text-xl font-bold text-navy mb-2">Asesores especializados en la Comunidad de Madrid</h3>
              <p className="text-gray-600">Conocen cada deducción y requisito específico para que no pierdas ni un euro.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <Users className="w-12 h-12 text-emerald mx-auto mb-4" />
              <h3 className="font-heading text-xl font-bold text-navy mb-2">El respaldo de +600 profesionales</h3>
              <p className="text-gray-600">Somos la mayor asesoría fiscal online de España, con miles de declaraciones presentadas cada año.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <Calculator className="w-12 h-12 text-emerald mx-auto mb-4" />
              <h3 className="font-heading text-xl font-bold text-navy mb-2">Simulador con tramos madrileños</h3>
              <p className="text-gray-600">Calcula el resultado de tu declaración al instante teniendo en cuenta los tipos impositivos de Madrid.</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Tramos IRPF */}
      <Section className="py-20 bg-white" id="tramos">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-navy mb-4">
            Tramos IRPF Autonómicos Madrid 2025
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl">
            Madrid aplica los tipos más bajos de España en el tramo autonómico del IRPF. Así queda la escala de gravamen para 2025:
          </p>
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase">
                <tr>
                  <th className="p-4 font-medium">Base liquidable hasta</th>
                  <th className="p-4 font-medium">Tipo autonómico</th>
                  <th className="p-4 font-medium">Tipo estatal</th>
                  <th className="p-4 font-medium">Tipo total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { base: "12.450€", auto: "8,50%", estatal: "9,50%", total: "18,00%" },
                  { base: "17.707€", auto: "10,70%", estatal: "12,00%", total: "22,70%" },
                  { base: "33.007€", auto: "12,80%", estatal: "15,00%", total: "27,80%" },
                  { base: "53.407€", auto: "17,40%", estatal: "18,50%", total: "35,90%" },
                  { base: "Más de 53.407€", auto: "20,50%", estatal: "22,50%", total: "43,00%" },
                ].map((tramo, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="p-4 text-gray-800">{tramo.base}</td>
                    <td className="p-4 text-gray-800">{tramo.auto}</td>
                    <td className="p-4 text-gray-800">{tramo.estatal}</td>
                    <td className="p-4 font-bold text-navy">{tramo.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* CTA Final */}
      <Section className="bg-navy text-white">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Calculator className="w-16 h-16 text-emerald mx-auto mb-6" />
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              Haz tu renta con expertos en Madrid.
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
              Calcula gratis el resultado de tu declaración o déjala en manos de nuestros asesores fiscales.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/simulador"
                className="inline-flex items-center justify-center gap-2 bg-emerald hover:bg-emerald-dark text-white font-bold py-4 px-8 rounded-xl transition-colors text-lg"
              >
                Simular mi renta
              </Link>
              <Link
                href="/empezar"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-xl transition-colors text-lg border border-white/20"
              >
                Contratar asesor
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </Section>

      <Footer />
    </div>
  );
}
