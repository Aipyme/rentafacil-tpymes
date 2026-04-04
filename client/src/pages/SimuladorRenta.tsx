/**
 * SimuladorRenta - Simulador completo IRPF 2025
 * Flujo: 7 secciones → Cálculo → Comparativa → Pago
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import {
  ChevronRight, ChevronLeft, Calculator, CheckCircle2,
  TrendingDown, Euro, AlertTriangle, Loader2, User,
  Home, Heart, Briefcase, MapPin, CreditCard, FileText
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ============================================================
// Tipos
// ============================================================
type Situacion = "Asalariado" | "Pensionista" | "Autónomo" | "Desempleado";

interface FormData {
  // Paso 1 - Situación laboral
  situacion?: Situacion;
  mas_de_un_pagador?: boolean;

  // Paso 2 - Ingresos
  ingresos_brutos?: number;
  retenciones?: number;
  importe_planes?: number;

  // Paso 3 - Vivienda
  compra_vivienda?: boolean;
  vivienda_fecha?: string;
  vivienda_precio?: number;
  vivienda_hipoteca?: boolean;

  // Paso 4 - Familia
  personas_a_cargo?: boolean;
  n_hijos?: number;
  discapacidad?: boolean;
  porcentaje_discapacidad?: number;

  // Paso 5 - Deducciones
  deducciones_check?: string[];
  gasto_gimnasio?: number;
  importe_donaciones?: number;

  // Paso 6 - Comunidad y autonómicas
  comunidad?: string;
  autonomica_checks?: Record<string, boolean | number | string>;

  // Paso 7 - Contacto
  nombre?: string;
  apellidos?: string;
  nif?: string;
  email?: string;
  telefono?: string;
  estado_civil?: "Soltero/a" | "Casado/a" | "Divorciado/a" | "Viudo/a" | "Pareja de hecho";
}

const COMUNIDADES = [
  "Andalucía", "Aragón", "Asturias", "Islas Baleares", "Canarias",
  "Cantabria", "Castilla y León", "Castilla-La Mancha", "Cataluña",
  "Comunitat Valenciana", "Extremadura", "Galicia", "La Rioja",
  "Madrid", "Murcia", "Navarra", "País Vasco",
];

const DEDUCCIONES_DISPONIBLES = [
  { id: "Vivienda", label: "Vivienda habitual (compra pre-2013)", icon: "🏠" },
  { id: "Alquiler", label: "Alquiler de vivienda", icon: "🔑" },
  { id: "Hijos", label: "Hijos o descendientes", icon: "👶" },
  { id: "Discapacidad", label: "Discapacidad (propia o familiar)", icon: "♿" },
  { id: "Donaciones", label: "Donativos a ONGs", icon: "❤️" },
  { id: "Planes", label: "Planes de pensiones", icon: "💰" },
  { id: "Gimnasio", label: "Gastos deportivos (Andalucía)", icon: "🏋️" },
  { id: "Guardería", label: "Guardería o educación infantil", icon: "🎒" },
];

const TOTAL_PASOS = 7;

// ============================================================
// Componente principal
// ============================================================
export default function SimuladorRenta() {
  const [paso, setPaso] = useState(1);
  const [form, setForm] = useState<FormData>({});
  const [resultado, setResultado] = useState<any>(null);
  const [precio, setPrecio] = useState<any>(null);
  const [expedienteId, setExpedienteId] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);

  const calcularMutation = trpc.simulador.calcular.useMutation();
  const guardarMutation = trpc.simulador.guardarSimulacion.useMutation();

  const progreso = Math.round((paso / (TOTAL_PASOS + 1)) * 100);

  const validarPaso = (): boolean => {
    setError(null);
    if (paso === 1 && !form.situacion) {
      setError("Por favor, selecciona tu situación laboral para continuar.");
      return false;
    }
    if (paso === 2 && (!form.ingresos_brutos || form.ingresos_brutos <= 0)) {
      setError("Por favor, introduce tus ingresos brutos anuales.");
      return false;
    }
    if (paso === 6 && !form.comunidad) {
      setError("Por favor, selecciona tu comunidad autónoma.");
      return false;
    }
    if (paso === 7) {
      if (!form.nombre?.trim()) { setError("Por favor, introduce tu nombre."); return false; }
      if (!form.nif?.trim()) { setError("Por favor, introduce tu NIF/NIE."); return false; }
      if (!form.email?.trim() || !form.email.includes("@")) { setError("Por favor, introduce un email válido."); return false; }
    }
    return true;
  };

  const update = (data: Partial<FormData>) => setForm(prev => ({ ...prev, ...data }));

  const siguiente = () => {
    if (!validarPaso()) return;
    if (paso < TOTAL_PASOS) {
      setPaso(p => p + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      handleCalcular();
    }
  };

  const anterior = () => {
    if (paso > 1) {
      setPaso(p => p - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCalcular = async () => {
    const respuestas = buildRespuestas();
    try {
      const res = await calcularMutation.mutateAsync(respuestas);
      setResultado(res.resultado);
      setPrecio(res.precio);
      setPaso(TOTAL_PASOS + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleGuardarYPagar = async () => {
    const respuestas = buildRespuestas();
    try {
      const res = await guardarMutation.mutateAsync({
        respuestas,
        emailContacto: form.email,
        telefonoContacto: form.telefono,
      });
      setExpedienteId(res.expedienteId);

      // Si es caso complejo, derivar al asesor con datos pre-rellenados
      if (resultado?.es_complejo) {
        const params = new URLSearchParams();
        params.set("expediente", res.expedienteId);
        if (resultado.motivo_complejidad) params.set("motivo", resultado.motivo_complejidad);
        if (resultado.ahorro_vs_borrador) params.set("ahorro", String(Math.abs(resultado.ahorro_vs_borrador)));
        if (precio?.precioTotal) params.set("precio", String(Math.round(precio.precioTotal / 100)));
        if (form.nombre) params.set("nombre", form.nombre);
        if (form.nif) params.set("nif", form.nif);
        if (form.email) params.set("email", form.email);
        if (form.telefono) params.set("telefono", form.telefono);
        navigate(`/asesor-fiscal?${params.toString()}`);
      } else {
        navigate(`/pago/${res.expedienteId}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const buildRespuestas = () => ({
    situacion: form.situacion || "Asalariado",
    mas_de_un_pagador: form.mas_de_un_pagador,
    compra_vivienda: form.compra_vivienda,
    personas_a_cargo: form.personas_a_cargo,
    deducciones_check: form.deducciones_check || [],
    ingresos_brutos: form.ingresos_brutos || 0,
    retenciones: form.retenciones || 0,
    vivienda_fecha: form.vivienda_fecha,
    vivienda_precio: form.vivienda_precio,
    vivienda_hipoteca: form.vivienda_hipoteca,
    n_hijos: form.n_hijos || 0,
    gasto_gimnasio: form.gasto_gimnasio,
    importe_donaciones: form.importe_donaciones,
    importe_planes: form.importe_planes,
    comunidad: form.comunidad,
    autonomica_checks: form.autonomica_checks || {},
    contribuyente: {
      nif: form.nif,
      nombre: form.nombre,
      apellidos: form.apellidos,
      discapacidad: form.discapacidad,
      porcentaje_discapacidad: form.porcentaje_discapacidad,
      estado_civil: form.estado_civil,
    },
  });

  const toggleDeduccion = (id: string) => {
    const current = form.deducciones_check || [];
    if (current.includes(id)) {
      update({ deducciones_check: current.filter(d => d !== id) });
    } else {
      update({ deducciones_check: [...current, id] });
    }
  };

  const isDeduccionChecked = (id: string) => (form.deducciones_check || []).includes(id);

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="min-h-screen flex flex-col bg-[#f7f5f2]">
      <Navbar />

      <main className="flex-1 pt-20 pb-16">
        <div className="container max-w-2xl">

          {/* Resultado */}
          {paso === TOTAL_PASOS + 1 && resultado ? (
            <ResultadoComparativa
              resultado={resultado}
              precio={precio}
              form={form}
              onPagar={handleGuardarYPagar}
              isLoading={guardarMutation.isPending}
            />
          ) : (
            <>
              {/* Header del wizard */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-[#1a365d]">
                    Paso {paso} de {TOTAL_PASOS}
                  </span>
                  <span className="text-sm text-[#059669] font-medium">{progreso}% completado</span>
                </div>
                <Progress value={progreso} className="h-2.5" />
                <div className="flex justify-between mt-2">
                  {[{i:1,l:"Situación"},{i:2,l:"Ingresos"},{i:3,l:"Vivienda"},{i:4,l:"Familia"},{i:5,l:"Deducciones"},{i:6,l:"Comunidad"},{i:7,l:"Contacto"}].map(s => (
                    <div key={s.i} className={`text-center flex-1 ${
                      s.i < paso ? "text-[#059669]" : s.i === paso ? "text-[#1a365d] font-semibold" : "text-gray-300"
                    }`}>
                      <div className={`w-5 h-5 rounded-full mx-auto mb-0.5 flex items-center justify-center text-xs font-bold ${
                        s.i < paso ? "bg-[#059669] text-white" : s.i === paso ? "bg-[#1a365d] text-white" : "bg-gray-200 text-gray-400"
                      }`}>{s.i < paso ? "✓" : s.i}</div>
                      <span className="text-[9px] hidden sm:block">{s.l}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Card className="border-0 shadow-xl shadow-gray-200/60 bg-white">
                <CardContent className="p-8">
                  {paso === 1 && <Paso1Situacion form={form} update={update} />}
                  {paso === 2 && <Paso2Ingresos form={form} update={update} />}
                  {paso === 3 && <Paso3Vivienda form={form} update={update} />}
                  {paso === 4 && <Paso4Familia form={form} update={update} />}
                  {paso === 5 && (
                    <Paso5Deducciones
                      form={form}
                      update={update}
                      toggleDeduccion={toggleDeduccion}
                      isDeduccionChecked={isDeduccionChecked}
                    />
                  )}
                  {paso === 6 && <Paso6Comunidad form={form} update={update} />}
                  {paso === 7 && <Paso7Contacto form={form} update={update} />}

                  {/* Error de validación */}
                  {error && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  {/* Navegación */}
                  <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      onClick={anterior}
                      disabled={paso === 1}
                      className="text-gray-500"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Anterior
                    </Button>
                    <Button
                      onClick={siguiente}
                      disabled={calcularMutation.isPending}
                      className="bg-[#059669] hover:bg-[#047857] text-white px-8"
                    >
                      {calcularMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      {paso === TOTAL_PASOS ? "Ver mi resultado" : "Siguiente"}
                      {paso !== TOTAL_PASOS && <ChevronRight className="w-4 h-4 ml-1" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Garantía */}
              <p className="text-center text-xs text-gray-400 mt-4">
                🔒 Simulación gratuita y sin compromiso · Tus datos están protegidos (RGPD)
              </p>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ============================================================
// PASO 1 - Situación laboral
// ============================================================
function Paso1Situacion({ form, update }: { form: FormData; update: (d: Partial<FormData>) => void }) {
  const opciones: { value: Situacion; label: string; desc: string; icon: React.ReactNode }[] = [
    { value: "Asalariado", label: "Asalariado/a", desc: "Trabajo por cuenta ajena", icon: <Briefcase className="w-5 h-5" /> },
    { value: "Pensionista", label: "Pensionista", desc: "Pensión de jubilación o invalidez", icon: <User className="w-5 h-5" /> },
    { value: "Autónomo", label: "Autónomo/a", desc: "Actividad económica propia", icon: <Calculator className="w-5 h-5" /> },
    { value: "Desempleado", label: "Desempleado/a", desc: "Prestación por desempleo", icon: <FileText className="w-5 h-5" /> },
  ];

  return (
    <div>
      <h2 className="font-['DM_Sans'] text-2xl font-bold text-[#1a365d] mb-2">
        ¿Cuál es tu situación laboral?
      </h2>
      <p className="text-gray-500 mb-6">Selecciona la opción que mejor te describe durante 2025.</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {opciones.map(op => (
          <button
            key={op.value}
            onClick={() => update({ situacion: op.value })}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              form.situacion === op.value
                ? "border-[#059669] bg-emerald-50"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <div className={`mb-2 ${form.situacion === op.value ? "text-[#059669]" : "text-gray-400"}`}>
              {op.icon}
            </div>
            <div className="font-semibold text-[#1a365d] text-sm">{op.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{op.desc}</div>
          </button>
        ))}
      </div>

      {form.situacion === "Asalariado" && (
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-sm font-medium text-[#1a365d] mb-3">¿Tuviste más de un pagador en 2025?</p>
          <div className="flex gap-3">
            {[{ v: true, l: "Sí, más de uno" }, { v: false, l: "No, solo uno" }].map(op => (
              <button
                key={String(op.v)}
                onClick={() => update({ mas_de_un_pagador: op.v })}
                className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  form.mas_de_un_pagador === op.v
                    ? "border-[#059669] bg-emerald-50 text-[#059669]"
                    : "border-gray-200 bg-white text-gray-600"
                }`}
              >
                {op.l}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PASO 2 - Ingresos
// ============================================================
function Paso2Ingresos({ form, update }: { form: FormData; update: (d: Partial<FormData>) => void }) {
  return (
    <div>
      <h2 className="font-['DM_Sans'] text-2xl font-bold text-[#1a365d] mb-2">
        Tus ingresos en 2025
      </h2>
      <p className="text-gray-500 mb-6">
        Puedes encontrar estos datos en tu certificado de retenciones o en el borrador de la AEAT.
      </p>

      <div className="space-y-5">
        <div>
          <Label className="text-sm font-semibold text-[#1a365d] mb-1.5 block">
            Ingresos brutos anuales (€)
          </Label>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="number"
              placeholder="Ej: 28.000"
              value={form.ingresos_brutos || ""}
              onChange={e => update({ ingresos_brutos: parseFloat(e.target.value) || undefined })}
              className="pl-9"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Casilla 001 del borrador de la AEAT</p>
        </div>

        <div>
          <Label className="text-sm font-semibold text-[#1a365d] mb-1.5 block">
            Retenciones practicadas (€)
          </Label>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="number"
              placeholder="Ej: 3.500"
              value={form.retenciones || ""}
              onChange={e => update({ retenciones: parseFloat(e.target.value) || undefined })}
              className="pl-9"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Lo que ya te han descontado en nómina</p>
        </div>

        <div>
          <Label className="text-sm font-semibold text-[#1a365d] mb-1.5 block">
            Aportaciones a planes de pensiones (€) <span className="text-gray-400 font-normal">(opcional)</span>
          </Label>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="number"
              placeholder="Ej: 1.200"
              value={form.importe_planes || ""}
              onChange={e => update({ importe_planes: parseFloat(e.target.value) || undefined })}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="mt-5 bg-amber-50 rounded-xl p-4 flex gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-700">
          Si no tienes los datos exactos, puedes usar valores aproximados. El resultado será orientativo.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// PASO 3 - Vivienda
// ============================================================
function Paso3Vivienda({ form, update }: { form: FormData; update: (d: Partial<FormData>) => void }) {
  return (
    <div>
      <h2 className="font-['DM_Sans'] text-2xl font-bold text-[#1a365d] mb-2">
        Vivienda habitual
      </h2>
      <p className="text-gray-500 mb-6">
        Las compras de vivienda antes de 2013 tienen una deducción especial del 15%.
      </p>

      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold text-[#1a365d] mb-3">
            ¿Compraste tu vivienda habitual antes del 1 de enero de 2013?
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { v: true, l: "Sí, antes de 2013", icon: "✅" },
              { v: false, l: "No / después de 2013", icon: "❌" },
            ].map(op => (
              <button
                key={String(op.v)}
                onClick={() => update({ compra_vivienda: op.v })}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  form.compra_vivienda === op.v
                    ? "border-[#059669] bg-emerald-50 text-[#059669]"
                    : "border-gray-200 bg-white text-gray-600"
                }`}
              >
                {op.icon} {op.l}
              </button>
            ))}
          </div>
        </div>

        {form.compra_vivienda === true && (
          <div className="bg-emerald-50 rounded-xl p-4 space-y-4">
            <div>
              <Label className="text-sm font-semibold text-[#1a365d] mb-1.5 block">
                Fecha de compra
              </Label>
              <Input
                type="date"
                value={form.vivienda_fecha || ""}
                max="2012-12-31"
                onChange={e => update({ vivienda_fecha: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-[#1a365d] mb-1.5 block">
                Importe pagado en 2025 (hipoteca + capital) (€)
              </Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="number"
                  placeholder="Ej: 9.000"
                  value={form.vivienda_precio || ""}
                  onChange={e => update({ vivienda_precio: parseFloat(e.target.value) || undefined })}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Máximo deducible: 9.040€ (deducción del 15%)</p>
            </div>
          </div>
        )}

        <div>
          <p className="text-sm font-semibold text-[#1a365d] mb-3">
            ¿Tienes vivienda en alquiler (como arrendatario)?
          </p>
          <div className="flex gap-3">
            {[{ v: true, l: "Sí, pago alquiler" }, { v: false, l: "No" }].map(op => (
              <button
                key={String(op.v)}
                onClick={() => {
                  const checks = form.autonomica_checks || {};
                  if (op.v) {
                    update({ autonomica_checks: { ...checks, alquiler: 0 } });
                    if (!(form.deducciones_check || []).includes("Alquiler")) {
                      update({ deducciones_check: [...(form.deducciones_check || []), "Alquiler"] });
                    }
                  } else {
                    const { alquiler, ...rest } = checks;
                    update({ autonomica_checks: rest });
                  }
                }}
                className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  (form.deducciones_check || []).includes("Alquiler") === op.v
                    ? "border-[#059669] bg-emerald-50 text-[#059669]"
                    : "border-gray-200 bg-white text-gray-600"
                }`}
              >
                {op.l}
              </button>
            ))}
          </div>
          {(form.deducciones_check || []).includes("Alquiler") && (
            <div className="mt-3">
              <Label className="text-sm font-semibold text-[#1a365d] mb-1.5 block">
                Alquiler anual pagado (€)
              </Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="number"
                  placeholder="Ej: 7.200"
                  value={(form.autonomica_checks?.alquiler as number) || ""}
                  onChange={e => update({
                    autonomica_checks: { ...(form.autonomica_checks || {}), alquiler: parseFloat(e.target.value) || 0 }
                  })}
                  className="pl-9"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PASO 4 - Familia
// ============================================================
function Paso4Familia({ form, update }: { form: FormData; update: (d: Partial<FormData>) => void }) {
  return (
    <div>
      <h2 className="font-['DM_Sans'] text-2xl font-bold text-[#1a365d] mb-2">
        Situación familiar
      </h2>
      <p className="text-gray-500 mb-6">
        Los hijos y situaciones de discapacidad generan importantes reducciones en la cuota.
      </p>

      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold text-[#1a365d] mb-3">
            ¿Tienes hijos o descendientes a tu cargo?
          </p>
          <div className="flex gap-3 mb-3">
            {[{ v: true, l: "Sí" }, { v: false, l: "No" }].map(op => (
              <button
                key={String(op.v)}
                onClick={() => update({ personas_a_cargo: op.v, n_hijos: op.v ? (form.n_hijos || 1) : 0 })}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                  form.personas_a_cargo === op.v
                    ? "border-[#059669] bg-emerald-50 text-[#059669]"
                    : "border-gray-200 bg-white text-gray-600"
                }`}
              >
                {op.l}
              </button>
            ))}
          </div>

          {form.personas_a_cargo && (
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm font-medium text-[#1a365d] mb-3">¿Cuántos hijos?</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => update({ n_hijos: n })}
                    className={`w-12 h-12 rounded-xl border-2 text-sm font-bold transition-all ${
                      form.n_hijos === n
                        ? "border-[#059669] bg-emerald-50 text-[#059669]"
                        : "border-gray-200 bg-white text-gray-600"
                    }`}
                  >
                    {n === 5 ? "5+" : n}
                  </button>
                ))}
              </div>
              {(form.n_hijos || 0) >= 3 && (
                <div className="mt-3 flex items-center gap-2 text-emerald-700 text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  ¡Familia numerosa! Tienes derecho a deducciones adicionales.
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-[#1a365d] mb-3">
            ¿Tú o algún familiar a tu cargo tenéis discapacidad reconocida?
          </p>
          <div className="flex gap-3 mb-3">
            {[{ v: true, l: "Sí" }, { v: false, l: "No" }].map(op => (
              <button
                key={String(op.v)}
                onClick={() => update({ discapacidad: op.v })}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                  form.discapacidad === op.v
                    ? "border-[#059669] bg-emerald-50 text-[#059669]"
                    : "border-gray-200 bg-white text-gray-600"
                }`}
              >
                {op.l}
              </button>
            ))}
          </div>

          {form.discapacidad && (
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm font-medium text-[#1a365d] mb-3">Grado de discapacidad</p>
              <div className="flex gap-3">
                {[
                  { v: 33, l: "33% - 64%" },
                  { v: 65, l: "65% o más" },
                ].map(op => (
                  <button
                    key={op.v}
                    onClick={() => update({ porcentaje_discapacidad: op.v })}
                    className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      form.porcentaje_discapacidad === op.v
                        ? "border-[#059669] bg-emerald-50 text-[#059669]"
                        : "border-gray-200 bg-white text-gray-600"
                    }`}
                  >
                    {op.l}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PASO 5 - Deducciones
// ============================================================
function Paso5Deducciones({
  form, update, toggleDeduccion, isDeduccionChecked
}: {
  form: FormData;
  update: (d: Partial<FormData>) => void;
  toggleDeduccion: (id: string) => void;
  isDeduccionChecked: (id: string) => boolean;
}) {
  return (
    <div>
      <h2 className="font-['DM_Sans'] text-2xl font-bold text-[#1a365d] mb-2">
        ¿Tienes alguna de estas deducciones?
      </h2>
      <p className="text-gray-500 mb-6">
        Selecciona todas las que apliquen. Cada una puede reducir lo que pagas a Hacienda.
      </p>

      <div className="space-y-2 mb-6">
        {DEDUCCIONES_DISPONIBLES.map(ded => (
          <button
            key={ded.id}
            onClick={() => toggleDeduccion(ded.id)}
            className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
              isDeduccionChecked(ded.id)
                ? "border-[#059669] bg-emerald-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <span className="text-xl">{ded.icon}</span>
            <span className={`text-sm font-medium ${isDeduccionChecked(ded.id) ? "text-[#059669]" : "text-gray-700"}`}>
              {ded.label}
            </span>
            {isDeduccionChecked(ded.id) && (
              <CheckCircle2 className="w-4 h-4 text-[#059669] ml-auto" />
            )}
          </button>
        ))}
      </div>

      {/* Campos adicionales según selección */}
      {isDeduccionChecked("Donaciones") && (
        <div className="bg-blue-50 rounded-xl p-4 mb-3">
          <Label className="text-sm font-semibold text-[#1a365d] mb-1.5 block">
            Importe total de donativos en 2025 (€)
          </Label>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="number"
              placeholder="Ej: 300"
              value={form.importe_donaciones || ""}
              onChange={e => update({ importe_donaciones: parseFloat(e.target.value) || undefined })}
              className="pl-9 bg-white"
            />
          </div>
        </div>
      )}

      {isDeduccionChecked("Gimnasio") && (
        <div className="bg-blue-50 rounded-xl p-4 mb-3">
          <Label className="text-sm font-semibold text-[#1a365d] mb-1.5 block">
            Gasto anual en gimnasio / actividades deportivas (€)
          </Label>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="number"
              placeholder="Ej: 600"
              value={form.gasto_gimnasio || ""}
              onChange={e => update({ gasto_gimnasio: parseFloat(e.target.value) || undefined })}
              className="pl-9 bg-white"
            />
          </div>
        </div>
      )}

      {isDeduccionChecked("Guardería") && (
        <div className="bg-blue-50 rounded-xl p-4 mb-3">
          <Label className="text-sm font-semibold text-[#1a365d] mb-1.5 block">
            Gasto anual en guardería (€)
          </Label>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="number"
              placeholder="Ej: 3.600"
              value={(form.autonomica_checks?.guarderia_amount as number) || ""}
              onChange={e => update({
                autonomica_checks: { ...(form.autonomica_checks || {}), guarderia_amount: parseFloat(e.target.value) || 0 }
              })}
              className="pl-9 bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PASO 6 - Comunidad autónoma
// ============================================================
function Paso6Comunidad({ form, update }: { form: FormData; update: (d: Partial<FormData>) => void }) {
  return (
    <div>
      <h2 className="font-['DM_Sans'] text-2xl font-bold text-[#1a365d] mb-2">
        Comunidad autónoma de residencia
      </h2>
      <p className="text-gray-500 mb-6">
        Cada comunidad tiene deducciones propias. Selecciona donde residías el 31 de diciembre de 2025.
      </p>

      <div className="grid grid-cols-2 gap-2 mb-6">
        {COMUNIDADES.map(com => (
          <button
            key={com}
            onClick={() => update({ comunidad: com })}
            className={`p-3 rounded-xl border-2 text-sm font-medium text-left transition-all ${
              form.comunidad === com
                ? "border-[#059669] bg-emerald-50 text-[#059669]"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            }`}
          >
            {form.comunidad === com && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5" />}
            {com}
          </button>
        ))}
      </div>

      {form.comunidad && (
        <div className="bg-emerald-50 rounded-xl p-4 flex gap-3">
          <MapPin className="w-4 h-4 text-[#059669] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#1a365d]">{form.comunidad}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Aplicaremos las deducciones autonómicas específicas de tu comunidad.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PASO 7 - Contacto
// ============================================================
function Paso7Contacto({ form, update }: { form: FormData; update: (d: Partial<FormData>) => void }) {
  return (
    <div>
      <h2 className="font-['DM_Sans'] text-2xl font-bold text-[#1a365d] mb-2">
        Tus datos de contacto
      </h2>
      <p className="text-gray-500 mb-6">
        Para enviarte tu informe personalizado y el resultado de tu declaración.
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-semibold text-[#1a365d] mb-1.5 block">Nombre</Label>
            <Input
              placeholder="Ana"
              value={form.nombre || ""}
              onChange={e => update({ nombre: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-sm font-semibold text-[#1a365d] mb-1.5 block">Apellidos</Label>
            <Input
              placeholder="García López"
              value={form.apellidos || ""}
              onChange={e => update({ apellidos: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label className="text-sm font-semibold text-[#1a365d] mb-1.5 block">NIF / NIE</Label>
          <Input
            placeholder="12345678A"
            value={form.nif || ""}
            onChange={e => update({ nif: e.target.value.toUpperCase() })}
          />
        </div>

        <div>
          <Label className="text-sm font-semibold text-[#1a365d] mb-1.5 block">Email</Label>
          <Input
            type="email"
            placeholder="ana@ejemplo.com"
            value={form.email || ""}
            onChange={e => update({ email: e.target.value })}
          />
        </div>

        <div>
          <Label className="text-sm font-semibold text-[#1a365d] mb-1.5 block">Teléfono</Label>
          <Input
            type="tel"
            placeholder="600 000 000"
            value={form.telefono || ""}
            onChange={e => update({ telefono: e.target.value })}
          />
        </div>

        <div>
          <Label className="text-sm font-semibold text-[#1a365d] mb-1.5 block">Estado civil</Label>
          <select
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            value={form.estado_civil || ""}
            onChange={e => update({ estado_civil: e.target.value as FormData["estado_civil"] })}
          >
            <option value="">Selecciona tu estado civil</option>
            <option value="Soltero/a">Soltero/a</option>
            <option value="Casado/a">Casado/a</option>
            <option value="Divorciado/a">Divorciado/a</option>
            <option value="Viudo/a">Viudo/a</option>
            <option value="Pareja de hecho">Pareja de hecho</option>
          </select>
        </div>
      </div>

      <div className="mt-5 bg-gray-50 rounded-xl p-4">
        <p className="text-xs text-gray-500">
          🔒 Tus datos están protegidos según el RGPD. No los compartiremos con terceros ni los usaremos para publicidad.
          Al continuar, aceptas nuestra{" "}
          <Link href="/privacidad" className="text-[#059669] underline">política de privacidad</Link>.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// RESULTADO - Comparativa
// ============================================================
function ResultadoComparativa({
  resultado,
  precio,
  form,
  onPagar,
  isLoading,
}: {
  resultado: any;
  precio: any;
  form: FormData;
  onPagar: () => void;
  isLoading: boolean;
}) {
  const resultadoBorrador = resultado.resultado_borrador;
  const resultadoNuestro = resultado.resultado;
  const ahorro = resultado.ahorro_vs_borrador;
  const esComplejo = resultado.es_complejo;

  const formatEuro = (n: number) => {
    const abs = Math.abs(n);
    const sign = n < 0 ? "-" : "+";
    return `${sign}${abs.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  };

  const colorResultado = (n: number) => n < 0 ? "text-emerald-600" : "text-red-500";
  const labelResultado = (n: number) => n < 0 ? "A DEVOLVER" : "A PAGAR";

  const precioEuros = (precio.precioTotal / 100).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-100 rounded-full px-4 py-1.5 mb-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-700">Simulación completada</span>
        </div>
        <h2 className="font-['DM_Sans'] text-3xl font-bold text-[#1a365d] mb-2">
          Tu resultado estimado
        </h2>
        <p className="text-gray-500">
          Hola {form.nombre || ""}. Esto es lo que hemos calculado para tu declaración 2025.
        </p>
      </div>

      {/* Comparativa principal */}
      <div className="grid grid-cols-2 gap-4">
        {/* Borrador AEAT */}
        <Card className="border-2 border-gray-200 bg-gray-50">
          <CardContent className="p-5 text-center">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Tu borrador AEAT
            </p>
            <p className={`font-['DM_Sans'] text-2xl font-bold ${colorResultado(resultadoBorrador)}`}>
              {formatEuro(resultadoBorrador)}
            </p>
            <p className={`text-xs font-semibold mt-1 ${colorResultado(resultadoBorrador)}`}>
              {labelResultado(resultadoBorrador)}
            </p>
            <p className="text-xs text-gray-400 mt-2">Sin optimizar</p>
          </CardContent>
        </Card>

        {/* Con nosotros */}
        <Card className="border-2 border-[#059669] bg-emerald-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-[#059669] text-white text-xs font-bold px-2 py-0.5 rounded-bl-lg">
            OPTIMIZADO
          </div>
          <CardContent className="p-5 text-center">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">
              Con Renta Fácil
            </p>
            <p className={`font-['DM_Sans'] text-2xl font-bold ${colorResultado(resultadoNuestro)}`}>
              {formatEuro(resultadoNuestro)}
            </p>
            <p className={`text-xs font-semibold mt-1 ${colorResultado(resultadoNuestro)}`}>
              {labelResultado(resultadoNuestro)}
            </p>
            <p className="text-xs text-emerald-600 mt-2 font-medium">Con todas tus deducciones</p>
          </CardContent>
        </Card>
      </div>

      {/* Ahorro */}
      {ahorro > 0 && (
        <div className="bg-emerald-600 rounded-2xl p-5 text-white text-center">
          <TrendingDown className="w-6 h-6 mx-auto mb-2 opacity-80" />
          <p className="text-sm opacity-80 mb-1">Te ahorramos</p>
          <p className="font-['DM_Sans'] text-4xl font-bold">
            {ahorro.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
          </p>
          <p className="text-sm opacity-70 mt-1">respecto al borrador de Hacienda</p>
        </div>
      )}

      {/* Desglose deducciones */}
      {resultado.desglose_deducciones?.length > 0 && (
        <div>
          <h3 className="font-semibold text-[#1a365d] mb-3 text-sm">Deducciones aplicadas:</h3>
          <div className="space-y-2">
            {resultado.desglose_deducciones.map((d: any, i: number) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">{d.concepto}</span>
                <span className="text-sm font-semibold text-emerald-600">
                  -{d.importe.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Caso complejo */}
      {esComplejo && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Tu caso requiere revisión especializada</p>
            <p className="text-xs text-amber-600 mt-1">{resultado.motivo_complejidad}</p>
          </div>
        </div>
      )}

      {/* CTA de pago */}
      <Card className="border-2 border-[#1a365d] bg-[#1a365d] text-white">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="font-['DM_Sans'] text-lg font-bold">Gestiona tu declaración</p>
              <p className="text-white/70 text-sm mt-1">
                Presentamos tu renta con todas las deducciones aplicadas
              </p>
            </div>
            <div className="text-right">
              <p className="font-['DM_Sans'] text-2xl font-bold">{precioEuros} €</p>
              {precio.suplementos?.length > 0 && (
                <p className="text-white/50 text-xs">Base + suplementos</p>
              )}
            </div>
          </div>

          {precio.suplementos?.length > 0 && (
            <div className="mb-4 space-y-1">
              <div className="flex justify-between text-xs text-white/60">
                <span>Precio base</span>
                <span>{(precio.precioBase / 100).toFixed(2)} €</span>
              </div>
              {precio.suplementos.map((s: any, i: number) => (
                <div key={i} className="flex justify-between text-xs text-white/60">
                  <span>{s.descripcion}</span>
                  <span>+{(s.importe / 100).toFixed(2)} €</span>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={onPagar}
            disabled={isLoading}
            className="w-full bg-[#059669] hover:bg-[#047857] text-white font-semibold h-12 text-base"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4 mr-2" />
            )}
            Pagar y gestionar mi declaración
          </Button>

          <div className="flex justify-center gap-4 mt-3">
            <span className="text-white/40 text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Google Pay
            </span>
            <span className="text-white/40 text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Apple Pay
            </span>
            <span className="text-white/40 text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Tarjeta
            </span>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-gray-400">
        * Resultado orientativo. El cálculo exacto puede variar según tu situación fiscal completa.
      </p>
    </div>
  );
}
