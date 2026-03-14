import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  User,
  Briefcase,
  Home,
  TrendingUp,
  Send,
  Shield,
  Clock,
  Star,
  ChevronRight,
  Building2,
  FileText,
  AlertCircle,
  Info,
} from "lucide-react";

/* ─── Types ─── */
type WorkSituation =
  | "empleado_1pagador"
  | "empleado_2pagadores"
  | "autonomo"
  | "pension"
  | "desempleo"
  | "otros";

type RentalSituation = "no" | "arrendador" | "arrendatario" | "ambos";
type InvestmentSituation = "no" | "bolsa" | "fondos" | "crypto" | "varios";

interface FormData {
  // Step 1: Personal
  nombre: string;
  email: string;
  telefono: string;
  estado_civil: "soltero" | "casado" | "divorciado" | "viudo" | "";
  hijos: "0" | "1" | "2" | "3+" | "";

  // Step 2: Situación laboral
  situacion_laboral: WorkSituation | "";
  ingresos_brutos: string;
  segundo_pagador: boolean;
  segundo_pagador_importe: string;

  // Step 3: Inmuebles
  vivienda_habitual: "propietario" | "alquiler" | "familiar" | "";
  situacion_alquiler: RentalSituation;
  hipoteca_pre2013: boolean;

  // Step 4: Inversiones y otros
  situacion_inversiones: InvestmentSituation;
  donaciones: boolean;
  discapacidad: boolean;
  declaracion_conjunta: boolean;

  // Step 5: Confirmation
  acepta_condiciones: boolean;
  acepta_comunicaciones: boolean;
}

const INITIAL_FORM: FormData = {
  nombre: "",
  email: "",
  telefono: "",
  estado_civil: "",
  hijos: "",
  situacion_laboral: "",
  ingresos_brutos: "",
  segundo_pagador: false,
  segundo_pagador_importe: "",
  vivienda_habitual: "",
  situacion_alquiler: "no",
  hipoteca_pre2013: false,
  situacion_inversiones: "no",
  donaciones: false,
  discapacidad: false,
  declaracion_conjunta: false,
  acepta_condiciones: false,
  acepta_comunicaciones: false,
};

/* ─── Estimate Calculator ─── */
function calculateEstimate(data: FormData): number {
  let base = 800;

  if (data.situacion_laboral === "autonomo") base += 400;
  if (data.situacion_laboral === "empleado_1pagador") base += 200;
  if (data.hipoteca_pre2013) base += 300;
  if (data.donaciones) base += 150;
  if (data.discapacidad) base += 500;
  if (data.situacion_alquiler === "arrendatario") base += 250;
  if (data.situacion_inversiones !== "no") base += 200;
  if (data.hijos === "1") base += 100;
  if (data.hijos === "2") base += 200;
  if (data.hijos === "3+") base += 350;

  return base;
}

/* ─── Complexity Detector ─── */
function detectComplexity(data: FormData): "simple" | "estandar" | "premium" {
  let score = 0;
  if (data.situacion_laboral === "autonomo") score += 3;
  if (data.segundo_pagador) score += 1;
  if (data.situacion_alquiler !== "no") score += 2;
  if (data.hipoteca_pre2013) score += 1;
  if (data.situacion_inversiones !== "no") score += 2;
  if (data.declaracion_conjunta) score += 1;
  if (data.discapacidad) score += 1;

  if (score >= 5) return "premium";
  if (score >= 2) return "estandar";
  return "simple";
}

