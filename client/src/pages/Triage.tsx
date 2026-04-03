/*
 * Design: Fintech Institucional
 * Formulario de Triage — Clasifica el caso y recoge datos iniciales
 * Palette: Navy #1a365d, Emerald #059669, Warm gray #f7f5f2
 * Lógica condicional: preguntas adaptativas según perfil del contribuyente
 */
import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ArrowRight, ArrowLeft, CheckCircle2, User, Briefcase,
  Home as HomeIcon, PiggyBank, FileCheck, Shield, Phone,
  Mail, AlertTriangle, Sparkles, Building2, TrendingUp,
  Heart, Baby, FileText, Download, Copy, Clock, Euro
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useSEO } from "@/hooks/useSEO";

type TriageStep = "perfil" | "ingresos" | "patrimonio" | "deducciones" | "contacto" | "resultado";

// ============================================================
// Validación de NIF / NIE / CIF español
// ============================================================
function validarNIF(valor: string): boolean {
  if (!valor) return true; // opcional
  const v = valor.trim().toUpperCase();

  // NIE: X/Y/Z + 7 dígitos + letra
  if (/^[XYZ]\d{7}[A-Z]$/.test(v)) {
    const map: Record<string, string> = { X: '0', Y: '1', Z: '2' };
    const num = parseInt(map[v[0]] + v.slice(1, 8));
    const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
    return v[8] === letras[num % 23];
  }

  // DNI: 8 dígitos + letra
  if (/^\d{8}[A-Z]$/.test(v)) {
    const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
    return v[8] === letras[parseInt(v.slice(0, 8)) % 23];
  }

  // CIF: letra + 7 dígitos + letra/dígito
  if (/^[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]$/.test(v)) {
    return true; // validación básica de formato
  }

  return false;
}

function validarNIFPagador(valor: string): boolean {
  if (!valor) return true; // opcional
  const v = valor.trim().toUpperCase();
  // CIF empresa: letra + 7 dígitos + letra/dígito
  if (/^[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]$/.test(v)) return true;
  // También puede ser NIF/NIE de autónomo
  return validarNIF(v);
}

interface TriageData {
  // Perfil
  tipoContribuyente: string;
  // Ingresos
  numPagadores: string;
  ingresosAprox: string;
  segundoPagadorImporte: string;
  esAutonomo: string;
  // Patrimonio
  tieneInmuebles: string;
  inmuebleAlquilado: string;
  tieneInversiones: string;
  tipoInversiones: string[];
  haVendidoInmueble: string;
  // Deducciones
  situacionFamiliar: string;
  numHijos: string;
  tieneHipotecaPre2013: string;
  pagaAlquilerVivienda: string;
  aportaPlanPensiones: string;
  haceDonaciones: string;
  tieneDiscapacidad: string;
  comunidadAutonoma: string;
  // Contacto
  nombre: string;
  apellidos: string;
  nif: string;
  email: string;
  telefono: string;
  prefiereContacto: string;
  tieneReferenciaCatastral: string;
  tieneDatosFiscalesAEAT: string;
  aceptaRGPD: boolean;
  // Datos del pagador principal (empresa)
  nifPagador: string;
  nombreEmpresa: string;
  tieneActividadEconomica: string;
  // Deducciones autonómicas específicas por comunidad
  ded_alquilerJovenes: string;
  ded_nacimientoAdopcion: string;
  ded_familiaNumerosa: string;
  ded_discapacidadFamiliar: string;
  ded_gastosEscolaresHijos: string;
  ded_alquilerViviendaHabitual: string;
  ded_cuidadoMayores: string;
  ded_inversionViviendaHabitual: string;
  ded_donativos: string;
  ded_emprendedores: string;
  ded_actividadFisica: string;
}

const INITIAL: TriageData = {
  tipoContribuyente: "",
  numPagadores: "",
  ingresosAprox: "",
  segundoPagadorImporte: "",
  esAutonomo: "",
  tieneInmuebles: "",
  inmuebleAlquilado: "",
  tieneInversiones: "",
  tipoInversiones: [],
  haVendidoInmueble: "",
  situacionFamiliar: "",
  numHijos: "",
  tieneHipotecaPre2013: "",
  pagaAlquilerVivienda: "",
  aportaPlanPensiones: "",
  haceDonaciones: "",
  tieneDiscapacidad: "",
  comunidadAutonoma: "",
  nombre: "",
  apellidos: "",
  nif: "",
  email: "",
  telefono: "",
  prefiereContacto: "",
  tieneReferenciaCatastral: "",
  tieneDatosFiscalesAEAT: "",
  aceptaRGPD: false,
  // Datos del pagador principal (empresa)
  nifPagador: "",
  nombreEmpresa: "",
  tieneActividadEconomica: "",
  // Deducciones autonómicas
  ded_alquilerJovenes: "",
  ded_nacimientoAdopcion: "",
  ded_familiaNumerosa: "",
  ded_discapacidadFamiliar: "",
  ded_gastosEscolaresHijos: "",
  ded_alquilerViviendaHabitual: "",
  ded_cuidadoMayores: "",
  ded_inversionViviendaHabitual: "",
  ded_donativos: "",
  ded_emprendedores: "",
  ded_actividadFisica: "",
};

// Deducciones autonómicas disponibles por comunidad
function getDeduccionesAutonomicas(ccaa: string): { key: string; label: string }[] {
  const comunes = [
    { key: 'ded_nacimientoAdopcion', label: 'Nacimiento o adopción de hijos en 2025' },
    { key: 'ded_familiaNumerosa', label: 'Familia numerosa reconocida' },
    { key: 'ded_discapacidadFamiliar', label: 'Discapacidad propia o de familiar a cargo' },
    { key: 'ded_alquilerViviendaHabitual', label: 'Alquiler de vivienda habitual (deducción autonómica)' },
  ];
  const porCCAA: Record<string, { key: string; label: string }[]> = {
    'Andalucía': [
      ...comunes,
      { key: 'ded_gastosEscolaresHijos', label: 'Gastos escolares de hijos (libros, uniformes, actividades)' },
      { key: 'ded_cuidadoMayores', label: 'Cuidado de familiares mayores o dependientes' },
    ],
    'Aragón': [
      ...comunes,
      { key: 'ded_cuidadoMayores', label: 'Cuidado de personas mayores o dependientes' },
    ],
    'Asturias': [
      ...comunes,
      { key: 'ded_alquilerJovenes', label: 'Alquiler de vivienda (menores de 35 años)' },
    ],
    'Baleares': [
      ...comunes,
      { key: 'ded_alquilerJovenes', label: 'Alquiler de vivienda habitual (jóvenes o familia numerosa)' },
    ],
    'Canarias': [
      ...comunes,
      { key: 'ded_donativos', label: 'Donativos a entidades canarias' },
    ],
    'Cantabria': [
      ...comunes,
      { key: 'ded_alquilerJovenes', label: 'Alquiler de vivienda habitual (jóvenes)' },
    ],
    'Castilla-La Mancha': [
      ...comunes,
      { key: 'ded_cuidadoMayores', label: 'Cuidado de familiares mayores o con discapacidad' },
    ],
    'Castilla y León': [
      ...comunes,
      { key: 'ded_alquilerJovenes', label: 'Alquiler de vivienda habitual (menores de 36 años)' },
      { key: 'ded_inversionViviendaHabitual', label: 'Inversión en vivienda habitual en zonas rurales' },
    ],
    'Cataluña': [
      ...comunes,
      { key: 'ded_alquilerJovenes', label: 'Alquiler de vivienda habitual (menores de 33 años o familia numerosa)' },
      { key: 'ded_donativos', label: 'Donativos a entidades catalanas' },
    ],
    'Extremadura': [
      ...comunes,
      { key: 'ded_inversionViviendaHabitual', label: 'Adquisición de vivienda habitual en municipios rurales' },
    ],
    'Galicia': [
      ...comunes,
      { key: 'ded_alquilerJovenes', label: 'Alquiler de vivienda habitual (menores de 35 años)' },
      { key: 'ded_cuidadoMayores', label: 'Cuidado de hijos o familiares mayores' },
    ],
    'Madrid': [
      ...comunes,
      { key: 'ded_alquilerJovenes', label: 'Alquiler de vivienda habitual (menores de 35 años)' },
      { key: 'ded_gastosEscolaresHijos', label: 'Gastos de escolaridad de hijos (0-3 años, colegios, idiomas)' },
      { key: 'ded_actividadFisica', label: 'Gastos en actividad física/deportiva (gimnasio, deporte federado) — 15% hasta 1.000€' },
      { key: 'ded_emprendedores', label: 'Inversión en empresas de nueva creación (Business Angel)' },
    ],
    'Murcia': [
      ...comunes,
      { key: 'ded_alquilerJovenes', label: 'Alquiler de vivienda habitual (menores de 35 años)' },
    ],
    'La Rioja': [
      ...comunes,
      { key: 'ded_alquilerJovenes', label: 'Alquiler de vivienda habitual' },
      { key: 'ded_emprendedores', label: 'Creación de empresa o actividad empresarial' },
    ],
    'Comunidad Valenciana': [
      ...comunes,
      { key: 'ded_alquilerJovenes', label: 'Alquiler de vivienda habitual (menores de 35 años o familia numerosa)' },
      { key: 'ded_gastosEscolaresHijos', label: 'Gastos de escolaridad de hijos (libros, material, transporte)' },
      { key: 'ded_actividadFisica', label: 'Gastos en actividad física/deportiva (gimnasio, actividades deportivas) — 15% hasta 150€' },
    ],
  };
  return porCCAA[ccaa] || comunes;
}

