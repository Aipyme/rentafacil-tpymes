/**
 * Design: Fintech Institucional
 * Aviso Legal — Cumplimiento LSSI-CE, Ley 34/2002
 * Palette: Navy #1a365d, Warm gray #f7f5f2
 */
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Scale, ArrowLeft } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

export default function AvisoLegal() {
  useSEO({
    title: "Aviso Legal",
    description: "Aviso legal e información sobre el titular del sitio web Renta Fácil TPymes, conforme a la Ley 34/2002 de Servicios de la Sociedad de la Información (LSSI-CE).",
    canonical: "/aviso-legal",
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
            <span className="text-gray-700">Aviso Legal</span>
          </div>

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-[#1a365d]/10 flex items-center justify-center">
              <Scale className="w-6 h-6 text-[#1a365d]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#1a365d]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Aviso Legal
              </h1>
              <p className="text-sm text-gray-500">Última actualización: marzo 2025</p>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10 space-y-8" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>

            <section>
              <h2 className="text-xl font-bold text-[#1a365d] mb-3">1. Datos identificativos</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y Comercio Electrónico (LSSI-CE), se informa al usuario de los datos del titular de este sitio web:
              </p>
              <div className="bg-gray-50 rounded-xl p-5 text-sm text-gray-700 space-y-1.5">
                <p><strong className="text-[#1a365d]">Denominación social:</strong> [NOMBRE DE LA EMPRESA / AYUDA T PYMES S.L.]</p>
                <p><strong className="text-[#1a365d]">NIF/CIF:</strong> [B-XXXXXXXX]</p>
                <p><strong className="text-[#1a365d]">Domicilio social:</strong> [DIRECCIÓN COMPLETA, CP, CIUDAD, PROVINCIA]</p>
                <p><strong className="text-[#1a365d]">Teléfono:</strong> [NÚMERO DE TELÉFONO]</p>
                <p><strong className="text-[#1a365d]">Correo electrónico:</strong> [EMAIL DE CONTACTO]</p>
                <p><strong className="text-[#1a365d]">Inscripción en el Registro Mercantil:</strong> [DATOS REGISTRALES]</p>
                <p><strong className="text-[#1a365d]">Actividad profesional:</strong> Asesoría fiscal y tributaria</p>
              </div>
              <p className="text-xs text-amber-600 mt-3 bg-amber-50 p-3 rounded-lg">
                ⚠ Los datos entre corchetes deben ser sustituidos por los datos reales de la empresa antes de la publicación definitiva.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1a365d] mb-3">2. Objeto</h2>
              <p className="text-gray-700 leading-relaxed">
                El presente Aviso Legal regula el uso del sitio web <strong>rentatpymes.aicheckpyme.co</strong> (en adelante, "el Sitio Web"), que el titular pone a disposición de los usuarios de Internet. El acceso y la navegación por el Sitio Web atribuyen la condición de usuario e implican la aceptación plena y sin reservas de todas las disposiciones incluidas en este Aviso Legal.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1a365d] mb-3">3. Condiciones de uso</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                El usuario se compromete a hacer un uso adecuado de los contenidos y servicios que se ofrecen a través del Sitio Web y, con carácter enunciativo pero no limitativo, a no emplearlos para:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 text-sm">
                <li>Incurrir en actividades ilícitas, ilegales o contrarias a la buena fe y al orden público.</li>
                <li>Difundir contenidos o propaganda de carácter racista, xenófobo, pornográfico, de apología del terrorismo o atentatorio contra los derechos humanos.</li>
                <li>Provocar daños en los sistemas físicos y lógicos del Sitio Web, de sus proveedores o de terceras personas.</li>
                <li>Introducir o difundir en la red virus informáticos o cualesquiera otros sistemas que sean susceptibles de causar daños.</li>
                <li>Intentar acceder y, en su caso, utilizar las cuentas de correo electrónico de otros usuarios y modificar o manipular sus mensajes.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1a365d] mb-3">4. Propiedad intelectual e industrial</h2>
              <p className="text-gray-700 leading-relaxed">
                Todos los contenidos del Sitio Web, incluyendo, sin carácter limitativo, textos, fotografías, gráficos, imágenes, iconos, tecnología, software, enlaces y demás contenidos audiovisuales o sonoros, así como su diseño gráfico y códigos fuente, son propiedad intelectual del titular o de terceros, sin que puedan entenderse cedidos al usuario ninguno de los derechos de explotación reconocidos por la normativa vigente en materia de propiedad intelectual sobre los mismos, salvo aquellos que resulten estrictamente necesarios para el uso del Sitio Web.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                Las marcas, nombres comerciales o signos distintivos son titularidad del titular o de terceros, sin que pueda entenderse que el acceso al Sitio Web atribuya ningún derecho sobre las citadas marcas, nombres comerciales y/o signos distintivos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1a365d] mb-3">5. Exclusión de responsabilidad</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                El titular no se hace responsable, en ningún caso, de los daños y perjuicios de cualquier naturaleza que pudieran ocasionar, a título enunciativo: errores u omisiones en los contenidos, falta de disponibilidad del Sitio Web o la transmisión de virus o programas maliciosos o lesivos en los contenidos, a pesar de haber adoptado todas las medidas tecnológicas necesarias para evitarlo.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Simulador fiscal:</strong> Los resultados proporcionados por el simulador de renta tienen carácter meramente orientativo e informativo. No constituyen asesoramiento fiscal profesional ni sustituyen la revisión por un asesor cualificado. Los cálculos se basan en la normativa vigente y en los datos proporcionados por el usuario, pudiendo existir variaciones respecto al resultado definitivo de la declaración.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1a365d] mb-3">6. Enlaces de terceros</h2>
              <p className="text-gray-700 leading-relaxed">
                El Sitio Web puede incluir enlaces a sitios de terceros. Las páginas de estos sitios no son propiedad ni están controladas por el titular, que no se hace responsable de los contenidos, materiales, acciones y/o servicios prestados por las mismas, ni de los daños o pérdidas ocasionados por la utilización de estos, sean causados directa o indirectamente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1a365d] mb-3">7. Modificaciones</h2>
              <p className="text-gray-700 leading-relaxed">
                El titular se reserva el derecho de efectuar sin previo aviso las modificaciones que considere oportunas en el Sitio Web, pudiendo cambiar, suprimir o añadir tanto los contenidos y servicios que se presten a través del mismo como la forma en la que estos aparezcan presentados o localizados.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1a365d] mb-3">8. Legislación aplicable y jurisdicción</h2>
              <p className="text-gray-700 leading-relaxed">
                La relación entre el titular y el usuario se regirá por la normativa española vigente. Para la resolución de cualquier controversia, las partes se someterán a los Juzgados y Tribunales del domicilio social del titular, salvo que la normativa aplicable disponga otra cosa.
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
