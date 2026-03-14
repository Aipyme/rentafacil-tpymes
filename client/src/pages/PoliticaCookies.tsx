/**
 * Design: Fintech Institucional
 * Política de Cookies — Cumplimiento LSSI-CE y RGPD
 * Palette: Navy #1a365d, Warm gray #f7f5f2
 */
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Cookie, ArrowLeft } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

const COOKIES_TECNICAS = [
  { name: "cookie_consent", purpose: "Almacena la preferencia de cookies del usuario", duration: "1 año", owner: "Propia" },
  { name: "session_id", purpose: "Identificador de sesión para mantener el estado de navegación", duration: "Sesión", owner: "Propia" },
];

const COOKIES_ANALITICAS = [
  { name: "_ga", purpose: "Distinguir usuarios únicos para estadísticas de visitas", duration: "2 años", owner: "Google Analytics" },
  { name: "_ga_*", purpose: "Mantener el estado de la sesión de análisis", duration: "2 años", owner: "Google Analytics" },
  { name: "umami.*", purpose: "Análisis de uso del sitio web (sin datos personales)", duration: "Sesión", owner: "Umami (propia)" },
];

function CookieTable({ cookies }: { cookies: typeof COOKIES_TECNICAS }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[#1a365d] text-white">
            <th className="px-3 py-2 text-left rounded-tl-lg">Cookie</th>
            <th className="px-3 py-2 text-left">Finalidad</th>
            <th className="px-3 py-2 text-left">Duración</th>
            <th className="px-3 py-2 text-left rounded-tr-lg">Titular</th>
          </tr>
        </thead>
        <tbody className="text-gray-700">
          {cookies.map((c, i) => (
            <tr key={c.name} className={i % 2 === 1 ? "bg-gray-50/50 border-b border-gray-100" : "border-b border-gray-100"}>
              <td className="px-3 py-2 font-mono text-xs">{c.name}</td>
              <td className="px-3 py-2">{c.purpose}</td>
              <td className="px-3 py-2">{c.duration}</td>
              <td className="px-3 py-2">{c.owner}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PoliticaCookies() {
  useSEO({
    title: "Política de Cookies",
    description: "Política de cookies de Renta Fácil TPymes. Información sobre las cookies utilizadas, su finalidad y cómo gestionarlas.",
    canonical: "/cookies",
    noindex: true,
  });
  return (
    <div className="min-h-screen flex flex-col bg-[#f7f5f2]">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 lg:pt-28 lg:pb-24">
        <article className="container max-w-3xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link href="/">
              <span className="hover:text-[#059669] transition-colors">Inicio</span>
            </Link>
            <span>/</span>
            <span className="text-gray-700">Política de Cookies</span>
          </div>

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Cookie className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#1a365d]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Política de Cookies
              </h1>
              <p className="text-sm text-gray-500">Última actualización: marzo 2025</p>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10 space-y-8" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>

            <section>
              <h2 className="text-xl font-bold text-[#1a365d] mb-3">1. ¿Qué son las cookies?</h2>
              <p className="text-gray-700 leading-relaxed">
                Las cookies son pequeños archivos de texto que los sitios web almacenan en su dispositivo (ordenador, tableta o teléfono móvil) cuando los visita. Permiten que el sitio web recuerde sus acciones y preferencias durante un periodo de tiempo, de modo que no tenga que volver a introducirlos cada vez que visite el sitio o navegue de una página a otra.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1a365d] mb-3">2. Cookies técnicas (necesarias)</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Son imprescindibles para el correcto funcionamiento del Sitio Web. No requieren consentimiento del usuario conforme al artículo 22.2 de la LSSI-CE.
              </p>
              <CookieTable cookies={COOKIES_TECNICAS} />
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1a365d] mb-3">3. Cookies analíticas</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Nos permiten cuantificar el número de usuarios y realizar la medición y análisis estadístico de la utilización del Sitio Web. Para su instalación se requiere el consentimiento del usuario.
              </p>
              <CookieTable cookies={COOKIES_ANALITICAS} />
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1a365d] mb-3">4. Cookies de terceros</h2>
              <p className="text-gray-700 leading-relaxed">
                Algunos servicios de terceros que utilizamos pueden instalar cookies en su dispositivo. Le informamos de los principales:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 text-sm mt-3">
                <li><strong>Google Analytics:</strong> servicio de análisis web prestado por Google LLC. Puede consultar su política de privacidad en <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#059669] hover:underline">policies.google.com/privacy</a>.</li>
                <li><strong>WhatsApp (Meta):</strong> el botón de contacto de WhatsApp puede instalar cookies cuando interactúa con él. Puede consultar la política de privacidad de Meta en <a href="https://www.whatsapp.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#059669] hover:underline">whatsapp.com/legal/privacy-policy</a>.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1a365d] mb-3">5. ¿Cómo gestionar las cookies?</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Usted puede permitir, bloquear o eliminar las cookies instaladas en su equipo mediante la configuración de las opciones de su navegador:
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { browser: "Google Chrome", url: "https://support.google.com/chrome/answer/95647" },
                  { browser: "Mozilla Firefox", url: "https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" },
                  { browser: "Microsoft Edge", url: "https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" },
                  { browser: "Safari", url: "https://support.apple.com/es-es/guide/safari/sfri11471/mac" },
                ].map((b) => (
                  <a
                    key={b.browser}
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-semibold text-[#1a365d]">{b.browser}</span>
                    <span className="text-xs text-gray-400">→ Configurar cookies</span>
                  </a>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed mt-4 text-sm">
                Si desactiva las cookies, es posible que algunos servicios del Sitio Web no funcionen correctamente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1a365d] mb-3">6. Base legal</h2>
              <p className="text-gray-700 leading-relaxed">
                La base legal para el tratamiento de datos mediante cookies técnicas es el interés legítimo del responsable (artículo 6.1.f del RGPD). Para las cookies analíticas y de terceros, la base legal es el consentimiento del usuario (artículo 6.1.a del RGPD), que puede retirar en cualquier momento.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1a365d] mb-3">7. Actualización de esta política</h2>
              <p className="text-gray-700 leading-relaxed">
                Esta Política de Cookies puede actualizarse periódicamente para reflejar cambios en las cookies que utilizamos o por otros motivos operativos, legales o regulatorios. Le recomendamos que revise esta política regularmente para estar informado sobre el uso de cookies.
              </p>
            </section>

          </div>

          {/* Back */}
          <div className="mt-8">
            <Link href="/">
              <span className="inline-flex items-center gap-2 text-[#1a365d] hover:text-[#059669] transition-colors font-medium text-sm">
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio
              </span>
            </Link>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