/* ─── Step Indicator ─── */
function StepIndicator({
  current,
  total,
  labels,
}: {
  current: number;
  total: number;
  labels: string[];
}) {
  return (
    <div className="w-full">
      <Progress value={(current / total) * 100} className="h-1.5 mb-4" />
      <div className="flex justify-between">
        {labels.map((label, i) => (
          <div
            key={i}
            className={`flex flex-col items-center gap-1 text-xs transition-colors ${
              i + 1 < current
                ? "text-[hsl(160,100%,33%)]"
                : i + 1 === current
                ? "text-foreground font-semibold"
                : "text-muted-foreground"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                i + 1 < current
                  ? "bg-[hsl(160,100%,33%)] border-[hsl(160,100%,33%)] text-white"
                  : i + 1 === current
                  ? "border-[hsl(215,55%,25%)] text-[hsl(215,55%,25%)]"
                  : "border-border text-muted-foreground"
              }`}
            >
              {i + 1 < current ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className="hidden sm:block">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Option Card ─── */
function OptionCard({
  selected,
  onClick,
  icon: Icon,
  label,
  desc,
  testId,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  desc?: string;
  testId?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={`w-full text-left rounded-xl border-2 p-4 transition-all hover:border-[hsl(215,55%,35%)] ${
        selected
          ? "border-[hsl(160,100%,33%)] bg-[hsl(160,100%,33%)]/5 shadow-sm"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            selected
              ? "bg-[hsl(160,100%,33%)]/15 text-[hsl(160,100%,33%)]"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium text-sm">{label}</p>
          {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
        </div>
        {selected && (
          <CheckCircle2 className="ml-auto h-5 w-5 text-[hsl(160,100%,33%)] flex-shrink-0" />
        )}
      </div>
    </button>
  );
}

/* ─── Text Input ─── */
function TextInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  testId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  testId?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-testid={testId}
        className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(215,55%,35%)] focus:border-transparent transition-all"
      />
    </div>
  );
}

/* ─── Toggle Checkbox ─── */
function ToggleCheck({
  label,
  desc,
  checked,
  onChange,
  testId,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  testId?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      data-testid={testId}
      className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
        checked
          ? "border-[hsl(160,100%,33%)] bg-[hsl(160,100%,33%)]/5"
          : "border-border bg-card hover:border-muted-foreground/40"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
            checked
              ? "bg-[hsl(160,100%,33%)] border-[hsl(160,100%,33%)]"
              : "border-muted-foreground"
          }`}
        >
          {checked && <CheckCircle2 className="h-3 w-3 text-white" />}
        </div>
        <div>
          <p className="font-medium text-sm">{label}</p>
          {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
        </div>
      </div>
    </button>
  );
}

/* ─── STEP 1: Personal Data ─── */
function Step1Personal({
  data,
  setData,
}: {
  data: FormData;
  setData: (d: Partial<FormData>) => void;
}) {
  const civilOptions = [
    { value: "soltero", label: "Soltero/a" },
    { value: "casado", label: "Casado/a" },
    { value: "divorciado", label: "Divorciado/a" },
    { value: "viudo", label: "Viudo/a" },
  ];

  const hijoOptions = [
    { value: "0", label: "Sin hijos" },
    { value: "1", label: "1 hijo" },
    { value: "2", label: "2 hijos" },
    { value: "3+", label: "3 o más" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold mb-1" data-testid="text-step1-title">Datos personales</h2>
        <p className="text-sm text-muted-foreground">Necesitamos algunos datos básicos para personalizar tu simulación.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <TextInput
          label="Nombre completo"
          value={data.nombre}
          onChange={(v) => setData({ nombre: v })}
          placeholder="Tu nombre"
          required
          testId="input-nombre"
        />
        <TextInput
          label="Email"
          value={data.email}
          onChange={(v) => setData({ email: v })}
          type="email"
          placeholder="tu@email.com"
          required
          testId="input-email"
        />
      </div>

      <TextInput
        label="Teléfono"
        value={data.telefono}
        onChange={(v) => setData({ telefono: v })}
        type="tel"
        placeholder="+34 600 000 000"
        testId="input-telefono"
      />

      <div>
        <label className="block text-sm font-medium mb-2">Estado civil</label>
        <div className="grid grid-cols-2 gap-2">
          {civilOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setData({ estado_civil: opt.value as FormData["estado_civil"] })}
              data-testid={`option-estado-civil-${opt.value}`}
              className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                data.estado_civil === opt.value
                  ? "border-[hsl(160,100%,33%)] bg-[hsl(160,100%,33%)]/8 text-[hsl(160,100%,33%)]"
                  : "border-border hover:border-muted-foreground/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Hijos a cargo</label>
        <div className="grid grid-cols-4 gap-2">
          {hijoOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setData({ hijos: opt.value as FormData["hijos"] })}
              data-testid={`option-hijos-${opt.value}`}
              className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                data.hijos === opt.value
                  ? "border-[hsl(160,100%,33%)] bg-[hsl(160,100%,33%)]/8 text-[hsl(160,100%,33%)]"
                  : "border-border hover:border-muted-foreground/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── STEP 2: Work Situation ─── */
function Step2Laboral({
  data,
  setData,
}: {
  data: FormData;
  setData: (d: Partial<FormData>) => void;
}) {
  const workOptions: {
    value: WorkSituation;
    icon: React.ElementType;
    label: string;
    desc: string;
  }[] = [
    {
      value: "empleado_1pagador",
      icon: Briefcase,
      label: "Empleado — 1 pagador",
      desc: "Trabajo por cuenta ajena, un solo empleador",
    },
    {
      value: "empleado_2pagadores",
      icon: Building2,
      label: "Empleado — 2+ pagadores",
      desc: "Varios empleadores durante el año",
    },
    {
      value: "autonomo",
      icon: Star,
      label: "Autónomo / Empresario",
      desc: "Actividad económica por cuenta propia",
    },
    {
      value: "pension",
      icon: Shield,
      label: "Pensionista / Jubilado",
      desc: "Pensión de jubilación, incapacidad u orfandad",
    },
    {
      value: "desempleo",
      icon: Clock,
      label: "Desempleo",
      desc: "Prestación por desempleo SEPE",
    },
    {
      value: "otros",
      icon: FileText,
      label: "Otros ingresos",
      desc: "Beca, práctica, herencia u otros",
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold mb-1" data-testid="text-step2-title">Situación laboral</h2>
        <p className="text-sm text-muted-foreground">¿Cuál es tu principal fuente de ingresos en 2025?</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {workOptions.map((opt) => (
          <OptionCard
            key={opt.value}
            selected={data.situacion_laboral === opt.value}
            onClick={() => setData({ situacion_laboral: opt.value })}
            icon={opt.icon}
            label={opt.label}
            desc={opt.desc}
            testId={`option-laboral-${opt.value}`}
          />
        ))}
      </div>

      <TextInput
        label="Ingresos brutos anuales estimados (€)"
        value={data.ingresos_brutos}
        onChange={(v) => setData({ ingresos_brutos: v })}
        type="number"
        placeholder="Ej: 28000"
        testId="input-ingresos-brutos"
      />

      {(data.situacion_laboral === "empleado_1pagador" ||
        data.situacion_laboral === "empleado_2pagadores") && (
        <div className="space-y-3">
          <ToggleCheck
            label="Tengo un segundo pagador"
            desc="Si cobraste de más de una empresa o tuviste subsidio de paro"
            checked={data.segundo_pagador}
            onChange={(v) => setData({ segundo_pagador: v })}
            testId="toggle-segundo-pagador"
          />
          {data.segundo_pagador && (
            <TextInput
              label="Importe del segundo pagador (€)"
              value={data.segundo_pagador_importe}
              onChange={(v) => setData({ segundo_pagador_importe: v })}
              type="number"
              placeholder="Ej: 3500"
              testId="input-segundo-pagador-importe"
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ─── STEP 3: Real Estate ─── */
function Step3Inmuebles({
  data,
  setData,
}: {
  data: FormData;
  setData: (d: Partial<FormData>) => void;
}) {
  const viviendaOptions: {
    value: FormData["vivienda_habitual"];
    icon: React.ElementType;
    label: string;
    desc: string;
  }[] = [
    {
      value: "propietario",
      icon: Home,
      label: "Propietario",
      desc: "Vivo en una vivienda de mi propiedad",
    },
    {
      value: "alquiler",
      icon: Building2,
      label: "En alquiler",
      desc: "Pago alquiler por mi vivienda habitual",
    },
    {
      value: "familiar",
      icon: User,
      label: "Vivienda familiar",
      desc: "Vivo con familia o en cesión de uso",
    },
  ];

  const alquilerOptions: {
    value: RentalSituation;
    label: string;
    desc: string;
  }[] = [
    { value: "no", label: "No tengo inmuebles en alquiler", desc: "" },
    {
      value: "arrendador",
      label: "Alquilo inmuebles (arrendador)",
      desc: "Cobro rentas de alquiler",
    },
    {
      value: "arrendatario",
      label: "Solo soy inquilino",
      desc: "Pago alquiler y puedo deducir",
    },
    {
      value: "ambos",
      label: "Arrendador e inquilino",
      desc: "Ambas situaciones",
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold mb-1" data-testid="text-step3-title">Vivienda e inmuebles</h2>
        <p className="text-sm text-muted-foreground">La vivienda tiene un gran impacto en tu declaración.</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">¿Cuál es tu situación de vivienda habitual?</label>
        <div className="space-y-2">
          {viviendaOptions.map((opt) => (
            <OptionCard
              key={opt.value}
              selected={data.vivienda_habitual === opt.value}
              onClick={() => setData({ vivienda_habitual: opt.value })}
              icon={opt.icon}
              label={opt.label}
              desc={opt.desc}
              testId={`option-vivienda-${opt.value}`}
            />
          ))}
        </div>
      </div>

      <ToggleCheck
        label="Tengo hipoteca anterior a 2013"
        desc="Puedes deducirte hasta el 15% de lo pagado (hasta 9.040€/año)"
        checked={data.hipoteca_pre2013}
        onChange={(v) => setData({ hipoteca_pre2013: v })}
        testId="toggle-hipoteca-pre2013"
      />

      <div>
        <label className="block text-sm font-medium mb-2">¿Tienes inmuebles en alquiler?</label>
        <div className="space-y-2">
          {alquilerOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setData({ situacion_alquiler: opt.value })}
              data-testid={`option-alquiler-${opt.value}`}
              className={`w-full text-left rounded-lg border-2 px-4 py-3 text-sm transition-all ${
                data.situacion_alquiler === opt.value
                  ? "border-[hsl(160,100%,33%)] bg-[hsl(160,100%,33%)]/5"
                  : "border-border hover:border-muted-foreground/50"
              }`}
            >
              <span className="font-medium">{opt.label}</span>
              {opt.desc && (
                <span className="text-muted-foreground ml-2">— {opt.desc}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── STEP 4: Investments & Others ─── */
function Step4Inversiones({
  data,
  setData,
}: {
  data: FormData;
  setData: (d: Partial<FormData>) => void;
}) {
  const inversionOptions: {
    value: InvestmentSituation;
    label: string;
    desc: string;
  }[] = [
    { value: "no", label: "No tengo inversiones", desc: "" },
    { value: "bolsa", label: "Acciones / Bolsa", desc: "Compraventa de acciones" },
    { value: "fondos", label: "Fondos de inversión", desc: "FI, ETFs o similares" },
    { value: "crypto", label: "Criptomonedas", desc: "Bitcoin, Ethereum u otras" },
    { value: "varios", label: "Varios tipos", desc: "Combinación de inversiones" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold mb-1" data-testid="text-step4-title">Inversiones y deducciones</h2>
        <p className="text-sm text-muted-foreground">Aquí están las deducciones que más impacto tienen en tu resultado.</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">¿Tienes inversiones o ganancias/pérdidas patrimoniales?</label>
        <div className="space-y-2">
          {inversionOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setData({ situacion_inversiones: opt.value })}
              data-testid={`option-inversiones-${opt.value}`}
              className={`w-full text-left rounded-lg border-2 px-4 py-3 text-sm transition-all ${
                data.situacion_inversiones === opt.value
                  ? "border-[hsl(160,100%,33%)] bg-[hsl(160,100%,33%)]/5"
                  : "border-border hover:border-muted-foreground/50"
              }`}
            >
              <span className="font-medium">{opt.label}</span>
              {opt.desc && (
                <span className="text-muted-foreground ml-2">— {opt.desc}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Otras deducciones</p>
        <ToggleCheck
          label="Hice donaciones a ONGs o entidades"
          desc="Deducción del 35-80% de lo donado según entidad"
          checked={data.donaciones}
          onChange={(v) => setData({ donaciones: v })}
          testId="toggle-donaciones"
        />
        <ToggleCheck
          label="Tengo discapacidad reconocida (≥33%)"
          desc="Reducción fiscal significativa en la base imponible"
          checked={data.discapacidad}
          onChange={(v) => setData({ discapacidad: v })}
          testId="toggle-discapacidad"
        />
        <ToggleCheck
          label="Quiero estudiar la declaración conjunta"
          desc="Si estás casado/a, puede ser más beneficiosa"
          checked={data.declaracion_conjunta}
          onChange={(v) => setData({ declaracion_conjunta: v })}
          testId="toggle-declaracion-conjunta"
        />
      </div>
    </div>
  );
}

/* ─── STEP 5: Summary & Confirmation ─── */
function Step5Confirmacion({
  data,
  setData,
}: {
  data: FormData;
  setData: (d: Partial<FormData>) => void;
}) {
  const estimate = calculateEstimate(data);
  const complexity = detectComplexity(data);

  const complexityConfig = {
    simple: {
      label: "Renta Simple",
      price: "49€",
      color: "text-[hsl(160,100%,33%)]",
      bg: "bg-[hsl(160,100%,33%)]/10",
      border: "border-[hsl(160,100%,33%)]/20",
    },
    estandar: {
      label: "Renta Estándar",
      price: "69€",
      color: "text-[hsl(215,55%,35%)]",
      bg: "bg-[hsl(215,55%,35%)]/10",
      border: "border-[hsl(215,55%,35%)]/20",
    },
    premium: {
      label: "Renta Premium",
      price: "99€",
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
  };

  const cfg = complexityConfig[complexity];

  const SummaryRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold mb-1" data-testid="text-step5-title">Tu simulación</h2>
        <p className="text-sm text-muted-foreground">Revisa el resumen y envía tu solicitud.</p>
      </div>

      {/* Estimate Card */}
      <div className="rounded-2xl bg-gradient-to-br from-[hsl(215,55%,18%)] to-[hsl(215,50%,24%)] p-6 text-white text-center">
        <p className="text-white/70 text-sm mb-1">Devolución estimada</p>
        <p className="text-5xl font-bold text-[hsl(160,100%,40%)] mb-1" data-testid="text-estimate-result">
          {estimate.toLocaleString("es-ES")}€
        </p>
        <p className="text-white/50 text-xs">Estimación orientativa basada en tus respuestas</p>
      </div>

      {/* Recommended Plan */}
      <div className={`rounded-xl border-2 ${cfg.border} ${cfg.bg} p-4`} data-testid="card-recommended-plan">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Plan recomendado</p>
            <p className={`text-lg font-bold ${cfg.color}`}>{cfg.label}</p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${cfg.color}`}>{cfg.price}</p>
            <p className="text-xs text-muted-foreground">/declaración</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <Card className="border-border/60">
        <CardContent className="pt-5 pb-5 px-5">
          <p className="text-sm font-semibold mb-3">Resumen de tu caso</p>
          <SummaryRow label="Nombre" value={data.nombre || "—"} />
          <SummaryRow label="Email" value={data.email || "—"} />
          <SummaryRow
            label="Situación laboral"
            value={data.situacion_laboral || "—"}
          />
          <SummaryRow
            label="Vivienda"
            value={data.vivienda_habitual || "—"}
          />
          <SummaryRow
            label="Inversiones"
            value={data.situacion_inversiones}
          />
          <SummaryRow
            label="Hijos a cargo"
            value={data.hijos || "0"}
          />
        </CardContent>
      </Card>

      {/* Legal */}
      <div className="space-y-3">
        <ToggleCheck
          label="Acepto los Términos y Condiciones y la Política de Privacidad *"
          checked={data.acepta_condiciones}
          onChange={(v) => setData({ acepta_condiciones: v })}
          testId="toggle-acepta-condiciones"
        />
        <ToggleCheck
          label="Acepto recibir comunicaciones comerciales"
          desc="Puedes cancelar en cualquier momento"
          checked={data.acepta_comunicaciones}
          onChange={(v) => setData({ acepta_comunicaciones: v })}
          testId="toggle-acepta-comunicaciones"
        />
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2.5">
        <Shield className="h-4 w-4 flex-shrink-0" />
        <span>Tus datos están protegidos con cifrado bancario y cumplimiento RGPD.</span>
      </div>
    </div>
  );
}

/* ─── Success State ─── */
function SuccessState({ data }: { data: FormData }) {
  const estimate = calculateEstimate(data);
  const complexity = detectComplexity(data);

  return (
    <div className="text-center py-8 space-y-5">
      <div className="w-20 h-20 rounded-full bg-[hsl(160,100%,33%)]/15 flex items-center justify-center mx-auto">
        <CheckCircle2 className="h-10 w-10 text-[hsl(160,100%,33%)]" />
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-2" data-testid="text-success-title">¡Solicitud enviada!</h2>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Hemos recibido tus datos. Un asesor fiscal te contactará en las próximas 24 horas para confirmar tu declaración.
        </p>
      </div>
      <div className="rounded-xl bg-[hsl(215,55%,18%)]/8 border border-[hsl(215,55%,18%)]/15 p-5 max-w-sm mx-auto">
        <p className="text-sm text-muted-foreground mb-1">Devolución estimada</p>
        <p className="text-4xl font-bold text-[hsl(160,100%,33%)] mb-2" data-testid="text-success-estimate">
          {estimate.toLocaleString("es-ES")}€
        </p>
        <Badge variant="outline" className="text-xs">
          Plan {complexity.charAt(0).toUpperCase() + complexity.slice(1)} recomendado
        </Badge>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/dashboard">
          <Button className="bg-[hsl(160,100%,33%)] hover:bg-[hsl(160,100%,28%)] text-white" data-testid="button-go-dashboard">
            Ver mi área personal
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" data-testid="button-go-home">Volver al inicio</Button>
        </Link>
      </div>
    </div>
  );
}

/* ─── Main Formulario Component ─── */
export default function Formulario() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [data, setFormData] = useState<FormData>(INITIAL_FORM);

  const TOTAL_STEPS = 5;
  const STEP_LABELS = ["Personal", "Laboral", "Vivienda", "Inversiones", "Resumen"];

  function updateData(partial: Partial<FormData>) {
    setFormData((prev) => ({ ...prev, ...partial }));
  }

  function canProceed(): boolean {
    if (step === 1) return !!(data.nombre && data.email);
    if (step === 2) return !!data.situacion_laboral;
    if (step === 5) return data.acepta_condiciones;
    return true;
  }

  function handleNext() {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
    else handleSubmit();
  }

  function handleBack() {
    if (step > 1) setStep((s) => s - 1);
  }

  function handleSubmit() {
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg">
            <SuccessState data={data} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Building2 className="h-4 w-4 text-[hsl(215,55%,25%)]" />
              Ayuda T Pymes
            </div>
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span>Datos protegidos</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Paso {step} de {TOTAL_STEPS}</span>
            <span className="text-xs text-muted-foreground">{Math.round((step / TOTAL_STEPS) * 100)}% completado</span>
          </div>
          <StepIndicator current={step} total={TOTAL_STEPS} labels={STEP_LABELS} />
        </div>

        {/* Step Content */}
        <Card className="border-border/60 shadow-sm">
          <CardContent className="pt-6 pb-6 px-6">
            {step === 1 && <Step1Personal data={data} setData={updateData} />}
            {step === 2 && <Step2Laboral data={data} setData={updateData} />}
            {step === 3 && <Step3Inmuebles data={data} setData={updateData} />}
            {step === 4 && <Step4Inversiones data={data} setData={updateData} />}
            {step === 5 && <Step5Confirmacion data={data} setData={updateData} />}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
            data-testid="button-prev-step"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all ${
                  i + 1 === step
                    ? "w-5 h-2 bg-[hsl(160,100%,33%)]"
                    : i + 1 < step
                    ? "w-2 h-2 bg-[hsl(160,100%,33%)]/50"
                    : "w-2 h-2 bg-border"
                }`}
              />
            ))}
          </div>

          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="bg-[hsl(160,100%,33%)] hover:bg-[hsl(160,100%,28%)] text-white"
            data-testid="button-next-step"
          >
            {step === TOTAL_STEPS ? (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar solicitud
              </>
            ) : (
              <>
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {/* Trust footer */}
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Cifrado bancario
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> RGPD compliant
          </span>
          <span className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5" /> +20.000 clientes
          </span>
        </div>
      </main>
    </div>
  );
}
