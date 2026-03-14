/**
 * Design: Fintech Institucional
 * Política de Privacidad — Cumplimiento RGPD (UE 2016/679) y LOPD-GDD (LO 3/2018)
 * Palette: Navy #1a365d, Warm gray #f7f5f2
 */
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

export default function PoliticaPrivacidad() {
  useSEO({
    title: "Política de Privacidad",
    description: "Política de privacidad de Renta Fácil TPymes. Información sobre el tratamiento de datos personales conforme al RGPD y la LOPD-GDD.",
    canonical: "/privacidad",
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
            <span className="text-gray-700">Política de Privacidad</span>
          </div>

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-[#059669]/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[#059669]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#1a365d]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Política de Privacidad
              </h1>
              <p className="text-sm text-gray-500">Última actualización: marzo 2025</p>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10 space-y-8" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>

            <section>
              <h2 className="text-xl font-bold text-[#1a365d] mb-3">1. Responsable del tratamiento</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                De conformidad con lo establecido en el Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo, de 27 de abril de 2016 (RGPD), y la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPD-GDD), le informamos que los datos personales que nos facilite serán tratados por:
              </p>
              <div className="bg-gray-50 rounded-xl p-5 text-sm text-gray-700 space-y-1.5">
                <p><strong className="text-[#1a365d]">Responsable:</strong> [NOMBRE DE LA EMPRESA / AYUDA T PYMES S.L.]</p>
                <p><strong className="text-[#1a365d]">NIF/CIF:</strong> [B-XXXXXXXX]</p>
                <p><strong className="text-[#1a365d]">Dirección:</strong> [DIRECCIÓN COMPLETA]</p>
                <p><strong className="text-[#1a365d]">Correo electrónico:</strong> [privacidad@EMAIL.COM]</p>
                <p><strong className="text-[#1a365d]">Delegado de Protección de Datos (DPO):</strong> [NOMBRE O EMAIL DEL DPO, si aplica]</p>
              </div>
              <p className="text-xs text-amber-600 mt-3 bg-amber-50 p-3 rounded-lg">
                ⚠ Los datos entre corchetes deben ser sustituidos por los datos reales de la empresa antes de la publicación definitiva.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1a365d] mb-3">2. Datos que recogemos</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                A través de este Sitio Web podemos recoger los siguientes datos personales:
              </p>

              <h3 className="text-lg font-semibold text-[#1a365d] mt-5 mb-2">2.1. Formulario de triage (solicitud del servicio de renta)</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-1.5 text-sm">
                <li><strong>Datos identificativos:</strong> nombre, apellidos, NIF/NIE</li>
                <li><strong>Datos de contacto:</strong> correo electrónico, teléfono</li>
                <li><strong>Datos económicos y fiscales:</strong> tipo de contribuyente, número de pagadores, ingresos aproximados, comunidad autónoma, situación familiar, información sobre inmuebles, inversiones, deducciones aplicables</li>
                <li><strong>Preferencias de contacto:</strong> canal preferido de comunicación</li>
              </ul>

              <h3 className="text-lg font-semibold text-[#1a365d] mt-5 mb-2">2.2. Simulador fiscal</h3>
              <p className="text-gray-700 text-sm">
                Los datos introducidos en el simulador fiscal se procesan exclusivamente en el navegador del usuario y <strong>no se almacenan ni se transmiten a nuestros servidores</strong>, salvo que el usuario decida enviar el resultado a través del formulario de contacto.
              </p>

              <h3 className="text-lg font-semibold text-[#1a365d] mt-5 mb-2">2.3. Datos de navegación</h3>
              <p className="text-gray-700 text-sm">
                Dirección IP, tipo de navegador, sistema operativo, páginas visitadas, tiempo de permanencia y otros datos de análisis web recogidos mediante cookies (ver <Link href="/cookies" className="text-[#059669] hover:underline">Política de Cookies</Link>).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1a365d] mb-3">3. Finalidades del tratamiento</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#1a365d] text-white">
                      <th className="px-4 py-2.5 text-left rounded-tl-lg">Finalidad</th>
                      <th className="px-4 py-2.5 text-left">Base legal</th>
                      <th className="px-4 py-2.5 text-left rounded-tr-lg">Conservación</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3">Gestión de la solicitud del servicio de declaración de renta</td>
                      <td className="px-4 py-3">Ejecución de contrato (art. 6.1.b RGPD)</td>
                      <td className="px-4 py-3">Duración de la relación contractual + 5 años (obligación fiscal)</td>
                    </tr>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <td className="px-4 py-3">Clasificación y asignación del expediente al asesor fiscal correspondiente</td>
                      <td className="px-4 py-3">Ejecución de contrato (art. 6.1.b RGPD)</td>
                      <td className="px-4 py-3">Duración de la relación contractual</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3">Comunicación sobre el estado del servicio contratado</td>
                      <td className="px-4 py-3">Ejecución de contrato (art. 6.1.b RGPD)</td>
                      <td className="px-4 py-3">Duración de la relación contractual</td>
                    </tr>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <td className="px-4 py-3">Envío de comunicaciones comerciales sobre servicios de asesoría fiscal</td>
                      <td className="px-4 py-3">Interés legítimo (art. 6.1.f RGPD) / Consentimiento (art. 6.1.a RGPD)</td>
                      <td className="px-4 py-3">Hasta revocación del consentimiento</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3">Cumplimiento de obligaciones legales y fiscales</td>
                      <td className="px-4 py-3">Obligación legal (art. 6.1.c RGPD)</td>
                      <td className="px-4 py-3">Plazos legalmente establecidos</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Análisis estadístico y mejora del servicio</td>
                      <td className="px-4 py-3">Interés legítimo (art. 6.1.f RGPD)</td>
                      <td className="px-4 py-3">Datos anonimizados, sin límite</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1a365d] mb-3">4. Destinatarios de los datos</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Sus datos personales podrán ser comunicados a:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 text-sm">
                <li><strong>Asesores fiscales de Ayuda T Pymes:</strong> profesionales encargados de la elaboración y revisión de su declaración de renta, en calidad de encargados del tratamiento.</li>
                <li><strong>Administraciones públicas:</strong> Agencia Estatal de Administración Tributaria (AEAT) y administraciones autonómicas, cuando sea necesario para la prestación del servicio contratado o por obligación legal.</li>
                <li><strong>Proveedores tecnológicos:</strong> servicios de alojamiento web, correo electrónico y herramientas de gestión, que actúan como encargados del tratamiento con las garantías adecuadas.</li>
                <li><strong>Entidades financieras:</strong> exclusivamente para la gestión del cobro del servicio contratado.</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                No se realizan transferencias internacionales de datos fuera del Espacio Económico Europeo (EEE), salvo a proveedores que cuenten con las garantías adecuadas conforme al Capítulo V del RGPD (cláusulas contractuales tipo, decisiones de adecuación, etc.).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1a365d] mb-3">5. Derechos del interesado</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                De conformidad con el RGPD y la LOPD-GDD, usted tiene derecho a:
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { title: "Acceso", desc: "Conocer qué datos personales tratamos sobre usted" },
                  { title: "Rectificación", desc: "Corregir datos inexactos o incompletos" },
                  { title: "Supresión", desc: "Solicitar la eliminación de sus datos cuando ya no sean necesarios" },
                  { title: "Oposición", desc: "Oponerse al tratamiento de sus datos en determinadas circunstancias" },
                  { title: "Limitación", desc: "Solicitar la limitación del tratamiento en los casos previstos por la ley" },
                  { title: "Portabilidad", desc: "Recibir sus datos en un formato estructurado y de uso común" },
                ].map((right) => (
                  <div key={right.title} className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-[#1a365d] text-sm mb-1">Derecho de {right.title}</h4>
                    <p className="text-xs text-gray-600">{right.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed mt-4 text-sm">
                Para ejercer estos derechos, puede dirigirse a <strong>[privacidad@EMAIL.COM]</strong> adjuntando copia de su DNI o documento identificativo equivalente. Le responderemos en un plazo máximo de un mes.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3 text-sm">
                Asimismo, tiene derecho a presentar una reclamación ante la <strong>Agencia Española de Protección de Datos (AEPD)</strong> en <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-[#059669] hover:underline">www.aepd.es</a> si considera que el tratamiento de sus datos no se ajusta a la normativa vigente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1a365d] mb-3">6. Medidas de seguridad</h2>
              <p className="text-gray-700 leading-relaxed">
                Hemos adoptado las medidas técnicas y organizativas apropiadas para garantizar un nivel de seguridad adecuado al riesgo, conforme al artículo 32 del RGPD. Entre otras: cifrado de comunicaciones (SSL/TLS), control de acceso a los datos, copias de seguridad periódicas, formación del personal en materia de protección de datos y evaluaciones periódicas de la eficacia de las medidas implementadas.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1a365d] mb-3">7. Datos de menores</h2>
              <p className="text-gray-700 leading-relaxed">
                Este Sitio Web no está dirigido a menores de 14 años. No recogemos conscientemente datos personales de menores de dicha edad. Si usted es padre, madre o tutor legal y tiene conocimiento de que su hijo nos ha proporcionado datos personales, le rogamos que se ponga en contacto con nosotros para proceder a su eliminación.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1a365d] mb-3">8. Modificaciones de esta política</h2>
              <p className="text-gray-700 leading-relaxed">
                Nos reservamos el derecho de modificar la presente Política de Privacidad para adaptarla a novedades legislativas o jurisprudenciales. En caso de cambios significativos, se lo notificaremos a través del Sitio Web o por correo electrónico.
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
