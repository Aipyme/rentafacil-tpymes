import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Brain,
  UserCheck,
  Shield,
  Award,
  FileText,
  CheckCircle2,
  Star,
  ArrowRight,
  ChevronRight,
  Upload,
  Sparkles,
  Send,
  ShieldCheck,
  Lock,
  BadgeCheck,
  Users,
  Building2,
  Clock,
  TrendingUp,
  HeartHandshake,
  Headphones,
  BarChart3,
  MessageCircle,
  X,
} from "lucide-react";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import { useEffect, useState, useRef } from "react";

/* ─── Animated Counter Hook ─── */
function useAnimatedCounter(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [hasStarted, target, duration]);

  return { count, ref };
}

function formatSpanishNumber(n: number): string {
  return n.toLocaleString("es-ES");
}

/* ─── Cookie Banner ─── */
function CookieBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-card border-t border-border shadow-2xl px-4 py-4 md:px-8 md:py-5">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">Este sitio web utiliza cookies</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Utilizamos cookies propias y de terceros para analizar el uso del sitio web y mejorar nuestros servicios.
            Más información en nuestra{" "}
            <button className="underline hover:text-foreground transition-colors">Política de Cookies</button>.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={() => setVisible(false)}
            className="bg-[hsl(160,100%,33%)] hover:bg-[hsl(160,100%,28%)] text-white"
            data-testid="button-accept-cookies"
          >
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            Aceptar todas
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setVisible(false)}
            data-testid="button-reject-cookies"
          >
            Solo esenciales
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── WhatsApp Floating Button ─── */
function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/34900000000?text=Hola%2C%20quiero%20información%20sobre%20la%20declaración%20de%20la%20renta"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-5 z-50 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20BD5A] shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-105"
      aria-label="Contactar por WhatsApp"
      data-testid="button-whatsapp"
    >
      <MessageCircle className="h-7 w-7 text-white fill-white" />
    </a>
  );
}

