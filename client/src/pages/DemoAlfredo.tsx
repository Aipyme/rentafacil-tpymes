/**
 * DEMO ALFREDO — Página de presentación privada
 * Diseño: Limpio, datos puros, visual. Para un CEO matemático.
 * No aparece en la navegación pública. Solo accesible por URL directa.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  TrendingUp,
  Users,
  Calculator,
  ArrowRight,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  Zap,
  Shield,
  ChevronDown,
  ExternalLink,
} from "lucide-react";

// Animated counter hook
function useCounter(end: number, duration: number = 2000, start: number = 0) {
  const [count, setCount] = useState(start);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(start + (end - start) * eased));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [started, end, duration, start]);

  return { count, start: () => setStarted(true), started };
}

// Section wrapper with fade-in
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
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export default function DemoAlfredo() {
  const revenue = useCounter(196200, 2500);
  const cost = useCounter(32700, 2500);
  const margin = useCounter(163500, 2500);
  const clients = useCounter(3000, 2500);
  const costPerUnit = useCounter(8, 1500);
  const marginPct = useCounter(83, 2000);

  // Trigger counters when hero is in view
  useEffect(() => {
    const timer = setTimeout(() => {
      revenue.start();
      cost.start();
      margin.start();
      clients.start();
      costPerUnit.start();
      marginPct.start();
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero — El problema */}
      <div className="bg-navy text-white">
        <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-emerald font-medium text-sm tracking-widest uppercase mb-4">
              Documento confidencial
            </p>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Las rentas que se escapan
              <br />
              <span className="text-emerald">ya no tienen por qué escaparse.</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/70 max-w-3xl leading-relaxed">
              Alfredo, cada campaña de renta tus clientes te piden ayuda.
              No puedes dedicar asesores a declaraciones de 30-40€.
              Los pierdes. Aquí está la solución.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="mt-12 flex justify-center"
          >
            <a href="#numeros" className="flex flex-col items-center text-white/50 hover:text-emerald transition-colors">
              <span className="text-sm mb-2">Ver los números</span>
              <ChevronDown className="w-5 h-5 animate-bounce" />
            </a>
          </motion.div>
        </div>
      </div>

      {/* Sección 1 — El dolor en números */}
      <Section id="numeros" className="py-20 bg-warm-gray">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-navy mb-4">
            El problema, en números
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl">
            Cada año, durante la campaña de renta (abril-junio):
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-4xl font-heading font-bold text-navy mb-2">~5.000</p>
              <p className="text-gray-600">clientes de T Pymes piden ayuda con su renta</p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-4xl font-heading font-bold text-navy mb-2">45 min</p>
              <p className="text-gray-600">de asesor por declaración = inviable a 30-40€</p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-4xl font-heading font-bold text-navy mb-2">60-70%</p>
              <p className="text-gray-600">se van a TaxDown, Taxfix o lo hacen solos</p>
            </div>
          </div>

          <div className="mt-8 bg-red-50 border border-red-100 rounded-xl p-6">
            <p className="text-lg text-red-800 font-medium">
              <strong>Resultado:</strong> T Pymes pierde ~3.000 oportunidades de facturación al año
              y, peor aún, esos clientes prueban otros servicios y algunos no vuelven.
            </p>
          </div>
        </div>
      </Section>

      {/* Sección 2 — La solución */}
      <Section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-navy mb-4">
            La solución: automatizar el 80%
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl">
            Un sistema que hace el trabajo pesado con IA. El asesor solo revisa y firma.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Antes */}
            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
              <h3 className="font-heading text-xl font-bold text-gray-400 mb-6 uppercase tracking-wide">Antes</h3>
              <div className="space-y-4">
                {[
                  "Cliente llama pidiendo cita",
                  "Asesor recoge documentación a mano",
                  "Asesor revisa todo desde cero (45 min)",
                  "Asesor presenta la declaración",
                  "Coste: ~25€ de tiempo de asesor",
                  "Precio: 30-40€ → margen ridículo",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">{i + 1}</span>
                    </div>
                    <p className="text-gray-500">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ahora */}
            <div className="bg-emerald/5 rounded-xl p-8 border-2 border-emerald">
              <h3 className="font-heading text-xl font-bold text-emerald-dark mb-6 uppercase tracking-wide">Ahora</h3>
              <div className="space-y-4">
                {[
                  { text: "Cliente entra por la web y rellena formulario inteligente", tag: "Auto" },
                  { text: "IA clasifica complejidad y pide solo los docs necesarios", tag: "Auto" },
                  { text: "IA genera borrador de declaración pre-revisado", tag: "Auto" },
                  { text: "Asesor revisa y valida (10-15 min, no 45)", tag: "Humano" },
                  { text: "Coste real: ~8€ por declaración", tag: "x3 menos" },
                  { text: "Precio: 49-99€ → margen del 75-85%", tag: "x10 más" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-navy font-medium">{item.text}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald bg-emerald/10 px-2 py-1 rounded-full whitespace-nowrap">
                      {item.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Sección 3 — Los números que importan */}
      <Section className="py-20 bg-navy text-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Proyección: Campaña Renta 2025
          </h2>
          <p className="text-lg text-white/60 mb-12">
            Escenario moderado. 3.000 declaraciones procesadas.
          </p>

          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="text-center">
              <p className="text-5xl md:text-6xl font-heading font-bold text-emerald">
                {clients.count.toLocaleString("es-ES")}
              </p>
              <p className="text-white/60 mt-2">declaraciones</p>
            </div>
            <div className="text-center">
              <p className="text-5xl md:text-6xl font-heading font-bold text-white">
                {revenue.count.toLocaleString("es-ES")}€
              </p>
              <p className="text-white/60 mt-2">facturación bruta</p>
            </div>
            <div className="text-center">
              <p className="text-5xl md:text-6xl font-heading font-bold text-white/40">
                -{cost.count.toLocaleString("es-ES")}€
              </p>
              <p className="text-white/60 mt-2">costes operativos</p>
            </div>
            <div className="text-center">
              <p className="text-5xl md:text-6xl font-heading font-bold text-emerald">
                {margin.count.toLocaleString("es-ES")}€
              </p>
              <p className="text-white/60 mt-2">beneficio neto</p>
            </div>
          </div>

          {/* Tabla de escenarios */}
          <div className="bg-white/5 rounded-xl overflow-hidden border border-white/10">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-white/50 font-medium text-sm">Escenario</th>
                  <th className="px-6 py-4 text-white/50 font-medium text-sm">Declaraciones</th>
                  <th className="px-6 py-4 text-white/50 font-medium text-sm">Ticket medio</th>
                  <th className="px-6 py-4 text-white/50 font-medium text-sm">Facturación</th>
                  <th className="px-6 py-4 text-white/50 font-medium text-sm">Beneficio</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5">
                  <td className="px-6 py-4 text-white/70">Conservador</td>
                  <td className="px-6 py-4 text-white">1.500</td>
                  <td className="px-6 py-4 text-white">58€</td>
                  <td className="px-6 py-4 text-white">87.000€</td>
                  <td className="px-6 py-4 text-emerald font-bold">70.500€</td>
                </tr>
                <tr className="border-b border-white/5 bg-emerald/10">
                  <td className="px-6 py-4 text-emerald font-bold">Moderado</td>
                  <td className="px-6 py-4 text-white font-bold">3.000</td>
                  <td className="px-6 py-4 text-white font-bold">65€</td>
                  <td className="px-6 py-4 text-white font-bold">196.200€</td>
                  <td className="px-6 py-4 text-emerald font-bold">163.500€</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-white/70">Optimista</td>
                  <td className="px-6 py-4 text-white">5.000</td>
                  <td className="px-6 py-4 text-white">72€</td>
                  <td className="px-6 py-4 text-white">360.000€</td>
                  <td className="px-6 py-4 text-emerald font-bold">306.000€</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
              <DollarSign className="w-8 h-8 text-emerald mx-auto mb-3" />
              <p className="text-3xl font-heading font-bold text-white">~{costPerUnit.count}€</p>
              <p className="text-white/50 text-sm mt-1">coste por declaración</p>
            </div>
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
              <BarChart3 className="w-8 h-8 text-emerald mx-auto mb-3" />
              <p className="text-3xl font-heading font-bold text-white">{marginPct.count}%</p>
              <p className="text-white/50 text-sm mt-1">margen neto</p>
            </div>
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
              <Zap className="w-8 h-8 text-emerald mx-auto mb-3" />
              <p className="text-3xl font-heading font-bold text-white">10-15 min</p>
              <p className="text-white/50 text-sm mt-1">tiempo de asesor (vs 45 min)</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Sección 4 — Qué incluye */}
      <Section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-navy mb-4">
            Qué está construido (ya funciona)
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl">
            No es un PowerPoint. Es un sistema operativo listo para activar.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: <ExternalLink className="w-5 h-5" />,
                title: "Web de captación",
                desc: "Landing page profesional con simulador de renta interactivo. El cliente calcula cuánto le sale antes de contratar.",
                link: "/",
                linkText: "Ver web →",
              },
              {
                icon: <Calculator className="w-5 h-5" />,
                title: "Simulador IRPF 2025",
                desc: "Cálculo real con tramos estatal y autonómico separados. 17 CCAA. Deducciones 2025 actualizadas.",
                link: "/simulador",
                linkText: "Probar simulador →",
              },
              {
                icon: <Shield className="w-5 h-5" />,
                title: "Formulario de triage inteligente",
                desc: "Clasifica automáticamente la complejidad del caso. Genera lista de documentos personalizada. Asigna plan y precio.",
                link: "/empezar",
                linkText: "Ver formulario →",
              },
              {
                icon: <Zap className="w-5 h-5" />,
                title: "Automatización con IA (n8n)",
                desc: "5 workflows listos: captación, procesamiento con GPT-4, comunicación automática (WhatsApp/email), upsell post-renta, métricas.",
                link: null,
                linkText: "Workflows JSON exportables",
              },
              {
                icon: <BarChart3 className="w-5 h-5" />,
                title: "Prompts fiscales especializados",
                desc: "6 prompts de IA entrenados en normativa IRPF 2025: clasificador, detector de deducciones, verificador, chatbot fiscal.",
                link: null,
                linkText: "Arsenal de prompts listo",
              },
              {
                icon: <Users className="w-5 h-5" />,
                title: "Manual de operaciones",
                desc: "Equipo necesario, SLAs, checklist por tipo de caso, plantillas de comunicación, protocolo de escalado.",
                link: null,
                linkText: "Documentación completa",
              },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:border-emerald/30 transition-colors">
                <div className="w-10 h-10 bg-emerald/10 rounded-lg flex items-center justify-center text-emerald mb-4">
                  {item.icon}
                </div>
                <h3 className="font-heading text-lg font-bold text-navy mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{item.desc}</p>
                {item.link ? (
                  <Link href={item.link} className="text-emerald font-medium text-sm hover:text-emerald-dark transition-colors inline-flex items-center gap-1">
                    {item.linkText} <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <span className="text-emerald/60 text-sm font-medium">{item.linkText}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Sección 5 — El efecto dominó */}
      <Section className="py-20 bg-warm-gray">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-navy mb-4">
            El efecto dominó: la renta es solo la puerta
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl">
            Un cliente que entra por la renta se queda para todo lo demás.
          </p>

          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-2">
            {[
              { step: "Renta", price: "49-99€", desc: "Entrada de bajo coste" },
              { step: "Fiscal trimestral", price: "50-80€/mes", desc: "Autónomos que descubres" },
              { step: "Contabilidad", price: "100-200€/mes", desc: "Pymes que captas" },
              { step: "Laboral", price: "150-300€/mes", desc: "Nóminas y seguros" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 md:gap-2 w-full md:w-auto">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center flex-1 md:flex-none md:w-48">
                  <p className="font-heading text-lg font-bold text-navy">{item.step}</p>
                  <p className="text-emerald font-bold text-xl mt-1">{item.price}</p>
                  <p className="text-gray-500 text-xs mt-1">{item.desc}</p>
                </div>
                {i < 3 && (
                  <ArrowRight className="w-6 h-6 text-emerald flex-shrink-0 hidden md:block" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-10 bg-emerald/10 border border-emerald/20 rounded-xl p-6">
            <p className="text-lg text-navy font-medium">
              <strong>Dato clave:</strong> El 30-40% de los clientes de renta tienen necesidades adicionales
              que hoy se van a la competencia. Con este sistema, los detectas automáticamente durante el triage.
            </p>
          </div>
        </div>
      </Section>

      {/* Sección 6 — Qué necesitas de T Pymes */}
      <Section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-navy mb-4">
            Qué necesito de T Pymes para activarlo
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl">
            El sistema está construido. Solo falta conectarlo a vuestra infraestructura.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-heading text-xl font-bold text-navy mb-6">Lo que ya está hecho</h3>
              <div className="space-y-3">
                {[
                  "Web de captación con simulador",
                  "Formulario de triage inteligente",
                  "Workflows de automatización (n8n)",
                  "Prompts de IA fiscales",
                  "Plantillas de comunicación",
                  "Manual de operaciones",
                  "Modelo financiero con 3 escenarios",
                  "Blog SEO con 8 artículos",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-heading text-xl font-bold text-navy mb-6">Lo que necesito de vosotros</h3>
              <div className="space-y-3">
                {[
                  "Acceso a la base de clientes (email/WhatsApp)",
                  "1-2 asesores fiscales para revisión (parcial)",
                  "Subdominio bajo ayudatpymes.es (ej: renta.ayudatpymes.es)",
                  "Logo y branding oficial de T Pymes",
                  "Validación de precios finales (49/69/99€)",
                  "Canal de WhatsApp Business",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-navy/30 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA Final */}
      <Section className="py-20 bg-navy text-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">
            La campaña de renta 2025 empieza en abril.
            <br />
            <span className="text-emerald">¿Activamos esto?</span>
          </h2>
          <p className="text-xl text-white/60 mb-10">
            Todo está construido. Solo necesito tu OK para conectarlo
            a la infraestructura de T Pymes y empezar a captar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/simulador"
              className="inline-flex items-center justify-center gap-2 bg-emerald hover:bg-emerald-dark text-white font-bold py-4 px-8 rounded-xl transition-colors text-lg"
            >
              Probar el simulador <Calculator className="w-5 h-5" />
            </Link>
            <Link
              href="/empezar"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-xl transition-colors text-lg border border-white/20"
            >
              Ver el formulario <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </Section>

      {/* Footer mínimo */}
      <div className="bg-navy border-t border-white/10 py-6">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-white/30 text-sm">
            Documento confidencial — Preparado para Alfredo, CEO de Ayuda T Pymes
          </p>
        </div>
      </div>
    </div>
  );
}
