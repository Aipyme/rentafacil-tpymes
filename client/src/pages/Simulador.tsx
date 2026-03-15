/*
 * Design: Fintech Institucional
 * Simulador IRPF 2025 — Cálculo real con tramos fiscales españoles
 * Palette: Navy #1a365d, Emerald #059669, Warm gray #f7f5f2
 */
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSimuladorFiscal, type ComunidadAutonoma } from "@/hooks/useSimuladorFiscal";
import {
  Calculator, ArrowRight, ArrowLeft, TrendingUp, TrendingDown,
  Shield, CheckCircle2, AlertCircle, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSEO } from "@/hooks/useSEO";

const STEPS = [
  { id: 1, title: "Ingresos", desc: "Tus rendimientos del trabajo" },
  { id: 2, title: "Situación personal", desc: "Familia y circunstancias" },
  { id: 3, title: "Deducciones", desc: "Vivienda, pensiones y más" },
  { id: 4, title: "Resultado", desc: "Tu estimación fiscal" },
];

export default function Simulador() {
  useSEO({
    title: "Simulador de Renta IRPF 2025 Gratuito",
    description: "Calcula gratis cuánto te devuelve o te sale a pagar en la declaración de la renta 2025. Simulador con tramos estatales y autonómicos actualizados, deducciones y mínimos personales.",
    canonical: "/simulador",
  });
  const [step, setStep] = useState(1);
  const { datos, resultado, updateDatos } = useSimuladorFiscal();

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const prev = () => setStep((s) => Math.max(s - 1, 1));

  const formatEur = (n: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f5f2]">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 lg:pt-28 lg:pb-24">
        <div className="container max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-['DM_Sans'] text-3xl lg:text-4xl font-bold text-[#1a365d] mb-2">
              Simulador de Renta 2025
            </h1>
            <p className="text-gray-500">
              Estimación gratuita y sin compromiso. Tus datos no se guardan.
            </p>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <button
                  onClick={() => setStep(s.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    step === s.id
                      ? "bg-[#1a365d] text-white"
                      : step > s.id
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {step > s.id ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-[10px]">
                      {s.id}
                    </span>
                  )}
                  <span className="hidden sm:inline">{s.title}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 ${step > s.id ? "bg-emerald-300" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            {/* Form */}
            <Card className="border-0 shadow-xl shadow-gray-200/50 bg-white">
              <CardContent className="p-6 lg:p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {step === 1 && (
                      <div className="space-y-6">
                        <div>
                          <h2 className="font-['DM_Sans'] text-xl font-bold text-[#1a365d] mb-1">
                            Tus ingresos
                          </h2>
                          <p className="text-sm text-gray-400">
                            Indica tus rendimientos brutos del trabajo y las retenciones practicadas.
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                              Ingresos brutos anuales (€)
                            </Label>
                            <Input
                              type="number"
                              value={datos.ingresosBrutos || ""}
                              onChange={(e) => updateDatos({ ingresosBrutos: Number(e.target.value) })}
                              placeholder="25000"
                              className="h-11 text-base"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                              Salario bruto anual, antes de retenciones e IRPF.
                            </p>
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                              Retenciones de IRPF practicadas (€)
                            </Label>
                            <Input
                              type="number"
                              value={datos.retencionesEmpresa || ""}
                              onChange={(e) => updateDatos({ retencionesEmpresa: Number(e.target.value) })}
                              placeholder="3500"
                              className="h-11 text-base"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                              Lo que tu empresa te ha retenido. Aparece en tu nómina.
                            </p>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div>
                              <Label className="text-sm font-medium text-gray-700">
                                ¿Tienes un segundo pagador?
                              </Label>
                              <p className="text-xs text-gray-400">Otro empleo, paro, etc.</p>
                            </div>
                            <Switch
                              checked={datos.tieneSegundoPagador}
                              onCheckedChange={(v) => updateDatos({ tieneSegundoPagador: v })}
                            />
                          </div>

                          {datos.tieneSegundoPagador && (
                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                Ingresos del segundo pagador (€)
                              </Label>
                              <Input
                                type="number"
                                value={datos.ingresosSegundoPagador || ""}
                                onChange={(e) => updateDatos({ ingresosSegundoPagador: Number(e.target.value) })}
                                placeholder="5000"
                                className="h-11"
                              />
                            </div>
                          )}

                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                              Comunidad Autónoma
                            </Label>
                            <Select
                              value={datos.comunidadAutonoma}
                              onValueChange={(v) => updateDatos({ comunidadAutonoma: v as ComunidadAutonoma })}
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Selecciona tu comunidad" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="default">Otra / No lo sé</SelectItem>
                                <SelectItem value="andalucia">Andalucía</SelectItem>
                                <SelectItem value="aragon">Aragón</SelectItem>
                                <SelectItem value="asturias">Asturias</SelectItem>
                                <SelectItem value="baleares">Islas Baleares</SelectItem>
                                <SelectItem value="canarias">Canarias</SelectItem>
                                <SelectItem value="cantabria">Cantabria</SelectItem>
                                <SelectItem value="castilla_leon">Castilla y León</SelectItem>
                                <SelectItem value="castilla_la_mancha">Castilla-La Mancha</SelectItem>
                                <SelectItem value="cataluna">Cataluña</SelectItem>
                                <SelectItem value="extremadura">Extremadura</SelectItem>
                                <SelectItem value="galicia">Galicia</SelectItem>
                                <SelectItem value="la_rioja">La Rioja</SelectItem>
                                <SelectItem value="madrid">Madrid</SelectItem>
                                <SelectItem value="murcia">Murcia</SelectItem>
                                <SelectItem value="navarra">Navarra</SelectItem>
                                <SelectItem value="pais_vasco">País Vasco</SelectItem>
                                <SelectItem value="valencia">Comunidad Valenciana</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-400 mt-1">
                              Los tramos autonómicos varían por comunidad. Afecta al resultado final.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-6">
                        <div>
                          <h2 className="font-['DM_Sans'] text-xl font-bold text-[#1a365d] mb-1">
                            Situación personal
                          </h2>
                          <p className="text-sm text-gray-400">
                            Tu situación familiar afecta al mínimo personal y las deducciones.
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                              Situación personal
                            </Label>
                            <RadioGroup
                              value={datos.situacionPersonal}
                              onValueChange={(v: any) => updateDatos({ situacionPersonal: v })}
                              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                            >
                              {[
                                { value: "soltero", label: "Soltero/a" },
                                { value: "casado", label: "Casado/a" },
                                { value: "familia_monoparental", label: "Familia monoparental" },
                              ].map((opt) => (
                                <label
                                  key={opt.value}
                                  className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                                    datos.situacionPersonal === opt.value
                                      ? "border-[#059669] bg-emerald-50"
                                      : "border-gray-200 hover:border-gray-300"
                                  }`}
                                >
                                  <RadioGroupItem value={opt.value} />
                                  <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                                </label>
                              ))}
                            </RadioGroup>
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                              Tu edad
                            </Label>
                            <Input
                              type="number"
                              value={datos.edad || ""}
                              onChange={(e) => updateDatos({ edad: Number(e.target.value) })}
                              placeholder="35"
                              className="h-11 max-w-[120px]"
                            />
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                Número de hijos
                              </Label>
                              <Select
                                value={String(datos.numHijos)}
                                onValueChange={(v) => updateDatos({ numHijos: Number(v) })}
                              >
                                <SelectTrigger className="h-11">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {[0, 1, 2, 3, 4, 5].map((n) => (
                                    <SelectItem key={n} value={String(n)}>
                                      {n === 0 ? "Sin hijos" : `${n} hijo${n > 1 ? "s" : ""}`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {datos.numHijos > 0 && (
                              <div>
                                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                  Hijos menores de 3 años
                                </Label>
                                <Select
                                  value={String(datos.hijosmenor3)}
                                  onValueChange={(v) => updateDatos({ hijosmenor3: Number(v) })}
                                >
                                  <SelectTrigger className="h-11">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: datos.numHijos + 1 }, (_, i) => i).map((n) => (
                                      <SelectItem key={n} value={String(n)}>
                                        {n}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                              Discapacidad reconocida
                            </Label>
                            <Select
                              value={datos.gradoDiscapacidad}
                              onValueChange={(v: any) => updateDatos({ gradoDiscapacidad: v })}
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ninguna">Sin discapacidad</SelectItem>
                                <SelectItem value="33_64">33% - 64%</SelectItem>
                                <SelectItem value="65_mas">65% o más</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-6">
                        <div>
                          <h2 className="font-['DM_Sans'] text-xl font-bold text-[#1a365d] mb-1">
                            Deducciones y reducciones
                          </h2>
                          <p className="text-sm text-gray-400">
                            Indica si tienes derecho a alguna de estas deducciones.
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div>
                              <Label className="text-sm font-medium text-gray-700">
                                Hipoteca vivienda habitual (antes de 2013)
                              </Label>
                              <p className="text-xs text-gray-400">Solo si compraste antes del 1/1/2013</p>
                            </div>
                            <Switch
                              checked={datos.tieneHipotecaPre2013}
                              onCheckedChange={(v) => updateDatos({ tieneHipotecaPre2013: v })}
                            />
                          </div>

                          {datos.tieneHipotecaPre2013 && (
                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                Total pagado en hipoteca este año (€)
                              </Label>
                              <Input
                                type="number"
                                value={datos.pagadoHipoteca || ""}
                                onChange={(e) => updateDatos({ pagadoHipoteca: Number(e.target.value) })}
                                placeholder="9040"
                                className="h-11"
                              />
                              <p className="text-xs text-gray-400 mt-1">
                                Máximo deducible: 9.040€ (15% = hasta 1.356€)
                              </p>
                            </div>
                          )}

                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                              Aportaciones a planes de pensiones (€)
                            </Label>
                            <Input
                              type="number"
                              value={datos.aportacionPensiones || ""}
                              onChange={(e) => updateDatos({ aportacionPensiones: Number(e.target.value) })}
                              placeholder="0"
                              className="h-11"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                              Límite individual: 1.500€/año
                            </p>
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                              Donaciones a ONG, fundaciones, etc. (€)
                            </Label>
                            <Input
                              type="number"
                              value={datos.donaciones || ""}
                              onChange={(e) => updateDatos({ donaciones: Number(e.target.value) })}
                              placeholder="0"
                              className="h-11"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                              Primeros 250€: 80% deducción. Resto: 40%.
                            </p>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div>
                              <Label className="text-sm font-medium text-gray-700">
                                Familia numerosa
                              </Label>
                              <p className="text-xs text-gray-400">General (1.200€) o Especial (2.400€)</p>
                            </div>
                            <Switch
                              checked={datos.esFamiliaNumerosa}
                              onCheckedChange={(v) => updateDatos({ esFamiliaNumerosa: v, familiaNumerosaCategoria: v ? "general" : "ninguna" })}
                            />
                          </div>

                          {datos.esFamiliaNumerosa && (
                            <Select
                              value={datos.familiaNumerosaCategoria}
                              onValueChange={(v: any) => updateDatos({ familiaNumerosaCategoria: v })}
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="general">General (3-4 hijos) — 1.200€</SelectItem>
                                <SelectItem value="especial">Especial (5+ hijos) — 2.400€</SelectItem>
                              </SelectContent>
                            </Select>
                          )}

                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div>
                              <Label className="text-sm font-medium text-gray-700">
                                Vehículo eléctrico (novedad 2025)
                              </Label>
                              <p className="text-xs text-gray-400">15% del valor, máx. 20.000€</p>
                            </div>
                            <Switch
                              checked={datos.tieneVehiculoElectrico}
                              onCheckedChange={(v) => updateDatos({ tieneVehiculoElectrico: v })}
                            />
                          </div>

                          {datos.tieneVehiculoElectrico && (
                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                Valor del vehículo eléctrico (€)
                              </Label>
                              <Input
                                type="number"
                                value={datos.valorVehiculoElectrico || ""}
                                onChange={(e) => updateDatos({ valorVehiculoElectrico: Number(e.target.value) })}
                                placeholder="20000"
                                className="h-11"
                              />
                            </div>
                          )}

                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div>
                              <Label className="text-sm font-medium text-gray-700">
                                Obras de eficiencia energética
                              </Label>
                              <p className="text-xs text-gray-400">20% del importe, máx. 5.000€</p>
                            </div>
                            <Switch
                              checked={datos.obraEficienciaEnergetica}
                              onCheckedChange={(v) => updateDatos({ obraEficienciaEnergetica: v })}
                            />
                          </div>

                          {datos.obraEficienciaEnergetica && (
                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                Importe de las obras (€)
                              </Label>
                              <Input
                                type="number"
                                value={datos.importeObraEficiencia || ""}
                                onChange={(e) => updateDatos({ importeObraEficiencia: Number(e.target.value) })}
                                placeholder="5000"
                                className="h-11"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {step === 4 && (
                      <div className="space-y-6">
                        <div>
                          <h2 className="font-['DM_Sans'] text-xl font-bold text-[#1a365d] mb-1">
                            Tu resultado estimado
                          </h2>
                          <p className="text-sm text-gray-400">
                            Estimación basada en los tramos IRPF 2025 y la normativa vigente.
                          </p>
                        </div>

                        {/* Big result */}
                        <div
                          className={`p-6 rounded-2xl text-center ${
                            resultado.resultado >= 0
                              ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50"
                              : "bg-gradient-to-br from-red-50 to-red-100/50"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2 mb-2">
                            {resultado.resultado >= 0 ? (
                              <TrendingUp className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <TrendingDown className="w-5 h-5 text-red-600" />
                            )}
                            <span
                              className={`text-sm font-medium ${
                                resultado.resultado >= 0 ? "text-emerald-700" : "text-red-700"
                              }`}
                            >
                              {resultado.resultado >= 0 ? "A devolver" : "A pagar"}
                            </span>
                          </div>
                          <p
                            className={`font-['DM_Sans'] text-5xl font-bold ${
                              resultado.resultado >= 0 ? "text-emerald-700" : "text-red-700"
                            }`}
                          >
                            {formatEur(Math.abs(resultado.resultado))}
                          </p>
                        </div>

                        {/* Breakdown */}
                        <div className="space-y-3">
                          {[
                            { label: "Base imponible", value: formatEur(resultado.baseImponible) },
                            { label: "Mínimo personal y familiar", value: formatEur(resultado.minimoPersonalFamiliar) },
                            { label: "Cuota estatal", value: formatEur(resultado.cuotaEstatal) },
                            { label: "Cuota autonómica", value: formatEur(resultado.cuotaAutonomica) },
                            { label: "Cuota íntegra total", value: formatEur(resultado.cuotaIntegra) },
                            { label: "Deducciones aplicadas", value: `- ${formatEur(resultado.deducciones)}` },
                            { label: "Cuota líquida", value: formatEur(resultado.cuotaLiquida) },
                            { label: "Retenciones practicadas", value: formatEur(resultado.retenciones) },
                          ].map((row, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                              <span className="text-sm text-gray-500">{row.label}</span>
                              <span className="text-sm font-semibold text-[#1a365d]">{row.value}</span>
                            </div>
                          ))}
                        </div>

                        {/* Deducciones detail */}
                        {resultado.detallesDeducciones.length > 0 && (
                          <div className="bg-emerald-50 rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-emerald-800 mb-2 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              Deducciones encontradas
                            </h4>
                            {resultado.detallesDeducciones.map((d, i) => (
                              <div key={i} className="flex justify-between text-sm py-1">
                                <span className="text-emerald-700">{d.concepto}</span>
                                <span className="font-medium text-emerald-800">{formatEur(d.importe)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Complexity badge */}
                        <div className={`flex items-center gap-2 p-3 rounded-xl ${
                          resultado.complejidad === "simple"
                            ? "bg-green-50 text-green-700"
                            : resultado.complejidad === "medio"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700"
                        }`}>
                          <Info className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            Tu caso es{" "}
                            <strong>
                              {resultado.complejidad === "simple"
                                ? "simple"
                                : resultado.complejidad === "medio"
                                ? "de complejidad media"
                                : "complejo"}
                            </strong>
                            {resultado.complejidad === "simple"
                              ? " — ideal para nuestro servicio de renta simplificada"
                              : resultado.complejidad === "medio"
                              ? " — te recomendamos nuestro servicio con optimización fiscal"
                              : " — te recomendamos nuestro servicio premium con asesor dedicado"}
                          </span>
                        </div>

                        {/* Disclaimer */}
                        <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
                          <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-gray-400 leading-relaxed">
                            Esta es una estimación orientativa basada en los datos proporcionados y los tramos IRPF 2025.
                            El resultado final puede variar según deducciones autonómicas, rentas del ahorro y otros factores.
                            Para un cálculo exacto, contrata nuestro servicio.
                          </p>
                        </div>

                        <Link href="/empezar">
                          <Button className="w-full bg-[#059669] hover:bg-[#047857] text-white font-semibold h-12 text-base shadow-lg shadow-emerald-200/50">
                            Contratar servicio
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                {step < 4 && (
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                    <Button
                      variant="outline"
                      onClick={prev}
                      disabled={step === 1}
                      className="gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Anterior
                    </Button>
                    <Button
                      onClick={next}
                      className="bg-[#1a365d] hover:bg-[#1a365d]/90 text-white gap-2"
                    >
                      {step === 3 ? "Ver resultado" : "Siguiente"}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sidebar: Live preview */}
            <div className="hidden lg:block">
              <div className="sticky top-24 space-y-4">
                <Card className="border-0 shadow-lg shadow-gray-200/50 bg-white">
                  <CardContent className="p-5">
                    <h3 className="font-['DM_Sans'] text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                      Estimación en vivo
                    </h3>
                    <div className="text-center mb-4">
                      <p className="text-xs text-gray-400 mb-1">
                        {resultado.resultado >= 0 ? "Te devuelven" : "A pagar"}
                      </p>
                      <p
                        className={`font-['DM_Sans'] text-3xl font-bold ${
                          resultado.resultado >= 0 ? "text-[#059669]" : "text-red-600"
                        }`}
                      >
                        {formatEur(Math.abs(resultado.resultado))}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Ingresos</span>
                        <span className="font-medium text-gray-600">{formatEur(datos.ingresosBrutos)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Retenciones</span>
                        <span className="font-medium text-gray-600">{formatEur(datos.retencionesEmpresa)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Cuota líquida</span>
                        <span className="font-medium text-gray-600">{formatEur(resultado.cuotaLiquida)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg shadow-gray-200/50 bg-[#1a365d]">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-white/80">100% Seguro</span>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed">
                      Tus datos no se guardan ni se envían a ningún servidor. 
                      Todo el cálculo se realiza en tu navegador.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
