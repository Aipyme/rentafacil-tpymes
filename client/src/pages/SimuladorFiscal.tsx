/**
 * SimuladorFiscal.tsx
 * Simulador IRPF 2025 paso a paso — Renta Fácil TPymes
 * Motor fiscal real basado en la normativa AEAT 2025
 */
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ChevronRight, ChevronLeft, Calculator, CheckCircle2,
  TrendingDown, TrendingUp, AlertCircle, Info,
  Home, Users, Briefcase, PiggyBank, Zap, Heart,
  FileText, ArrowRight, Shield, Euro
} from "lucide-react";
import {
  calcularRenta, crearDatosVacios, estaObligadoADeclarar, formatEuro,
  type DatosContribuyente, type ComunidadAutonoma
} from "@shared/fiscalEngine";
import { useSEO } from "@/hooks/useSEO";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

type Paso =
  | "bienvenida"
  | "situacion_personal"
  | "ingresos_trabajo"
  | "ingresos_otros"
  | "familia"
  | "vivienda"
  | "deducciones"
  | "resultado";

const PASOS_ORDEN: Paso[] = [
  "bienvenida",
  "situacion_personal",
  "ingresos_trabajo",
  "ingresos_otros",
  "familia",
  "vivienda",
  "deducciones",
  "resultado",
];

const CCAA_OPCIONES: { value: ComunidadAutonoma; label: string }[] = [
  { value: "andalucia", label: "Andalucía" },
  { value: "aragon", label: "Aragón" },
  { value: "asturias", label: "Asturias" },
  { value: "baleares", label: "Baleares" },
  { value: "canarias", label: "Canarias" },
  { value: "cantabria", label: "Cantabria" },
  { value: "castilla_la_mancha", label: "Castilla-La Mancha" },
  { value: "castilla_leon", label: "Castilla y León" },
  { value: "cataluna", label: "Cataluña" },
  { value: "extremadura", label: "Extremadura" },
  { value: "galicia", label: "Galicia" },
  { value: "madrid", label: "Comunidad de Madrid" },
  { value: "murcia", label: "Murcia" },
  { value: "la_rioja", label: "La Rioja" },
  { value: "valencia", label: "Comunidad Valenciana" },
  { value: "pais_vasco", label: "País Vasco" },
  { value: "navarra", label: "Navarra" },
];

// ─── COMPONENTES AUXILIARES ───────────────────────────────────────────────────