const CCAA = [
  "Andalucía", "Aragón", "Asturias", "Baleares", "Canarias",
  "Cantabria", "Castilla-La Mancha", "Castilla y León", "Cataluña",
  "Extremadura", "Galicia", "Madrid", "Murcia", "La Rioja",
  "Comunidad Valenciana", "País Vasco", "Navarra"
];

function getComplejidad(data: TriageData): "simple" | "medio" | "complejo" | "no_apto" {
  let puntos = 0;

  // Autónomo → no apto para el servicio estándar
  if (data.esAutonomo === "si" || data.tipoContribuyente === "autonomo") return "no_apto";

  // Pagadores
  if (data.numPagadores === "2") puntos += 1;
  if (data.numPagadores === "3_mas") puntos += 2;

  // Ingresos altos
  if (data.ingresosAprox === "mas_60k") puntos += 1;

  // Inmuebles
  if (data.tieneInmuebles === "uno") puntos += 1;
  if (data.tieneInmuebles === "varios") puntos += 2;
  if (data.inmuebleAlquilado === "si") puntos += 1;

  // Inversiones
  if (data.tieneInversiones === "si") puntos += 2;

  // Venta de inmueble
  if (data.haVendidoInmueble === "si") puntos += 2;

  // Hipoteca anterior a 2013
  if (data.tieneHipotecaPre2013 === "si") puntos += 1;

  // Discapacidad
  if (data.tieneDiscapacidad === "si") puntos += 1;

  if (puntos >= 5) return "complejo";
  if (puntos >= 2) return "medio";
  return "simple";
}

interface PrecioDesglose {
  base: number;
  suplementos: { concepto: string; importe: number }[];
  total: number;
}

function getPrecioDesglose(complejidad: string, data?: TriageData): PrecioDesglose {
  let base = 0;
  switch (complejidad) {
    case "simple": base = 39; break;
    case "medio": base = 69; break;
    case "complejo": base = 99; break;
    default: return { base: 0, suplementos: [], total: 0 };
  }
  const suplementos: { concepto: string; importe: number }[] = [];
  if (data) {
    if (data.tieneInmuebles === "uno") suplementos.push({ concepto: "Inmueble en propiedad", importe: 20 });
    if (data.tieneInmuebles === "varios") suplementos.push({ concepto: "Varios inmuebles", importe: 40 });
    if (data.tieneInversiones === "si") suplementos.push({ concepto: "Inversiones financieras", importe: 15 });
    if (data.tieneHipotecaPre2013 === "si") suplementos.push({ concepto: "Hipoteca anterior a 2013", importe: 10 });
    if (data.tieneDiscapacidad === "si") suplementos.push({ concepto: "Discapacidad", importe: 10 });
  }
  const total = base + suplementos.reduce((acc, s) => acc + s.importe, 0);
  return { base, suplementos, total };
}

function getPrecio(complejidad: string, data?: TriageData): string {
  const { total } = getPrecioDesglose(complejidad, data);
  if (total === 0) return "Presupuesto personalizado";
  return `${total}€`;
}

function getPlan(complejidad: string): string {
  switch (complejidad) {
    case "simple": return "Renta Simple";
    case "medio": return "Renta Estándar";
    case "complejo": return "Renta Premium";
    default: return "Consulta personalizada";
  }
}

function getDeduccionesDetectadas(data: TriageData): string[] {
  const deducciones: string[] = [];
  if (data.tieneHipotecaPre2013 === "si") deducciones.push("Deducción por inversión en vivienda habitual (hipoteca anterior a 2013)");
  if (data.pagaAlquilerVivienda === "si") deducciones.push("Deducción autonómica por alquiler de vivienda habitual");
  if (data.aportaPlanPensiones === "si") deducciones.push("Reducción por aportaciones a planes de pensiones");
  if (data.haceDonaciones === "si") deducciones.push("Deducción por donativos y donaciones");
  if (data.tieneDiscapacidad === "si") deducciones.push("Deducción por discapacidad del contribuyente o familiar");
  if (data.situacionFamiliar === "con_hijos" || data.situacionFamiliar === "monoparental") {
    deducciones.push("Mínimo por descendientes");
  }
  if (data.situacionFamiliar === "monoparental") {
    deducciones.push("Reducción por tributación conjunta (familia monoparental)");
  }
  if (data.situacionFamiliar === "ascendientes") {
    deducciones.push("Mínimo por ascendientes");
  }
  if (data.inmuebleAlquilado === "si") {
    deducciones.push("Reducción del 60% por rendimientos de alquiler de vivienda");
  }
  // Deducciones autonómicas específicas
  if (data.ded_nacimientoAdopcion === "si") deducciones.push(`Deducción autonómica por nacimiento/adopción (${data.comunidadAutonoma})`);
  if (data.ded_familiaNumerosa === "si") deducciones.push(`Deducción autonómica por familia numerosa (${data.comunidadAutonoma})`);
  if (data.ded_discapacidadFamiliar === "si") deducciones.push(`Deducción autonómica por discapacidad (${data.comunidadAutonoma})`);
  if (data.ded_alquilerViviendaHabitual === "si") deducciones.push(`Deducción autonómica por alquiler de vivienda habitual (${data.comunidadAutonoma})`);
  if (data.ded_alquilerJovenes === "si") deducciones.push(`Deducción autonómica por alquiler jóvenes (${data.comunidadAutonoma})`);
  if (data.ded_gastosEscolaresHijos === "si") deducciones.push(`Deducción autonómica por gastos escolares (${data.comunidadAutonoma})`);
  if (data.ded_cuidadoMayores === "si") deducciones.push(`Deducción autonómica por cuidado de mayores (${data.comunidadAutonoma})`);
  if (data.ded_inversionViviendaHabitual === "si") deducciones.push(`Deducción autonómica por inversión en vivienda habitual (${data.comunidadAutonoma})`);
  if (data.ded_donativos === "si") deducciones.push(`Deducción autonómica por donativos (${data.comunidadAutonoma})`);
  if (data.ded_emprendedores === "si") deducciones.push(`Deducción autonómica por emprendimiento/inversión (${data.comunidadAutonoma})`);
  if (data.ded_actividadFisica === "si") deducciones.push(`Deducción autonómica por actividad física/deportiva (${data.comunidadAutonoma})`);
  return deducciones;
}

