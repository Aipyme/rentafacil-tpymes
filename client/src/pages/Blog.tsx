/**
 * Design: Fintech Institucional
 * Blog SEO — Artículos sobre IRPF, deducciones y fiscalidad
 * Palette: Navy #1a365d, Emerald #059669, Warm gray #f7f5f2
 */
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Calendar, Clock, ArrowRight, Search, Tag } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useSEO } from "@/hooks/useSEO";

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  image: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "deducciones-madrid-2025",
    title: "Deducciones en Madrid 2025: todas las que puedes aplicar en tu renta",
    excerpt: "La Comunidad de Madrid ofrece los tipos impositivos más bajos de España y deducciones exclusivas por alquiler, gastos educativos, acogimiento y más. Te explicamos cada una con importes y requisitos.",
    category: "Deducciones",
    readTime: "7 min",
    date: "2025-03-20",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663338874301/9cYuQahZqTNwQkcjbW6hjA/blog-deducciones-madrid_2b654191.jpg",
  },
  {
    slug: "estoy-obligado-declarar-renta-2025",
    title: "¿Estoy obligado a hacer la declaración de la renta en 2025?",
    excerpt: "Descubre los límites de ingresos, las excepciones y los casos especiales que determinan si debes presentar tu declaración del IRPF este año. Con los nuevos límites actualizados para la campaña 2025.",
    category: "Obligaciones",
    readTime: "5 min",
    date: "2025-03-15",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663338874301/9cYuQahZqTNwQkcjbW6hjA/blog-obligacion-declarar_42640c5c.png",
  },
  {
    slug: "deducciones-autonomicas-2025-guia-completa",
    title: "Guía completa de deducciones autonómicas IRPF 2025",
    excerpt: "Cada comunidad autónoma tiene sus propias deducciones fiscales. Te explicamos las más importantes de Madrid, Cataluña, Andalucía, Valencia y el resto de CCAA para que no dejes dinero sobre la mesa.",
    category: "Deducciones",
    readTime: "8 min",
    date: "2025-03-10",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663338874301/9cYuQahZqTNwQkcjbW6hjA/blog-deducciones-autonomicas_d7e0807f.png",
  },
  {
    slug: "dos-pagadores-declaracion-renta",
    title: "Dos pagadores en la renta: ¿me sale a pagar?",
    excerpt: "Si has cambiado de trabajo, has cobrado el paro o has tenido dos pagadores, es probable que te salga a pagar. Te explicamos por qué ocurre y cómo minimizar el impacto con deducciones.",
    category: "Situaciones",
    readTime: "6 min",
    date: "2025-03-05",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663338874301/9cYuQahZqTNwQkcjbW6hjA/blog-dos-pagadores_141bd376.png",
  },
  {
    slug: "hipoteca-antes-2013-deduccion",
    title: "Hipoteca anterior a 2013: la deducción que muchos olvidan",
    excerpt: "Si compraste tu vivienda habitual antes del 1 de enero de 2013, puedes deducirte hasta 9.040€ al año. Te explicamos cómo aplicarla correctamente y cuánto puedes recuperar.",
    category: "Deducciones",
    readTime: "4 min",
    date: "2025-02-28",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663338874301/9cYuQahZqTNwQkcjbW6hjA/blog-hipoteca_e5df8700.png",
  },
  {
    slug: "plan-pensiones-reduccion-irpf",
    title: "Plan de pensiones: cómo reducir tu base imponible hasta 1.500€",
    excerpt: "Las aportaciones a planes de pensiones siguen siendo una de las mejores herramientas de planificación fiscal. Te explicamos los límites 2025 y cómo optimizar tu aportación.",
    category: "Deducciones",
    readTime: "5 min",
    date: "2025-02-20",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663338874301/9cYuQahZqTNwQkcjbW6hjA/blog-plan-pensiones_b38167a8.png",
  },
  {
    slug: "declaracion-conjunta-individual-que-conviene",
    title: "¿Declaración conjunta o individual? Cómo saber qué te conviene",
    excerpt: "La elección entre declaración conjunta e individual puede suponer cientos de euros de diferencia. Analizamos los escenarios más comunes y te damos la clave para decidir.",
    category: "Situaciones",
    readTime: "6 min",
    date: "2025-02-15",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663338874301/9cYuQahZqTNwQkcjbW6hjA/blog-conjunta-individual_0a75a878.png",
  },
  {
    slug: "errores-comunes-declaracion-renta",
    title: "7 errores comunes en la declaración de la renta (y cómo evitarlos)",
    excerpt: "Desde olvidar deducciones hasta no revisar el borrador de Hacienda, estos son los errores más frecuentes que hacen que pagues de más. Aprende a evitarlos.",
    category: "Consejos",
    readTime: "7 min",
    date: "2025-02-10",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663338874301/9cYuQahZqTNwQkcjbW6hjA/blog-errores-comunes_83a5c011.png",
  },
  {
    slug: "vehiculo-electrico-deduccion-2025",
    title: "Deducción por vehículo eléctrico: hasta un 15% en tu IRPF",
    excerpt: "Si has comprado un coche eléctrico o has instalado un punto de recarga, puedes deducirte hasta el 15% del precio. Te explicamos los requisitos y cómo aplicarla.",
    category: "Deducciones",
    readTime: "4 min",
    date: "2025-02-05",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663338874301/9cYuQahZqTNwQkcjbW6hjA/blog-vehiculo-electrico_05afea3c.png",
  },
];

