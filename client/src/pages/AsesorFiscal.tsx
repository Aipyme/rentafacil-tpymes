/**
 * Página de derivación a asesor fiscal para casos complejos.
 * Accesible desde:
 *  - El simulador cuando detecta un caso complejo (con expedienteId y resultadoSimulador)
 *  - Directamente desde la landing page (sin expediente previo)
 *
 * Mejoras v2:
 *  - Muestra fecha real del slot reservado (próximo día hábil)
 *  - Captura IP y User-Agent para audit log
 *  - Pantalla de confirmación con slot confirmado y próximos pasos claros
 *  - Email de confirmación provisional enviado automáticamente por n8n
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  UserCheck, Phone, Mail, Clock, CheckCircle2,
  AlertTriangle, ArrowLeft, Calendar, Shield,
  TrendingUp, FileText, ChevronRight, CalendarCheck
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Franjas horarias disponibles
const FRANJAS = [
  { id: "manana_temprano", label: "Mañana temprano", sublabel: "9:00 - 11:00", icon: "🌅", horaInicio: 9 },
  { id: "manana", label: "Mañana", sublabel: "11:00 - 13:00", icon: "☀️", horaInicio: 11 },
  { id: "mediodia", label: "Mediodía", sublabel: "13:00 - 15:00", icon: "🌞", horaInicio: 13 },
  { id: "tarde_temprano", label: "Tarde temprana", sublabel: "15:00 - 17:00", icon: "🌤️", horaInicio: 15 },
  { id: "tarde", label: "Tarde", sublabel: "17:00 - 19:00", icon: "🌆", horaInicio: 17 },
  { id: "flexible", label: "Flexible", sublabel: "Cualquier hora", icon: "🕐", horaInicio: 9 },
];

// Motivos de complejidad legibles
const MOTIVOS_LEGIBLES: Record<string, string> = {
  "actividad_economica": "Actividad económica o autónomo",
  "vivienda_pre2013": "Deducción por vivienda habitual (pre-2013)",
  "rentas_extranjero": "Rentas del extranjero",
  "ganancias_patrimoniales": "Ganancias o pérdidas patrimoniales",
  "herencias_donaciones": "Herencias o donaciones",
  "imputacion_rentas": "Imputación de rentas inmobiliarias",
  "planes_pensiones_complejos": "Planes de pensiones con rescate",
  "tributacion_conjunta": "Tributación conjunta con situación especial",
  "discapacidad_alta": "Discapacidad igual o superior al 65%",
  "multiple_complejidad": "Múltiples factores de complejidad",
};

/**
 * Calcula el próximo día hábil (lunes-viernes) a partir de hoy.
 * Devuelve una fecha formateada en español.
 */
function proximoDiaHabilLabel(offsetDias = 1): { fecha: Date; label: string } {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + offsetDias);
  // Si cae en sábado → lunes
  if (fecha.getDay() === 6) fecha.setDate(fecha.getDate() + 2);
  // Si cae en domingo → lunes
  if (fecha.getDay() === 0) fecha.setDate(fecha.getDate() + 1);

  const label = fecha.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return { fecha, label };
}

/**
 * Formatea un ISO datetime en texto legible en español.
 * Ej: "2026-04-02T10:00:00+02:00" → "jueves 2 de abril a las 10:00"
 */
