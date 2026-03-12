/*
 * Design: Fintech Institucional
 * Formulario de Triage — Clasifica el caso y recoge datos iniciales
 * Palette: Navy #1a365d, Emerald #059669, Warm gray #f7f5f2
 */
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ArrowRight, ArrowLeft, CheckCircle2, User, Briefcase,
  Home as HomeIcon, PiggyBank, FileCheck, Shield, Phone,
  Mail, AlertTriangle, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type TriageStep = "perfil" | "ingresos" | "situacion" | "documentos" | "contacto" | "resultado";

interface TriageData {
  nombre: string;
  email: string;
  telefono: string;
  tipoContribuyente: string;
  numPagadores: string;
  ingresosAprox: string;
  tieneInmuebles: string;
  tieneInversiones: string;
  esAutonomo: string;
  situacionFamiliar: string;
  comunidadAutonoma: string;
}

const INITIAL: TriageData = {
  nombre: "",
  email: "",
  telefono: "",
  tipoContribuyente: "",
  numPagadores: "",
  ingresosAprox: "",
  tieneInmuebles: "",
  tieneInversiones: "",
  esAutonomo: "",
  situacionFamiliar: "",
  comunidadAutonoma: "",
};

function getComplejidad(data: TriageData): "simple" | "medio" | "complejo" | "no_apto" {
  if (data.esAutonomo === "si") return "no_apto";
  if (data.tieneInversiones === "si") return "complejo";
  if (data.tieneInmuebles === "varios") return "complejo";
  if (data.numPagadores === "3_mas") return "complejo";
  if (data.tieneInmuebles === "uno" || data.numPagadores === "2") return "medio";
  return "simple";
}

function getPrecio(complejidad: string): string {
  switch (complejidad) {
    case "simple": return "49€";
    case "medio": return "69€";
    case "complejo": return "99€";
    default: return "—";
  }
}

function getPlan(complejidad: string): string {
  switch (complejidad) {
    case "simple": return "Renta Simple";
    case "medio": return "Renta Estándar";
    case "complejo": return "Renta Premium";
    default: return "Consulta personalizada";
  }
}

const STEPS: { id: TriageStep; title: string; icon: any }[] = [
  { id: "perfil", title: "Tu perfil", icon: User },
  { id: "ingresos", title: "Ingresos", icon: Briefcase },
  { id: "situacion", title: "Situación", icon: HomeIcon },
  { id: "contacto", title: "Contacto", icon: Mail },
  { id: "resultado", title: "Resultado", icon: FileCheck },
];

