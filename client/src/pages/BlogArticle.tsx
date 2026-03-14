/**
 * Design: Fintech Institucional
 * Blog Article — Artículo individual con contenido SEO
 * Palette: Navy #1a365d, Emerald #059669, Warm gray #f7f5f2
 */
import { useParams, Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BLOG_POSTS } from "./Blog";
import { Calendar, Clock, ArrowLeft, ArrowRight, Tag, Share2, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useSEO } from "@/hooks/useSEO";

// Contenido completo de cada artículo
const ARTICLE_CONTENT: Record<string, string> = {
  "deducciones-madrid-2025": `
## Deducciones en la Comunidad de Madrid 2025: la guía definitiva

La Comunidad de Madrid es la región con los **tipos impositivos más bajos de España**. Su tipo máximo autonómico es del 20,50%, frente al 25,50% de Valencia o el 25,50% de Cataluña. Pero además de los tramos favorables, Madrid ofrece **deducciones autonómicas exclusivas** que muchos contribuyentes desconocen.

En este artículo te explicamos cada deducción con sus importes, requisitos y cómo aplicarlas correctamente.

### 1. Deducción por alquiler de vivienda habitual

Si eres menor de 35 años y vives de alquiler en Madrid, puedes deducirte el **30% del alquiler pagado**, con un máximo de **1.000€ al año**.

| Requisito | Detalle |
|---|---|
| Edad | Menor de 35 años |
| Base imponible máxima | 25.620€ (individual) / 36.200€ (conjunta) |
| Porcentaje | 30% del alquiler pagado |
| Máximo | 1.000€ anuales |

> **Consejo:** Asegúrate de que el contrato de alquiler esté registrado en la fianza de la Comunidad de Madrid. Sin este registro, Hacienda puede rechazar la deducción.

### 2. Deducción por gastos educativos

Una de las deducciones más generosas de Madrid. Puedes deducirte gastos de escolaridad, enseñanza de idiomas y uniformes de tus hijos.

| Concepto | Porcentaje | Máximo por hijo |
|---|---|---|
| Escolaridad | 15% | 400€ |
| Enseñanza de idiomas | 10% | 400€ |
| Uniformes | 5% | 400€ |

- Se aplica a hijos en **educación infantil, primaria, ESO, bachillerato y FP**
- Los gastos de comedor escolar **no son deducibles**
- Incluye academias de idiomas extraescolares

### 3. Deducción por cuidado de hijos menores de 3 años

Para familias con hijos pequeños, Madrid ofrece una deducción del **20% de las cuotas de Seguridad Social** del empleado del hogar, con un máximo de **400€ al año**.

- El hijo debe ser menor de 3 años
- Ambos progenitores deben trabajar
- El empleado debe estar dado de alta en el Régimen Especial de Empleados del Hogar

### 4. Deducción por acogimiento familiar de menores

Si acoges a un menor en tu hogar, puedes deducirte:

| Tipo de acogimiento | Importe |
|---|---|
| Primer menor acogido | 600€ |
| Segundo menor acogido | 750€ |
| Tercer menor y sucesivos | 900€ |

### 5. Deducción por nacimiento o adopción

Por cada hijo nacido o adoptado en el ejercicio, puedes deducirte **600€**. Esta deducción es compatible con las deducciones estatales por maternidad.

### 6. Deducción por familias con dos o más descendientes e ingresos reducidos

Si tienes dos o más hijos y tu base imponible no supera los 24.000€ (individual), puedes deducirte **10% de la cuota íntegra autonómica**.

### 7. Deducción por inversión en empresas de nueva creación (Business Angels)

Madrid incentiva la inversión en startups con una deducción del **30% de las cantidades invertidas**, con un máximo de **6.000€**.

| Requisito | Detalle |
|---|---|
| Tipo de empresa | Nueva creación (< 3 años) |
| Participación máxima | 40% del capital |
| Permanencia mínima | 3 años |
| Deducción | 30% de la inversión |
| Máximo | 6.000€ |

### 8. Deducción por donativos

Las donaciones a fundaciones y ONGs registradas en Madrid tienen una deducción del **15%**, sin límite máximo.

### Tramos IRPF de Madrid 2025: los más bajos de España

Además de las deducciones, Madrid tiene los tramos autonómicos más favorables:

| Base liquidable | Tipo autonómico | Tipo estatal | Tipo total |
|---|---|---|---|
| Hasta 13.362€ | 8,50% | 9,50% | 18,00% |
| 13.362 - 18.572€ | 10,70% | 12,00% | 22,70% |
| 18.572 - 35.200€ | 12,80% | 15,00% | 27,80% |
| 35.200 - 57.320€ | 17,40% | 18,50% | 35,90% |
| Más de 57.320€ | 20,50% | 22,50% | 43,00% |

Compara el tipo máximo de Madrid (43%) con el de Cataluña (50%) o Valencia (54%). La diferencia puede suponer **miles de euros** en rentas altas.

### ¿Cómo aplicar estas deducciones correctamente?

1. **Verifica tu residencia fiscal**: Debes haber vivido en Madrid más de 183 días del año
2. **Reúne la documentación**: Contratos de alquiler, facturas de colegio, certificados de donaciones
3. **Usa nuestro simulador**: Calcula automáticamente todas las deducciones madrileñas que te corresponden
4. **Consulta con un asesor**: Nuestro equipo conoce cada particularidad de la normativa madrileña

> **¿Quieres ver todas las deducciones de Madrid en detalle?** Visita nuestra [página especializada en la Comunidad de Madrid](/madrid) con información completa sobre cada deducción y los tramos IRPF autonómicos.

### Conclusión

La Comunidad de Madrid es, fiscalmente, una de las regiones más favorables de España. Entre los tipos bajos y las deducciones autonómicas, un contribuyente medio puede ahorrarse entre **200€ y 1.500€** respecto a otras comunidades. No dejes dinero sobre la mesa: aplica todas las deducciones que te corresponden.
  `,

  "estoy-obligado-declarar-renta-2025": `
## ¿Quién está obligado a declarar en 2025?

La campaña de la renta 2025 (ejercicio 2024) comienza el **2 de abril** y finaliza el **30 de junio de 2025**. Pero no todos los contribuyentes están obligados a presentar la declaración.

### Límites de ingresos para 2025

Los límites actualizados para la campaña 2025 son:

| Situación | Límite |
|---|---|
| Un solo pagador | 22.000€ brutos anuales |
| Dos o más pagadores (2º pagador > 1.500€) | 15.000€ brutos anuales |
| Rendimientos del capital mobiliario | 1.600€ brutos anuales |
| Rentas inmobiliarias imputadas | 1.000€ brutos anuales |

### ¿Cuándo SÍ estás obligado?

Debes presentar la declaración si:

- Tus **rendimientos del trabajo** superan los 22.000€ brutos anuales con un solo pagador
- Has tenido **dos o más pagadores** y el segundo te ha pagado más de 1.500€, con ingresos totales superiores a 15.000€
- Has obtenido **rendimientos del capital mobiliario** (intereses, dividendos) superiores a 1.600€
- Has realizado **ganancias patrimoniales** (venta de acciones, inmuebles, criptomonedas) superiores a 1.600€
- Tienes **inmuebles alquilados** con rendimientos superiores a 1.000€

### ¿Cuándo NO estás obligado pero te conviene?

Aunque no estés obligado, **te interesa declarar si**:

- Te han retenido de más en la nómina (te devolverán)
- Tienes derecho a deducciones (hipoteca pre-2013, maternidad, familia numerosa)
- Has hecho aportaciones a un plan de pensiones
- Has realizado donaciones deducibles

> **Consejo de experto:** Utiliza nuestro simulador gratuito para saber si te conviene declarar aunque no estés obligado. En muchos casos, los contribuyentes no obligados tienen derecho a devoluciones de 200€ a 800€.

### Casos especiales

**Prestación por desempleo (SEPE):** Cuenta como un segundo pagador. Si has cobrado paro y nómina en el mismo año, es muy probable que estés obligado a declarar.

**ERTE:** Los trabajadores que estuvieron en ERTE tienen al SEPE como segundo pagador, lo que reduce el límite a 15.000€.

**Criptomonedas:** Si has vendido criptomonedas con beneficio, debes declararlo independientemente del importe.
  `,

  "deducciones-autonomicas-2025-guia-completa": `
## Deducciones autonómicas: el dinero que dejas sobre la mesa

Cada comunidad autónoma establece sus propias deducciones en el IRPF. Muchos contribuyentes desconocen estas deducciones y pierden cientos de euros cada año.

### Madrid

| Deducción | Importe máximo |
|---|---|
| Alquiler de vivienda habitual (menores de 35 años) | 30% con máximo 1.000€ |
| Gastos educativos (uniforme, enseñanza de idiomas) | 15% con máximo 400€/hijo |
| Cuidado de hijos menores de 3 años | 20% con máximo 400€ |
| Acogimiento familiar de menores | 600€-900€ |

### Cataluña

| Deducción | Importe máximo |
|---|---|
| Alquiler de vivienda habitual | 10% con máximo 300€ |
| Nacimiento o adopción | 150€ por hijo |
| Donaciones a entidades de fomento del catalán | 15% |
| Rehabilitación de vivienda habitual | 1,5% del importe |

### Andalucía

| Deducción | Importe máximo |
|---|---|
| Alquiler de vivienda habitual (menores de 35 años) | 15% con máximo 500€ |
| Inversión en vivienda protegida | 2% del importe |
| Adopción internacional | 600€ |
| Ayuda doméstica | 15% con máximo 250€ |

### Comunidad Valenciana

| Deducción | Importe máximo |
|---|---|
| Alquiler de vivienda habitual | 20% con máximo 700€ |
| Material escolar | 100€ por hijo |
| Nacimiento, adopción o acogimiento | 270€ primer hijo |
| Conciliación del trabajo con la vida familiar | 418€ |

### Cómo aplicarlas correctamente

1. **Identifica tu CCAA fiscal**: Es donde has tenido tu residencia habitual durante más de 183 días del año
2. **Revisa TODAS las deducciones disponibles**: Muchas son desconocidas
3. **Guarda los justificantes**: Facturas, contratos de alquiler, certificados de donaciones
4. **Verifica los límites de renta**: Algunas deducciones tienen límites de base imponible

> **Dato clave:** El 40% de los contribuyentes no aplica todas las deducciones autonómicas a las que tiene derecho. Esto supone una media de 180€ que dejan de recuperar.
  `,

  "dos-pagadores-declaracion-renta": `
## Dos pagadores: por qué te sale a pagar y qué hacer

Tener dos pagadores en un mismo ejercicio fiscal es una de las situaciones más comunes que hacen que la declaración salga "a pagar". Pero, ¿por qué ocurre esto?

### ¿Por qué me sale a pagar?

El motivo es sencillo: **cada pagador retiene como si fuera el único**. Es decir:

- Tu empresa te retiene un porcentaje basado en tu salario anual
- El SEPE (si cobras paro) o tu segunda empresa también retiene, pero calculando como si ese fuera tu único ingreso
- Al sumar ambos ingresos, tu tipo impositivo real es mayor que el que cada pagador ha aplicado por separado

### Ejemplo práctico

| Concepto | Importe |
|---|---|
| Salario empresa A (8 meses) | 18.000€ (retención 12%) |
| Prestación SEPE (4 meses) | 6.000€ (retención 2%) |
| **Total ingresos** | **24.000€** |
| Retenciones totales | 2.280€ |
| IRPF real que corresponde | ~3.100€ |
| **Diferencia a pagar** | **~820€** |

### ¿Cómo minimizar el impacto?

1. **Pide a tu empresa que te retenga más**: Puedes solicitar un tipo de retención superior al mínimo obligatorio en el modelo 145
2. **Aplica TODAS las deducciones**: Hipoteca, alquiler, plan de pensiones, donaciones
3. **Revisa si te conviene declaración conjunta**: Si tu cónyuge tiene ingresos bajos, puede compensar
4. **Fracciona el pago**: Hacienda permite pagar el 60% en junio y el 40% en noviembre sin intereses

> **Importante:** Tener que pagar no significa que hayas hecho algo mal. Simplemente, las retenciones fueron insuficientes. Lo que pagas es lo que realmente te corresponde por tus ingresos totales.

### ¿Estoy obligado a declarar con dos pagadores?

Sí, si el segundo pagador te ha pagado más de 1.500€ y tus ingresos totales superan los 15.000€. Si el segundo pagador te ha pagado menos de 1.500€, el límite sube a 22.000€.
  `,

  "hipoteca-antes-2013-deduccion": `
## La deducción por hipoteca anterior a 2013

Si compraste tu vivienda habitual antes del 1 de enero de 2013, tienes derecho a una de las deducciones más generosas del IRPF español.

### ¿Cuánto puedes deducirte?

- **Base máxima de deducción:** 9.040€ anuales (incluye capital + intereses + seguros vinculados)
- **Porcentaje estatal:** 7,5%
- **Porcentaje autonómico:** 7,5% (varía según CCAA)
- **Deducción máxima total:** 1.356€ al año

### Requisitos

1. La vivienda debe ser tu **residencia habitual**
2. La hipoteca debe haberse constituido **antes del 1 de enero de 2013**
3. Debes haber aplicado la deducción en ejercicios anteriores a 2013
4. No se aplica a segundas residencias ni a inversiones inmobiliarias

### ¿Qué gastos incluye la base de deducción?

- Cuotas de la hipoteca (capital + intereses)
- Seguro de vida vinculado a la hipoteca
- Seguro de hogar si es obligatorio por el banco
- Gastos de constitución de la hipoteca (el año que se firmó)

### Errores comunes

- **No incluir los seguros vinculados**: Muchos contribuyentes solo ponen la cuota del préstamo
- **Olvidar la deducción al amortizar anticipadamente**: Si haces una amortización parcial, esa cantidad también es deducible (hasta el límite de 9.040€)
- **No aplicarla por desconocimiento**: Es la deducción más olvidada del IRPF

> **Estrategia fiscal:** Si tu cuota anual de hipoteca no llega a 9.040€, considera hacer una amortización anticipada a final de año para aprovechar al máximo la deducción. Por cada 1.000€ que amortices, recuperas 150€ en la renta.
  `,

  "plan-pensiones-reduccion-irpf": `
## Plan de pensiones: reducción directa en tu base imponible

Las aportaciones a planes de pensiones son una de las pocas herramientas que permiten **reducir directamente la base imponible** del IRPF, no solo aplicar una deducción.

### Límites 2025

| Concepto | Límite |
|---|---|
| Aportación máxima individual | 1.500€/año |
| Aportación empresa (planes de empleo) | 8.500€/año |
| Aportación total máxima | 10.000€/año |
| Aportación a favor del cónyuge | 1.000€/año |

### ¿Cuánto te ahorras realmente?

El ahorro depende de tu tipo marginal:

| Base imponible | Tipo marginal | Ahorro por 1.500€ aportados |
|---|---|---|
| Hasta 12.450€ | 19% | 285€ |
| 12.450€ - 20.200€ | 24% | 360€ |
| 20.200€ - 35.200€ | 30% | 450€ |
| 35.200€ - 60.000€ | 37% | 555€ |
| Más de 60.000€ | 45-47% | 675-705€ |

### Estrategia óptima

1. **Aporta al menos lo que te permite tu tipo marginal**: Si ganas 30.000€, cada euro que aportes te ahorra un 30% en impuestos
2. **Aporta a final de año**: Puedes hacer la aportación hasta el 31 de diciembre y deducirla en la renta de ese ejercicio
3. **Combina con aportación del cónyuge**: Si tu cónyuge gana menos de 8.000€, puedes aportar 1.000€ a su plan y deducirlo tú

> **Atención:** Recuerda que el dinero del plan de pensiones tributa cuando lo rescates (jubilación, desempleo de larga duración, enfermedad grave). No es un ahorro definitivo, sino un diferimiento fiscal.
  `,

  "declaracion-conjunta-individual-que-conviene": `
## Conjunta vs. individual: la decisión que vale cientos de euros

Cada año, miles de parejas presentan su declaración sin plantearse si les conviene más hacerla conjunta o individual. Esta decisión puede suponer una diferencia de 200€ a 1.500€.

### ¿Cuándo conviene la declaración conjunta?

La declaración conjunta suele convenir cuando:

- **Un cónyuge no tiene ingresos** o son muy bajos (se aplica una reducción de 3.400€)
- **Ambos tienen ingresos bajos** y la suma no supera los tramos altos
- **Hay pérdidas patrimoniales** que un cónyuge puede compensar con ganancias del otro

### ¿Cuándo conviene la individual?

La individual suele convenir cuando:

- **Ambos cónyuges trabajan** con ingresos similares
- **Los ingresos combinados** superan los 35.000€
- **Uno de los dos tiene deducciones personales** que se perderían en conjunta

### Ejemplo comparativo

**Caso: Pareja con un hijo. Él gana 28.000€, ella 8.000€**

| Modalidad | Cuota IRPF | Resultado |
|---|---|---|
| Individual (él) | 3.850€ | - |
| Individual (ella) | 420€ | - |
| **Total individual** | **4.270€** | - |
| **Conjunta** | **3.680€** | **Ahorro de 590€** |

**Caso: Pareja sin hijos. Él gana 35.000€, ella 30.000€**

| Modalidad | Cuota IRPF | Resultado |
|---|---|---|
| Individual (él) | 5.900€ | - |
| Individual (ella) | 4.800€ | - |
| **Total individual** | **10.700€** | **Ahorro de 1.200€** |
| **Conjunta** | **11.900€** | - |

> **Regla rápida:** Si uno de los dos gana menos de 8.000€ al año, casi siempre conviene conjunta. Si ambos ganan más de 15.000€, casi siempre conviene individual. En el medio, hay que calcular.
  `,

  "errores-comunes-declaracion-renta": `
## 7 errores que te hacen pagar de más en la renta

Cada año, millones de contribuyentes pagan más IRPF del que les corresponde por errores evitables. Estos son los 7 más frecuentes:

### 1. Aceptar el borrador sin revisarlo

El borrador de Hacienda **no incluye automáticamente** muchas deducciones autonómicas, gastos deducibles ni situaciones personales. Aceptarlo sin más es el error más caro.

### 2. No declarar la deducción por hipoteca anterior a 2013

Si compraste tu vivienda antes de 2013, puedes deducirte hasta 1.356€ al año. Es la deducción más olvidada.

### 3. Olvidar las deducciones autonómicas

Cada CCAA tiene deducciones propias por alquiler, gastos educativos, nacimiento de hijos, etc. El 40% de los contribuyentes no las aplica.

### 4. No incluir los gastos sindicales y colegiales

Las cuotas de sindicatos y colegios profesionales obligatorios son gastos deducibles de los rendimientos del trabajo.

### 5. No declarar donaciones

Las donaciones a ONGs, fundaciones y partidos políticos tienen deducciones del 80% (primeros 250€) y del 40% (resto). Muchos contribuyentes donan pero no lo declaran.

### 6. Elegir mal entre conjunta e individual

Como hemos visto, la elección incorrecta puede costar entre 200€ y 1.500€. Siempre hay que calcular ambas opciones.

### 7. No fraccionar el pago cuando sale a pagar

Hacienda permite pagar el 60% en junio y el 40% en noviembre **sin intereses**. Muchos contribuyentes no lo saben y pagan todo de golpe, generando problemas de liquidez.

> **Solución:** Un asesor fiscal profesional revisa todos estos puntos. Con Renta Fácil TPymes, nuestros expertos verifican cada deducción aplicable y optimizan tu declaración. Desde 49€.
  `,

  "vehiculo-electrico-deduccion-2025": `
## Deducción por vehículo eléctrico: novedades 2025

La compra de vehículos eléctricos y la instalación de puntos de recarga tienen beneficios fiscales significativos en el IRPF.

### Deducción por compra de vehículo eléctrico

- **Porcentaje:** 15% del valor de adquisición
- **Base máxima:** 20.000€
- **Deducción máxima:** 3.000€
- **Requisito:** Vehículo nuevo, eléctrico (BEV) o de pila de combustible (FCEV)
- **Plazo:** Compras realizadas hasta el 31 de diciembre de 2024

### Deducción por punto de recarga

- **Porcentaje:** 15% del coste de instalación
- **Base máxima:** 4.000€
- **Deducción máxima:** 600€
- **Requisito:** Instalación en un inmueble de tu propiedad, no afecto a actividad económica

### ¿Cómo se aplica?

La deducción se aplica en el ejercicio en que se matricula el vehículo. Si has reservado el vehículo con un pago a cuenta de al menos el 25%, puedes aplicar la deducción en el ejercicio del pago, aunque la entrega sea posterior.

### Documentación necesaria

- Factura de compra del vehículo
- Certificado de matriculación
- Ficha técnica del vehículo (debe ser categoría BEV o FCEV)
- Para puntos de recarga: factura de instalación y certificado del instalador

> **Importante:** Esta deducción es compatible con las ayudas del Plan MOVES III. Es decir, puedes recibir la subvención Y aplicar la deducción fiscal, aunque la base de deducción se reduce por el importe de la subvención.
  `,
};

