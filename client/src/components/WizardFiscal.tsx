/**
 * WizardFiscal — Cuestionario fiscal completo estilo TaxDown
 * Cubre: ingresos, situación personal, deducciones con importes, borrador Hacienda
 * Al completar: llama al motor fiscal en el servidor y muestra resultado visual completo
 */
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronRight, ChevronLeft, CheckCircle2, TrendingDown, TrendingUp,
  Euro, FileText, Download, Loader2, AlertTriangle, Info,
  Building2, Users, Home, Dumbbell, Car, Rocket, Heart,
  Baby, Briefcase, Calculator, Sparkles, Upload, X, Lock
} from "lucide-react";
import { toast } from "sonner";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface PreguntaWizard {
  id: string;
  seccion: "ingresos" | "personal" | "deducciones" | "borrador";
  tipo: "opcion" | "numero" | "select" | "si_no_importe";
  pregunta: string;
  descripcion?: string;
  icono?: React.ReactNode;
  opciones?: { valor: string; label: string; descripcion?: string }[];
  unidad?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  normativa?: string;
  ahorro?: string;
  dependeDe?: { id: string; valor: boolean | string };
}

interface RespuestasWizard {
  // Ingresos
  situacion: string;
  ingresos_brutos: number;
  retenciones: number;
  mas_de_un_pagador: boolean;
  segundo_pagador_importe: number;
  tiene_capital_mobiliario: boolean;
  importe_capital_mobiliario: number;
  tiene_capital_inmobiliario: boolean;
  importe_capital_inmobiliario: number;
  tiene_ganancias_patrimoniales: boolean;
  importe_ganancias_patrimoniales: number;
  // Personal
  n_hijos: number;
  discapacidad: boolean;
  porcentaje_discapacidad: number;
  edad: number;
  comunidad: string;
  // Deducciones
  compra_vivienda: boolean;
  vivienda_precio: number;
  vivienda_fecha: string;
  alquiler_pre2015: boolean;
  alquiler_pre2015_amount: number;
  importe_planes: number;
  importe_donaciones: number;
  gasto_gimnasio: number;
  vehiculo_electrico: boolean;
  vehiculo_electrico_precio: number;
  inversion_startup: boolean;
  startup_inversion: number;
  maternidad: boolean;
  guarderia_amount: number;
  alquiler_amount: number;
  nacimiento: boolean;
  // Borrador
  resultado_borrador_hacienda: number | null;
}

const COMUNIDADES = [
  "Andalucía", "Aragón", "Asturias", "Baleares", "Canarias",
  "Cantabria", "Castilla-La Mancha", "Castilla y León", "Cataluña",
  "Comunitat Valenciana", "Extremadura", "Galicia", "La Rioja",
  "Madrid", "Murcia", "Navarra", "País Vasco",
];

const SECCIONES = [
  { id: "ingresos", label: "Ingresos", icono: <Euro className="w-4 h-4" /> },
  { id: "personal", label: "Situación personal", icono: <Users className="w-4 h-4" /> },
  { id: "deducciones", label: "Deducciones", icono: <Sparkles className="w-4 h-4" /> },
  { id: "borrador", label: "Borrador Hacienda", icono: <FileText className="w-4 h-4" /> },
];