export default function Triage() {
  const [currentStep, setCurrentStep] = useState<TriageStep>("perfil");
  const [data, setData] = useState<TriageData>(INITIAL);

  const update = (partial: Partial<TriageData>) => setData((prev) => ({ ...prev, ...partial }));

  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const next = () => {
    if (stepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[stepIndex + 1].id);
    }
  };
  const prev = () => {
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1].id);
    }
  };

  const complejidad = getComplejidad(data);

  const handleSubmit = () => {
    toast.success("Solicitud enviada correctamente. Nos pondremos en contacto contigo en menos de 24 horas.");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f5f2]">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 lg:pt-28 lg:pb-24">
        <div className="container max-w-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-['DM_Sans'] text-3xl lg:text-4xl font-bold text-[#1a365d] mb-2">
              Haz tu renta con TPymes
            </h1>
            <p className="text-gray-500">
              Comprueba en 2 minutos qué tipo de servicio necesitas
            </p>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-1 mb-10">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                    currentStep === s.id
                      ? "bg-[#1a365d] text-white"
                      : stepIndex > i
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {stepIndex > i ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-6 sm:w-12 h-0.5 ${stepIndex > i ? "bg-emerald-300" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>

          <Card className="border-0 shadow-xl shadow-gray-200/50 bg-white">
            <CardContent className="p-6 lg:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* STEP: Perfil */}
                  {currentStep === "perfil" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="font-['DM_Sans'] text-xl font-bold text-[#1a365d] mb-1">
                          ¿Qué tipo de contribuyente eres?
                        </h2>
                        <p className="text-sm text-gray-400">
                          Esto nos ayuda a clasificar tu caso desde el principio.
                        </p>
                      </div>

                      <RadioGroup
                        value={data.tipoContribuyente}
                        onValueChange={(v) => update({ tipoContribuyente: v })}
                        className="grid gap-3"
                      >
                        {[
                          {
                            value: "asalariado",
                            label: "Asalariado/a",
                            desc: "Trabajo por cuenta ajena con nómina",
                            icon: Briefcase,
                          },
                          {
                            value: "pensionista",
                            label: "Pensionista",
                            desc: "Jubilación, viudedad u otra pensión",
                            icon: PiggyBank,
                          },
                          {
                            value: "desempleado",
                            label: "Desempleado/a",
                            desc: "Prestación por desempleo",
                            icon: User,
                          },
                          {
                            value: "autonomo",
                            label: "Autónomo/a",
                            desc: "Trabajo por cuenta propia",
                            icon: Sparkles,
                          },
                        ].map((opt) => (
                          <label
                            key={opt.value}
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              data.tipoContribuyente === opt.value
                                ? "border-[#059669] bg-emerald-50/50"
                                : "border-gray-100 hover:border-gray-200"
                            }`}
                          >
                            <RadioGroupItem value={opt.value} className="sr-only" />
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              data.tipoContribuyente === opt.value ? "bg-emerald-100" : "bg-gray-50"
                            }`}>
                              <opt.icon className={`w-5 h-5 ${
                                data.tipoContribuyente === opt.value ? "text-emerald-600" : "text-gray-400"
                              }`} />
                            </div>
                            <div>
                              <p className="font-semibold text-[#1a365d] text-sm">{opt.label}</p>
                              <p className="text-xs text-gray-400">{opt.desc}</p>
                            </div>
                            {data.tipoContribuyente === opt.value && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />
                            )}
                          </label>
                        ))}
                      </RadioGroup>

                      {data.tipoContribuyente === "autonomo" && (
                        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl">
                          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-amber-800">
                              Las rentas de autónomos requieren atención especializada
                            </p>
                            <p className="text-xs text-amber-600 mt-1">
                              Te derivaremos a un asesor fiscal especializado en autónomos para garantizar 
                              el mejor resultado posible.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP: Ingresos */}
                  {currentStep === "ingresos" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="font-['DM_Sans'] text-xl font-bold text-[#1a365d] mb-1">
                          Sobre tus ingresos
                        </h2>
                        <p className="text-sm text-gray-400">
                          No necesitamos cifras exactas, solo una idea general.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            ¿Cuántos pagadores has tenido en 2025?
                          </Label>
                          <RadioGroup
                            value={data.numPagadores}
                            onValueChange={(v) => update({ numPagadores: v })}
                            className="grid sm:grid-cols-3 gap-3"
                          >
                            {[
                              { value: "1", label: "1 pagador" },
                              { value: "2", label: "2 pagadores" },
                              { value: "3_mas", label: "3 o más" },
                            ].map((opt) => (
                              <label
                                key={opt.value}
                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${
                                  data.numPagadores === opt.value
                                    ? "border-[#059669] bg-emerald-50/50 text-emerald-700"
                                    : "border-gray-100 text-gray-500 hover:border-gray-200"
                                }`}
                              >
                                <RadioGroupItem value={opt.value} className="sr-only" />
                                {opt.label}
                              </label>
                            ))}
                          </RadioGroup>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            Rango aproximado de ingresos anuales
                          </Label>
                          <RadioGroup
                            value={data.ingresosAprox}
                            onValueChange={(v) => update({ ingresosAprox: v })}
                            className="grid sm:grid-cols-2 gap-3"
                          >
                            {[
                              { value: "menos_20k", label: "Menos de 20.000€" },
                              { value: "20k_35k", label: "20.000€ - 35.000€" },
                              { value: "35k_60k", label: "35.000€ - 60.000€" },
                              { value: "mas_60k", label: "Más de 60.000€" },
                            ].map((opt) => (
                              <label
                                key={opt.value}
                                className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${
                                  data.ingresosAprox === opt.value
                                    ? "border-[#059669] bg-emerald-50/50 text-emerald-700"
                                    : "border-gray-100 text-gray-500 hover:border-gray-200"
                                }`}
                              >
                                <RadioGroupItem value={opt.value} className="sr-only" />
                                {opt.label}
                              </label>
                            ))}
                          </RadioGroup>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            ¿Eres autónomo o tienes actividad económica?
                          </Label>
                          <RadioGroup
                            value={data.esAutonomo}
                            onValueChange={(v) => update({ esAutonomo: v })}
                            className="grid sm:grid-cols-2 gap-3"
                          >
                            {[
                              { value: "no", label: "No" },
                              { value: "si", label: "Sí" },
                            ].map((opt) => (
                              <label
                                key={opt.value}
                                className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${
                                  data.esAutonomo === opt.value
                                    ? "border-[#059669] bg-emerald-50/50 text-emerald-700"
                                    : "border-gray-100 text-gray-500 hover:border-gray-200"
                                }`}
                              >
                                <RadioGroupItem value={opt.value} className="sr-only" />
                                {opt.label}
                              </label>
                            ))}
                          </RadioGroup>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP: Situación */}
                  {currentStep === "situacion" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="font-['DM_Sans'] text-xl font-bold text-[#1a365d] mb-1">
                          Tu situación patrimonial
                        </h2>
                        <p className="text-sm text-gray-400">
                          Esto determina la complejidad de tu declaración.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            ¿Tienes inmuebles (pisos, locales, garajes)?
                          </Label>
                          <RadioGroup
                            value={data.tieneInmuebles}
                            onValueChange={(v) => update({ tieneInmuebles: v })}
                            className="grid sm:grid-cols-3 gap-3"
                          >
                            {[
                              { value: "no", label: "No" },
                              { value: "uno", label: "Sí, 1 inmueble" },
                              { value: "varios", label: "Sí, varios" },
                            ].map((opt) => (
                              <label
                                key={opt.value}
                                className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${
                                  data.tieneInmuebles === opt.value
                                    ? "border-[#059669] bg-emerald-50/50 text-emerald-700"
                                    : "border-gray-100 text-gray-500 hover:border-gray-200"
                                }`}
                              >
                                <RadioGroupItem value={opt.value} className="sr-only" />
                                {opt.label}
                              </label>
                            ))}
                          </RadioGroup>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            ¿Tienes inversiones (acciones, fondos, criptomonedas)?
                          </Label>
                          <RadioGroup
                            value={data.tieneInversiones}
                            onValueChange={(v) => update({ tieneInversiones: v })}
                            className="grid sm:grid-cols-2 gap-3"
                          >
                            {[
                              { value: "no", label: "No" },
                              { value: "si", label: "Sí" },
                            ].map((opt) => (
                              <label
                                key={opt.value}
                                className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${
                                  data.tieneInversiones === opt.value
                                    ? "border-[#059669] bg-emerald-50/50 text-emerald-700"
                                    : "border-gray-100 text-gray-500 hover:border-gray-200"
                                }`}
                              >
                                <RadioGroupItem value={opt.value} className="sr-only" />
                                {opt.label}
                              </label>
                            ))}
                          </RadioGroup>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            Situación familiar
                          </Label>
                          <RadioGroup
                            value={data.situacionFamiliar}
                            onValueChange={(v) => update({ situacionFamiliar: v })}
                            className="grid sm:grid-cols-2 gap-3"
                          >
                            {[
                              { value: "sin_hijos", label: "Sin hijos a cargo" },
                              { value: "con_hijos", label: "Con hijos a cargo" },
                              { value: "monoparental", label: "Familia monoparental" },
                              { value: "ascendientes", label: "Con ascendientes a cargo" },
                            ].map((opt) => (
                              <label
                                key={opt.value}
                                className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${
                                  data.situacionFamiliar === opt.value
                                    ? "border-[#059669] bg-emerald-50/50 text-emerald-700"
                                    : "border-gray-100 text-gray-500 hover:border-gray-200"
                                }`}
                              >
                                <RadioGroupItem value={opt.value} className="sr-only" />
                                {opt.label}
                              </label>
                            ))}
                          </RadioGroup>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP: Contacto */}
                  {currentStep === "contacto" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="font-['DM_Sans'] text-xl font-bold text-[#1a365d] mb-1">
                          Tus datos de contacto
                        </h2>
                        <p className="text-sm text-gray-400">
                          Para enviarte el resultado y que un asesor pueda contactarte.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                            Nombre completo
                          </Label>
                          <Input
                            value={data.nombre}
                            onChange={(e) => update({ nombre: e.target.value })}
                            placeholder="María García López"
                            className="h-11"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                            Email
                          </Label>
                          <Input
                            type="email"
                            value={data.email}
                            onChange={(e) => update({ email: e.target.value })}
                            placeholder="maria@ejemplo.com"
                            className="h-11"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                            Teléfono
                          </Label>
                          <Input
                            type="tel"
                            value={data.telefono}
                            onChange={(e) => update({ telefono: e.target.value })}
                            placeholder="612 345 678"
                            className="h-11"
                          />
                        </div>
                      </div>

                      <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
                        <Shield className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-gray-400 leading-relaxed">
                          Tus datos están protegidos conforme al RGPD. Solo los usaremos para gestionar 
                          tu declaración de la renta y contactarte sobre el servicio.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* STEP: Resultado */}
                  {currentStep === "resultado" && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                          complejidad === "no_apto" ? "bg-amber-100" : "bg-emerald-100"
                        }`}>
                          {complejidad === "no_apto" ? (
                            <Phone className="w-7 h-7 text-amber-600" />
                          ) : (
                            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                          )}
                        </div>
                        <h2 className="font-['DM_Sans'] text-2xl font-bold text-[#1a365d] mb-2">
                          {complejidad === "no_apto"
                            ? "Tu caso necesita atención especializada"
                            : `Tu plan recomendado: ${getPlan(complejidad)}`}
                        </h2>
                        <p className="text-gray-500">
                          {complejidad === "no_apto"
                            ? "Las rentas de autónomos requieren un asesor fiscal dedicado. Te contactaremos para una consulta personalizada."
                            : `Hemos analizado tu perfil y este es el servicio que mejor se adapta a tu situación.`}
                        </p>
                      </div>

                      {complejidad !== "no_apto" && (
                        <div className="bg-gradient-to-br from-[#1a365d] to-[#2d4a7a] rounded-2xl p-6 text-white text-center">
                          <p className="text-white/60 text-sm mb-1">Precio del servicio</p>
                          <p className="font-['DM_Sans'] text-5xl font-bold mb-1">
                            {getPrecio(complejidad)}
                          </p>
                          <p className="text-white/40 text-xs">por declaración, IVA incluido</p>
                          <div className="mt-4 space-y-2">
                            {[
                              "Simulación y análisis fiscal",
                              "Recogida automática de documentación",
                              "Revisión por asesor profesional",
                              "Presentación ante la AEAT",
                              complejidad === "complejo" ? "Asesor fiscal dedicado" : "Soporte por email",
                            ].map((f, i) => (
                              <div key={i} className="flex items-center justify-center gap-2 text-sm text-white/70">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                {f}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={handleSubmit}
                        className="w-full bg-[#059669] hover:bg-[#047857] text-white font-semibold h-12 text-base shadow-lg shadow-emerald-200/50"
                      >
                        {complejidad === "no_apto" ? "Solicitar consulta" : "Contratar servicio"}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>

                      <p className="text-center text-xs text-gray-400">
                        Al continuar, aceptas nuestros términos de servicio y política de privacidad.
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              {currentStep !== "resultado" && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                  <Button
                    variant="outline"
                    onClick={prev}
                    disabled={stepIndex === 0}
                    className="gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Anterior
                  </Button>
                  <Button
                    onClick={next}
                    className="bg-[#1a365d] hover:bg-[#1a365d]/90 text-white gap-2"
                  >
                    Siguiente
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