function InputEuro({
  label, value, onChange, placeholder, ayuda, min = 0,
}: {
  label: string; value: number; onChange: (v: number) => void;
  placeholder?: string; ayuda?: string; min?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-[#1a365d]">{label}</label>
      {ayuda && <p className="text-xs text-gray-500">{ayuda}</p>}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">€</span>
        <input
          type="number"
          min={min}
          value={value || ""}
          onChange={(e) => onChange(Math.max(min, parseFloat(e.target.value) || 0))}
          placeholder={placeholder || "0"}
          className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-[#1a365d] font-medium focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent bg-white"
        />
      </div>
    </div>
  );
}

function ToggleCard({
  label, descripcion, value, onChange, icon: Icon,
}: {
  label: string; descripcion?: string; value: boolean;
  onChange: (v: boolean) => void; icon?: React.ElementType;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        value
          ? "border-[#059669] bg-emerald-50"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
            value ? "bg-[#059669] text-white" : "bg-gray-100 text-gray-500"
          }`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${value ? "text-[#059669]" : "text-[#1a365d]"}`}>{label}</p>
          {descripcion && <p className="text-xs text-gray-500 mt-0.5">{descripcion}</p>}
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
          value ? "border-[#059669] bg-[#059669]" : "border-gray-300"
        }`}>
          {value && <CheckCircle2 className="w-3 h-3 text-white" />}
        </div>
      </div>
    </button>
  );
}

function SelectField({
  label, value, onChange, options, ayuda,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; ayuda?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-[#1a365d]">{label}</label>
      {ayuda && <p className="text-xs text-gray-500">{ayuda}</p>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#1a365d] font-medium focus:outline-none focus:ring-2 focus:ring-[#059669] bg-white"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function NumberField({
  label, value, onChange, min = 0, max = 20, ayuda,
}: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; ayuda?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-[#1a365d]">{label}</label>
      {ayuda && <p className="text-xs text-gray-500">{ayuda}</p>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-[#1a365d] font-bold hover:border-[#059669] transition-colors"
        >−</button>
        <span className="text-2xl font-bold text-[#1a365d] w-12 text-center">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-[#1a365d] font-bold hover:border-[#059669] transition-colors"
        >+</button>
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export default function SimuladorFiscal() {
  useSEO({
    title: "Simulador IRPF 2025 — Calcula tu declaración de la renta | Renta Fácil TPymes",
    description: "Calcula gratis tu declaración de la renta 2025. Motor fiscal real con todas las deducciones estatales y autonómicas. Descubre si te devuelven o tienes que pagar.",
    canonical: "/simulador-fiscal",
  });

  const [pasoActual, setPasoActual] = useState<Paso>("bienvenida");
  const [datos, setDatos] = useState<DatosContribuyente>(crearDatosVacios());

  const update = (campo: Partial<DatosContribuyente>) => {
    setDatos((prev) => ({ ...prev, ...campo }));
  };

  const pasoIndex = PASOS_ORDEN.indexOf(pasoActual);
  const progreso = pasoActual === "resultado" ? 100 : Math.round((pasoIndex / (PASOS_ORDEN.length - 1)) * 100);

  const siguiente = () => {
    const idx = PASOS_ORDEN.indexOf(pasoActual);
    if (idx < PASOS_ORDEN.length - 1) setPasoActual(PASOS_ORDEN[idx + 1]);
  };

  const anterior = () => {
    const idx = PASOS_ORDEN.indexOf(pasoActual);
    if (idx > 0) setPasoActual(PASOS_ORDEN[idx - 1]);
  };

  // Calcular resultado solo cuando llegamos al último paso
  const resultado = useMemo(() => {
    if (pasoActual === "resultado") return calcularRenta(datos);
    return null;
  }, [pasoActual, datos]);

  const obligacion = useMemo(() => estaObligadoADeclarar(datos), [datos]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f5f2]">
      <Navbar />

      {/* Header con progreso */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="container max-w-2xl py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">
              {pasoActual === "bienvenida" ? "Inicio" :
               pasoActual === "resultado" ? "Tu resultado" :
               `Paso ${pasoIndex} de ${PASOS_ORDEN.length - 2}`}
            </span>
            <span className="text-sm font-bold text-[#059669]">{progreso}%</span>
          </div>
          <Progress value={progreso} className="h-2" />
        </div>
      </div>

      <main className="flex-1 py-8">
        <div className="container max-w-2xl">

          {/* ── BIENVENIDA ── */}
          {pasoActual === "bienvenida" && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#1a365d] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calculator className="w-8 h-8 text-white" />
                </div>
                <h1 className="font-['DM_Sans'] text-3xl font-bold text-[#1a365d] mb-3">
                  Simulador IRPF 2025
                </h1>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Calcula tu declaración de la renta con el <strong>motor fiscal real</strong> de la AEAT.
                  Aplicamos automáticamente todas las deducciones a las que tienes derecho.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Shield, label: "Normativa AEAT 2025", desc: "Escalas y deducciones oficiales" },
                  { icon: Zap, label: "Resultado en 3 min", desc: "7 preguntas sencillas" },
                  { icon: Euro, label: "100% gratuito", desc: "Sin registro ni tarjeta" },
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 text-center border border-gray-100">
                    <item.icon className="w-6 h-6 text-[#059669] mx-auto mb-2" />
                    <p className="text-xs font-bold text-[#1a365d]">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>

              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <h2 className="font-['DM_Sans'] text-lg font-bold text-[#1a365d] mb-4">
                    ¿Qué calcula este simulador?
                  </h2>
                  <div className="space-y-3">
                    {[
                      "Cuota íntegra estatal y autonómica (escalas IRPF 2025)",
                      "Mínimo personal, familiar y por discapacidad",
                      "Deducción por maternidad, familia numerosa, alquiler, hipoteca pre-2013",
                      "Deducciones autonómicas de tu comunidad (Madrid, Andalucía, Cataluña, Valencia, Canarias...)",
                      "Eficiencia energética, donativos, planes de pensiones",
                      "Resultado final: a devolver o a pagar",
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#059669] mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  <strong>Aviso legal:</strong> Este simulador es orientativo. El resultado puede variar
                  según tu situación específica. Para una declaración oficial, contacta con un asesor fiscal.
                </p>
              </div>

              <Button
                onClick={siguiente}
                size="lg"
                className="w-full bg-[#059669] hover:bg-[#047857] text-white font-bold h-14 text-base rounded-xl shadow-lg"
              >
                Empezar el simulador
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {/* ── SITUACIÓN PERSONAL ── */}
          {pasoActual === "situacion_personal" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-['DM_Sans'] text-2xl font-bold text-[#1a365d] mb-1">
                  Tu situación personal
                </h2>
                <p className="text-gray-500">Datos básicos para calcular el mínimo personal y la escala autonómica.</p>
              </div>

              <Card className="border-0 shadow-md bg-white">
                <CardContent className="p-6 space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-[#1a365d]">Tu edad</label>
                    <input
                      type="number"
                      min={18} max={99}
                      value={datos.edad}
                      onChange={(e) => update({ edad: parseInt(e.target.value) || 35 })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#1a365d] font-medium focus:outline-none focus:ring-2 focus:ring-[#059669] bg-white"
                    />
                    <p className="text-xs text-gray-500">A partir de 65 años se aplica un mínimo adicional de 1.150 €</p>
                  </div>

                  <SelectField
                    label="Comunidad autónoma de residencia"
                    value={datos.comunidadAutonoma}
                    onChange={(v) => update({ comunidadAutonoma: v as ComunidadAutonoma })}
                    options={CCAA_OPCIONES}
                    ayuda="Determina la escala autonómica y las deducciones de tu comunidad"
                  />

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-[#1a365d]">Discapacidad reconocida</label>
                    <select
                      value={datos.discapacidadPorcentaje}
                      onChange={(e) => update({ discapacidadPorcentaje: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#1a365d] font-medium focus:outline-none focus:ring-2 focus:ring-[#059669] bg-white"
                    >
                      <option value={0}>Sin discapacidad reconocida</option>
                      <option value={33}>33% - 64% (mínimo +3.000 €)</option>
                      <option value={65}>65% o más (mínimo +9.000 €)</option>
                    </select>
                  </div>

                  <ToggleCard
                    label="Declaración conjunta con mi cónyuge"
                    descripcion="Reducción adicional de 3.400 € en la base imponible"
                    value={datos.declaracionConjunta}
                    onChange={(v) => update({ declaracionConjunta: v })}
                    icon={Users}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── INGRESOS DEL TRABAJO ── */}
          {pasoActual === "ingresos_trabajo" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-['DM_Sans'] text-2xl font-bold text-[#1a365d] mb-1">
                  Ingresos del trabajo
                </h2>
                <p className="text-gray-500">Puedes encontrar estos datos en tu certificado de retenciones o en los datos fiscales de la AEAT.</p>
              </div>

              <Card className="border-0 shadow-md bg-white">
                <CardContent className="p-6 space-y-5">
                  <InputEuro
                    label="Ingresos brutos del trabajo (nómina anual)"
                    value={datos.ingresosTrabajo}
                    onChange={(v) => update({ ingresosTrabajo: v })}
                    ayuda="Suma de todas las nóminas brutas del año. Casilla 001 del borrador."
                    placeholder="30000"
                  />

                  <InputEuro
                    label="Cuotas de la Seguridad Social pagadas"
                    value={datos.cotizacionSS}
                    onChange={(v) => update({ cotizacionSS: v })}
                    ayuda="Aproximadamente el 6,35% del salario bruto. Casilla 014."
                    placeholder="1905"
                  />

                  <InputEuro
                    label="Total retenciones IRPF practicadas"
                    value={datos.retencionesIRPF}
                    onChange={(v) => update({ retencionesIRPF: v })}
                    ayuda="Total de retenciones de IRPF que te han practicado durante el año. Casilla 599."
                    placeholder="4500"
                  />

                  <ToggleCard
                    label="Soy autónomo o tengo actividad económica"
                    descripcion="Además de o en lugar de nómina"
                    value={datos.esAutonomo}
                    onChange={(v) => update({ esAutonomo: v })}
                    icon={Briefcase}
                  />

                  {datos.esAutonomo && (
                    <>
                      <InputEuro
                        label="Rendimientos netos de actividades económicas"
                        value={datos.ingresosAutonomo}
                        onChange={(v) => update({ ingresosAutonomo: v })}
                        ayuda="Ingresos menos gastos deducibles de tu actividad. Casilla 224."
                      />
                      <InputEuro
                        label="Pagos fraccionados (modelo 130/131)"
                        value={datos.pagosAcuentaAutonomo}
                        onChange={(v) => update({ pagosAcuentaAutonomo: v })}
                        ayuda="Total de pagos fraccionados realizados durante el año."
                      />
                    </>
                  )}

                  <InputEuro
                    label="Cuotas sindicales pagadas"
                    value={datos.cuotasSindicales}
                    onChange={(v) => update({ cuotasSindicales: v })}
                    ayuda="Deducibles como gasto del trabajo. Máx. 500 €."
                  />
                </CardContent>
              </Card>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Se aplica automáticamente la <strong>reducción por rendimientos del trabajo</strong> (hasta 7.302 €
                  para rentas inferiores a 14.852 €) y el gasto deducible general de 2.000 €.
                </p>
              </div>
            </div>
          )}

          {/* ── INGRESOS OTROS ── */}
          {pasoActual === "ingresos_otros" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-['DM_Sans'] text-2xl font-bold text-[#1a365d] mb-1">
                  Otros ingresos
                </h2>
                <p className="text-gray-500">Alquileres, dividendos, ganancias patrimoniales y capital mobiliario.</p>
              </div>

              <Card className="border-0 shadow-md bg-white">
                <CardContent className="p-6 space-y-5">
                  <div className="pb-4 border-b border-gray-100">
                    <h3 className="font-semibold text-[#1a365d] mb-3 flex items-center gap-2">
                      <Home className="w-4 h-4" /> Capital inmobiliario (alquiler)
                    </h3>
                    <div className="space-y-4">
                      <InputEuro
                        label="Ingresos brutos por alquiler de inmuebles"
                        value={datos.ingresosAlquiler}
                        onChange={(v) => update({ ingresosAlquiler: v })}
                        ayuda="Total de rentas cobradas por alquiler durante 2025."
                      />
                      {datos.ingresosAlquiler > 0 && (
                        <>
                          <InputEuro
                            label="Gastos deducibles del alquiler"
                            value={datos.gastosAlquiler}
                            onChange={(v) => update({ gastosAlquiler: v })}
                            ayuda="IBI, comunidad, seguro, reparaciones, amortización, intereses hipoteca del inmueble alquilado."
                          />
                          <ToggleCard
                            label="El inmueble se alquila como vivienda habitual del inquilino"
                            descripcion="Reducción del 60% del rendimiento neto (Art. 23.2 LIRPF)"
                            value={datos.esAlquilerViviendaHabitual}
                            onChange={(v) => update({ esAlquilerViviendaHabitual: v })}
                            icon={Home}
                          />
                          <InputEuro
                            label="Retenciones practicadas sobre el alquiler"
                            value={datos.retencionesAlquiler}
                            onChange={(v) => update({ retencionesAlquiler: v })}
                            ayuda="Si el inquilino es empresa, te habrá practicado retenciones del 19%."
                          />
                        </>
                      )}
                    </div>
                  </div>

                  <div className="pb-4 border-b border-gray-100">
                    <h3 className="font-semibold text-[#1a365d] mb-3 flex items-center gap-2">
                      <PiggyBank className="w-4 h-4" /> Capital mobiliario y ganancias
                    </h3>
                    <div className="space-y-4">
                      <InputEuro
                        label="Dividendos e intereses recibidos"
                        value={datos.dividendos + datos.intereses}
                        onChange={(v) => update({ dividendos: v * 0.5, intereses: v * 0.5 })}
                        ayuda="Dividendos de acciones, intereses de cuentas y depósitos. Casillas 029-044."
                      />
                      <InputEuro
                        label="Ganancias patrimoniales (acciones, fondos, inmuebles)"
                        value={datos.gananciasPatrimoniales}
                        onChange={(v) => update({ gananciasPatrimoniales: v })}
                        ayuda="Beneficio por venta de acciones, fondos de inversión, inmuebles, etc."
                      />
                      {datos.gananciasPatrimoniales > 0 && (
                        <InputEuro
                          label="Pérdidas patrimoniales a compensar"
                          value={datos.perdidasPatrimoniales}
                          onChange={(v) => update({ perdidasPatrimoniales: v })}
                          ayuda="Las pérdidas compensan las ganancias del mismo tipo."
                        />
                      )}
                      <InputEuro
                        label="Retenciones sobre dividendos e intereses"
                        value={datos.retencionesCapitalMobiliario}
                        onChange={(v) => update({ retencionesCapitalMobiliario: v })}
                        ayuda="Normalmente el 19% de los dividendos e intereses. Casilla 599."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── FAMILIA ── */}
          {pasoActual === "familia" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-['DM_Sans'] text-2xl font-bold text-[#1a365d] mb-1">
                  Situación familiar
                </h2>
                <p className="text-gray-500">El mínimo familiar reduce directamente tu cuota. No lo pierdas.</p>
              </div>

              <Card className="border-0 shadow-md bg-white">
                <CardContent className="p-6 space-y-6">
                  <NumberField
                    label="Número de hijos a cargo (menores de 25 años)"
                    value={datos.numHijos}
                    onChange={(v) => {
                      update({
                        numHijos: v,
                        hijosMenores3: Math.min(datos.hijosMenores3, v),
                        hijosDiscapacitados: datos.hijosDiscapacitados.slice(0, v),
                      });
                    }}
                    ayuda="Incluye hijos mayores de 25 años si tienen discapacidad"
                  />

                  {datos.numHijos > 0 && (
                    <>
                      <NumberField
                        label="De ellos, ¿cuántos son menores de 3 años?"
                        value={datos.hijosMenores3}
                        onChange={(v) => update({ hijosMenores3: Math.min(v, datos.numHijos) })}
                        max={datos.numHijos}
                        ayuda="Mínimo adicional de 2.800 € por hijo menor de 3 años"
                      />

                      <ToggleCard
                        label="Algún hijo tiene discapacidad reconocida (≥33%)"
                        value={datos.hijosDiscapacitados.length > 0}
                        onChange={(v) => update({ hijosDiscapacitados: v ? [33] : [] })}
                        icon={Heart}
                      />

                      <ToggleCard
                        label="Familia numerosa (3 o más hijos)"
                        descripcion="Deducción de 1.200 € (general) o 2.400 € (especial)"
                        value={datos.familiaNumerosa}
                        onChange={(v) => update({ familiaNumerosa: v })}
                        icon={Users}
                      />

                      {datos.familiaNumerosa && (
                        <ToggleCard
                          label="Familia numerosa de categoría especial (5+ hijos)"
                          value={datos.familiaNumerosaEspecial}
                          onChange={(v) => update({ familiaNumerosaEspecial: v })}
                          icon={Users}
                        />
                      )}

                      <ToggleCard
                        label="Madre trabajadora con hijos menores de 3 años"
                        descripcion="Deducción por maternidad de 1.200 € por hijo"
                        value={datos.madreTrabajaFueraHogar}
                        onChange={(v) => update({ madreTrabajaFueraHogar: v })}
                        icon={Heart}
                      />
                    </>
                  )}

                  <div className="pt-4 border-t border-gray-100">
                    <NumberField
                      label="Ascendientes (padres/abuelos) mayores de 65 años a cargo"
                      value={datos.numAscendientes}
                      onChange={(v) => update({ numAscendientes: v })}
                      max={4}
                      ayuda="Deben convivir contigo y tener rentas inferiores a 8.000 €"
                    />

                    {datos.numAscendientes > 0 && (
                      <div className="mt-4">
                        <ToggleCard
                          label="Algún ascendiente tiene discapacidad (≥33%)"
                          value={datos.ascendientesDiscapacitados}
                          onChange={(v) => update({ ascendientesDiscapacitados: v })}
                          icon={Heart}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {datos.numHijos > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3">
                  <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-emerald-800">
                    <p className="font-semibold mb-1">Mínimo por descendientes estimado:</p>
                    <p>
                      {datos.numHijos >= 1 && "1º hijo: 2.400 €"}
                      {datos.numHijos >= 2 && " · 2º hijo: 2.700 €"}
                      {datos.numHijos >= 3 && " · 3º hijo: 4.000 €"}
                      {datos.numHijos >= 4 && " · 4º hijo: 4.500 €"}
                      {datos.hijosMenores3 > 0 && ` · +2.800 € por cada hijo < 3 años`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── VIVIENDA ── */}
          {pasoActual === "vivienda" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-['DM_Sans'] text-2xl font-bold text-[#1a365d] mb-1">
                  Tu vivienda
                </h2>
                <p className="text-gray-500">Deducciones por alquiler, hipoteca y eficiencia energética.</p>
              </div>

              <Card className="border-0 shadow-md bg-white">
                <CardContent className="p-6 space-y-5">
                  <ToggleCard
                    label="Pago alquiler por mi vivienda habitual"
                    descripcion="Posibles deducciones estatales y autonómicas"
                    value={datos.alquilerViviendaHabitual}
                    onChange={(v) => update({ alquilerViviendaHabitual: v })}
                    icon={Home}
                  />

                  {datos.alquilerViviendaHabitual && (
                    <>
                      <InputEuro
                        label="Importe anual del alquiler pagado"
                        value={datos.alquilerAnual}
                        onChange={(v) => update({ alquilerAnual: v })}
                        ayuda="Total de mensualidades pagadas en 2025."
                      />
                      <ToggleCard
                        label="Mi contrato de alquiler es anterior al 01/01/2015"
                        descripcion="Deducción estatal del 10,05% si la base imponible es < 24.107 €"
                        value={datos.contratoAlquilerAntes2015}
                        onChange={(v) => update({ contratoAlquilerAntes2015: v })}
                        icon={FileText}
                      />
                    </>
                  )}

                  <div className="pt-4 border-t border-gray-100">
                    <ToggleCard
                      label="Tengo hipoteca sobre vivienda habitual firmada antes del 01/01/2013"
                      descripcion="Deducción del 15% de lo pagado, máx. 9.040 €"
                      value={datos.hipotecaAntes2013}
                      onChange={(v) => update({ hipotecaAntes2013: v })}
                      icon={Home}
                    />

                    {datos.hipotecaAntes2013 && (
                      <div className="mt-4">
                        <InputEuro
                          label="Amortización + intereses hipoteca pagados en 2025"
                          value={datos.hipotecaAnual}
                          onChange={(v) => update({ hipotecaAnual: v })}
                          ayuda="Suma de capital amortizado más intereses. Máx. deducible: 9.040 €."
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <ToggleCard
                      label="He realizado obras de mejora de eficiencia energética"
                      descripcion="Deducciones del 20%, 40% o 60% según el tipo de mejora"
                      value={datos.obrasEficienciaEnergetica}
                      onChange={(v) => update({ obrasEficienciaEnergetica: v })}
                      icon={Zap}
                    />

                    {datos.obrasEficienciaEnergetica && (
                      <div className="mt-4 space-y-4">
                        <InputEuro
                          label="Importe de las obras de eficiencia energética"
                          value={datos.importeObrasEnergeticas}
                          onChange={(v) => update({ importeObrasEnergeticas: v })}
                        />
                        <SelectField
                          label="Tipo de mejora energética"
                          value={datos.tipoMejoraEnergetica}
                          onChange={(v) => update({ tipoMejoraEnergetica: v as any })}
                          options={[
                            { value: "reduccion20", label: "Reducción ≥7% demanda calefacción/refrigeración (20%)" },
                            { value: "reduccion40", label: "Reducción ≥30% consumo energía primaria (40%)" },
                            { value: "reduccion60", label: "Edificio residencial, clase energética A o B (60%)" },
                          ]}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── DEDUCCIONES ── */}
          {pasoActual === "deducciones" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-['DM_Sans'] text-2xl font-bold text-[#1a365d] mb-1">
                  Otras deducciones
                </h2>
                <p className="text-gray-500">Planes de pensiones, donativos y gastos de guardería o escolaridad.</p>
              </div>

              <Card className="border-0 shadow-md bg-white">
                <CardContent className="p-6 space-y-5">
                  <InputEuro
                    label="Aportaciones a planes de pensiones en 2025"
                    value={datos.aportacionesPlanPensiones}
                    onChange={(v) => update({ aportacionesPlanPensiones: v })}
                    ayuda="Reducen directamente la base imponible. Límite: 1.500 € o 30% de los rendimientos."
                  />

                  <div className="pt-4 border-t border-gray-100">
                    <InputEuro
                      label="Donativos a ONGs y entidades sin ánimo de lucro"
                      value={datos.donativos}
                      onChange={(v) => update({ donativos: v })}
                      ayuda="80% de los primeros 250 € + 40% del resto (45% si eres donante habitual)."
                    />
                    {datos.donativos > 0 && (
                      <div className="mt-3">
                        <ToggleCard
                          label="Soy donante habitual de la misma ONG (≥2 años consecutivos)"
                          descripcion="El exceso de 250 € se deduce al 45% en lugar del 40%"
                          value={datos.donativosHabitualONG}
                          onChange={(v) => update({ donativosHabitualONG: v })}
                          icon={Heart}
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="font-semibold text-[#1a365d] mb-3">Deducciones autonómicas adicionales</h3>
                    <div className="space-y-4">
                      <InputEuro
                        label="Gastos de guardería (hijos < 3 años)"
                        value={datos.gastosGuarderia}
                        onChange={(v) => update({ gastosGuarderia: v })}
                        ayuda="Deducibles en Madrid, Andalucía, Canarias y otras CCAA."
                      />
                      <InputEuro
                        label="Gastos de escolaridad (hijos 3-12 años)"
                        value={datos.gastosEscolaridad}
                        onChange={(v) => update({ gastosEscolaridad: v })}
                        ayuda="Material escolar, libros, matrículas. Deducible en Madrid y otras CCAA."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Al pulsar "Ver resultado" calculamos automáticamente todas las deducciones aplicables
                  según tu comunidad autónoma y situación personal.
                </p>
              </div>
            </div>
          )}

          {/* ── RESULTADO ── */}
          {pasoActual === "resultado" && resultado && (
            <div className="space-y-6">
              {/* Resultado principal */}
              <div className={`rounded-2xl p-8 text-center ${
                resultado.resultado === "devolucion"
                  ? "bg-gradient-to-br from-emerald-600 to-emerald-700"
                  : resultado.resultado === "pagar"
                  ? "bg-gradient-to-br from-[#1a365d] to-[#2d4a7a]"
                  : "bg-gradient-to-br from-gray-600 to-gray-700"
              }`}>
                <div className="text-white/70 text-sm font-medium mb-2">Tu resultado estimado</div>
                <div className="text-5xl font-bold text-white mb-2">
                  {resultado.resultado === "devolucion" ? "+" : resultado.resultado === "pagar" ? "-" : ""}
                  {formatEuro(resultado.importeResultado)}
                </div>
                <div className="text-white/90 text-lg font-semibold">
                  {resultado.resultado === "devolucion"
                    ? "Hacienda te devuelve"
                    : resultado.resultado === "pagar"
                    ? "Tienes que pagar a Hacienda"
                    : "Resultado cero"}
                </div>
                <div className="mt-4 text-white/60 text-sm">
                  Tipo medio efectivo: {resultado.tipoMedioEfectivo.toFixed(2)}%
                </div>
              </div>

              {/* Obligación de declarar */}
              <div className={`rounded-xl p-4 flex gap-3 ${
                obligacion.obligado
                  ? "bg-amber-50 border border-amber-200"
                  : "bg-emerald-50 border border-emerald-200"
              }`}>
                {obligacion.obligado
                  ? <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  : <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                }
                <div>
                  <p className={`text-sm font-semibold ${obligacion.obligado ? "text-amber-800" : "text-emerald-800"}`}>
                    {obligacion.obligado ? "Estás obligado a declarar" : "Puede que no estés obligado a declarar"}
                  </p>
                  <p className={`text-xs mt-0.5 ${obligacion.obligado ? "text-amber-700" : "text-emerald-700"}`}>
                    {obligacion.motivo}
                  </p>
                </div>
              </div>

              {/* Ahorro potencial */}
              {resultado.ahorroPotencial > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3">
                  <TrendingDown className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">
                      Deducciones aplicadas: {formatEuro(resultado.ahorroPotencial)}
                    </p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Estas deducciones reducen tu cuota final. Sin ellas pagarías {formatEuro(resultado.ahorroPotencial)} más.
                    </p>
                  </div>
                </div>
              )}

              {/* Desglose del cálculo */}
              <Card className="border-0 shadow-md bg-white">
                <CardContent className="p-6">
                  <h3 className="font-['DM_Sans'] text-lg font-bold text-[#1a365d] mb-4">
                    Desglose del cálculo
                  </h3>
                  <div className="space-y-2 text-sm">
                    {[
                      { label: "Rendimiento neto del trabajo", valor: resultado.rendimientoNetoTrabajo, casilla: "023" },
                      resultado.rendimientoNetoCapitalInmobiliario > 0 && { label: "Rendimiento neto capital inmobiliario", valor: resultado.rendimientoNetoCapitalInmobiliario, casilla: "100" },
                      resultado.rendimientoNetoActividades > 0 && { label: "Rendimiento neto actividades económicas", valor: resultado.rendimientoNetoActividades, casilla: "224" },
                      resultado.baseImponibleAhorro > 0 && { label: "Base imponible del ahorro", valor: resultado.baseImponibleAhorro, casilla: "435" },
                      { label: "Base imponible general", valor: resultado.baseImponibleGeneral, casilla: "415", destacado: true },
                      resultado.reduccionPlanPensiones > 0 && { label: "Reducción plan de pensiones", valor: -resultado.reduccionPlanPensiones, casilla: "466" },
                      resultado.reduccionDeclaracionConjunta > 0 && { label: "Reducción declaración conjunta", valor: -resultado.reduccionDeclaracionConjunta, casilla: "485" },
                      { label: "Base liquidable general", valor: resultado.baseLiquidableGeneral, casilla: "500", destacado: true },
                      { label: "Mínimo personal y familiar", valor: -resultado.minimoTotal, casilla: "519" },
                      { label: "Cuota íntegra estatal", valor: resultado.cuotaIntegraEstatal, casilla: "545" },
                      { label: "Cuota íntegra autonómica", valor: resultado.cuotaIntegraAutonomica, casilla: "546" },
                      { label: "Cuota íntegra total", valor: resultado.cuotaIntegraTotal, casilla: "547", destacado: true },
                      resultado.totalDeduccionesEstatales > 0 && { label: "Total deducciones estatales", valor: -resultado.totalDeduccionesEstatales, casilla: "595" },
                      resultado.totalDeduccionesAutonomicas > 0 && { label: "Total deducciones autonómicas", valor: -resultado.totalDeduccionesAutonomicas, casilla: "596" },
                      { label: "Cuota líquida total", valor: resultado.cuotaLiquidaTotal, casilla: "620", destacado: true },
                      { label: "Total retenciones e ingresos a cuenta", valor: -resultado.totalRetenciones, casilla: "599" },
                    ].filter(Boolean).map((item: any, i) => (
                      <div key={i} className={`flex items-center justify-between py-2 ${
                        item.destacado ? "border-t border-gray-200 font-semibold" : ""
                      }`}>
                        <span className={`${item.destacado ? "text-[#1a365d]" : "text-gray-600"}`}>
                          {item.label}
                          <span className="text-gray-400 text-xs ml-1">[{item.casilla}]</span>
                        </span>
                        <span className={`font-mono ${
                          item.valor < 0 ? "text-emerald-600" : item.destacado ? "text-[#1a365d]" : "text-gray-700"
                        }`}>
                          {item.valor < 0 ? `−${formatEuro(Math.abs(item.valor))}` : formatEuro(item.valor)}
                        </span>
                      </div>
                    ))}

                    <div className="border-t-2 border-[#1a365d] pt-3 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1a365d] text-base">Cuota diferencial [670]</span>
                        <span className={`font-bold text-lg font-mono ${
                          resultado.resultado === "devolucion" ? "text-emerald-600" : "text-red-600"
                        }`}>
                          {resultado.resultado === "devolucion" ? "−" : "+"}
                          {formatEuro(resultado.importeResultado)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Deducciones aplicadas */}
              {(resultado.deduccionesEstatales.length > 0 || resultado.deduccionesAutonomicas.length > 0) && (
                <Card className="border-0 shadow-md bg-white">
                  <CardContent className="p-6">
                    <h3 className="font-['DM_Sans'] text-lg font-bold text-[#1a365d] mb-4">
                      Deducciones aplicadas automáticamente
                    </h3>
                    <div className="space-y-3">
                      {[...resultado.deduccionesEstatales, ...resultado.deduccionesAutonomicas].map((d, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-[#1a365d]">{d.nombre}</p>
                              <p className="text-sm font-bold text-emerald-600 flex-shrink-0">
                                {formatEuro(d.importe)}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{d.descripcion}</p>
                            <p className="text-xs text-gray-400">{d.normativa}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Mínimo personal y familiar */}
              <Card className="border-0 shadow-md bg-white">
                <CardContent className="p-6">
                  <h3 className="font-['DM_Sans'] text-lg font-bold text-[#1a365d] mb-4">
                    Mínimo personal y familiar
                  </h3>
                  <div className="space-y-2 text-sm">
                    {[
                      { label: "Mínimo personal", valor: resultado.minimoPersonal },
                      resultado.minimoDescendientes > 0 && { label: "Mínimo por descendientes", valor: resultado.minimoDescendientes },
                      resultado.minimoAscendientes > 0 && { label: "Mínimo por ascendientes", valor: resultado.minimoAscendientes },
                      resultado.minimoDiscapacidad > 0 && { label: "Mínimo por discapacidad", valor: resultado.minimoDiscapacidad },
                    ].filter(Boolean).map((item: any, i) => (
                      <div key={i} className="flex justify-between py-1.5 border-b border-gray-100">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-semibold text-[#1a365d]">{formatEuro(item.valor)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 font-bold">
                      <span className="text-[#1a365d]">Total mínimo personal y familiar</span>
                      <span className="text-[#1a365d]">{formatEuro(resultado.minimoTotal)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CTA */}
              <div className="bg-[#1a365d] rounded-2xl p-6 text-center">
                <h3 className="font-['DM_Sans'] text-xl font-bold text-white mb-2">
                  ¿Quieres que lo hagamos por ti?
                </h3>
                <p className="text-white/70 text-sm mb-4">
                  Un asesor fiscal revisará tu declaración y la presentará ante la AEAT.
                  Precio desde 29 € con resultado garantizado.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/renta">
                    <Button className="bg-[#059669] hover:bg-[#047857] text-white font-bold px-8 h-12">
                      Contratar servicio
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 h-12"
                    onClick={() => {
                      setPasoActual("bienvenida");
                      setDatos(crearDatosVacios());
                    }}
                  >
                    Volver a calcular
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Botones de navegación */}
          {pasoActual !== "bienvenida" && pasoActual !== "resultado" && (
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={anterior}
                className="flex-1 h-12 border-gray-300 text-[#1a365d]"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>
              <Button
                onClick={siguiente}
                className="flex-2 h-12 bg-[#059669] hover:bg-[#047857] text-white font-bold px-8"
              >
                {pasoActual === "deducciones" ? "Ver mi resultado" : "Siguiente"}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {pasoActual === "resultado" && (
            <div className="mt-4 text-center">
              <button
                onClick={anterior}
                className="text-sm text-gray-500 hover:text-[#1a365d] flex items-center gap-1 mx-auto"
              >
                <ChevronLeft className="w-4 h-4" />
                Modificar datos
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