function generateExpedienteId(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RF${year}${month}-${random}`;
}

function getDocumentosNecesarios(data: TriageData): string[] {
  const docs: string[] = [
    "DNI/NIE del contribuyente (y cónyuge si declaración conjunta)",
    "Datos fiscales de la AEAT (se pueden descargar desde Renta Web)",
    "Certificado de retenciones de la empresa (modelo 190)",
  ];
  if (data.numPagadores === "2" || data.numPagadores === "3_mas") {
    docs.push("Certificado de retenciones de todos los pagadores");
  }
  if (data.tieneInmuebles !== "no" && data.tieneInmuebles !== "") {
    docs.push("Referencia catastral de los inmuebles");
    docs.push("Recibos del IBI");
  }
  if (data.inmuebleAlquilado === "si") {
    docs.push("Contrato de alquiler y justificantes de ingresos/gastos");
  }
  if (data.tieneInversiones === "si") {
    docs.push("Informe fiscal del broker / entidad financiera");
  }
  if (data.haVendidoInmueble === "si") {
    docs.push("Escritura de compra y venta del inmueble");
    docs.push("Gastos asociados a la compraventa (notaría, registro, plusvalía)");
  }
  if (data.tieneHipotecaPre2013 === "si") {
    docs.push("Certificado del banco con cantidades pagadas de hipoteca");
  }
  if (data.pagaAlquilerVivienda === "si") {
    docs.push("Contrato de alquiler y recibos de pago");
    docs.push("NIF del arrendador");
  }
  if (data.aportaPlanPensiones === "si") {
    docs.push("Certificado de aportaciones al plan de pensiones");
  }
  if (data.haceDonaciones === "si") {
    docs.push("Certificados de donativos realizados");
  }
  if (data.tieneDiscapacidad === "si") {
    docs.push("Certificado de discapacidad");
  }
  if (data.situacionFamiliar === "con_hijos" || data.situacionFamiliar === "monoparental") {
    docs.push("Libro de familia o certificado de nacimiento de los hijos");
  }
  return docs;
}

const STEPS: { id: TriageStep; title: string; icon: any }[] = [
  { id: "perfil", title: "Tu perfil", icon: User },
  { id: "ingresos", title: "Ingresos", icon: Briefcase },
  { id: "patrimonio", title: "Patrimonio", icon: Building2 },
  { id: "deducciones", title: "Deducciones", icon: PiggyBank },
  { id: "contacto", title: "Contacto", icon: Mail },
  { id: "resultado", title: "Resultado", icon: FileCheck },
];

export default function Triage() {
  useSEO({
    title: "Hacer mi Renta 2025 — Empieza aquí",
    description: "Completa el formulario inteligente y descubre qué tipo de declaración necesitas, qué documentos preparar y cuánto podrías ahorrarte con un asesor fiscal profesional.",
    canonical: "/empezar",
  });
  const [currentStep, setCurrentStep] = useState<TriageStep>("perfil");
  const [data, setData] = useState<TriageData>(INITIAL);
  const [submitted, setSubmitted] = useState(false);
  const [expedienteId] = useState(() => generateExpedienteId());
  const [nifError, setNifError] = useState<string>('');
  const [nifPagadorError, setNifPagadorError] = useState<string>('');

  const update = (partial: Partial<TriageData>) => setData((prev) => ({ ...prev, ...partial }));

  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const canAdvance = useMemo(() => {
    switch (currentStep) {
      case "perfil":
        return !!data.tipoContribuyente;
      case "ingresos":
        return !!data.numPagadores && !!data.ingresosAprox && !!data.esAutonomo;
      case "patrimonio":
        return !!data.tieneInmuebles && !!data.tieneInversiones && !!data.haVendidoInmueble;
      case "deducciones":
        return !!data.situacionFamiliar && !!data.comunidadAutonoma;
      case "contacto":
        return !!data.nombre && !!data.apellidos && !!data.email && !!data.telefono && data.aceptaRGPD;
      default:
        return true;
    }
  }, [currentStep, data]);

  const next = () => {
    if (!canAdvance) {
      toast.error("Por favor, completa todos los campos obligatorios antes de continuar.");
      return;
    }
    if (stepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[stepIndex + 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const prev = () => {
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const complejidad = getComplejidad(data);
  const deducciones = getDeduccionesDetectadas(data);
  const documentos = getDocumentosNecesarios(data);
  const precioDesglose = getPrecioDesglose(complejidad, data);

  const [isSending, setIsSending] = useState(false);
  const [webhookSent, setWebhookSent] = useState(false);

  // Timestamp en zona horaria de España (Europe/Madrid)
  const getTimestampES = () => {
    const now = new Date();
    const opts: Intl.DateTimeFormatOptions = {
      timeZone: 'Europe/Madrid',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    };
    const parts = new Intl.DateTimeFormat('es-ES', opts).formatToParts(now);
    const get = (t: string) => parts.find(p => p.type === t)?.value ?? '00';
    return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`;
  };
  const getFechaES = () => {
    const now = new Date();
    const opts: Intl.DateTimeFormatOptions = {
      timeZone: 'Europe/Madrid',
      day: '2-digit', month: '2-digit', year: 'numeric',
    };
    const parts = new Intl.DateTimeFormat('es-ES', opts).formatToParts(now);
    const get = (t: string) => parts.find(p => p.type === t)?.value ?? '00';
    return `${get('day')}/${get('month')}/${get('year')}`;
  };

  // Construir payload mapeado a las columnas del Google Sheet (53 columnas)
  const buildPayload = () => ({
    // Col A: id_caso (generado por n8n)
    // Col B: timestamp — formato DD/MM/AAAA HH:MM
    timestamp: getTimestampES(),
    // Col C-F: datos personales
    nombreCompleto: `${data.nombre} ${data.apellidos}`.trim(),
    nif: data.nif,
    email: data.email,
    telefono: data.telefono,
    // Col G-S: datos fiscales
    comunidadAutonoma: data.comunidadAutonoma,
    estadoCivil: data.situacionFamiliar === 'con_hijos' ? 'Con hijos a cargo'
      : data.situacionFamiliar === 'monoparental' ? 'Familia monoparental'
      : data.situacionFamiliar === 'ascendientes' ? 'Con ascendientes a cargo'
      : data.situacionFamiliar === 'sin_cargas' ? 'Sin cargas familiares' : data.situacionFamiliar,
    numHijos: data.numHijos || '0',
    rendimientosTrabajo: data.ingresosAprox === 'menos_22k' ? '18000'
      : data.ingresosAprox === '22k_35k' ? '28000'
      : data.ingresosAprox === '35k_60k' ? '45000'
      : data.ingresosAprox === 'mas_60k' ? '70000' : '',
    numPagadores: data.numPagadores === '1' ? '1'
      : data.numPagadores === '2' ? '2'
      : data.numPagadores === '3_mas' ? '3' : data.numPagadores,
    tieneActividadEconomica: data.esAutonomo === 'si' ? 'Si' : 'No',
    tieneInmueblesAlquilados: data.inmuebleAlquilado === 'si' ? 'Si' : 'No',
    tieneInversiones: data.tieneInversiones === 'si' ? 'Si' : 'No',
    tieneDiscapacidad: data.tieneDiscapacidad === 'si' ? 'Si' : 'No',
    realizaDonaciones: data.haceDonaciones === 'si' ? 'Si' : 'No',
    tienePlanPensiones: data.aportaPlanPensiones === 'si' ? 'Si' : 'No',
    aceptaPolitica: data.aceptaRGPD ? 'Si' : 'No',
    aceptaTratamiento: data.aceptaRGPD ? 'Si' : 'No',
    // Col T-W: estado y contacto
    estado: 'Pendiente',
    tipo_declaracion: data.tipoContribuyente === 'autonomo' ? 'Autonomo' : 'Individual',
    fecha_creacion: getFechaES(),
    contactoPreferido: data.prefiereContacto || 'Email',
    // Col X-Z: situacion laboral e ingresos
    situacionLaboral: data.tipoContribuyente === 'asalariado' ? 'Asalariado'
      : data.tipoContribuyente === 'autonomo' ? 'Autonomo'
      : data.tipoContribuyente === 'pensionista' ? 'Pensionista'
      : data.tipoContribuyente === 'desempleado' ? 'Desempleado' : data.tipoContribuyente,
    ingresosBrutos: data.ingresosAprox === 'menos_22k' ? '18000'
      : data.ingresosAprox === '22k_35k' ? '28000'
      : data.ingresosAprox === '35k_60k' ? '45000'
      : data.ingresosAprox === 'mas_60k' ? '70000' : '',
    tipoVivienda: data.tieneInmuebles === 'no' ? 'Sin inmuebles'
      : data.tieneInmuebles === 'uno' ? 'Propiedad propia'
      : data.tieneInmuebles === 'varios' ? 'Varios inmuebles' : data.tieneInmuebles,
    // Col AA-AD: deducciones
    hipotecaAnterior2013: data.tieneHipotecaPre2013 === 'si' ? 'Si' : 'No',
    otrosRendimientosDescripcion: '',
    deduccionesConocidas: deducciones.join(', '),
    porcentajeDiscapacidad: '0',
    // Col AE-AK: clasificacion
    tipo: data.tipoContribuyente === 'asalariado' ? 'Individual'
      : data.tipoContribuyente === 'autonomo' ? 'Autonomo'
      : 'Individual',
    expedienteId,
    complejidad,
    plan: getPlan(complejidad),
    precio: getPrecio(complejidad, data),
    precioBase: precioDesglose.base,
    precioTotal: precioDesglose.total,
    suplementos: precioDesglose.suplementos.map(s => `${s.concepto}: +${s.importe}€`).join(', '),
    deduccionesDetectadas: deducciones.join(', '),
    documentosNecesarios: documentos.join(', '),
    // Campos adicionales para el asesor
    alquilerVivienda: data.pagaAlquilerVivienda === 'si' ? 'Si' : 'No',
    vendioInmueble: data.haVendidoInmueble === 'si' ? 'Si' : 'No',
    segundoPagadorImporte: data.segundoPagadorImporte || 'N/A',
    numHijosDetalle: data.numHijos || '0',
    tieneDatosFiscalesAEAT: data.tieneDatosFiscalesAEAT === 'si' ? 'Si' : 'No',
    tieneReferenciaCatastral: data.tieneReferenciaCatastral === 'si' ? 'Si' : 'No',
    // Col AL-AN: empresa pagadora
    fechaRegistro: getFechaES(),
    nombreEmpresa: data.nombreEmpresa || '',
    nifPagador: data.nifPagador || '',
    // Col AO-BA: gestion inicial (rellenos con valores por defecto)
    prioridad: 'Media',
    asesorAsignado: 'Sin asignar',
    notasAsesor: 'Nuevo caso pendiente de asignacion y revision inicial.',
    documentosRecibidos: 'Pendiente',
    fechaContacto: getFechaES(),
    fechaRevision: 'Pendiente',
    resultadoFinal: 'Pendiente',
    importeResultado: '0',
    fechaPresentacion: 'Pendiente',
    observaciones: 'Pendiente revisar documentacion inicial.',
    ultimoRecordatorio: getFechaES(),
    tipoResultado: 'Pendiente',
    resultadoEstimado: '0',
  });

  // Enviar datos al webhook automáticamente cuando se llega al paso resultado
  useEffect(() => {
    if (currentStep === 'resultado' && !webhookSent) {
      setWebhookSent(true);
      const webhookUrl = import.meta.env.VITE_WEBHOOK_N8N || '';
      if (webhookUrl) {
        const payload = buildPayload();

        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
          .then(r => r.text())
          .then(t => console.log('[WEBHOOK] Respuesta:', t))
          .catch(e => console.error('[WEBHOOK] Error:', e));
      }
    }
  }, [currentStep, webhookSent]);

  const handleSubmit = async () => {
    // Validar NIF antes de enviar
    if (data.nif && !validarNIF(data.nif)) {
      setNifError('NIF/NIE no válido. Comprueba el formato y la letra de control.');
      toast.error('El NIF/NIE introducido no es válido. Por favor, corrígelo antes de continuar.');
      return;
    }
    if (data.nifPagador && !validarNIFPagador(data.nifPagador)) {
      setNifPagadorError('CIF/NIF no válido. Ej: B12345678 o A87654321');
      toast.error('El CIF/NIF de la empresa pagadora no es válido. Por favor, corrígelo.');
      return;
    }

    setIsSending(true);
    try {
      // Enviar al webhook de n8n (configurar URL en variable de entorno)
      const webhookUrl = import.meta.env.VITE_WEBHOOK_N8N || '';

      const payload = buildPayload();

      if (webhookUrl) {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData?.error || `Error ${response.status}`;
          // Si es error de NIF, mostrarlo al usuario
          if (errorMsg.toLowerCase().includes('nif') || errorMsg.toLowerCase().includes('nie')) {
            setNifError(`El NIF no fue aceptado por el sistema: ${errorMsg}`);
            toast.error(`NIF no válido: ${errorMsg}`);
            setIsSending(false);
            return;
          }
          // Otros errores: registrar igualmente pero avisar
          console.warn('[Webhook] Error no crítico:', errorMsg);
        }
      }

      setSubmitted(true);
      toast.success(
        `Solicitud ${expedienteId} registrada. Te contactaremos en menos de 24 horas.`,
        { duration: 6000 }
      );
    } catch (err) {
      // Si falla la conexión, registramos igualmente
      console.error('[DEBUG] Error enviando al webhook:', err);
      setSubmitted(true);
      toast.success(
        `Solicitud ${expedienteId} registrada. Te contactaremos en menos de 24 horas.`,
        { duration: 6000 }
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyExpediente = () => {
    navigator.clipboard.writeText(expedienteId);
    toast.info("ID de expediente copiado al portapapeles");
  };

  const resumenTexto = `
EXPEDIENTE: ${expedienteId}
PLAN: ${getPlan(complejidad)} (${getPrecio(complejidad, data)})
---
CONTRIBUYENTE: ${data.nombre} ${data.apellidos}
NIF: ${data.nif || "No proporcionado"}
EMAIL: ${data.email}
TELÉFONO: ${data.telefono}
CCAA: ${data.comunidadAutonoma}
---
PERFIL: ${data.tipoContribuyente}
PAGADORES: ${data.numPagadores}
INGRESOS: ${data.ingresosAprox}
INMUEBLES: ${data.tieneInmuebles}
INVERSIONES: ${data.tieneInversiones}
SITUACIÓN FAMILIAR: ${data.situacionFamiliar}
---
DEDUCCIONES DETECTADAS:
${deducciones.map(d => `- ${d}`).join("\n")}
---
DOCUMENTOS NECESARIOS:
${documentos.map(d => `- ${d}`).join("\n")}
  `.trim();

  const handleDownloadResumen = () => {
    const blob = new Blob([resumenTexto], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expediente-${expedienteId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Resumen descargado");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f5f2]">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 lg:pt-28 lg:pb-24">
        <div className="container max-w-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-['DM_Sans'] text-3xl lg:text-4xl font-bold text-[#1a365d] mb-2">
              Analicemos tu caso
            </h1>
            <p className="text-gray-500">
              En 3 minutos sabrás qué tipo de declaración tienes, qué documentos necesitas y cuánto te costaría
            </p>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-0.5 sm:gap-1 mb-10">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <button
                  onClick={() => {
                    if (i < stepIndex) setCurrentStep(s.id);
                  }}
                  disabled={i > stepIndex}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                    currentStep === s.id
                      ? "bg-[#1a365d] text-white scale-110"
                      : stepIndex > i
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {stepIndex > i ? <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : i + 1}
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`w-4 sm:w-10 h-0.5 ${stepIndex > i ? "bg-emerald-300" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step labels (desktop) */}
          <div className="hidden lg:flex items-center justify-between mb-6 px-2">
            {STEPS.map((s, i) => (
              <span key={s.id} className={`text-xs font-medium ${
                currentStep === s.id ? "text-[#1a365d]" : stepIndex > i ? "text-emerald-600" : "text-gray-300"
              }`}>
                {s.title}
              </span>
            ))}
          </div>

          <Card className="border-0 shadow-xl shadow-gray-200/50 bg-white">
            <CardContent className="p-5 sm:p-6 lg:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* ═══════════════════════════════════════ */}
                  {/* STEP 1: PERFIL */}
                  {/* ═══════════════════════════════════════ */}
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
                        onValueChange={(v) => update({ tipoContribuyente: v, esAutonomo: v === "autonomo" ? "si" : data.esAutonomo })}
                        className="grid gap-3"
                      >
                        {[
                          { value: "asalariado", label: "Asalariado/a", desc: "Trabajo por cuenta ajena con nómina", icon: Briefcase },
                          { value: "pensionista", label: "Pensionista", desc: "Jubilación, viudedad u otra pensión", icon: PiggyBank },
                          { value: "desempleado", label: "Desempleado/a", desc: "Prestación por desempleo (SEPE)", icon: User },
                          { value: "autonomo", label: "Autónomo/a", desc: "Trabajo por cuenta propia", icon: Sparkles },
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
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                              data.tipoContribuyente === opt.value ? "bg-emerald-100" : "bg-gray-50"
                            }`}>
                              <opt.icon className={`w-5 h-5 ${
                                data.tipoContribuyente === opt.value ? "text-emerald-600" : "text-gray-400"
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-[#1a365d] text-sm">{opt.label}</p>
                              <p className="text-xs text-gray-400">{opt.desc}</p>
                            </div>
                            {data.tipoContribuyente === opt.value && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                            )}
                          </label>
                        ))}
                      </RadioGroup>

                      {data.tipoContribuyente === "autonomo" && (
                        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-amber-800">
                              Las rentas de autónomos requieren atención especializada
                            </p>
                            <p className="text-xs text-amber-600 mt-1">
                              Te derivaremos a un asesor fiscal especializado en autónomos de nuestro equipo
                              de +600 profesionales para garantizar el mejor resultado posible.
                            </p>
                          </div>
                        </div>
                      )}

                      {data.tipoContribuyente === "desempleado" && (
                        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                          <Euro className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-blue-800">
                              ¿Sabías que muchos desempleados tienen derecho a devolución?
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              Si has cobrado prestación del SEPE y antes tenías empleo, es muy probable que
                              hayas tenido 2 pagadores y te corresponda devolución.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ═══════════════════════════════════════ */}
                  {/* STEP 2: INGRESOS */}
                  {/* ═══════════════════════════════════════ */}
                  {currentStep === "ingresos" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="font-['DM_Sans'] text-xl font-bold text-[#1a365d] mb-1">
                          Sobre tus ingresos
                        </h2>
                        <p className="text-sm text-gray-400">
                          No necesitamos cifras exactas, solo una idea general para clasificar tu caso.
                        </p>
                      </div>

                      <div className="space-y-5">
                        {/* Pagadores */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            ¿Cuántos pagadores has tenido en 2025? <span className="text-red-400">*</span>
                          </Label>
                          <p className="text-xs text-gray-400 mb-2">
                            Incluye empresas, SEPE, INSS (pensión), etc.
                          </p>
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

                        {/* Segundo pagador importe (condicional) */}
                        {(data.numPagadores === "2" || data.numPagadores === "3_mas") && (
                          <div className="pl-4 border-l-2 border-emerald-200">
                            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                              ¿El 2.º pagador te pagó más de 1.500€ en el año?
                            </Label>
                            <p className="text-xs text-gray-400 mb-2">
                              Si es así, estás obligado a declarar con ingresos superiores a 15.000€
                            </p>
                            <RadioGroup
                              value={data.segundoPagadorImporte}
                              onValueChange={(v) => update({ segundoPagadorImporte: v })}
                              className="grid sm:grid-cols-2 gap-3"
                            >
                              {[
                                { value: "menos_1500", label: "No, menos de 1.500€" },
                                { value: "mas_1500", label: "Sí, más de 1.500€" },
                              ].map((opt) => (
                                <label
                                  key={opt.value}
                                  className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${
                                    data.segundoPagadorImporte === opt.value
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
                        )}

                        {/* Rango ingresos */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            Rango aproximado de ingresos brutos anuales <span className="text-red-400">*</span>
                          </Label>
                          <RadioGroup
                            value={data.ingresosAprox}
                            onValueChange={(v) => update({ ingresosAprox: v })}
                            className="grid sm:grid-cols-2 gap-3"
                          >
                            {[
                              { value: "menos_15k", label: "Menos de 15.000€" },
                              { value: "15k_22k", label: "15.000€ - 22.000€" },
                              { value: "22k_35k", label: "22.000€ - 35.000€" },
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

                        {/* Autónomo (si no lo seleccionó en perfil) */}
                        {data.tipoContribuyente !== "autonomo" && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                              ¿Has tenido alguna actividad económica como autónomo? <span className="text-red-400">*</span>
                            </Label>
                            <RadioGroup
                              value={data.esAutonomo}
                              onValueChange={(v) => update({ esAutonomo: v })}
                              className="grid sm:grid-cols-2 gap-3"
                            >
                              {[
                                { value: "no", label: "No" },
                                { value: "si", label: "Sí, aunque sea parcialmente" },
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
                        )}
                      </div>
                    </div>
                  )}

                  {/* ═══════════════════════════════════════ */}
                  {/* STEP 3: PATRIMONIO */}
                  {/* ═══════════════════════════════════════ */}
                  {currentStep === "patrimonio" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="font-['DM_Sans'] text-xl font-bold text-[#1a365d] mb-1">
                          Tu situación patrimonial
                        </h2>
                        <p className="text-sm text-gray-400">
                          Esto determina la complejidad de tu declaración.
                        </p>
                      </div>

                      <div className="space-y-5">
                        {/* Inmuebles */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            ¿Tienes inmuebles en propiedad (pisos, locales, garajes, plazas)? <span className="text-red-400">*</span>
                          </Label>
                          <RadioGroup
                            value={data.tieneInmuebles}
                            onValueChange={(v) => update({ tieneInmuebles: v })}
                            className="grid sm:grid-cols-3 gap-3"
                          >
                            {[
                              { value: "no", label: "No tengo" },
                              { value: "uno", label: "Sí, 1 inmueble" },
                              { value: "varios", label: "Sí, 2 o más" },
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

                        {/* Alquiler (condicional) */}
                        {(data.tieneInmuebles === "uno" || data.tieneInmuebles === "varios") && (
                          <div className="pl-4 border-l-2 border-emerald-200">
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                              ¿Alguno de tus inmuebles está alquilado?
                            </Label>
                            <RadioGroup
                              value={data.inmuebleAlquilado}
                              onValueChange={(v) => update({ inmuebleAlquilado: v })}
                              className="grid sm:grid-cols-2 gap-3"
                            >
                              {[
                                { value: "no", label: "No, ninguno" },
                                { value: "si", label: "Sí, tengo inmuebles alquilados" },
                              ].map((opt) => (
                                <label
                                  key={opt.value}
                                  className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${
                                    data.inmuebleAlquilado === opt.value
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
                        )}

                        {/* Inversiones */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            ¿Tienes inversiones financieras? <span className="text-red-400">*</span>
                          </Label>
                          <RadioGroup
                            value={data.tieneInversiones}
                            onValueChange={(v) => update({ tieneInversiones: v })}
                            className="grid sm:grid-cols-2 gap-3"
                          >
                            {[
                              { value: "no", label: "No" },
                              { value: "si", label: "Sí (acciones, fondos, cripto, etc.)" },
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

                        {/* Venta inmueble */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            ¿Has vendido algún inmueble en 2025? <span className="text-red-400">*</span>
                          </Label>
                          <RadioGroup
                            value={data.haVendidoInmueble}
                            onValueChange={(v) => update({ haVendidoInmueble: v })}
                            className="grid sm:grid-cols-2 gap-3"
                          >
                            {[
                              { value: "no", label: "No" },
                              { value: "si", label: "Sí" },
                            ].map((opt) => (
                              <label
                                key={opt.value}
                                className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${
                                  data.haVendidoInmueble === opt.value
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

                  {/* ═══════════════════════════════════════ */}
                  {/* STEP 4: DEDUCCIONES */}
                  {/* ═══════════════════════════════════════ */}
                  {currentStep === "deducciones" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="font-['DM_Sans'] text-xl font-bold text-[#1a365d] mb-1">
                          Deducciones y situación personal
                        </h2>
                        <p className="text-sm text-gray-400">
                          Esto nos permite detectar deducciones que podrías estar dejando pasar.
                        </p>
                      </div>

                      <div className="space-y-5">
                        {/* Situación familiar */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            Situación familiar <span className="text-red-400">*</span>
                          </Label>
                          <RadioGroup
                            value={data.situacionFamiliar}
                            onValueChange={(v) => update({ situacionFamiliar: v })}
                            className="grid sm:grid-cols-2 gap-3"
                          >
                            {[
                              { value: "sin_hijos", label: "Sin hijos a cargo", icon: User },
                              { value: "con_hijos", label: "Con hijos a cargo", icon: Baby },
                              { value: "monoparental", label: "Familia monoparental", icon: Heart },
                              { value: "ascendientes", label: "Con ascendientes a cargo", icon: User },
                            ].map((opt) => (
                              <label
                                key={opt.value}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${
                                  data.situacionFamiliar === opt.value
                                    ? "border-[#059669] bg-emerald-50/50 text-emerald-700"
                                    : "border-gray-100 text-gray-500 hover:border-gray-200"
                                }`}
                              >
                                <RadioGroupItem value={opt.value} className="sr-only" />
                                <opt.icon className={`w-4 h-4 shrink-0 ${
                                  data.situacionFamiliar === opt.value ? "text-emerald-600" : "text-gray-400"
                                }`} />
                                {opt.label}
                              </label>
                            ))}
                          </RadioGroup>
                        </div>

                        {/* Num hijos (condicional) */}
                        {(data.situacionFamiliar === "con_hijos" || data.situacionFamiliar === "monoparental") && (
                          <div className="pl-4 border-l-2 border-emerald-200">
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                              ¿Cuántos hijos menores de 25 años o con discapacidad?
                            </Label>
                            <RadioGroup
                              value={data.numHijos}
                              onValueChange={(v) => update({ numHijos: v })}
                              className="grid grid-cols-4 gap-3"
                            >
                              {["1", "2", "3", "4+"].map((n) => (
                                <label
                                  key={n}
                                  className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${
                                    data.numHijos === n
                                      ? "border-[#059669] bg-emerald-50/50 text-emerald-700"
                                      : "border-gray-100 text-gray-500 hover:border-gray-200"
                                  }`}
                                >
                                  <RadioGroupItem value={n} className="sr-only" />
                                  {n}
                                </label>
                              ))}
                            </RadioGroup>
                          </div>
                        )}

                        {/* Preguntas de deducciones rápidas */}
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                          <p className="text-sm font-medium text-[#1a365d]">
                            Marca las que apliquen a tu caso:
                          </p>
                          {[
                            { key: "tieneHipotecaPre2013", label: "Tengo hipoteca de vivienda habitual contratada antes de 2013" },
                            { key: "pagaAlquilerVivienda", label: "Pago alquiler de mi vivienda habitual" },
                            { key: "aportaPlanPensiones", label: "He aportado a un plan de pensiones en 2025" },
                            { key: "haceDonaciones", label: "He realizado donaciones a ONGs o entidades benéficas" },
                            { key: "tieneDiscapacidad", label: "Tengo reconocida una discapacidad (o un familiar a cargo)" },
                          ].map((item) => (
                            <label key={item.key} className="flex items-start gap-3 cursor-pointer group">
                              <Checkbox
                                checked={data[item.key as keyof TriageData] === "si"}
                                onCheckedChange={(checked) => update({ [item.key]: checked ? "si" : "no" })}
                                className="mt-0.5"
                              />
                              <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                                {item.label}
                              </span>
                            </label>
                          ))}
                        </div>

                        {/* Comunidad autónoma */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            Comunidad autónoma de residencia <span className="text-red-400">*</span>
                          </Label>
                          <p className="text-xs text-gray-400 mb-2">
                            Cada comunidad tiene deducciones propias que podemos aplicar.
                          </p>
                          <Select value={data.comunidadAutonoma} onValueChange={(v) => update({ comunidadAutonoma: v })}>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Selecciona tu comunidad autónoma" />
                            </SelectTrigger>
                            <SelectContent>
                              {CCAA.map((cc) => (
                                <SelectItem key={cc} value={cc}>{cc}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* ── Deducciones autonómicas dinámicas ── */}
                        {data.comunidadAutonoma && !['País Vasco', 'Navarra'].includes(data.comunidadAutonoma) && (
                          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 space-y-3">
                            <p className="text-sm font-semibold text-[#1a365d] flex items-center gap-2">
                              <span className="text-base">🏛️</span>
                              Deducciones propias de {data.comunidadAutonoma}
                            </p>
                            <p className="text-xs text-gray-500">Marca las que apliquen para que las incluyamos en tu declaración.</p>
                            <div className="space-y-2">
                              {getDeduccionesAutonomicas(data.comunidadAutonoma).map((item) => (
                                <label key={item.key} className="flex items-start gap-3 cursor-pointer group">
                                  <Checkbox
                                    checked={data[item.key as keyof TriageData] === 'si'}
                                    onCheckedChange={(checked) => update({ [item.key]: checked ? 'si' : 'no' })}
                                    className="mt-0.5"
                                  />
                                  <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                                    {item.label}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ═══════════════════════════════════════ */}
                  {/* STEP 5: CONTACTO */}
                  {/* ═══════════════════════════════════════ */}
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
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                              Nombre <span className="text-red-400">*</span>
                            </Label>
                            <Input
                              value={data.nombre}
                              onChange={(e) => update({ nombre: e.target.value })}
                              placeholder="María"
                              className="h-11"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                              Apellidos <span className="text-red-400">*</span>
                            </Label>
                            <Input
                              value={data.apellidos}
                              onChange={(e) => update({ apellidos: e.target.value })}
                              placeholder="García López"
                              className="h-11"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                            NIF / NIE
                          </Label>
                          <Input
                            value={data.nif}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase();
                              update({ nif: val });
                              if (val && !validarNIF(val)) {
                                setNifError('NIF/NIE no válido. Comprueba el formato y la letra de control.');
                              } else {
                                setNifError('');
                              }
                            }}
                            onBlur={() => {
                              if (data.nif && !validarNIF(data.nif)) {
                                setNifError('NIF/NIE no válido. Comprueba el formato y la letra de control.');
                              } else {
                                setNifError('');
                              }
                            }}
                            placeholder="12345678A"
                            className={`h-11 uppercase ${nifError ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                            maxLength={9}
                          />
                          {nifError ? (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />{nifError}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400 mt-1">Opcional ahora, necesario para la gestión</p>
                          )}
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                            Email <span className="text-red-400">*</span>
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
                            Teléfono <span className="text-red-400">*</span>
                          </Label>
                          <Input
                            type="tel"
                            value={data.telefono}
                            onChange={(e) => update({ telefono: e.target.value })}
                            placeholder="612 345 678"
                            className="h-11"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            ¿Cómo prefieres que te contactemos?
                          </Label>
                          <RadioGroup
                            value={data.prefiereContacto}
                            onValueChange={(v) => update({ prefiereContacto: v })}
                            className="grid grid-cols-3 gap-3"
                          >
                            {[
                              { value: "whatsapp", label: "WhatsApp" },
                              { value: "email", label: "Email" },
                              { value: "telefono", label: "Teléfono" },
                            ].map((opt) => (
                              <label
                                key={opt.value}
                                className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${
                                  data.prefiereContacto === opt.value
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

                        {/* Datos del pagador — nuevos campos */}
                        <div className="bg-teal-50 rounded-xl p-4 border border-teal-200">
                          <div className="flex items-center gap-2 mb-3">
                            <Building2 className="w-4 h-4 text-teal-600" />
                            <p className="text-sm font-semibold text-teal-800">
                              Datos de tu empresa pagadora
                            </p>
                          </div>
                          <p className="text-xs text-teal-600 mb-4">
                            Estos datos nos permiten preparar tu declaración sin pedirte el certificado de retenciones más adelante. Son opcionales ahora, pero muy útiles para el asesor.
                          </p>
                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                Nombre de la empresa pagadora
                              </Label>
                              <Input
                                value={data.nombreEmpresa}
                                onChange={(e) => update({ nombreEmpresa: e.target.value })}
                                placeholder="Empresa S.A. / Ej. Mercadona S.A."
                                className="h-11 bg-white"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                NIF / CIF de la empresa pagadora
                              </Label>
                              <Input
                                value={data.nifPagador}
                                onChange={(e) => {
                                  const val = e.target.value.toUpperCase();
                                  update({ nifPagador: val });
                                  if (val && !validarNIFPagador(val)) {
                                    setNifPagadorError('CIF/NIF no válido. Ej: B12345678 o A87654321');
                                  } else {
                                    setNifPagadorError('');
                                  }
                                }}
                                onBlur={() => {
                                  if (data.nifPagador && !validarNIFPagador(data.nifPagador)) {
                                    setNifPagadorError('CIF/NIF no válido. Ej: B12345678 o A87654321');
                                  } else {
                                    setNifPagadorError('');
                                  }
                                }}
                                placeholder="A12345678 (CIF empresa)"
                                className={`h-11 bg-white uppercase ${nifPagadorError ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                                maxLength={9}
                              />
                              {nifPagadorError ? (
                                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />{nifPagadorError}
                                </p>
                              ) : (
                                <p className="text-xs text-gray-400 mt-1">Lo encontrarás en tu nómina o en el certificado de retenciones</p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                          <p className="text-sm font-medium text-[#1a365d]">
                            Documentación previa (opcional):
                          </p>
                          {[
                            { key: "tieneDatosFiscalesAEAT", label: "Ya tengo descargados mis datos fiscales de la AEAT" },
                            { key: "tieneReferenciaCatastral", label: "Tengo la referencia catastral de mis inmuebles" },
                          ].map((item) => (
                            <label key={item.key} className="flex items-start gap-3 cursor-pointer group">
                              <Checkbox
                                checked={data[item.key as keyof TriageData] === "si"}
                                onCheckedChange={(checked) => update({ [item.key]: checked ? "si" : "no" })}
                                className="mt-0.5"
                              />
                              <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                                {item.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* RGPD */}
                      <label className="flex items-start gap-3 cursor-pointer">
                        <Checkbox
                          checked={data.aceptaRGPD}
                          onCheckedChange={(checked) => update({ aceptaRGPD: !!checked })}
                          className="mt-0.5"
                        />
                        <span className="text-xs text-gray-500 leading-relaxed">
                          Acepto la{" "}
                          <a href="#" className="text-[#059669] underline">política de privacidad</a>{" "}
                          y el tratamiento de mis datos conforme al RGPD para la gestión de mi declaración
                          de la renta. Mis datos solo se usarán para este servicio y no se compartirán con terceros. <span className="text-red-400">*</span>
                        </span>
                      </label>
                    </div>
                  )}

                  {/* ═══════════════════════════════════════ */}
                  {/* STEP 6: RESULTADO */}
                  {/* ═══════════════════════════════════════ */}
                  {currentStep === "resultado" && (
                    <div className="space-y-6">
                      {/* Cabecera resultado */}
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
                        <h2 className="font-['DM_Sans'] text-2xl font-bold text-[#1a365d] mb-1">
                          {complejidad === "no_apto"
                            ? "Tu caso necesita atención especializada"
                            : `Tu plan recomendado: ${getPlan(complejidad)}`}
                        </h2>
                        <p className="text-gray-500 text-sm">
                          {complejidad === "no_apto"
                            ? "Las rentas de autónomos requieren un asesor fiscal dedicado."
                            : `Hemos analizado tu perfil y este es el servicio que mejor se adapta.`}
                        </p>
                        {/* Expediente ID */}
                        <div className="mt-3 inline-flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5">
                          <FileText className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs font-mono text-gray-600">Expediente: {expedienteId}</span>
                          <button onClick={handleCopyExpediente} className="text-gray-400 hover:text-gray-600">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Card precio con desglose transparente */}
                      {complejidad !== "no_apto" && (
                        <div className="bg-gradient-to-br from-[#1a365d] to-[#2d4a7a] rounded-2xl p-6 text-white">
                          <div className="text-center mb-5">
                            <p className="text-white/60 text-sm mb-1">Tu plan recomendado</p>
                            <p className="font-['DM_Sans'] text-2xl font-bold mb-1">
                              {getPlan(complejidad)}
                            </p>
                          </div>

                          {/* Desglose de precio transparente */}
                          <div className="bg-white/10 rounded-xl p-4 mb-4">
                            <p className="text-xs text-white/60 uppercase tracking-wide mb-3">Desglose del precio</p>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-white/80">Servicio base ({getPlan(complejidad)})</span>
                                <span className="font-semibold text-white">{precioDesglose.base}€</span>
                              </div>
                              {precioDesglose.suplementos.map((sup, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                  <span className="text-white/70">+ {sup.concepto}</span>
                                  <span className="text-emerald-300">+{sup.importe}€</span>
                                </div>
                              ))}
                              <div className="border-t border-white/20 pt-2 flex justify-between items-center">
                                <span className="font-semibold text-white">Total</span>
                                <span className="font-['DM_Sans'] text-2xl font-bold text-emerald-400">{precioDesglose.total}€</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {[
                              "Análisis fiscal completo de tu caso",
                              "Revisión por asesor fiscal profesional",
                              "Presentación telemática ante la AEAT",
                              complejidad === "complejo" ? "Asesor fiscal dedicado + consulta telefónica" : "Soporte por email y WhatsApp",
                              "Gestión de documentación incluida",
                            ].map((f, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                {f}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Deducciones detectadas */}
                      {deducciones.length > 0 && (
                        <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
                          <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-emerald-600" />
                            <h3 className="text-sm font-bold text-emerald-800">
                              Deducciones detectadas ({deducciones.length})
                            </h3>
                          </div>
                          <div className="space-y-1.5">
                            {deducciones.map((d, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                <span className="text-xs text-emerald-700">{d}</span>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-emerald-600 mt-3 italic">
                            Nuestro equipo buscará deducciones adicionales específicas de {data.comunidadAutonoma || "tu comunidad"}.
                          </p>
                        </div>
                      )}

                      {/* Documentos necesarios */}
                      <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <h3 className="text-sm font-bold text-blue-800">
                            Documentos que necesitarás ({documentos.length})
                          </h3>
                        </div>
                        <div className="space-y-1.5">
                          {documentos.map((d, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <div className="w-3.5 h-3.5 rounded-full border border-blue-300 flex items-center justify-center mt-0.5 shrink-0">
                                <span className="text-[8px] text-blue-500 font-bold">{i + 1}</span>
                              </div>
                              <span className="text-xs text-blue-700">{d}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Resumen del caso */}
                      <div className="bg-gray-50 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-bold text-[#1a365d]">Resumen de tu caso</h3>
                          <button
                            onClick={handleDownloadResumen}
                            className="flex items-center gap-1.5 text-xs text-[#059669] hover:text-emerald-700 font-medium"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Descargar
                          </button>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                          <div className="flex justify-between py-1 border-b border-gray-200">
                            <span className="text-gray-500">Contribuyente</span>
                            <span className="font-medium text-gray-700">{data.nombre} {data.apellidos}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-gray-200">
                            <span className="text-gray-500">Tipo</span>
                            <span className="font-medium text-gray-700 capitalize">{data.tipoContribuyente}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-gray-200">
                            <span className="text-gray-500">Pagadores</span>
                            <span className="font-medium text-gray-700">{data.numPagadores === "3_mas" ? "3+" : data.numPagadores}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-gray-200">
                            <span className="text-gray-500">Ingresos</span>
                            <span className="font-medium text-gray-700">{data.ingresosAprox?.replace(/_/g, " ").replace("k", ".000€")}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-gray-200">
                            <span className="text-gray-500">Inmuebles</span>
                            <span className="font-medium text-gray-700 capitalize">{data.tieneInmuebles}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-gray-200">
                            <span className="text-gray-500">Inversiones</span>
                            <span className="font-medium text-gray-700 capitalize">{data.tieneInversiones}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-gray-200">
                            <span className="text-gray-500">Familia</span>
                            <span className="font-medium text-gray-700 capitalize">{data.situacionFamiliar?.replace(/_/g, " ")}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-gray-200">
                            <span className="text-gray-500">CCAA</span>
                            <span className="font-medium text-gray-700">{data.comunidadAutonoma}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-gray-200">
                            <span className="text-gray-500">Contacto</span>
                            <span className="font-medium text-gray-700 capitalize">{data.prefiereContacto || "Email"}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-gray-200">
                            <span className="text-gray-500">Complejidad</span>
                            <span className={`font-bold capitalize ${
                              complejidad === "simple" ? "text-emerald-600" :
                              complejidad === "medio" ? "text-amber-600" :
                              complejidad === "complejo" ? "text-red-500" : "text-amber-600"
                            }`}>{complejidad === "no_apto" ? "Especializada" : complejidad}</span>
                          </div>
                        </div>
                      </div>

                      {/* Tiempo estimado */}
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <Clock className="w-5 h-5 text-[#1a365d]" />
                        <div>
                          <p className="text-sm font-medium text-[#1a365d]">
                            Tiempo estimado: {complejidad === "simple" ? "24-48h" : complejidad === "medio" ? "48-72h" : "3-5 días"}
                          </p>
                          <p className="text-xs text-gray-400">
                            Desde que recibimos toda la documentación hasta la presentación
                          </p>
                        </div>
                      </div>

                      {/* Botón enviar */}
                      {!submitted ? (
                        <Button
                          onClick={handleSubmit}
                          disabled={isSending}
                          className="w-full bg-[#059669] hover:bg-[#047857] text-white font-semibold h-12 text-base shadow-lg shadow-emerald-200/50 disabled:opacity-60"
                        >
                          {isSending ? "Enviando..." : complejidad === "no_apto" ? "Solicitar consulta personalizada" : "Contratar servicio"}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                            <div>
                              <p className="text-sm font-bold text-emerald-800">Solicitud enviada correctamente</p>
                              <p className="text-xs text-emerald-600 mt-0.5">
                                Tu expediente <span className="font-mono font-bold">{expedienteId}</span> ha sido registrado.
                                {complejidad !== "no_apto"
                                  ? " Completa el pago para que comencemos a gestionar tu declaración."
                                  : ` Te contactaremos en menos de 24 horas por ${data.prefiereContacto || "email"}.`}
                              </p>
                            </div>
                          </div>
                          {/* Botón de pago directo para rentas automatizables */}
                          {complejidad !== "no_apto" && (
                            <Link href={`/pago/${expedienteId}`}>
                              <Button className="w-full bg-[#059669] hover:bg-[#047857] text-white font-semibold h-12 text-base shadow-lg shadow-emerald-200/50 gap-2">
                                <Euro className="w-4 h-4" />
                                Pagar y empezar mi declaración — {precioDesglose.total}€
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                            </Link>
                          )}
                          <div className="flex gap-3">
                            <Button
                              variant="outline"
                              onClick={handleDownloadResumen}
                              className="flex-1 gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Descargar resumen
                            </Button>
                            <Link href="/">
                              <Button variant="outline" className="flex-1 gap-2">
                                <HomeIcon className="w-4 h-4" />
                                Volver al inicio
                              </Button>
                            </Link>
                          </div>
                        </div>
                      )}

                      {!submitted && (
                        <p className="text-center text-xs text-gray-400">
                          Al continuar, aceptas nuestros{" "}
                          <a href="#" className="underline">términos de servicio</a> y{" "}
                          <a href="#" className="underline">política de privacidad</a>.
                        </p>
                      )}
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
                  <span className="text-xs text-gray-400 hidden sm:block">
                    Paso {stepIndex + 1} de {STEPS.length}
                  </span>
                  <Button
                    onClick={next}
                    disabled={!canAdvance}
                    className="bg-[#1a365d] hover:bg-[#1a365d]/90 text-white gap-2 disabled:opacity-50"
                  >
                    {stepIndex === STEPS.length - 2 ? "Ver resultado" : "Siguiente"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trust bar */}
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Datos protegidos
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              RGPD
            </div>
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              +600 profesionales
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