export default function BlogArticle() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  const content = ARTICLE_CONTENT[slug] || "";

  useSEO({
    title: post?.title || "Artículo no encontrado",
    description: post?.excerpt || "Artículo del blog fiscal de Renta Fácil TPymes.",
    canonical: `/blog/${slug}`,
    ogType: "article",
    ogImage: post?.image,
  });

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f7f5f2]">
        <Navbar />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#1a365d] mb-4">Artículo no encontrado</h1>
            <Link href="/blog">
              <span className="text-[#059669] hover:underline">Volver al blog</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Artículos relacionados (misma categoría, excluyendo el actual)
  const related = BLOG_POSTS.filter((p) => p.category === post.category && p.slug !== slug).slice(0, 3);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: post.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.info("Enlace copiado al portapapeles");
    }
  };

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
            <Link href="/blog">
              <span className="hover:text-[#059669] transition-colors">Blog</span>
            </Link>
            <span>/</span>
            <span className="text-gray-700 truncate">{post.title}</span>
          </div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#1a365d]/10 text-[#1a365d] rounded-full text-sm font-medium">
                <Tag className="w-3 h-3" />
                {post.category}
              </span>
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(post.date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
              </span>
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                {post.readTime}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-[#1a365d] mb-4 leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {post.title}
            </h1>

            <p className="text-lg text-gray-600 mb-6">
              {post.excerpt}
            </p>

            {/* Image */}
            <div className="rounded-2xl overflow-hidden mb-8 shadow-lg">
              <img
                src={post.image}
                alt={post.title}
                className="w-full aspect-[2/1] object-cover"
              />
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="prose prose-lg max-w-none
              prose-headings:text-[#1a365d] prose-headings:font-bold
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-gray-700 prose-p:leading-relaxed
              prose-a:text-[#059669] prose-a:no-underline hover:prose-a:underline
              prose-strong:text-[#1a365d]
              prose-blockquote:border-l-[#059669] prose-blockquote:bg-emerald-50/50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-xl prose-blockquote:not-italic
              prose-table:border-collapse
              prose-th:bg-[#1a365d] prose-th:text-white prose-th:px-4 prose-th:py-2 prose-th:text-left
              prose-td:px-4 prose-td:py-2 prose-td:border-b prose-td:border-gray-200
              prose-li:text-gray-700
              prose-ol:text-gray-700
              prose-ul:text-gray-700
            "
            style={{ fontFamily: "'Source Sans 3', sans-serif" }}
          >
            <div dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }} />
          </motion.div>

          {/* Share + Actions */}
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-200">
            <Link href="/blog">
              <span className="inline-flex items-center gap-2 text-[#1a365d] hover:text-[#059669] transition-colors font-medium">
                <ArrowLeft className="w-4 h-4" />
                Volver al blog
              </span>
            </Link>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Compartir
            </button>
          </div>

          {/* CTA */}
          <div className="mt-12 bg-gradient-to-br from-[#1a365d] to-[#0f2440] rounded-2xl p-8 text-center">
            <BookOpen className="w-8 h-8 text-[#059669] mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              ¿Necesitas ayuda con tu declaración?
            </h3>
            <p className="text-blue-200 mb-5 text-sm max-w-md mx-auto">
              Nuestros asesores fiscales aplican todas las deducciones que te corresponden. Sin sorpresas.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/simulador">
                <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#1a365d] font-semibold rounded-xl text-sm hover:bg-gray-100 transition-colors">
                  Simular gratis
                </span>
              </Link>
              <Link href="/empezar">
                <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#059669] text-white font-semibold rounded-xl text-sm hover:bg-[#047857] transition-colors">
                  Hacer mi renta desde 49€
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </div>

          {/* Related articles */}
          {related.length > 0 && (
            <div className="mt-16">
              <h3 className="text-xl font-bold text-[#1a365d] mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Artículos relacionados
              </h3>
              <div className="grid md:grid-cols-3 gap-5">
                {related.map((r) => (
                  <Link key={r.slug} href={`/blog/${r.slug}`}>
                    <div className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-100">
                      <img
                        src={r.image}
                        alt={r.title}
                        className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="p-4">
                        <h4 className="text-sm font-bold text-[#1a365d] group-hover:text-[#059669] transition-colors line-clamp-2">
                          {r.title}
                        </h4>
                        <span className="text-xs text-gray-400 mt-2 block">{r.readTime}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>

      <Footer />
    </div>
  );
}

// Simple markdown to HTML converter for the article content
function markdownToHtml(md: string): string {
  let html = md
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Blockquotes
    .replace(/^> (.*$)/gm, '<blockquote><p>$1</p></blockquote>')
    // Tables
    .replace(/\n\n\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)+)/g, (_match, header, rows) => {
      const headers = header.split('|').map((h: string) => h.trim()).filter(Boolean);
      const headerHtml = headers.map((h: string) => `<th>${h}</th>`).join('');
      const rowLines = rows.trim().split('\n');
      const rowsHtml = rowLines.map((row: string) => {
        const cells = row.split('|').map((c: string) => c.trim()).filter(Boolean);
        return `<tr>${cells.map((c: string) => `<td>${c}</td>`).join('')}</tr>`;
      }).join('');
      return `<table><thead><tr>${headerHtml}</tr></thead><tbody>${rowsHtml}</tbody></table>`;
    })
    // Unordered lists
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
    // Ordered lists
    .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
    // Paragraphs
    .replace(/\n\n(?!<)/g, '</p><p>')
    // Line breaks
    .replace(/\n(?!<)/g, '<br/>');

  return `<p>${html}</p>`;
}