const CATEGORIES = ["Todos", "Deducciones", "Obligaciones", "Situaciones", "Consejos"];

export default function Blog() {
  useSEO({
    title: "Blog Fiscal — Guías y Consejos para tu Renta 2025",
    description: "Artículos y guías prácticas sobre la declaración de la renta 2025: deducciones, obligaciones, errores comunes y cómo ahorrar en tu IRPF.",
    canonical: "/blog",
  });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");

  const filtered = BLOG_POSTS.filter((post) => {
    const matchSearch =
      search === "" ||
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "Todos" || post.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f5f2]">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 lg:pt-28 lg:pb-24">
        <div className="container max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-[#1a365d]/10 text-[#1a365d] rounded-full text-sm font-medium mb-4">
              Blog Fiscal
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1a365d] mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Guías y consejos para tu renta
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Artículos escritos por asesores fiscales para ayudarte a entender tu declaración y no dejar dinero sobre la mesa.
            </p>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar artículos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669] transition-all"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    category === cat
                      ? "bg-[#1a365d] text-white shadow-md"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de artículos */}
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No se encontraron artículos con esos criterios.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((post, i) => (
                <motion.div
                  key={post.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/blog/${post.slug}`}>
                    <article className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 h-full flex flex-col">
                      <div className="relative overflow-hidden aspect-[16/10]">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-[#1a365d]">
                            <Tag className="w-3 h-3" />
                            {post.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <h2 className="text-lg font-bold text-[#1a365d] mb-2 group-hover:text-[#059669] transition-colors line-clamp-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                          {post.title}
                        </h2>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(post.date).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {post.readTime}
                            </span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-[#059669] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </article>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 bg-[#1a365d] rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              ¿Prefieres que un experto haga tu renta?
            </h2>
            <p className="text-blue-200 mb-6 max-w-xl mx-auto">
              Nuestros asesores fiscales se encargan de todo. Desde 49€, con revisión de deducciones incluida.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/simulador">
                <span className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#1a365d] font-semibold rounded-xl hover:bg-gray-100 transition-colors">
                  Simular gratis
                </span>
              </Link>
              <Link href="/empezar">
                <span className="inline-flex items-center gap-2 px-6 py-3 bg-[#059669] text-white font-semibold rounded-xl hover:bg-[#047857] transition-colors">
                  Hacer mi renta
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