// ─── Componente principal ─────────────────────────────────────────────────────
export function WizardFiscal({
  expedienteId,
  datosIniciales,
  resultadoInicial,
  onCompletado,
}: {
  expedienteId: string;
  datosIniciales?: Partial<RespuestasWizard>;
  resultadoInicial?: any;
  onCompletado?: (resultado: any) => void;
}) {
  const [seccionActual, setSeccionActual] = useState<"ingresos" | "personal" | "deducciones" | "borrador" | "resultado">("ingresos");
  const [datos, setDatos] = useState<Partial<RespuestasWizard>>({
    situacion: "Asalariado",
    ingresos_brutos: 0,
    retenciones: 0,
    mas_de_un_pagador: false,
    segundo_pagador_importe: 0,
    tiene_capital_mobiliario: false,
    importe_capital_mobiliario: 0,
    tiene_capital_inmobiliario: false,
    importe_capital_inmobiliario: 0,
    tiene_ganancias_patrimoniales: false,
    importe_ganancias_patrimoniales: 0,
    n_hijos: 0,
    discapacidad: false,
    porcentaje_discapacidad: 0,
    edad: 0,
    comunidad: "",
    compra_vivienda: false,
    vivienda_precio: 0,
    vivienda_fecha: "",
    alquiler_pre2015: false,
    alquiler_pre2015_amount: 0,
    importe_planes: 0,
    importe_donaciones: 0,
    gasto_gimnasio: 0,
    vehiculo_electrico: false,
    vehiculo_electrico_precio: 0,
    inversion_startup: false,
    startup_inversion: 0,
    maternidad: false,
    guarderia_amount: 0,
    alquiler_amount: 0,
    nacimiento: false,
    resultado_borrador_hacienda: null,
    ...datosIniciales,
  });
  const [resultado, setResultado] = useState<any>(resultadoInicial || null);
  const [derivado, setDerivado] = useState(false);
  const [motivoDerivacion, setMotivoDerivacion] = useState("");

  const actualizarMutation = trpc.simulador.actualizarDatosWizard.useMutation({
    onSuccess: (data) => {
      setResultado(data.resultado);
      if (data.derivado) {
        setDerivado(true);
        setMotivoDerivacion(data.motivoDerivacion || "");
        setSeccionActual("resultado");
        onCompletado?.(data.resultado);
        toast.warning("¡Tu caso requiere revisión! Un asesor se pondrá en contacto contigo.");
      } else {
        setSeccionActual("resultado");
        onCompletado?.(data.resultado);
        toast.success("¡Declaración calculada! Revisa tu resultado.");
      }
    },
    onError: (err) => {
      toast.error("Error al calcular. Inténtalo de nuevo.");
      console.error(err);
    },
  });

  const handleCompletar = () => {
    const datosEnvio = {
      situacion: (datos.situacion || "Asalariado") as any,
      ingresos_brutos: datos.ingresos_brutos || 0,
      retenciones: datos.retenciones || 0,
      mas_de_un_pagador: datos.mas_de_un_pagador || false,
      segundo_pagador_importe: datos.segundo_pagador_importe || 0,
      tiene_capital_mobiliario: datos.tiene_capital_mobiliario || false,
      importe_capital_mobiliario: datos.importe_capital_mobiliario || 0,
      tiene_capital_inmobiliario: datos.tiene_capital_inmobiliario || false,
      importe_capital_inmobiliario: datos.importe_capital_inmobiliario || 0,
      tiene_ganancias_patrimoniales: datos.tiene_ganancias_patrimoniales || false,
      importe_ganancias_patrimoniales: datos.importe_ganancias_patrimoniales || 0,
      n_hijos: datos.n_hijos || 0,
      compra_vivienda: datos.compra_vivienda || false,
      vivienda_precio: datos.vivienda_precio || 0,
      vivienda_fecha: datos.vivienda_fecha || "",
      personas_a_cargo: (datos.n_hijos || 0) > 0 || datos.maternidad || false,
      comunidad: datos.comunidad || "",
      gasto_gimnasio: datos.gasto_gimnasio || 0,
      importe_donaciones: datos.importe_donaciones || 0,
      importe_planes: datos.importe_planes || 0,
      deducciones_check: [
        datos.alquiler_pre2015 ? "alquiler_pre2015" : null,
        datos.vehiculo_electrico ? "vehiculo_electrico" : null,
        datos.inversion_startup ? "inversion_startup" : null,
        (datos.gasto_gimnasio || 0) > 0 ? "cuotas_gimnasio" : null,
      ].filter(Boolean) as string[],
      autonomica_checks: {
        alquiler_pre2015_amount: datos.alquiler_pre2015_amount || 0,
        vehiculo_electrico_precio: datos.vehiculo_electrico_precio || 0,
        startup_inversion: datos.startup_inversion || 0,
        gym_amount: datos.gasto_gimnasio || 0,
        guarderia_amount: datos.guarderia_amount || 0,
        alquiler_amount: datos.alquiler_amount || 0,
        nacimiento: datos.nacimiento || false,
        maternidad_extra: datos.maternidad || false,
      },
      contribuyente: {
        edad: datos.edad || 0,
        discapacidad: datos.discapacidad || false,
        porcentaje_discapacidad: datos.porcentaje_discapacidad || 0,
      },
    };

    actualizarMutation.mutate({
      expedienteId,
      datos: datosEnvio,
      resultadoBorrador: datos.resultado_borrador_hacienda ?? undefined,
    });
  };

  if (seccionActual === "resultado" && resultado) {
    return <PantallaResultado resultado={resultado} expedienteId={expedienteId} derivado={derivado} motivoDerivacion={motivoDerivacion} />;
  }

  return (
    <div className="mb-6">
      {/* Header del wizard */}
      <div className="bg-gradient-to-r from-[#1a365d] to-[#2d5a9e] rounded-2xl p-5 mb-4 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="w-5 h-5 text-emerald-400" />
          <h2 className="font-['DM_Sans'] text-lg font-bold">Cuestionario fiscal completo</h2>
        </div>
        <p className="text-white/70 text-sm mb-4">
          Responde las preguntas para que calculemos tu declaración óptima automáticamente.
        </p>
        {/* Barra de secciones */}
        <div className="grid grid-cols-4 gap-1">
          {SECCIONES.map((s, i) => {
            const secciones = ["ingresos", "personal", "deducciones", "borrador"];
            const idx = secciones.indexOf(seccionActual);
            const completada = i < idx;
            const activa = s.id === seccionActual;
            return (
              <div key={s.id} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                activa ? "bg-white/20" : completada ? "bg-emerald-500/30" : "bg-white/5"
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  completada ? "bg-emerald-400 text-white" : activa ? "bg-white text-[#1a365d]" : "bg-white/20 text-white/40"
                }`}>
                  {completada ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={`text-[10px] font-medium text-center leading-tight ${
                  activa ? "text-white" : completada ? "text-emerald-300" : "text-white/40"
                }`}>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sección activa */}
      {seccionActual === "ingresos" && (
        <SeccionIngresos
          datos={datos}
          onChange={(k, v) => setDatos(prev => ({ ...prev, [k]: v }))}
          onSiguiente={() => setSeccionActual("personal")}
        />
      )}
      {seccionActual === "personal" && (
        <SeccionPersonal
          datos={datos}
          onChange={(k, v) => setDatos(prev => ({ ...prev, [k]: v }))}
          onAnterior={() => setSeccionActual("ingresos")}
          onSiguiente={() => setSeccionActual("deducciones")}
        />
      )}
      {seccionActual === "deducciones" && (
        <SeccionDeducciones
          datos={datos}
          onChange={(k, v) => setDatos(prev => ({ ...prev, [k]: v }))}
          onAnterior={() => setSeccionActual("personal")}
          onSiguiente={() => setSeccionActual("borrador")}
        />
      )}
      {seccionActual === "borrador" && (
        <SeccionBorrador
          datos={datos}
          onChange={(k, v) => setDatos(prev => ({ ...prev, [k]: v }))}
          onAnterior={() => setSeccionActual("deducciones")}
          onCalcular={handleCompletar}
          calculando={actualizarMutation.isPending}
        />
      )}
    </div>
  );
}

// ─── Sección 1: Ingresos ──────────────────────────────────────────────────────
function SeccionIngresos({
  datos, onChange, onSiguiente,
}: {
  datos: Partial<RespuestasWizard>;
  onChange: (k: string, v: any) => void;
  onSiguiente: () => void;
}) {
  const valido = (datos.ingresos_brutos || 0) > 0;

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Euro className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-['DM_Sans'] text-base font-bold text-[#1a365d]">Tus ingresos en 2025</h3>
            <p className="text-xs text-gray-400">Datos de tu certificado de retenciones (modelo 190)</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Tipo de contribuyente */}
          <div>
            <label className="block text-sm font-semibold text-[#1a365d] mb-2">¿Cuál es tu situación principal?</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: "Asalariado", label: "Asalariado/a", desc: "Trabajo por cuenta ajena" },
                { v: "Pensionista", label: "Pensionista", desc: "Pensión de jubilación/invalidez" },
                { v: "Desempleado", label: "Desempleado/a", desc: "Prestación por desempleo" },
                { v: "Autónomo", label: "Autónomo/a", desc: "Trabajo por cuenta propia" },
              ].map(op => (
                <button
                  key={op.v}
                  onClick={() => onChange("situacion", op.v)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    datos.situacion === op.v
                      ? "border-[#059669] bg-emerald-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className={`text-sm font-semibold ${datos.situacion === op.v ? "text-[#059669]" : "text-[#1a365d]"}`}>{op.label}</p>
                  <p className="text-xs text-gray-400">{op.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Ingresos brutos */}
          <div>
            <label className="block text-sm font-semibold text-[#1a365d] mb-1">
              Ingresos brutos totales en 2025 <span className="text-red-400">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">Casilla 003 del certificado de retenciones (salario bruto anual)</p>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={999999}
                value={datos.ingresos_brutos || ""}
                onChange={e => onChange("ingresos_brutos", parseFloat(e.target.value) || 0)}
                placeholder="Ej: 28.000"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 text-[#1a365d] font-semibold focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">€</span>
            </div>
          </div>

          {/* Retenciones */}
          <div>
            <label className="block text-sm font-semibold text-[#1a365d] mb-1">Retenciones practicadas en 2025</label>
            <p className="text-xs text-gray-400 mb-2">Casilla 596 del certificado de retenciones (lo que ya te han retenido)</p>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={999999}
                value={datos.retenciones || ""}
                onChange={e => onChange("retenciones", parseFloat(e.target.value) || 0)}
                placeholder="Ej: 4.200"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 text-[#1a365d] font-semibold focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">€</span>
            </div>
          </div>

          {/* Más de un pagador */}
          <div>
            <label className="block text-sm font-semibold text-[#1a365d] mb-2">¿Has tenido más de un pagador en 2025?</label>
            <p className="text-xs text-gray-400 mb-2">Dos empleos, empresa + prestación de desempleo, etc.</p>
            <div className="flex gap-3">
              <button
                onClick={() => onChange("mas_de_un_pagador", true)}
                className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                  datos.mas_de_un_pagador ? "border-[#059669] bg-emerald-50 text-[#059669]" : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >Sí</button>
              <button
                onClick={() => { onChange("mas_de_un_pagador", false); onChange("segundo_pagador_importe", 0); }}
                className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                  datos.mas_de_un_pagador === false ? "border-[#1a365d] bg-blue-50 text-[#1a365d]" : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >No</button>
            </div>
            {datos.mas_de_un_pagador && (
              <div className="mt-3">
                <label className="block text-xs text-gray-500 mb-1">¿Cuánto cobró el segundo pagador?</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={datos.segundo_pagador_importe || ""}
                    onChange={e => onChange("segundo_pagador_importe", parseFloat(e.target.value) || 0)}
                    placeholder="Ej: 3.000"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-[#1a365d] focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
                </div>
              </div>
            )}
          </div>

          {/* Rendimientos del capital */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-semibold text-[#1a365d] mb-3">¿Tienes otros tipos de ingresos?</p>
            <div className="space-y-3">
              {/* Capital mobiliario */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm text-[#1a365d] font-medium">Dividendos, intereses, fondos de inversión</p>
                  <p className="text-xs text-gray-400">Rendimientos del capital mobiliario</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => onChange("tiene_capital_mobiliario", true)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      datos.tiene_capital_mobiliario ? "border-[#059669] bg-emerald-50 text-[#059669]" : "border-gray-200 text-gray-400"
                    }`}
                  >Sí</button>
                  <button
                    onClick={() => { onChange("tiene_capital_mobiliario", false); onChange("importe_capital_mobiliario", 0); }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      datos.tiene_capital_mobiliario === false ? "border-gray-400 bg-gray-50 text-gray-600" : "border-gray-200 text-gray-400"
                    }`}
                  >No</button>
                </div>
              </div>
              {datos.tiene_capital_mobiliario && (
                <div className="relative ml-4">
                  <input
                    type="number"
                    min={0}
                    value={datos.importe_capital_mobiliario || ""}
                    onChange={e => onChange("importe_capital_mobiliario", parseFloat(e.target.value) || 0)}
                    placeholder="Importe total recibido"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 pr-10 text-sm text-[#1a365d] focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
                </div>
              )}

              {/* Capital inmobiliario */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm text-[#1a365d] font-medium">Alquiler de inmuebles propios</p>
                  <p className="text-xs text-gray-400">Rendimientos del capital inmobiliario</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => onChange("tiene_capital_inmobiliario", true)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      datos.tiene_capital_inmobiliario ? "border-[#059669] bg-emerald-50 text-[#059669]" : "border-gray-200 text-gray-400"
                    }`}
                  >Sí</button>
                  <button
                    onClick={() => { onChange("tiene_capital_inmobiliario", false); onChange("importe_capital_inmobiliario", 0); }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      datos.tiene_capital_inmobiliario === false ? "border-gray-400 bg-gray-50 text-gray-600" : "border-gray-200 text-gray-400"
                    }`}
                  >No</button>
                </div>
              </div>
              {datos.tiene_capital_inmobiliario && (
                <div className="relative ml-4">
                  <input
                    type="number"
                    min={0}
                    value={datos.importe_capital_inmobiliario || ""}
                    onChange={e => onChange("importe_capital_inmobiliario", parseFloat(e.target.value) || 0)}
                    placeholder="Ingresos brutos por alquiler"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 pr-10 text-sm text-[#1a365d] focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
                </div>
              )}

              {/* Ganancias patrimoniales */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm text-[#1a365d] font-medium">Venta de acciones, inmuebles o criptomonedas</p>
                  <p className="text-xs text-gray-400">Ganancias o pérdidas patrimoniales</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => onChange("tiene_ganancias_patrimoniales", true)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      datos.tiene_ganancias_patrimoniales ? "border-[#059669] bg-emerald-50 text-[#059669]" : "border-gray-200 text-gray-400"
                    }`}
                  >Sí</button>
                  <button
                    onClick={() => { onChange("tiene_ganancias_patrimoniales", false); onChange("importe_ganancias_patrimoniales", 0); }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      datos.tiene_ganancias_patrimoniales === false ? "border-gray-400 bg-gray-50 text-gray-600" : "border-gray-200 text-gray-400"
                    }`}
                  >No</button>
                </div>
              </div>
              {datos.tiene_ganancias_patrimoniales && (
                <div className="relative ml-4">
                  <input
                    type="number"
                    value={datos.importe_ganancias_patrimoniales || ""}
                    onChange={e => onChange("importe_ganancias_patrimoniales", parseFloat(e.target.value) || 0)}
                    placeholder="Ganancia/pérdida neta"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 pr-10 text-sm text-[#1a365d] focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={onSiguiente}
            disabled={!valido}
            className="bg-[#1a365d] hover:bg-[#2d5a9e] text-white gap-2 px-6"
          >
            Siguiente: Situación personal
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Sección 2: Situación personal ───────────────────────────────────────────
function SeccionPersonal({
  datos, onChange, onAnterior, onSiguiente,
}: {
  datos: Partial<RespuestasWizard>;
  onChange: (k: string, v: any) => void;
  onAnterior: () => void;
  onSiguiente: () => void;
}) {
  const valido = !!datos.comunidad;

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-['DM_Sans'] text-base font-bold text-[#1a365d]">Tu situación personal</h3>
            <p className="text-xs text-gray-400">Afecta al mínimo personal, familiar y deducciones autonómicas</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Comunidad autónoma */}
          <div>
            <label className="block text-sm font-semibold text-[#1a365d] mb-1">
              Comunidad autónoma de residencia <span className="text-red-400">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">Donde residías a 31 de diciembre de 2025</p>
            <select
              value={datos.comunidad || ""}
              onChange={e => onChange("comunidad", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[#1a365d] font-semibold focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669] bg-white"
            >
              <option value="">Selecciona tu comunidad autónoma</option>
              {COMUNIDADES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Edad */}
          <div>
            <label className="block text-sm font-semibold text-[#1a365d] mb-1">Tu edad a 31/12/2025</label>
            <input
              type="number"
              min={16}
              max={100}
              value={datos.edad || ""}
              onChange={e => onChange("edad", parseInt(e.target.value) || 0)}
              placeholder="Ej: 38"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[#1a365d] font-semibold focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669]"
            />
          </div>

          {/* Hijos */}
          <div>
            <label className="block text-sm font-semibold text-[#1a365d] mb-1">Número de hijos menores de 25 años a cargo</label>
            <p className="text-xs text-gray-400 mb-2">Conviven contigo y no tienen rentas superiores a 8.000€/año</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onChange("n_hijos", Math.max(0, (datos.n_hijos || 0) - 1))}
                className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-xl font-bold text-gray-500 hover:border-[#1a365d] hover:text-[#1a365d] transition-all"
              >−</button>
              <span className="text-2xl font-bold text-[#1a365d] w-8 text-center">{datos.n_hijos || 0}</span>
              <button
                onClick={() => onChange("n_hijos", Math.min(10, (datos.n_hijos || 0) + 1))}
                className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-xl font-bold text-gray-500 hover:border-[#059669] hover:text-[#059669] transition-all"
              >+</button>
            </div>
          </div>

          {/* Maternidad */}
          {(datos.n_hijos || 0) > 0 && (
            <div className="bg-blue-50 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-[#1a365d]">Deducciones por hijos</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#1a365d]">¿Eres madre con hijos &lt; 3 años y trabajas?</p>
                  <p className="text-xs text-gray-500">Deducción maternidad: hasta 1.200€/hijo</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onChange("maternidad", true)} className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${datos.maternidad ? "border-[#059669] bg-emerald-50 text-[#059669]" : "border-gray-200 text-gray-400"}`}>Sí</button>
                  <button onClick={() => onChange("maternidad", false)} className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${datos.maternidad === false ? "border-gray-400 bg-gray-50 text-gray-600" : "border-gray-200 text-gray-400"}`}>No</button>
                </div>
              </div>
              {datos.maternidad && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">¿Cuánto pagaste en guardería en 2025?</p>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      value={datos.guarderia_amount || ""}
                      onChange={e => onChange("guarderia_amount", parseFloat(e.target.value) || 0)}
                      placeholder="Ej: 3.600"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2 pr-10 text-sm text-[#1a365d] focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669] bg-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#1a365d]">¿Has tenido o adoptado un hijo en 2025?</p>
                  <p className="text-xs text-gray-500">Deducción autonómica por nacimiento</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onChange("nacimiento", true)} className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${datos.nacimiento ? "border-[#059669] bg-emerald-50 text-[#059669]" : "border-gray-200 text-gray-400"}`}>Sí</button>
                  <button onClick={() => onChange("nacimiento", false)} className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${datos.nacimiento === false ? "border-gray-400 bg-gray-50 text-gray-600" : "border-gray-200 text-gray-400"}`}>No</button>
                </div>
              </div>
            </div>
          )}

          {/* Discapacidad */}
          <div>
            <label className="block text-sm font-semibold text-[#1a365d] mb-2">¿Tienes reconocida una discapacidad?</label>
            <div className="flex gap-3 mb-3">
              <button
                onClick={() => onChange("discapacidad", true)}
                className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                  datos.discapacidad ? "border-[#059669] bg-emerald-50 text-[#059669]" : "border-gray-200 text-gray-500"
                }`}
              >Sí</button>
              <button
                onClick={() => { onChange("discapacidad", false); onChange("porcentaje_discapacidad", 0); }}
                className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                  datos.discapacidad === false ? "border-[#1a365d] bg-blue-50 text-[#1a365d]" : "border-gray-200 text-gray-500"
                }`}
              >No</button>
            </div>
            {datos.discapacidad && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Porcentaje de discapacidad reconocido</label>
                <div className="grid grid-cols-3 gap-2">
                  {[33, 65, 75].map(pct => (
                    <button
                      key={pct}
                      onClick={() => onChange("porcentaje_discapacidad", pct)}
                      className={`py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                        datos.porcentaje_discapacidad === pct ? "border-[#059669] bg-emerald-50 text-[#059669]" : "border-gray-200 text-gray-500"
                      }`}
                    >≥ {pct}%</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={onAnterior} className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>
          <Button
            onClick={onSiguiente}
            disabled={!valido}
            className="bg-[#1a365d] hover:bg-[#2d5a9e] text-white gap-2 px-6"
          >
            Siguiente: Deducciones
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Sección 3: Deducciones ───────────────────────────────────────────────────
function SeccionDeducciones({
  datos, onChange, onAnterior, onSiguiente,
}: {
  datos: Partial<RespuestasWizard>;
  onChange: (k: string, v: any) => void;
  onAnterior: () => void;
  onSiguiente: () => void;
}) {
  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-['DM_Sans'] text-base font-bold text-[#1a365d]">Deducciones aplicables</h3>
            <p className="text-xs text-gray-400">Marca las que te aplican — el motor fiscal calculará el ahorro exacto</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Vivienda habitual (hipoteca pre-2013) */}
          <DeduccionRow
            icono={<Home className="w-4 h-4 text-orange-500" />}
            titulo="Hipoteca vivienda habitual comprada antes del 01/01/2013"
            desc="15% de las cantidades pagadas, base máx. 9.040€ → hasta 1.356€/año"
            normativa="DT 18ª LIRPF"
            activo={datos.compra_vivienda || false}
            onToggle={(v) => { onChange("compra_vivienda", v); if (!v) { onChange("vivienda_precio", 0); onChange("vivienda_fecha", ""); } }}
          >
            {datos.compra_vivienda && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Cuotas pagadas en 2025</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={9040}
                      value={datos.vivienda_precio || ""}
                      onChange={e => onChange("vivienda_precio", parseFloat(e.target.value) || 0)}
                      placeholder="Ej: 7.200"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 pr-8 text-sm text-[#1a365d] focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669]"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Fecha de compra</label>
                  <input
                    type="date"
                    max="2012-12-31"
                    value={datos.vivienda_fecha || ""}
                    onChange={e => onChange("vivienda_fecha", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#1a365d] focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669]"
                  />
                </div>
              </div>
            )}
          </DeduccionRow>

          {/* Alquiler pre-2015 */}
          <DeduccionRow
            icono={<Building2 className="w-4 h-4 text-blue-500" />}
            titulo="Alquiler vivienda habitual con contrato anterior al 01/01/2015"
            desc="10,05% del alquiler anual pagado, base máx. 9.040€ → hasta 908€/año"
            normativa="DT 15ª LIRPF"
            activo={datos.alquiler_pre2015 || false}
            onToggle={(v) => { onChange("alquiler_pre2015", v); if (!v) onChange("alquiler_pre2015_amount", 0); }}
          >
            {datos.alquiler_pre2015 && (
              <div className="mt-2">
                <label className="block text-xs text-gray-500 mb-1">Alquiler total pagado en 2025</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={9040}
                    value={datos.alquiler_pre2015_amount || ""}
                    onChange={e => onChange("alquiler_pre2015_amount", parseFloat(e.target.value) || 0)}
                    placeholder="Ej: 7.200"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 pr-8 text-sm text-[#1a365d] focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669]"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
                </div>
              </div>
            )}
          </DeduccionRow>

          {/* Alquiler habitual (autonómica) */}
          <DeduccionRow
            icono={<Building2 className="w-4 h-4 text-indigo-500" />}
            titulo="Alquiler vivienda habitual (deducción autonómica)"
            desc="Porcentaje variable según comunidad autónoma. Aplica si eres joven o tienes renta limitada."
            normativa="Normativa autonómica"
            activo={(datos.alquiler_amount || 0) > 0}
            onToggle={(v) => { if (!v) onChange("alquiler_amount", 0); }}
          >
            <div className="mt-2">
              <label className="block text-xs text-gray-500 mb-1">Alquiler total pagado en 2025</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  value={datos.alquiler_amount || ""}
                  onChange={e => onChange("alquiler_amount", parseFloat(e.target.value) || 0)}
                  placeholder="Ej: 9.600"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 pr-8 text-sm text-[#1a365d] focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669]"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
              </div>
            </div>
          </DeduccionRow>

          {/* Plan de pensiones */}
          <DeduccionRow
            icono={<Briefcase className="w-4 h-4 text-gray-600" />}
            titulo="Aportaciones a plan de pensiones, EPSV o mutualidad"
            desc="Reducción en la base imponible. Límite: el menor de 1.500€ o el 30% de los rendimientos netos."
            normativa="Art. 51 LIRPF"
            activo={(datos.importe_planes || 0) > 0}
            onToggle={(v) => { if (!v) onChange("importe_planes", 0); }}
          >
            <div className="mt-2">
              <label className="block text-xs text-gray-500 mb-1">Total aportado en 2025</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={1500}
                  value={datos.importe_planes || ""}
                  onChange={e => onChange("importe_planes", parseFloat(e.target.value) || 0)}
                  placeholder="Ej: 1.500"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 pr-8 text-sm text-[#1a365d] focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669]"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
              </div>
            </div>
          </DeduccionRow>

          {/* Donaciones */}
          <DeduccionRow
            icono={<Heart className="w-4 h-4 text-red-500" />}
            titulo="Donativos a ONGs, fundaciones o entidades sin ánimo de lucro"
            desc="80% de los primeros 250€ y 40% del resto. Si donas a la misma entidad 3 años seguidos: 45%."
            normativa="Ley 49/2002"
            activo={(datos.importe_donaciones || 0) > 0}
            onToggle={(v) => { if (!v) onChange("importe_donaciones", 0); }}
          >
            <div className="mt-2">
              <label className="block text-xs text-gray-500 mb-1">Total donado en 2025</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  value={datos.importe_donaciones || ""}
                  onChange={e => onChange("importe_donaciones", parseFloat(e.target.value) || 0)}
                  placeholder="Ej: 300"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 pr-8 text-sm text-[#1a365d] focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669]"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
              </div>
            </div>
          </DeduccionRow>

          {/* Gimnasio */}
          <DeduccionRow
            icono={<Dumbbell className="w-4 h-4 text-emerald-600" />}
            titulo="✨ Cuotas de gimnasio, piscina municipal o actividad física (NUEVA 2025)"
            desc="15% de las cuotas pagadas. Base máxima 1.000€ → hasta 150€ de deducción."
            normativa="RDL 4/2024"
            activo={(datos.gasto_gimnasio || 0) > 0}
            onToggle={(v) => { if (!v) onChange("gasto_gimnasio", 0); }}
          >
            <div className="mt-2">
              <label className="block text-xs text-gray-500 mb-1">Total pagado en cuotas deportivas en 2025</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={1000}
                  value={datos.gasto_gimnasio || ""}
                  onChange={e => onChange("gasto_gimnasio", parseFloat(e.target.value) || 0)}
                  placeholder="Ej: 720"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 pr-8 text-sm text-[#1a365d] focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669]"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
              </div>
            </div>
          </DeduccionRow>

          {/* Vehículo eléctrico */}
          <DeduccionRow
            icono={<Car className="w-4 h-4 text-teal-600" />}
            titulo="Compra de vehículo eléctrico nuevo (30/06/2023 – 31/12/2025)"
            desc="15% del precio de compra sin IVA. Máximo 3.000€ de deducción."
            normativa="DA 58ª LIRPF (RDL 5/2023)"
            activo={datos.vehiculo_electrico || false}
            onToggle={(v) => { onChange("vehiculo_electrico", v); if (!v) onChange("vehiculo_electrico_precio", 0); }}
          >
            {datos.vehiculo_electrico && (
              <div className="mt-2">
                <label className="block text-xs text-gray-500 mb-1">Precio de compra sin IVA</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={45000}
                    value={datos.vehiculo_electrico_precio || ""}
                    onChange={e => onChange("vehiculo_electrico_precio", parseFloat(e.target.value) || 0)}
                    placeholder="Ej: 28.000"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 pr-8 text-sm text-[#1a365d] focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669]"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
                </div>
              </div>
            )}
          </DeduccionRow>

          {/* Startup */}
          <DeduccionRow
            icono={<Rocket className="w-4 h-4 text-violet-600" />}
            titulo="Inversión en empresa de nueva creación (startup, business angel)"
            desc="50% de la inversión. Base máxima 100.000€ → hasta 50.000€ de deducción."
            normativa="Art. 68.1 LIRPF (Ley 28/2022)"
            activo={datos.inversion_startup || false}
            onToggle={(v) => { onChange("inversion_startup", v); if (!v) onChange("startup_inversion", 0); }}
          >
            {datos.inversion_startup && (
              <div className="mt-2">
                <label className="block text-xs text-gray-500 mb-1">Importe total invertido en 2025</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100000}
                    value={datos.startup_inversion || ""}
                    onChange={e => onChange("startup_inversion", parseFloat(e.target.value) || 0)}
                    placeholder="Ej: 10.000"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 pr-8 text-sm text-[#1a365d] focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669]"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
                </div>
              </div>
            )}
          </DeduccionRow>
        </div>

        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={onAnterior} className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>
          <Button
            onClick={onSiguiente}
            className="bg-[#1a365d] hover:bg-[#2d5a9e] text-white gap-2 px-6"
          >
            Siguiente: Borrador Hacienda
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Sección 4: Borrador de Hacienda ─────────────────────────────────────────
function SeccionBorrador({
  datos, onChange, onAnterior, onCalcular, calculando,
}: {
  datos: Partial<RespuestasWizard>;
  onChange: (k: string, v: any) => void;
  onAnterior: () => void;
  onCalcular: () => void;
  calculando: boolean;
}) {
  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-['DM_Sans'] text-base font-bold text-[#1a365d]">Borrador de Hacienda</h3>
            <p className="text-xs text-gray-400">Opcional — para comparar con nuestra declaración optimizada</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800 mb-1">¿Cómo obtener el borrador?</p>
              <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside">
                <li>Accede a la Sede Electrónica de la AEAT (agenciatributaria.gob.es)</li>
                <li>Identifícate con Cl@ve, certificado digital o DNIe</li>
                <li>Ve a "Renta 2025 → Ver borrador / datos fiscales"</li>
                <li>Anota el resultado de la casilla 670 (resultado a ingresar o a devolver)</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-[#1a365d] mb-1">
            Resultado del borrador de Hacienda (casilla 670)
          </label>
          <p className="text-xs text-gray-400 mb-3">
            Introduce el importe exacto. Negativo si es a devolver (ej: -320), positivo si es a ingresar (ej: 450).
          </p>
          <div className="relative">
            <input
              type="number"
              value={datos.resultado_borrador_hacienda ?? ""}
              onChange={e => onChange("resultado_borrador_hacienda", e.target.value === "" ? null : parseFloat(e.target.value))}
              placeholder="Ej: -320 (a devolver) o 450 (a ingresar)"
              className="w-full border-2 border-amber-200 rounded-xl px-4 py-3 pr-10 text-[#1a365d] font-semibold focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">€</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Si no tienes el borrador todavía, puedes dejarlo en blanco y calculamos igualmente.
          </p>
        </div>

        <div className="bg-[#1a365d]/5 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-[#1a365d] mb-2">¿Qué hacemos con tus datos?</p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Calculamos tu declaración óptima con todas las deducciones aplicables</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Comparamos con el borrador de Hacienda para mostrarte cuánto ahorras</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Guardamos el resultado en tu expediente para que el asesor lo revise</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Generamos el informe con las casillas del Modelo 100</li>
          </ul>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onAnterior} className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>
          <Button
            onClick={onCalcular}
            disabled={calculando}
            className="bg-[#059669] hover:bg-[#047857] text-white gap-2 px-8 h-12 text-base font-semibold shadow-lg shadow-emerald-900/20"
          >
            {calculando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Calculando...
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4" />
                Calcular mi declaración
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Pantalla de resultado ────────────────────────────────────────────────────
function PantallaResultado({ resultado, expedienteId, derivado, motivoDerivacion }: { resultado: any; expedienteId: string; derivado?: boolean; motivoDerivacion?: string }) {
  const generarPDFMutation = trpc.simulador.generarPDF.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
      toast.success("Informe PDF generado correctamente");
    },
    onError: () => toast.error("Error al generar el PDF. Inténtalo de nuevo."),
  });

  const esDevolucion = resultado.resultado < 0;
  const ahorroVsBorrador = resultado.ahorro_vs_borrador_hacienda ?? resultado.ahorro_vs_borrador;
  const resultadoBorradorHacienda = resultado.resultado_borrador_hacienda ?? resultado.resultado_borrador;

  const fmt = (n: number) => n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtEur = (n: number) => `${fmt(Math.abs(n))} €`;

  return (
    <div className="space-y-4 mb-6">
      {/* Banner de derivación automática */}
      {derivado && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-['DM_Sans'] font-bold text-amber-900 mb-1">Tu caso ha sido asignado a un asesor especialista</h3>
              <p className="text-sm text-amber-700 leading-relaxed">
                {motivoDerivacion || "Tu declaración tiene características que requieren revisión especializada."}  Un asesor de TPymes revisará tu expediente y se pondrá en contacto contigo en las próximas 24h.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Resultado principal */}
      <div className={`rounded-2xl p-6 text-white ${esDevolucion ? "bg-gradient-to-br from-emerald-600 to-emerald-700" : "bg-gradient-to-br from-[#1a365d] to-[#2d5a9e]"}`}>
        <div className="flex items-center gap-2 mb-2">
          {esDevolucion ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
          <span className="text-sm font-medium opacity-80">Resultado de tu declaración optimizada</span>
        </div>
        <div className="text-4xl font-['DM_Sans'] font-bold mb-1">
          {esDevolucion ? "+" : "-"}{fmtEur(resultado.resultado)}
        </div>
        <p className="text-sm opacity-80">
          {esDevolucion ? "Hacienda te devuelve" : "Tienes que ingresar a Hacienda"}
        </p>

        {/* Comparación con borrador */}
        {resultadoBorradorHacienda !== 0 && ahorroVsBorrador !== 0 && (
          <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs opacity-60 mb-1">Borrador Hacienda</p>
              <p className="text-xl font-bold">
                {resultadoBorradorHacienda < 0 ? "+" : "-"}{fmtEur(resultadoBorradorHacienda)}
              </p>
            </div>
            <div>
              <p className="text-xs opacity-60 mb-1">Ahorro con nosotros</p>
              <p className="text-xl font-bold text-emerald-300">
                +{fmtEur(ahorroVsBorrador)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Desglose de deducciones */}
      {resultado.desglose_deducciones?.length > 0 && (
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <h3 className="font-['DM_Sans'] text-sm font-bold text-[#1a365d] mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Deducciones aplicadas ({resultado.desglose_deducciones.length})
            </h3>
            <div className="space-y-2">
              {resultado.desglose_deducciones.map((d: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1a365d] truncate">{d.concepto}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      d.tipo === "estatal" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                    }`}>{d.tipo === "estatal" ? "Estatal" : "Autonómica"}</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 shrink-0 ml-3">−{fmtEur(d.importe)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 font-bold">
                <span className="text-sm text-[#1a365d]">Total deducciones</span>
                <span className="text-sm text-emerald-600">−{fmtEur(resultado.total_deducciones)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Casillas del Modelo 100 */}
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-5">
          <h3 className="font-['DM_Sans'] text-sm font-bold text-[#1a365d] mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            Casillas principales del Modelo 100
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { casilla: "003", label: "Retribuciones dinerarias", valor: resultado.casillas?.["003"] },
              { casilla: "023", label: "Reducción rendimientos trabajo", valor: resultado.casillas?.["023"] },
              { casilla: "051", label: "Aportaciones planes pensiones", valor: resultado.casillas?.["051"] },
              { casilla: "435", label: "Base imponible general", valor: resultado.casillas?.["435"] },
              { casilla: "505", label: "Mínimo del contribuyente", valor: resultado.casillas?.["505"] },
              { casilla: "019", label: "Cuota íntegra estatal", valor: resultado.casillas?.["019"] },
              { casilla: "020", label: "Cuota íntegra autonómica", valor: resultado.casillas?.["020"] },
              { casilla: "595", label: "Cuota resultante", valor: resultado.casillas?.["595"] },
              { casilla: "596", label: "Retenciones trabajo", valor: resultado.casillas?.["596"] },
              { casilla: "670", label: "Resultado final", valor: resultado.casillas?.["670"] },
            ].filter(c => c.valor !== undefined && c.valor !== 0).map(c => (
              <div key={c.casilla} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <div>
                  <span className="font-mono text-gray-400 text-[10px]">[{c.casilla}]</span>
                  <p className="text-gray-600 text-[11px] leading-tight">{c.label}</p>
                </div>
                <span className={`font-bold text-xs ${c.casilla === "670" ? (resultado.resultado < 0 ? "text-emerald-600" : "text-red-600") : "text-[#1a365d]"}`}>
                  {fmt(c.valor || 0)} €
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fraccionamiento si es a ingresar */}
      {resultado.resultado > 0 && (
        <Card className="border-0 shadow-sm bg-amber-50">
          <CardContent className="p-5">
            <h3 className="font-['DM_Sans'] text-sm font-bold text-amber-800 mb-3">Opción de fraccionamiento</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">60% en junio</p>
                <p className="text-lg font-bold text-[#1a365d]">{fmtEur(resultado.casillas?.["671"] || 0)}</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">40% en noviembre</p>
                <p className="text-lg font-bold text-[#1a365d]">{fmtEur(resultado.casillas?.["672"] || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flags de complejidad */}
      {resultado.es_complejo && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-orange-800">Caso con complejidad detectada</p>
            <p className="text-xs text-orange-600 mt-1">{resultado.motivo_complejidad}</p>
            <p className="text-xs text-orange-500 mt-1">Un asesor revisará tu declaración antes de presentarla.</p>
          </div>
        </div>
      )}

      {/* Botón descargar PDF */}
      <Button
        onClick={() => generarPDFMutation.mutate({ expedienteId })}
        disabled={generarPDFMutation.isPending}
        className="w-full bg-[#1a365d] hover:bg-[#2d5a9e] text-white gap-2 h-12"
      >
        {generarPDFMutation.isPending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Generando informe...</>
        ) : (
          <><Download className="w-4 h-4" /> Descargar informe Modelo 100 (PDF)</>
        )}
      </Button>
    </div>
  );
}

// ─── Componente auxiliar: fila de deducción ───────────────────────────────────
function DeduccionRow({
  icono, titulo, desc, normativa, activo, onToggle, children,
}: {
  icono: React.ReactNode;
  titulo: string;
  desc: string;
  normativa?: string;
  activo: boolean;
  onToggle: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${activo ? "border-emerald-300 bg-emerald-50" : "border-gray-100 bg-gray-50"}`}>
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activo ? "bg-emerald-100" : "bg-white"}`}>
          {icono}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold leading-tight ${activo ? "text-[#1a365d]" : "text-gray-600"}`}>{titulo}</p>
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
          {normativa && <span className="text-[10px] text-gray-300 font-mono">{normativa}</span>}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => onToggle(true)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              activo ? "border-emerald-500 bg-emerald-500 text-white" : "border-gray-200 text-gray-400 hover:border-emerald-300"
            }`}
          >Sí</button>
          <button
            onClick={() => onToggle(false)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              !activo ? "border-gray-400 bg-gray-200 text-gray-700" : "border-gray-200 text-gray-400 hover:border-gray-300"
            }`}
          >No</button>
        </div>
      </div>
      {activo && children && (
        <div className="mt-3 ml-11">
          {children}
        </div>
      )}
    </div>
  );
}