function formatearSlot(isoSlot: string): string {
  try {
    const fecha = new Date(isoSlot);
    return fecha.toLocaleString("es-ES", {
      timeZone: "Europe/Madrid",
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoSlot;
  }
}

export default function AsesorFiscal() {
  const [, navigate] = useLocation();

  // Leer parámetros de la URL (pasados desde el simulador)
  const urlParams = new URLSearchParams(window.location.search);
  const expedienteId = urlParams.get("expediente") || undefined;
  const motivoUrl = urlParams.get("motivo") || undefined;
  const ahorroUrl = urlParams.get("ahorro") ? parseFloat(urlParams.get("ahorro")!) : undefined;
  const precioUrl = urlParams.get("precio") ? parseInt(urlParams.get("precio")!) : undefined;

  // Calcular el próximo día hábil para mostrar al usuario
  const { label: proximoDiaLabel } = proximoDiaHabilLabel(1);

  // Estado del formulario
  const [nombre, setNombre] = useState(urlParams.get("nombre") || "");
  const [nif, setNif] = useState(urlParams.get("nif") || "");
  const [email, setEmail] = useState(urlParams.get("email") || "");
  const [telefono, setTelefono] = useState(urlParams.get("telefono") || "");
  const [franjaHoraria, setFranjaHoraria] = useState("flexible");
  const [descripcion, setDescripcion] = useState("");
  const [consentimiento, setConsentimiento] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Estado de la solicitud
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [solicitudId, setSolicitudId] = useState<number | null>(null);
  const [derivacionId, setDerivacionId] = useState<string | null>(null);
  const [reservedSlot, setReservedSlot] = useState<string | null>(null);

  const crearSolicitud = trpc.asesor.crearSolicitud.useMutation({
    onSuccess: (data) => {
      setSolicitudEnviada(true);
      setSolicitudId(data.solicitudId || null);
      setDerivacionId(data.derivacionId || null);
      setReservedSlot(data.reservedSlot || null);
    },
    onError: (error) => {
      toast.error("Error al enviar la solicitud: " + error.message);
    },
  });

  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {};
    if (!nombre.trim() || nombre.trim().length < 2) {
      nuevosErrores.nombre = "El nombre es obligatorio (mínimo 2 caracteres)";
    }
    if (!nif.trim() || nif.trim().length < 8) {
      nuevosErrores.nif = "El NIF/NIE es obligatorio";
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nuevosErrores.email = "Introduce un email válido";
    }
    if (!telefono.trim() || telefono.trim().length < 9) {
      nuevosErrores.telefono = "El teléfono es obligatorio (mínimo 9 dígitos)";
    }
    if (!consentimiento) {
      nuevosErrores.consentimiento = "Debes aceptar la política de privacidad";
    }
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    crearSolicitud.mutate({
      expedienteId,
      nombre: nombre.trim(),
      nif: nif.trim().toUpperCase(),
      email: email.trim().toLowerCase(),
      telefono: telefono.trim(),
      franjaHoraria,
      motivoComplejidad: motivoUrl,
      descripcionSituacion: descripcion.trim() || undefined,
      resultadoSimulador: ahorroUrl ? { ahorro_total: ahorroUrl } : undefined,
      precioEstimado: precioUrl,
      consentimientoRGPD: consentimiento,
      // Capturar user agent para audit log
      userAgent: navigator.userAgent,
    });
  };

  // ==================== PANTALLA DE CONFIRMACIÓN ====================
  if (solicitudEnviada) {
    const slotFormateado = reservedSlot ? formatearSlot(reservedSlot) : proximoDiaLabel;
    const franjaLabel = FRANJAS.find(f => f.id === franjaHoraria)?.label || "Flexible";

    return (
      <div className="min-h-screen flex flex-col bg-[#f7f5f2]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-16 px-4">
          <div className="max-w-lg w-full text-center">
            {/* Icono de éxito */}
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <h1 className="font-['DM_Sans'] text-3xl font-bold text-[#1a365d] mb-3">
              ¡Solicitud recibida!
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              Hemos recibido tu solicitud de revisión. Un asesor especializado se pondrá en contacto contigo en <strong>menos de 24 horas</strong>.
            </p>

            {/* Slot reservado */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6 text-left">
              <div className="flex items-center gap-3 mb-2">
                <CalendarCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <h3 className="font-['DM_Sans'] font-semibold text-emerald-800">
                  Cita provisional reservada
                </h3>
              </div>
              <p className="text-emerald-700 font-medium capitalize">
                {slotFormateado}
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                Franja: {franjaLabel} · Estado: <span className="font-semibold">Provisional</span> (pendiente confirmación del asesor)
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                Recibirás un email de confirmación en los próximos minutos con todos los detalles.
              </p>
            </div>

            {/* Resumen de la solicitud */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-left mb-8 shadow-sm">
              <h3 className="font-['DM_Sans'] font-semibold text-[#1a365d] mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Resumen de tu solicitud
              </h3>
              <div className="space-y-3 text-sm">
                {solicitudId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nº de solicitud</span>
                    <span className="font-semibold text-[#1a365d]">SOL-{String(solicitudId).padStart(5, "0")}</span>
                  </div>
                )}
                {derivacionId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">ID derivación</span>
                    <span className="font-mono text-xs text-gray-500">{derivacionId}</span>
                  </div>
                )}
                {expedienteId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Expediente</span>
                    <span className="font-mono text-sm">{expedienteId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Nombre</span>
                  <span className="font-medium">{nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium">{email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Teléfono</span>
                  <span className="font-medium">{telefono}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Franja preferida</span>
                  <span className="font-medium">{franjaLabel}</span>
                </div>
                {ahorroUrl && (
                  <div className="flex justify-between pt-3 border-t border-gray-100">
                    <span className="text-gray-500">Ahorro estimado</span>
                    <span className="font-bold text-emerald-600 text-base">{ahorroUrl.toFixed(2)} €</span>
                  </div>
                )}
                {precioUrl && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Precio estimado</span>
                    <span className="font-bold text-[#1a365d] text-base">{precioUrl} €</span>
                  </div>
                )}
              </div>
            </div>

            {/* Próximos pasos */}
            <div className="bg-blue-50 rounded-xl p-5 text-left mb-8">
              <h3 className="font-semibold text-blue-900 mb-3 text-sm">¿Qué pasa ahora?</h3>
              <div className="space-y-2">
                {[
                  "Recibirás un email de confirmación provisional en los próximos minutos",
                  "El asesor revisará tu expediente y confirmará la cita en tu franja preferida",
                  "Recibirás un recordatorio 24 h antes y 1 h antes de la llamada",
                  "El asesor te presentará un presupuesto cerrado antes de empezar",
                  "Si aceptas, gestionamos tu declaración de principio a fin",
                ].map((paso, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-blue-800">
                    <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-700">{i + 1}</span>
                    </div>
                    <span>{paso}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="border-[#1a365d] text-[#1a365d]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al inicio
              </Button>
              <Button
                onClick={() => navigate("/renta")}
                className="bg-[#059669] hover:bg-[#047857] text-white"
              >
                Hacer otra simulación
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ==================== FORMULARIO PRINCIPAL ====================
  return (
    <div className="min-h-screen flex flex-col bg-[#f7f5f2]">
      <Navbar />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 rounded-full px-4 py-1.5 mb-4 text-sm font-medium">
              <AlertTriangle className="w-4 h-4" />
              Tu caso requiere revisión especializada
            </div>
            <h1 className="font-['DM_Sans'] text-3xl lg:text-4xl font-bold text-[#1a365d] mb-3">
              Habla con un asesor fiscal
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Tu situación tiene características que requieren revisión humana para maximizar tu resultado.
              Nuestros asesores te contactarán en menos de 24 horas.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8">

            {/* ===== COLUMNA IZQUIERDA: Info del caso ===== */}
            <div className="lg:col-span-2 space-y-5">

              {/* Motivo de derivación */}
              {motivoUrl && (
                <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm">
                  <h3 className="font-['DM_Sans'] font-semibold text-[#1a365d] mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Por qué derivamos tu caso
                  </h3>
                  <p className="text-sm text-gray-700 bg-amber-50 rounded-lg p-3">
                    {MOTIVOS_LEGIBLES[motivoUrl] || motivoUrl}
                  </p>
                </div>
              )}

              {/* Ahorro estimado */}
              {ahorroUrl && ahorroUrl > 0 && (
                <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5 shadow-sm">
                  <h3 className="font-['DM_Sans'] font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Ahorro estimado
                  </h3>
                  <p className="text-3xl font-bold text-emerald-600 font-['DM_Sans']">
                    {ahorroUrl.toFixed(2)} €
                  </p>
                  <p className="text-xs text-emerald-700 mt-1">
                    vs. borrador de Hacienda. El asesor puede optimizarlo aún más.
                  </p>
                </div>
              )}

              {/* Expediente */}
              {expedienteId && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="font-['DM_Sans'] font-semibold text-[#1a365d] mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Tu expediente
                  </h3>
                  <p className="font-mono text-sm text-gray-600 bg-gray-50 rounded px-3 py-2">
                    {expedienteId}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    El asesor tendrá acceso a todos tus datos del simulador.
                  </p>
                </div>
              )}

              {/* Disponibilidad */}
              <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5 shadow-sm">
                <h3 className="font-['DM_Sans'] font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Próxima disponibilidad
                </h3>
                <p className="text-sm text-blue-700 capitalize font-medium">
                  {proximoDiaLabel}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Primer día hábil disponible para la llamada.
                </p>
              </div>

              {/* Garantías */}
              <div className="bg-[#1a365d] rounded-2xl p-5 text-white">
                <h3 className="font-['DM_Sans'] font-semibold mb-4">Nuestras garantías</h3>
                <div className="space-y-3">
                  {[
                    { icon: Clock, text: "Respuesta en menos de 24 horas" },
                    { icon: Shield, text: "Precio cerrado antes de empezar" },
                    { icon: UserCheck, text: "Asesor especializado en tu caso" },
                    { icon: CheckCircle2, text: "Sin compromiso hasta que aceptes" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <item.icon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-white/80">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ===== COLUMNA DERECHA: Formulario ===== */}
            <div className="lg:col-span-3">
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-7 shadow-sm">
                <h2 className="font-['DM_Sans'] text-xl font-bold text-[#1a365d] mb-6">
                  Solicitar contacto con asesor
                </h2>

                {/* Datos personales */}
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="nombre" className="text-sm font-medium text-gray-700 mb-1 block">
                      Nombre completo *
                    </Label>
                    <Input
                      id="nombre"
                      value={nombre}
                      onChange={e => setNombre(e.target.value)}
                      placeholder="María García López"
                      className={errores.nombre ? "border-red-400" : ""}
                    />
                    {errores.nombre && <p className="text-red-500 text-xs mt-1">{errores.nombre}</p>}
                  </div>
                  <div>
                    <Label htmlFor="nif" className="text-sm font-medium text-gray-700 mb-1 block">
                      NIF / NIE *
                    </Label>
                    <Input
                      id="nif"
                      value={nif}
                      onChange={e => setNif(e.target.value.toUpperCase())}
                      placeholder="12345678A"
                      className={errores.nif ? "border-red-400" : ""}
                    />
                    {errores.nif && <p className="text-red-500 text-xs mt-1">{errores.nif}</p>}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1 block">
                      <Mail className="w-3.5 h-3.5 inline mr-1" />
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="maria@ejemplo.com"
                      className={errores.email ? "border-red-400" : ""}
                    />
                    {errores.email && <p className="text-red-500 text-xs mt-1">{errores.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="telefono" className="text-sm font-medium text-gray-700 mb-1 block">
                      <Phone className="w-3.5 h-3.5 inline mr-1" />
                      Teléfono *
                    </Label>
                    <Input
                      id="telefono"
                      type="tel"
                      value={telefono}
                      onChange={e => setTelefono(e.target.value)}
                      placeholder="612 345 678"
                      className={errores.telefono ? "border-red-400" : ""}
                    />
                    {errores.telefono && <p className="text-red-500 text-xs mt-1">{errores.telefono}</p>}
                  </div>
                </div>

                {/* Franja horaria */}
                <div className="mb-6">
                  <Label className="text-sm font-medium text-gray-700 mb-1 block">
                    <Calendar className="w-3.5 h-3.5 inline mr-1" />
                    ¿Cuándo prefieres que te llamemos?
                  </Label>
                  <p className="text-xs text-gray-500 mb-3">
                    Próxima disponibilidad: <span className="font-medium capitalize text-[#1a365d]">{proximoDiaLabel}</span>
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {FRANJAS.map((franja) => (
                      <button
                        key={franja.id}
                        type="button"
                        onClick={() => setFranjaHoraria(franja.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          franjaHoraria === franja.id
                            ? "border-[#059669] bg-emerald-50 ring-1 ring-[#059669]"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="text-lg mb-1">{franja.icon}</div>
                        <div className="text-xs font-semibold text-gray-800">{franja.label}</div>
                        <div className="text-xs text-gray-500">{franja.sublabel}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Descripción opcional */}
                <div className="mb-6">
                  <Label htmlFor="descripcion" className="text-sm font-medium text-gray-700 mb-1 block">
                    Cuéntanos algo más sobre tu situación <span className="text-gray-400">(opcional)</span>
                  </Label>
                  <Textarea
                    id="descripcion"
                    value={descripcion}
                    onChange={e => setDescripcion(e.target.value)}
                    placeholder="Ej: Vendí un piso en 2025, tengo una hipoteca pre-2013 y también soy autónomo a tiempo parcial..."
                    rows={3}
                    className="resize-none"
                  />
                </div>

                {/* RGPD */}
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="consentimiento"
                      checked={consentimiento}
                      onCheckedChange={(v) => setConsentimiento(v === true)}
                      className="mt-0.5"
                    />
                    <Label htmlFor="consentimiento" className="text-sm text-gray-600 cursor-pointer leading-relaxed">
                      Acepto la{" "}
                      <a href="/privacidad" className="text-[#059669] underline" target="_blank">
                        política de privacidad
                      </a>{" "}
                      y consiento el tratamiento de mis datos para recibir asesoramiento fiscal personalizado.
                    </Label>
                  </div>
                  {errores.consentimiento && (
                    <p className="text-red-500 text-xs mt-2 ml-7">{errores.consentimiento}</p>
                  )}
                </div>

                {/* Botón enviar */}
                <Button
                  type="submit"
                  disabled={crearSolicitud.isPending}
                  className="w-full bg-[#059669] hover:bg-[#047857] text-white font-semibold h-12 text-base shadow-lg shadow-emerald-900/20"
                >
                  {crearSolicitud.isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enviando solicitud...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5" />
                      Solicitar contacto con asesor
                    </span>
                  )}
                </Button>

                <p className="text-center text-xs text-gray-400 mt-3">
                  Sin compromiso · Respuesta en menos de 24 horas · Precio cerrado antes de empezar
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