/* ─── Hero Section (Railway style: 2 columns, simulator CTA, €1847 figure) ─── */
function HeroSection() {
  const { count, ref } = useAnimatedCounter(1847, 2000);

  return (
    <section className="relative overflow-hidden py-16 md:py-24 px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(215,55%,18%)] via-[hsl(215,50%,22%)] to-[hsl(210,48%,16%)]" />
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0,168,120,0.15) 0%, transparent 40%)"
        }} />
      </div>

      <div className="relative max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Left: Copy */}
          <div>
            <Badge
              variant="secondary"
              className="mb-6 bg-white/10 text-white border-white/20 backdrop-blur-sm text-sm px-4 py-1.5"
              data-testid="badge-campaign"
            >
              <Clock className="mr-1.5 h-3.5 w-3.5" />
              Campaña Renta 2025 — Desde el 8 de abril
            </Badge>
            <h1
              className="text-3xl md:text-[2.75rem] font-bold text-white leading-[1.15] mb-5 tracking-tight"
              data-testid="text-hero-title"
            >
              Descubre en 2 minutos{" "}
              <span className="text-[hsl(160,100%,40%)]">cuánto te devuelve</span>{" "}
              Hacienda
            </h1>
            <p className="text-base md:text-lg text-white/75 mb-8 max-w-lg leading-relaxed">
              Simulador gratuito + gestión completa de tu declaración. Con el respaldo de más de 600 profesionales de Ayuda T Pymes.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              <Link href="/formulario">
                <Button
                  size="lg"
                  className="bg-[hsl(160,100%,33%)] hover:bg-[hsl(160,100%,28%)] text-white font-semibold text-base px-7 py-6 rounded-lg shadow-lg"
                  data-testid="button-simular"
                >
                  <FileText className="mr-2 h-5 w-5" />
                  Simular gratis
                </Button>
              </Link>
              <Link href="/formulario">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 font-semibold text-base px-7 py-6 rounded-lg"
                  data-testid="button-hacer-renta"
                >
                  Hacer mi renta
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Trust badges row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-white/60 text-sm">
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4" /> Datos protegidos
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" /> +20.000 clientes
              </span>
              <span className="flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4" /> Alianza BBVA
              </span>
            </div>
          </div>

          {/* Right: Return estimate card */}
          <div className="flex justify-center" ref={ref}>
            <div className="relative">
              {/* Background decoration */}
              <div className="absolute -inset-4 bg-white/5 rounded-3xl blur-xl" />

              {/* Main card */}
              <div className="relative bg-white/[0.07] backdrop-blur-md border border-white/15 rounded-2xl p-8 md:p-10 text-center max-w-sm">
                {/* Decorative chart icon */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[hsl(160,100%,33%)]/15 border border-[hsl(160,100%,33%)]/20 flex items-center justify-center">
                  <BarChart3 className="h-10 w-10 text-[hsl(160,100%,40%)]" />
                </div>

                <p className="text-white/60 text-sm mb-2">Devolución media estimada</p>
                <p className="text-5xl md:text-6xl font-bold text-[hsl(160,100%,40%)] tabular-nums tracking-tight mb-2" data-testid="text-return-estimate">
                  €{formatSpanishNumber(count)}
                </p>
                <p className="text-white/40 text-xs">Basado en rentas simples procesadas</p>

                {/* Mini stats */}
                <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-white">+340€</p>
                    <p className="text-xs text-white/50">Media extra en deducciones</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">98%</p>
                    <p className="text-xs text-white/50">Satisfacción clientes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Stats Bar (Railway style) ─── */
function StatsBar() {
  const stats = [
    { value: "600+", label: "Profesionales", icon: Users },
    { value: "20.000+", label: "Clientes confían", icon: HeartHandshake },
    { value: "15 años", label: "De experiencia", icon: Award },
    { value: "98%", label: "Satisfacción", icon: Star },
  ];

  return (
    <section className="py-10 px-4 bg-background border-b border-border/50">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center" data-testid={`stat-${i}`}>
              <stat.icon className="h-6 w-6 text-[hsl(160,100%,33%)] mx-auto mb-2" />
              <p className="text-2xl md:text-3xl font-bold tracking-tight">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Cómo Funciona Section (mix of both) ─── */
function ComoFuncionaSection() {
  const steps = [
    {
      num: "01",
      icon: FileText,
      title: "Comprueba tu caso",
      desc: "En 2 minutos nuestro simulador analiza tu situación y te dice exactamente qué documentos necesitas. Sin compromiso.",
    },
    {
      num: "02",
      icon: Upload,
      title: "Sube tu documentación",
      desc: "Nuestra IA procesa automáticamente tus datos fiscales y busca más de 200 deducciones para maximizar tu resultado.",
    },
    {
      num: "03",
      icon: UserCheck,
      title: "Un experto revisa y presenta",
      desc: "Un asesor fiscal certificado revisa tu declaración y la presenta ante la AEAT. Sin errores, sin preocupaciones.",
    },
  ];

  return (
    <section id="como-funciona" className="py-16 md:py-24 px-4 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-4">
          <Badge variant="outline" className="text-xs uppercase tracking-wider font-medium mb-3">Proceso</Badge>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4" data-testid="text-como-funciona-title">
          Tu renta en 3 pasos simples
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
          Combinamos tecnología de vanguardia con el criterio de profesionales fiscales reales.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={step.num} className="relative" data-testid={`card-como-funciona-${step.num}`}>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px border-t-2 border-dashed border-[hsl(160,100%,33%)]/20" />
              )}
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-5">
                  <div className="w-20 h-20 rounded-2xl bg-[hsl(215,55%,18%)]/8 flex items-center justify-center">
                    <step.icon className="h-9 w-9 text-[hsl(215,55%,25%)]" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[hsl(160,100%,33%)] text-white flex items-center justify-center text-xs font-bold shadow-md">
                    {step.num}
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/formulario">
            <Button
              className="bg-[hsl(160,100%,33%)] hover:bg-[hsl(160,100%,28%)] text-white px-8"
              data-testid="button-empezar-proceso"
            >
              Empezar ahora
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Advantages Section (Railway style: automation + human) ─── */
function AdvantagesSection() {
  const advantages = [
    {
      icon: Brain,
      title: "Tecnología + Humano",
      desc: "IA fiscal avanzada que analiza tu caso, con revisión obligatoria de un asesor colegiado. No te dejamos solo con un algoritmo.",
    },
    {
      icon: Lock,
      title: "Máxima seguridad",
      desc: "Cifrado de nivel bancario en tránsito y en reposo. Tus datos solo son accesibles por el asesor asignado a tu caso.",
    },
    {
      icon: TrendingUp,
      title: "Optimización fiscal",
      desc: "Nuestros algoritmos detectan deducciones que otros pasan por alto. De media, encontramos +340€ extra por declaración.",
    },
    {
      icon: Headphones,
      title: "Soporte real",
      desc: "Profesionales fiscales que resuelven tus dudas. Nada de chatbots, nada de respuestas automáticas.",
    },
  ];

  return (
    <section className="py-16 md:py-24 px-4 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-4">
          <Badge variant="outline" className="text-xs uppercase tracking-wider font-medium mb-3">Ventajas</Badge>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4" data-testid="text-advantages-title">
          Automatización con respaldo humano real
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
          La combinación perfecta entre inteligencia artificial y experiencia profesional.
        </p>
        <div className="grid sm:grid-cols-2 gap-6">
          {advantages.map((a, i) => (
            <Card key={i} className="border-border/60 bg-card" data-testid={`card-advantage-${i}`}>
              <CardContent className="pt-6 pb-6 px-6 flex gap-4">
                <div className="w-11 h-11 rounded-lg bg-[hsl(160,100%,33%)]/10 flex-shrink-0 flex items-center justify-center">
                  <a.icon className="h-5 w-5 text-[hsl(160,100%,33%)]" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{a.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{a.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Trust Indicators ─── */
function TrustSection() {
  const indicators = [
    {
      icon: BadgeCheck,
      title: "Certificado Verifactu",
      desc: "Facturación electrónica conforme al reglamento de la AEAT.",
    },
    {
      icon: ShieldCheck,
      title: "Cumplimiento RGPD",
      desc: "Datos protegidos según la normativa europea vigente.",
    },
    {
      icon: Users,
      title: "Asesores certificados",
      desc: "Profesionales colegiados con experiencia real en fiscalidad.",
    },
    {
      icon: Lock,
      title: "Cifrado bancario",
      desc: "Comunicación y almacenamiento con estándares de seguridad bancaria.",
    },
  ];

  return (
    <section className="py-16 md:py-24 px-4 bg-background">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4" data-testid="text-trust-title">
          Tu tranquilidad, nuestra prioridad
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
          Seguridad, cumplimiento normativo y profesionalidad en cada paso.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {indicators.map((item, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center group"
              data-testid={`trust-indicator-${i}`}
            >
              <div className="w-14 h-14 rounded-xl bg-[hsl(215,55%,18%)]/8 border border-[hsl(215,55%,18%)]/10 flex items-center justify-center mb-4 group-hover:bg-[hsl(215,55%,18%)]/15 transition-colors">
                <item.icon className="h-7 w-7 text-[hsl(215,55%,25%)]" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing Section (placeholder for Alfredo to decide) ─── */
function PricingSection() {
  const plans = [
    {
      name: "Renta Simple",
      target: "Caso básico: 1 pagador, sin complicaciones",
      price: "49",
      features: [
        "Simulación gratuita incluida",
        "Revisión por asesor fiscal",
        "Presentación ante la AEAT",
        "Soporte por email",
        "Resultado en 24-48h",
      ],
      highlighted: false,
      cta: "Empezar",
    },
    {
      name: "Renta Estándar",
      target: "2+ pagadores, alquiler o inversiones",
      price: "69",
      features: [
        "Todo lo de Renta Simple",
        "Optimización avanzada de deducciones",
        "Análisis de inmuebles/inversiones",
        "Soporte prioritario",
        "Resultado en 3-5 días",
      ],
      highlighted: true,
      cta: "Empezar con Estándar",
    },
    {
      name: "Renta Premium",
      target: "Autónomos, actividad económica, casos complejos",
      price: "99",
      features: [
        "Todo lo de Renta Estándar",
        "Gestión de actividad económica",
        "Asesor fiscal dedicado",
        "Planificación fiscal futura",
        "Revisión de ejercicios anteriores",
      ],
      highlighted: false,
      cta: "Empezar con Premium",
    },
  ];

  return (
    <section id="precios" className="py-16 md:py-24 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-4">
          <Badge variant="outline" className="text-xs uppercase tracking-wider font-medium mb-3">Precios</Badge>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4" data-testid="text-pricing-title">
          Transparentes y sin sorpresas
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
          Precio fijo por declaración. Sin letra pequeña.
        </p>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative bg-card ${
                plan.highlighted
                  ? "border-[hsl(160,100%,33%)]/40 ring-2 ring-[hsl(160,100%,33%)]/20 shadow-lg md:scale-105"
                  : "border-border/60"
              }`}
              data-testid={`card-pricing-${plan.name.toLowerCase().replace(/\s/g, "-")}`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[hsl(160,100%,33%)] text-white border-0 px-3 py-0.5 text-xs font-semibold shadow-md">
                    Popular
                  </Badge>
                </div>
              )}
              <CardContent className="pt-8 pb-8 px-6 md:px-8">
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.target}</p>
                </div>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}€</span>
                    <span className="text-muted-foreground text-sm">/declaración</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    IVA no incluido
                  </p>
                </div>
                <ul className="space-y-3 mb-8 text-sm">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-[hsl(160,100%,33%)] mt-0.5 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/formulario">
                  <Button
                    className={`w-full ${
                      plan.highlighted
                        ? "bg-[hsl(160,100%,33%)] hover:bg-[hsl(160,100%,28%)] text-white shadow-md"
                        : ""
                    }`}
                    variant={plan.highlighted ? "default" : "outline"}
                    data-testid={`button-pricing-${plan.name.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    {plan.cta}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground bg-muted/50 inline-block rounded-full px-4 py-2">
            * Precios orientativos pendientes de confirmación. Consulta con tu asesor para el precio final.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials Section (improved with PYMEs focus) ─── */
function TestimonialsSection() {
  const testimonials = [
    {
      name: "Ana María Ruiz",
      role: "Diseñadora freelance",
      text: "Increíble servicio. En 24 horas tenía mi declaración lista y me devolvieron 1.200€ más de lo que esperaba. El asesor me explicó cada deducción.",
      stars: 5,
    },
    {
      name: "Carlos Vega",
      role: "Consultor IT, autónomo",
      text: "Como autónomo, la renta siempre me daba dolor de cabeza. Con este servicio, todo fue rápido y claro. Encontraron deducciones que yo ni sabía que existían.",
      stars: 5,
    },
    {
      name: "Lucía Fernández",
      role: "Propietaria de e-commerce",
      text: "Llevan 3 años haciéndome la renta. Profesionales, rápidos y siempre consiguen mejor resultado que el borrador de Hacienda. Muy recomendable.",
      stars: 5,
    },
  ];

  return (
    <section className="py-16 md:py-24 px-4 bg-background">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12" data-testid="text-testimonials-title">
          Lo que dicen nuestros clientes
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <Card key={i} className="border-border/60 bg-card" data-testid={`card-testimonial-${i}`}>
              <CardContent className="pt-6 pb-6 px-6">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-foreground/90 mb-4 leading-relaxed italic">"{t.text}"</p>
                <div className="text-sm">
                  <span className="font-medium">{t.name}</span>
                  <p className="text-muted-foreground text-xs mt-0.5">{t.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ Section (combined & expanded) ─── */
function FAQSection() {
  const faqs = [
    {
      q: "¿Quién está obligado a presentar la declaración de la renta?",
      a: "Con carácter general, los contribuyentes con rendimientos del trabajo superiores a 22.000€ anuales (un solo pagador) o 15.000€ (dos o más pagadores, si del segundo y siguientes se perciben más de 1.500€). También si tienes rendimientos de capital, ganancias patrimoniales o actividades económicas por encima de ciertos umbrales.",
    },
    {
      q: "¿Quién revisa mi declaración?",
      a: "Un asesor fiscal colegiado con experiencia en tu tipo de caso. No te dejamos solo con un algoritmo: la IA prepara el borrador y un profesional lo revisa, optimiza y presenta.",
    },
    {
      q: "¿Qué pasa si mi caso es complejo?",
      a: "Si tienes múltiples pagadores, inmuebles, inversiones o actividad económica como autónomo, nuestro sistema detecta la complejidad y asigna un asesor especializado. Los planes Estándar y Premium están pensados para estos casos.",
    },
    {
      q: "¿Cuándo empieza la campaña de la Renta 2025?",
      a: "La campaña comienza el 8 de abril de 2026 y se extiende hasta el 30 de junio. Puedes registrarte y preparar tu documentación antes de esa fecha para ser de los primeros en presentar.",
    },
    {
      q: "¿Es seguro subir mis documentos?",
      a: "Absolutamente. Utilizamos cifrado de nivel bancario (SSL/TLS) tanto en tránsito como en reposo. Cumplimos con el RGPD y la LOPD. Tus datos solo son accesibles por el asesor asignado a tu caso.",
    },
    {
      q: "¿Puedo hacer la declaración conjunta?",
      a: "Sí. Nuestro sistema permite tanto la declaración individual como la conjunta. El asesor evaluará cuál es la opción más favorable para tu situación y te recomendará la mejor alternativa.",
    },
    {
      q: "¿Qué incluye la certificación Verifactu?",
      a: "Nuestro sistema cumple con el reglamento Verifactu de la AEAT para facturación electrónica. Todas las facturas emitidas desde la plataforma son válidas ante Hacienda.",
    },
    {
      q: "¿Qué documentos necesito?",
      a: "Solo necesitas tus datos personales y fiscales básicos. Nosotros accedemos a los datos fiscales de la AEAT con tu autorización. Si tienes documentación adicional (contratos de alquiler, certificados de donaciones, etc.), podrás adjuntarla durante el proceso.",
    },
  ];

  return (
    <section className="py-16 md:py-24 px-4 bg-muted/30">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12" data-testid="text-faq-title">
          Preguntas frecuentes
        </h2>
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4 bg-card" data-testid={`accordion-faq-${i}`}>
              <AccordionTrigger className="text-sm font-medium text-left py-4">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ─── CTA Final ─── */
function CTASection() {
  return (
    <section className="py-16 md:py-24 px-4 bg-[hsl(215,55%,18%)]">
      <div className="max-w-3xl mx-auto text-center">
        <Sparkles className="h-10 w-10 text-[hsl(160,100%,40%)] mx-auto mb-5" />
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4" data-testid="text-cta-title">
          ¿Listo para descubrir cuánto te devuelve Hacienda?
        </h2>
        <p className="text-white/70 mb-8 max-w-xl mx-auto">
          Simulación gratuita en 2 minutos. Sin registro previo. Sin compromiso.
        </p>
        <Link href="/formulario">
          <Button
            size="lg"
            className="bg-[hsl(160,100%,33%)] hover:bg-[hsl(160,100%,28%)] text-white font-semibold px-10 py-6 text-base rounded-lg shadow-lg"
            data-testid="button-cta-final"
          >
            <Send className="mr-2 h-5 w-5" />
            Simular mi devolución gratis
          </Button>
        </Link>
        <p className="text-white/40 text-xs mt-4">Campaña Renta 2025 · Desde el 8 de abril de 2026</p>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="py-10 px-4 bg-background border-t border-border/50">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-5 w-5 text-[hsl(215,55%,25%)]" />
              <span className="font-bold text-sm">Ayuda T Pymes</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-xs">
              Asesoría fiscal y contable para autónomos y pequeñas empresas. Alianza estratégica con BBVA.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Aviso Legal</a>
            <a href="#" className="hover:text-foreground transition-colors">Política de Privacidad</a>
            <a href="#" className="hover:text-foreground transition-colors">Política de Cookies</a>
            <a href="#" className="hover:text-foreground transition-colors">Contacto</a>
          </div>
        </div>
        <div className="mt-6 pt-5 border-t border-border/30 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-muted-foreground">
            © 2026 Ayuda T Pymes. Todos los derechos reservados.
          </p>
          <PerplexityAttribution />
        </div>
      </div>
    </footer>
  );
}

/* ─── Navbar ─── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled
          ? "bg-background/95 backdrop-blur-sm border-b border-border/50 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[hsl(215,55%,25%)]" />
          <span className="font-bold text-sm">Ayuda T Pymes</span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#como-funciona" className="hover:text-foreground transition-colors">Cómo funciona</a>
          <a href="#precios" className="hover:text-foreground transition-colors">Precios</a>
          <a href="#" className="hover:text-foreground transition-colors">Contacto</a>
        </div>

        <Link href="/formulario">
          <Button size="sm" className="bg-[hsl(160,100%,33%)] hover:bg-[hsl(160,100%,28%)] text-white" data-testid="button-nav-cta">
            Simular gratis
          </Button>
        </Link>
      </div>
    </nav>
  );
}

/* ─── Main Export ─── */
export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <StatsBar />
      <ComoFuncionaSection />
      <AdvantagesSection />
      <TrustSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
      <WhatsAppButton />
      <CookieBanner />
    </div>
  );
}
