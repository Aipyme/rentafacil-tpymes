/**
 * Motor Fiscal IRPF 2025 — Renta Fácil TPymes
 * Fuente: Manual Práctico IRPF 2025 AEAT
 * Normativa: Ley 35/2006 IRPF y modificaciones RDL 4/2024
 *
 * Cubre:
 * - Escalas de gravamen general y del ahorro (estatal + autonómica)
 * - Mínimo personal y familiar
 * - Reducciones de la base imponible (trabajo, planes de pensiones, alquiler)
 * - Deducciones de la cuota íntegra estatales
 * - Deducciones autonómicas de las principales CCAA
 * - Cálculo completo: cuota íntegra → cuota líquida → cuota diferencial → resultado
 */

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export type ComunidadAutonoma =
  | "andalucia"
  | "aragon"
  | "asturias"
  | "baleares"
  | "canarias"
  | "cantabria"
  | "castilla_la_mancha"
  | "castilla_leon"
  | "cataluna"
  | "extremadura"
  | "galicia"
  | "madrid"
  | "murcia"
  | "navarra"
  | "la_rioja"
  | "valencia"
  | "pais_vasco";

export interface DatosContribuyente {
  // Situación personal
  edad: number;
  discapacidadPorcentaje: number; // 0, 33, 65, 75
  comunidadAutonoma: ComunidadAutonoma;
  declaracionConjunta: boolean;
  conyugeDiscapacidad: boolean;

  // Ingresos del trabajo
  ingresosTrabajo: number; // Rendimientos íntegros del trabajo (nómina bruta)
  cotizacionSS: number; // Cuotas SS pagadas por el trabajador
  retencionesIRPF: number; // Total retenciones IRPF del año

  // Ingresos de actividades económicas
  ingresosAutonomo: number; // Rendimientos netos actividades económicas
  esAutonomo: boolean;

  // Ingresos del capital inmobiliario
  ingresosAlquiler: number; // Ingresos brutos por alquiler
  gastosAlquiler: number; // Gastos deducibles del alquiler
  esAlquilerViviendaHabitual: boolean; // Si el alquiler es de vivienda habitual del inquilino

  // Ingresos del capital mobiliario (ahorro)
  dividendos: number;
  intereses: number;
  gananciasPatrimoniales: number; // Ganancias patrimoniales (acciones, fondos, etc.)
  perdidasPatrimoniales: number; // Pérdidas patrimoniales compensables

  // Situación familiar
  numHijos: number; // Hijos menores de 25 años (o discapacitados)
  edadesHijos: number[]; // Edades de cada hijo
  hijosDiscapacitados: number[]; // Porcentaje discapacidad de cada hijo (0 si no)
  numAscendientes: number; // Ascendientes mayores de 65 años a cargo
  ascendientesDiscapacitados: boolean;
  familiaNumerosa: boolean; // Familia numerosa general o especial
  familiaNumerosaEspecial: boolean;
  madreTrabajaFueraHogar: boolean; // Para deducción por maternidad
  hijosMenores3: number; // Hijos menores de 3 años (deducción maternidad)

  // Vivienda
  alquilerViviendaHabitual: boolean; // Paga alquiler por su vivienda habitual
  alquilerAnual: number; // Importe anual del alquiler pagado
  contratoAlquilerAntes2015: boolean; // Contrato firmado antes del 01/01/2015
  hipotecaAntes2013: boolean; // Hipoteca sobre vivienda habitual antes del 01/01/2013
  hipotecaAnual: number; // Amortización + intereses hipoteca pagados en el año

  // Aportaciones
  aportacionesPlanPensiones: number; // Aportaciones a planes de pensiones
  aportacionesMutualidades: number; // Aportaciones a mutualidades de previsión social

  // Eficiencia energética
  obrasEficienciaEnergetica: boolean;
  importeObrasEnergeticas: number; // Importe obras de mejora energética
  tipoMejoraEnergetica: "reduccion20" | "reduccion40" | "reduccion60" | "ninguna";

  // Donativos
  donativos: number; // Donativos a entidades sin ánimo de lucro
  donativosHabitualONG: boolean; // Si es donativo recurrente a la misma ONG

  // Cuotas sindicales y colegios profesionales
  cuotasSindicales: number;
  cuotasColegiosProfesionales: number; // Máx. 500 €

  // Retenciones adicionales
  retencionesAlquiler: number; // Retenciones por alquiler de inmuebles
  retencionesCapitalMobiliario: number; // Retenciones sobre dividendos/intereses
  pagosAcuentaAutonomo: number; // Pagos fraccionados autónomo

  // Autonómicas específicas
  alquilerJoven: boolean; // Menor de 35 años (algunas CCAA)
  adquisicionViviendaJoven: boolean; // Compra vivienda habitual joven
  gastosEscolaridad: number; // Gastos escolaridad hijos (deducciones autonómicas)
  gastosGuarderia: number; // Gastos guardería hijos < 3 años
}

export interface DeduccionAplicada {
  nombre: string;
  casilla: string;
  importe: number;
  descripcion: string;
  normativa: string;
}

export interface ResultadoFiscal {
  // Bases imponibles
  rendimientoNetoTrabajo: number;
  rendimientoNetoCapitalInmobiliario: number;
  rendimientoNetoCapitalMobiliario: number;
  rendimientoNetoActividades: number;
  gananciaPatrimonialNeta: number;
  baseImponibleGeneral: number;
  baseImponibleAhorro: number;

  // Reducciones
  reduccionPlanPensiones: number;
  reduccionDeclaracionConjunta: number;
  reduccionMinimosPersonalesFamiliares: number;
  baseLiquidableGeneral: number;
  baseLiquidableAhorro: number;

  // Mínimo personal y familiar
  minimoPersonal: number;
  minimoDescendientes: number;
  minimoAscendientes: number;
  minimoDiscapacidad: number;
  minimoTotal: number;

  // Cuotas íntegras
  cuotaIntegraEstatal: number;
  cuotaIntegraAutonomica: number;
  cuotaIntegraTotal: number;

  // Deducciones aplicadas
  deduccionesEstatales: DeduccionAplicada[];
  deduccionesAutonomicas: DeduccionAplicada[];
  totalDeduccionesEstatales: number;
  totalDeduccionesAutonomicas: number;

  // Cuota líquida
  cuotaLiquidaEstatal: number;
  cuotaLiquidaAutonomica: number;
  cuotaLiquidaTotal: number;

  // Resultado final
  totalRetenciones: number;
  cuotaDiferencial: number; // Negativo = a devolver, positivo = a pagar
  resultado: "devolucion" | "pagar" | "cero";
  importeResultado: number; // Siempre positivo
  tipoMedioEfectivo: number; // Porcentaje

  // Ahorro detectado vs borrador
  ahorroPotencial: number; // Cuánto más recupera vs no aplicar deducciones
}

// ─── ESCALAS DE GRAVAMEN ─────────────────────────────────────────────────────

interface TramoEscala {
  desde: number;
  cuotaAcumulada: number;
  tipo: number; // porcentaje como decimal (0.095 = 9.5%)
}

// Escala general estatal 2025 (Art. 63.1.1º LIRPF)
const ESCALA_GENERAL_ESTATAL: TramoEscala[] = [
  { desde: 0, cuotaAcumulada: 0, tipo: 0.095 },
  { desde: 12450, cuotaAcumulada: 1182.75, tipo: 0.12 },
  { desde: 20200, cuotaAcumulada: 2112.75, tipo: 0.15 },
  { desde: 35200, cuotaAcumulada: 4362.75, tipo: 0.185 },
  { desde: 60000, cuotaAcumulada: 8950.75, tipo: 0.225 },
  { desde: 300000, cuotaAcumulada: 62950.75, tipo: 0.245 },
];

// Escala del ahorro estatal 2025 (Art. 66 LIRPF — modificado RDL 4/2024)
const ESCALA_AHORRO_ESTATAL: TramoEscala[] = [
  { desde: 0, cuotaAcumulada: 0, tipo: 0.095 },
  { desde: 6000, cuotaAcumulada: 570, tipo: 0.10 },
  { desde: 50000, cuotaAcumulada: 4970, tipo: 0.14 },
  { desde: 200000, cuotaAcumulada: 25970, tipo: 0.27 },
  { desde: 300000, cuotaAcumulada: 52970, tipo: 0.30 },
];

// Escalas autonómicas 2025 por comunidad
// Fuente: Manual Práctico IRPF 2025 Parte 1, Capítulo 15
const ESCALAS_AUTONOMICAS: Record<ComunidadAutonoma, TramoEscala[]> = {
  andalucia: [
    { desde: 0, cuotaAcumulada: 0, tipo: 0.095 },
    { desde: 12450, cuotaAcumulada: 1182.75, tipo: 0.12 },
    { desde: 20200, cuotaAcumulada: 2112.75, tipo: 0.15 },
    { desde: 35200, cuotaAcumulada: 4362.75, tipo: 0.185 },
    { desde: 60000, cuotaAcumulada: 8950.75, tipo: 0.225 },
    { desde: 300000, cuotaAcumulada: 62950.75, tipo: 0.245 },
  ],
  aragon: [
    { desde: 0, cuotaAcumulada: 0, tipo: 0.10 },
    { desde: 12450, cuotaAcumulada: 1245, tipo: 0.1224 },
    { desde: 20200, cuotaAcumulada: 2193.6, tipo: 0.1566 },
    { desde: 35200, cuotaAcumulada: 4543.8, tipo: 0.19 },
    { desde: 60000, cuotaAcumulada: 9255.8, tipo: 0.2375 },
    { desde: 120000, cuotaAcumulada: 23505.8, tipo: 0.245 },
    { desde: 300000, cuotaAcumulada: 67605.8, tipo: 0.25 },
  ],
  asturias: [
    { desde: 0, cuotaAcumulada: 0, tipo: 0.10 },
    { desde: 12450, cuotaAcumulada: 1245, tipo: 0.12 },
    { desde: 17707, cuotaAcumulada: 1875.84, tipo: 0.14 },
    { desde: 33007, cuotaAcumulada: 4017.84, tipo: 0.185 },
    { desde: 53407, cuotaAcumulada: 7791.84, tipo: 0.21 },
    { desde: 70000, cuotaAcumulada: 11276.34, tipo: 0.2325 },
    { desde: 90000, cuotaAcumulada: 15926.34, tipo: 0.245 },
    { desde: 175000, cuotaAcumulada: 36751.34, tipo: 0.25 },
  ],
  baleares: [
    { desde: 0, cuotaAcumulada: 0, tipo: 0.09 },
    { desde: 10000, cuotaAcumulada: 900, tipo: 0.1125 },
    { desde: 18000, cuotaAcumulada: 1800, tipo: 0.1575 },
    { desde: 30000, cuotaAcumulada: 3690, tipo: 0.185 },
    { desde: 48000, cuotaAcumulada: 7020, tipo: 0.215 },
    { desde: 70000, cuotaAcumulada: 11750, tipo: 0.235 },
    { desde: 100000, cuotaAcumulada: 18800, tipo: 0.245 },
    { desde: 150000, cuotaAcumulada: 31050, tipo: 0.25 },
  ],
  canarias: [
    { desde: 0, cuotaAcumulada: 0, tipo: 0.09 },
    { desde: 12450, cuotaAcumulada: 1120.5, tipo: 0.1175 },
    { desde: 20200, cuotaAcumulada: 2031.625, tipo: 0.1275 },
    { desde: 35200, cuotaAcumulada: 3943.375, tipo: 0.185 },
    { desde: 60000, cuotaAcumulada: 8531.375, tipo: 0.2375 },
    { desde: 90000, cuotaAcumulada: 15656.375, tipo: 0.245 },
  ],
  cantabria: [
    { desde: 0, cuotaAcumulada: 0, tipo: 0.095 },
    { desde: 12450, cuotaAcumulada: 1182.75, tipo: 0.12 },
    { desde: 20200, cuotaAcumulada: 2112.75, tipo: 0.14 },
    { desde: 34000, cuotaAcumulada: 4044.75, tipo: 0.185 },
    { desde: 60000, cuotaAcumulada: 8854.75, tipo: 0.23 },
    { desde: 90000, cuotaAcumulada: 15754.75, tipo: 0.24 },
    { desde: 150000, cuotaAcumulada: 30154.75, tipo: 0.245 },
  ],
  castilla_la_mancha: [
    { desde: 0, cuotaAcumulada: 0, tipo: 0.095 },
    { desde: 12450, cuotaAcumulada: 1182.75, tipo: 0.12 },
    { desde: 20200, cuotaAcumulada: 2112.75, tipo: 0.15 },
    { desde: 35200, cuotaAcumulada: 4362.75, tipo: 0.185 },
    { desde: 60000, cuotaAcumulada: 8950.75, tipo: 0.225 },
    { desde: 300000, cuotaAcumulada: 62950.75, tipo: 0.245 },
  ],
  castilla_leon: [
    { desde: 0, cuotaAcumulada: 0, tipo: 0.09 },
    { desde: 12450, cuotaAcumulada: 1120.5, tipo: 0.115 },
    { desde: 20200, cuotaAcumulada: 2011.75, tipo: 0.14 },
    { desde: 35200, cuotaAcumulada: 4111.75, tipo: 0.185 },
    { desde: 60000, cuotaAcumulada: 8699.75, tipo: 0.225 },
    { desde: 300000, cuotaAcumulada: 62699.75, tipo: 0.245 },
  ],
  cataluna: [
    { desde: 0, cuotaAcumulada: 0, tipo: 0.105 },
    { desde: 12450, cuotaAcumulada: 1307.25, tipo: 0.12 },
    { desde: 17707, cuotaAcumulada: 1938.09, tipo: 0.14 },
    { desde: 33007, cuotaAcumulada: 4080.09, tipo: 0.185 },
    { desde: 53407, cuotaAcumulada: 7854.09, tipo: 0.2175 },
    { desde: 90000, cuotaAcumulada: 15815.34, tipo: 0.235 },
    { desde: 120000, cuotaAcumulada: 22865.34, tipo: 0.245 },
    { desde: 175000, cuotaAcumulada: 36340.34, tipo: 0.2575 },
  ],
  extremadura: [
    { desde: 0, cuotaAcumulada: 0, tipo: 0.08 },
    { desde: 12450, cuotaAcumulada: 996, tipo: 0.115 },
    { desde: 20200, cuotaAcumulada: 1887.25, tipo: 0.1575 },
    { desde: 35200, cuotaAcumulada: 4250.5, tipo: 0.185 },
    { desde: 60000, cuotaAcumulada: 8838.5, tipo: 0.2275 },
    { desde: 120000, cuotaAcumulada: 22488.5, tipo: 0.245 },
    { desde: 175000, cuotaAcumulada: 35963.5, tipo: 0.25 },
  ],
  galicia: [
    { desde: 0, cuotaAcumulada: 0, tipo: 0.09 },
    { desde: 12450, cuotaAcumulada: 1120.5, tipo: 0.115 },
    { desde: 20200, cuotaAcumulada: 2011.75, tipo: 0.145 },
    { desde: 35200, cuotaAcumulada: 4186.75, tipo: 0.185 },
    { desde: 60000, cuotaAcumulada: 8774.75, tipo: 0.225 },
    { desde: 70000, cuotaAcumulada: 11024.75, tipo: 0.235 },
    { desde: 300000, cuotaAcumulada: 65074.75, tipo: 0.245 },
  ],
  madrid: [
    { desde: 0, cuotaAcumulada: 0, tipo: 0.09 },
    { desde: 12450, cuotaAcumulada: 1120.5, tipo: 0.1175 },
    { desde: 17707, cuotaAcumulada: 1738.2, tipo: 0.1275 },
    { desde: 33007, cuotaAcumulada: 3688.95, tipo: 0.185 },
    { desde: 53407, cuotaAcumulada: 7463.95, tipo: 0.2375 },
    { desde: 300000, cuotaAcumulada: 66076.2, tipo: 0.245 },
  ],
  murcia: [
    { desde: 0, cuotaAcumulada: 0, tipo: 0.095 },
    { desde: 12450, cuotaAcumulada: 1182.75, tipo: 0.12 },
    { desde: 20200, cuotaAcumulada: 2112.75, tipo: 0.15 },
    { desde: 35200, cuotaAcumulada: 4362.75, tipo: 0.185 },
    { desde: 60000, cuotaAcumulada: 8950.75, tipo: 0.225 },
    { desde: 300000, cuotaAcumulada: 62950.75, tipo: 0.245 },
  ],
  navarra: [
    // Régimen foral — escala aproximada
    { desde: 0, cuotaAcumulada: 0, tipo: 0.085 },
    { desde: 12450, cuotaAcumulada: 1058.25, tipo: 0.12 },
    { desde: 20200, cuotaAcumulada: 1988.25, tipo: 0.15 },
    { desde: 35200, cuotaAcumulada: 4238.25, tipo: 0.185 },
    { desde: 60000, cuotaAcumulada: 8826.25, tipo: 0.225 },
    { desde: 300000, cuotaAcumulada: 62826.25, tipo: 0.245 },
  ],
  la_rioja: [
    { desde: 0, cuotaAcumulada: 0, tipo: 0.09 },
    { desde: 12450, cuotaAcumulada: 1120.5, tipo: 0.115 },
    { desde: 20200, cuotaAcumulada: 2011.75, tipo: 0.14 },
    { desde: 35200, cuotaAcumulada: 4121.75, tipo: 0.185 },
    { desde: 60000, cuotaAcumulada: 8709.75, tipo: 0.225 },
    { desde: 300000, cuotaAcumulada: 62709.75, tipo: 0.245 },
  ],
  valencia: [
    { desde: 0, cuotaAcumulada: 0, tipo: 0.10 },
    { desde: 12450, cuotaAcumulada: 1245, tipo: 0.12 },
    { desde: 20200, cuotaAcumulada: 2175, tipo: 0.14 },
    { desde: 35200, cuotaAcumulada: 4275, tipo: 0.185 },
    { desde: 60000, cuotaAcumulada: 8863, tipo: 0.2375 },
    { desde: 120000, cuotaAcumulada: 23113, tipo: 0.245 },
    { desde: 175000, cuotaAcumulada: 36588, tipo: 0.25 },
    { desde: 300000, cuotaAcumulada: 67838, tipo: 0.29 },
  ],
  pais_vasco: [
    // Régimen foral — escala aproximada
    { desde: 0, cuotaAcumulada: 0, tipo: 0.085 },
    { desde: 12450, cuotaAcumulada: 1058.25, tipo: 0.12 },
    { desde: 20200, cuotaAcumulada: 1988.25, tipo: 0.15 },
    { desde: 35200, cuotaAcumulada: 4238.25, tipo: 0.185 },
    { desde: 60000, cuotaAcumulada: 8826.25, tipo: 0.225 },
    { desde: 300000, cuotaAcumulada: 62826.25, tipo: 0.245 },
  ],
};

// Escala del ahorro autonómica 2025 (igual para todas las CCAA de régimen común)
const ESCALA_AHORRO_AUTONOMICA: TramoEscala[] = [
  { desde: 0, cuotaAcumulada: 0, tipo: 0.095 },
  { desde: 6000, cuotaAcumulada: 570, tipo: 0.10 },
  { desde: 50000, cuotaAcumulada: 4970, tipo: 0.14 },
  { desde: 200000, cuotaAcumulada: 25970, tipo: 0.27 },
  { desde: 300000, cuotaAcumulada: 52970, tipo: 0.30 },
];

// ─── FUNCIONES DE CÁLCULO ────────────────────────────────────────────────────

/** Aplica una escala progresiva a una base */
function aplicarEscala(base: number, escala: TramoEscala[]): number {
  if (base <= 0) return 0;
  let cuota = 0;
  for (let i = escala.length - 1; i >= 0; i--) {
    if (base > escala[i].desde) {
      cuota = escala[i].cuotaAcumulada + (base - escala[i].desde) * escala[i].tipo;
      break;
    }
  }
  return Math.max(0, cuota);
}

/** Calcula la reducción por rendimientos del trabajo (Art. 20 LIRPF) */
function calcularReduccionTrabajo(rendimientoNeto: number): number {
  // Rendimiento neto = ingresos - gastos deducibles (SS, sindicatos, etc.)
  if (rendimientoNeto <= 14852) {
    return 7302; // Reducción máxima para rentas bajas
  } else if (rendimientoNeto <= 17673.52) {
    // Reducción decreciente entre 14.852 y 17.673,52 €
    return Math.max(0, 7302 - 1.75 * (rendimientoNeto - 14852));
  }
  return 0;
}

/** Calcula el mínimo personal (Art. 57 LIRPF) */
function calcularMinimoPersonal(datos: DatosContribuyente): number {
  let minimo = 5550; // Mínimo general

  if (datos.edad >= 65) minimo += 1150;
  if (datos.edad >= 75) minimo += 1400;

  // Declaración conjunta: se suma el mínimo del cónyuge (5.550 €)
  if (datos.declaracionConjunta) {
    minimo += 5550;
    if (datos.conyugeDiscapacidad) minimo += 3000; // Discapacidad cónyuge
  }

  return minimo;
}

/** Calcula el mínimo por descendientes (Art. 58 LIRPF) */
function calcularMinimoDescendientes(datos: DatosContribuyente): number {
  let minimo = 0;
  const hijos = datos.numHijos;

  // Mínimos por orden de hijo (2025)
  const minimosPorOrden = [2400, 2700, 4000, 4500]; // 1º, 2º, 3º, 4º y siguientes

  for (let i = 0; i < hijos; i++) {
    minimo += i < minimosPorOrden.length - 1 ? minimosPorOrden[i] : minimosPorOrden[3];
  }

  // Incremento por hijos menores de 3 años: +2.800 € por cada uno
  minimo += datos.hijosMenores3 * 2800;

  // Incremento por hijos con discapacidad
  for (const discap of datos.hijosDiscapacitados) {
    if (discap >= 33 && discap < 65) minimo += 3000;
    if (discap >= 65) minimo += 9000;
  }

  return minimo;
}

/** Calcula el mínimo por ascendientes (Art. 59 LIRPF) */
function calcularMinimoAscendientes(datos: DatosContribuyente): number {
  let minimo = 0;
  if (datos.numAscendientes > 0) {
    minimo += datos.numAscendientes * 1150;
    // Si el ascendiente tiene más de 75 años
    // (simplificamos: añadimos 1.400 si hay ascendientes)
    minimo += datos.numAscendientes * 1400; // Asumimos > 75 para ser conservadores
  }
  if (datos.ascendientesDiscapacitados) {
    minimo += 3000; // Discapacidad >= 33%
  }
  return minimo;
}

/** Calcula el mínimo por discapacidad del contribuyente (Art. 60 LIRPF) */
function calcularMinimoDiscapacidad(datos: DatosContribuyente): number {
  let minimo = 0;
  if (datos.discapacidadPorcentaje >= 33 && datos.discapacidadPorcentaje < 65) {
    minimo += 3000;
  } else if (datos.discapacidadPorcentaje >= 65) {
    minimo += 9000;
  }
  // Gastos de asistencia si discapacidad >= 65% o necesita ayuda de terceros
  if (datos.discapacidadPorcentaje >= 65) {
    minimo += 3000; // Gastos de asistencia
  }
  return minimo;
}

/** Calcula la cuota íntegra aplicando la escala al mínimo personal y familiar */
function calcularCuotaMinimo(minimo: number, escala: TramoEscala[]): number {
  return aplicarEscala(minimo, escala);
}

// ─── DEDUCCIONES ESTATALES ───────────────────────────────────────────────────

function calcularDeduccionesEstatales(
  datos: DatosContribuyente,
  cuotaIntegraEstatal: number,
  cuotaIntegraAutonomica: number
): DeduccionAplicada[] {
  const deducciones: DeduccionAplicada[] = [];
  const cuotaTotal = cuotaIntegraEstatal + cuotaIntegraAutonomica;

  // 1. Deducción por maternidad (Art. 81 LIRPF)
  if (datos.madreTrabajaFueraHogar && datos.hijosMenores3 > 0) {
    const importeMaternidad = Math.min(1200 * datos.hijosMenores3, 1200 * datos.hijosMenores3);
    deducciones.push({
      nombre: "Deducción por maternidad",
      casilla: "0611",
      importe: importeMaternidad,
      descripcion: `${datos.hijosMenores3} hijo(s) menor(es) de 3 años. Madres trabajadoras.`,
      normativa: "Art. 81 LIRPF",
    });
  }

  // 2. Deducción por familia numerosa (Art. 81 bis LIRPF)
  if (datos.familiaNumerosa) {
    const importeFN = datos.familiaNumerosaEspecial ? 2400 : 1200;
    deducciones.push({
      nombre: datos.familiaNumerosaEspecial ? "Deducción familia numerosa especial" : "Deducción familia numerosa general",
      casilla: "0618",
      importe: importeFN,
      descripcion: datos.familiaNumerosaEspecial ? "Familia numerosa de categoría especial." : "Familia numerosa de categoría general.",
      normativa: "Art. 81 bis LIRPF",
    });
  }

  // 3. Deducción por ascendiente con discapacidad a cargo (Art. 81 bis LIRPF)
  if (datos.ascendientesDiscapacitados && datos.numAscendientes > 0) {
    deducciones.push({
      nombre: "Deducción por ascendiente con discapacidad",
      casilla: "0617",
      importe: 1200,
      descripcion: "Ascendiente con discapacidad >= 33% a cargo.",
      normativa: "Art. 81 bis LIRPF",
    });
  }

  // 4. Deducción por alquiler de vivienda habitual (contratos antes 01/01/2015)
  if (datos.alquilerViviendaHabitual && datos.contratoAlquilerAntes2015) {
    // Límite de base imponible: 24.107,20 €
    const baseTotal = datos.ingresosTrabajo + datos.ingresosAutonomo;
    if (baseTotal < 24107.20) {
      const porcentaje = baseTotal <= 17707.20 ? 0.1005 : 0.1005 * (24107.20 - baseTotal) / 6400;
      const importeAlquiler = Math.min(datos.alquilerAnual * porcentaje, 9040 * porcentaje);
      if (importeAlquiler > 0) {
        deducciones.push({
          nombre: "Deducción por alquiler vivienda habitual (contrato pre-2015)",
          casilla: "0547",
          importe: Math.round(importeAlquiler * 100) / 100,
          descripcion: `10,05% de ${datos.alquilerAnual.toLocaleString("es-ES")} € pagados en alquiler. Contrato anterior al 01/01/2015.`,
          normativa: "DT 15ª LIRPF",
        });
      }
    }
  }

  // 5. Deducción por inversión en vivienda habitual (hipoteca antes 01/01/2013)
  if (datos.hipotecaAntes2013 && datos.hipotecaAnual > 0) {
    const baseDeduccion = Math.min(datos.hipotecaAnual, 9040);
    const importeVivienda = baseDeduccion * 0.15;
    deducciones.push({
      nombre: "Deducción por inversión en vivienda habitual (hipoteca pre-2013)",
      casilla: "0547",
      importe: Math.round(importeVivienda * 100) / 100,
      descripcion: `15% de ${Math.min(datos.hipotecaAnual, 9040).toLocaleString("es-ES")} € (máx. 9.040 €). Hipoteca anterior al 01/01/2013.`,
      normativa: "DT 18ª LIRPF",
    });
  }

  // 6. Deducción por obras de mejora de eficiencia energética
  if (datos.obrasEficienciaEnergetica && datos.importeObrasEnergeticas > 0) {
    let porcentaje = 0;
    let limiteBase = 0;
    let nombreDeduccion = "";
    let casilla = "";

    switch (datos.tipoMejoraEnergetica) {
      case "reduccion20":
        porcentaje = 0.20;
        limiteBase = 5000;
        nombreDeduccion = "Obras mejora energética (reducción 7% demanda calefacción/refrigeración)";
        casilla = "0563";
        break;
      case "reduccion40":
        porcentaje = 0.40;
        limiteBase = 7500;
        nombreDeduccion = "Obras mejora energética (reducción 30% consumo energía primaria)";
        casilla = "0564";
        break;
      case "reduccion60":
        porcentaje = 0.60;
        limiteBase = 5000;
        nombreDeduccion = "Obras mejora energética (edificio residencial, clase A o B)";
        casilla = "0565";
        break;
    }

    if (porcentaje > 0) {
      const baseDeduccion = Math.min(datos.importeObrasEnergeticas, limiteBase);
      const importeEnergetica = baseDeduccion * porcentaje;
      // Límite: 60% de la suma de cuotas íntegras
      const limiteTotal = cuotaTotal * 0.60;
      deducciones.push({
        nombre: nombreDeduccion,
        casilla,
        importe: Math.min(importeEnergetica, limiteTotal),
        descripcion: `${(porcentaje * 100).toFixed(0)}% de ${baseDeduccion.toLocaleString("es-ES")} € en obras de mejora energética.`,
        normativa: "Art. 92 bis LIRPF (RDL 19/2021)",
      });
    }
  }

  // 7. Deducción por donativos (Art. 68.3 LIRPF + Ley 49/2002)
  if (datos.donativos > 0) {
    let importeDonativos = 0;
    const primerosEuros = Math.min(datos.donativos, 250);
    const restoDonativos = Math.max(0, datos.donativos - 250);

    if (datos.donativosHabitualONG) {
      // Donante habitual: 80% primeros 250 €, 45% resto (o 50% si > 4 años)
      importeDonativos = primerosEuros * 0.80 + restoDonativos * 0.45;
    } else {
      // Donante no habitual: 80% primeros 250 €, 40% resto
      importeDonativos = primerosEuros * 0.80 + restoDonativos * 0.40;
    }

    // Límite: 10% de la base liquidable
    deducciones.push({
      nombre: "Deducción por donativos a entidades sin ánimo de lucro",
      casilla: "0627",
      importe: Math.round(importeDonativos * 100) / 100,
      descripcion: `80% de los primeros 250 € + ${datos.donativosHabitualONG ? "45" : "40"}% del resto. Donativo de ${datos.donativos.toLocaleString("es-ES")} €.`,
      normativa: "Art. 68.3 LIRPF + Ley 49/2002",
    });
  }

  return deducciones;
}

// ─── DEDUCCIONES AUTONÓMICAS ─────────────────────────────────────────────────

function calcularDeduccionesAutonomicas(
  datos: DatosContribuyente,
  baseLiquidableGeneral: number
): DeduccionAplicada[] {
  const deducciones: DeduccionAplicada[] = [];
  const ccaa = datos.comunidadAutonoma;
  const baseTotal = datos.ingresosTrabajo + datos.ingresosAutonomo;
  const edad = datos.edad;

  switch (ccaa) {
    case "madrid": {
      // Deducción por alquiler de vivienda habitual (menores de 35 años o hasta 40 con paro)
      if (datos.alquilerViviendaHabitual && datos.alquilerAnual > 0) {
        if (edad < 35 || (edad < 40 && baseTotal < 25620)) {
          const importeAlquilerMadrid = Math.min(datos.alquilerAnual * 0.30, 1000);
          deducciones.push({
            nombre: "Deducción autonómica por alquiler vivienda habitual (Madrid)",
            casilla: "0801",
            importe: importeAlquilerMadrid,
            descripcion: `30% del alquiler anual (${datos.alquilerAnual.toLocaleString("es-ES")} €), máx. 1.000 €. Menores de 35 años.`,
            normativa: "Art. 4 Ley 9/1999 CCAA Madrid",
          });
        }
      }

      // Deducción por nacimiento o adopción de hijos
      if (datos.numHijos > 0 && datos.hijosMenores3 > 0) {
        const importeNacimiento = datos.hijosMenores3 === 1 ? 600 : datos.hijosMenores3 === 2 ? 750 : 900;
        deducciones.push({
          nombre: "Deducción por nacimiento o adopción de hijos (Madrid)",
          casilla: "0802",
          importe: importeNacimiento,
          descripcion: `${datos.hijosMenores3} hijo(s) nacido(s)/adoptado(s). Importe según número de hijos.`,
          normativa: "Art. 5 Ley 9/1999 CCAA Madrid",
        });
      }

      // Deducción por gastos educativos (escolaridad 3-12 años)
      if (datos.gastosEscolaridad > 0) {
        const importeEscolaridad = Math.min(datos.gastosEscolaridad * 0.15, 400 * datos.numHijos);
        deducciones.push({
          nombre: "Deducción por gastos de escolaridad (Madrid)",
          casilla: "0803",
          importe: importeEscolaridad,
          descripcion: `15% de gastos de escolaridad, máx. 400 € por hijo.`,
          normativa: "Art. 11 Ley 9/1999 CCAA Madrid",
        });
      }

      // Deducción por cuidado de hijos menores de 3 años (guardería)
      if (datos.gastosGuarderia > 0 && datos.hijosMenores3 > 0) {
        const importeGuarderia = Math.min(datos.gastosGuarderia * 0.20, 1000 * datos.hijosMenores3);
        deducciones.push({
          nombre: "Deducción por guardería (Madrid)",
          casilla: "0804",
          importe: importeGuarderia,
          descripcion: `20% de gastos de guardería, máx. 1.000 € por hijo menor de 3 años.`,
          normativa: "Art. 6 Ley 9/1999 CCAA Madrid",
        });
      }
      break;
    }

    case "andalucia": {
      // Deducción por alquiler de vivienda habitual (menores de 35 años)
      if (datos.alquilerViviendaHabitual && datos.alquilerAnual > 0 && edad < 35) {
        if (baseTotal < 19000 || (datos.declaracionConjunta && baseTotal < 24000)) {
          const importeAlquilerAnd = Math.min(datos.alquilerAnual * 0.15, 500);
          deducciones.push({
            nombre: "Deducción autonómica por alquiler vivienda habitual (Andalucía)",
            casilla: "0901",
            importe: importeAlquilerAnd,
            descripcion: `15% del alquiler anual, máx. 500 €. Menores de 35 años con renta < 19.000 €.`,
            normativa: "Art. 12 bis Decreto Legislativo 1/2018 Andalucía",
          });
        }
      }

      // Deducción por adopción internacional
      // (no aplicable en este contexto simplificado)

      // Deducción por gastos de guardería (hijos < 3 años)
      if (datos.gastosGuarderia > 0 && datos.hijosMenores3 > 0) {
        const importeGuarderiaAnd = Math.min(datos.gastosGuarderia * 0.15, 250 * datos.hijosMenores3);
        deducciones.push({
          nombre: "Deducción por guardería (Andalucía)",
          casilla: "0902",
          importe: importeGuarderiaAnd,
          descripcion: `15% de gastos de guardería, máx. 250 € por hijo menor de 3 años.`,
          normativa: "Art. 12 ter Decreto Legislativo 1/2018 Andalucía",
        });
      }
      break;
    }

    case "cataluna": {
      // Deducción por alquiler de vivienda habitual (menores de 33 años o > 65)
      if (datos.alquilerViviendaHabitual && datos.alquilerAnual > 0) {
        if ((edad < 33 || edad >= 65 || datos.discapacidadPorcentaje >= 65) && baseTotal < 20000) {
          const importeAlquilerCat = Math.min(datos.alquilerAnual * 0.10, 300);
          deducciones.push({
            nombre: "Deducción autonómica por alquiler vivienda habitual (Cataluña)",
            casilla: "1001",
            importe: importeAlquilerCat,
            descripcion: `10% del alquiler anual, máx. 300 €. Menores de 33 años o mayores de 65.`,
            normativa: "Art. 3 Ley 31/2002 CCAA Cataluña",
          });
        }
      }

      // Deducción por donativos a entidades catalanas
      // (ya cubierta por deducción estatal)
      break;
    }

    case "valencia": {
      // Deducción por nacimiento o adopción
      if (datos.hijosMenores3 > 0) {
        const importeNacimientoVal = datos.hijosMenores3 >= 3 ? 246 : datos.hijosMenores3 === 2 ? 246 : 270;
        deducciones.push({
          nombre: "Deducción por nacimiento o adopción (Valencia)",
          casilla: "1101",
          importe: importeNacimientoVal * datos.hijosMenores3,
          descripcion: `Deducción por nacimiento/adopción de hijos en 2025.`,
          normativa: "Art. 4 Ley 13/1997 CCAA Valencia",
        });
      }

      // Deducción por alquiler vivienda habitual (menores de 35 años)
      if (datos.alquilerViviendaHabitual && datos.alquilerAnual > 0 && edad < 35) {
        if (baseTotal < 25000) {
          const importeAlquilerVal = Math.min(datos.alquilerAnual * 0.15, 550);
          deducciones.push({
            nombre: "Deducción autonómica por alquiler vivienda habitual (Valencia)",
            casilla: "1102",
            importe: importeAlquilerVal,
            descripcion: `15% del alquiler anual, máx. 550 €. Menores de 35 años.`,
            normativa: "Art. 4 ter Ley 13/1997 CCAA Valencia",
          });
        }
      }

      // Deducción DANA (daños por catástrofes naturales 2024)
      // Hasta 2.000 € por gastos de reparación de vivienda habitual
      break;
    }

    case "canarias": {
      // Deducción por familia numerosa
      if (datos.familiaNumerosa) {
        const importeFNCanarias = datos.familiaNumerosaEspecial ? 600 : 200;
        deducciones.push({
          nombre: "Deducción familia numerosa (Canarias)",
          casilla: "1201",
          importe: importeFNCanarias,
          descripcion: `Familia numerosa ${datos.familiaNumerosaEspecial ? "especial" : "general"}.`,
          normativa: "Art. 8 Decreto Legislativo 1/2009 Canarias",
        });
      }

      // Deducción por gastos de guardería
      if (datos.gastosGuarderia > 0 && datos.hijosMenores3 > 0) {
        const importeGuarderiaCanarias = Math.min(datos.gastosGuarderia * 0.15, 400 * datos.hijosMenores3);
        deducciones.push({
          nombre: "Deducción por guardería (Canarias)",
          casilla: "1202",
          importe: importeGuarderiaCanarias,
          descripcion: `15% de gastos de guardería, máx. 400 € por hijo.`,
          normativa: "Art. 9 Decreto Legislativo 1/2009 Canarias",
        });
      }
      break;
    }

    default:
      // Para el resto de CCAA, aplicar deducciones genéricas básicas
      if (datos.alquilerViviendaHabitual && datos.alquilerAnual > 0 && edad < 35) {
        const importeGenerico = Math.min(datos.alquilerAnual * 0.10, 300);
        if (importeGenerico > 0) {
          deducciones.push({
            nombre: `Deducción autonómica por alquiler vivienda habitual`,
            casilla: "CCAA",
            importe: importeGenerico,
            descripcion: `Deducción autonómica por alquiler de vivienda habitual. Consulte las deducciones específicas de su comunidad.`,
            normativa: "Normativa autonómica",
          });
        }
      }
      break;
  }

  return deducciones;
}

// ─── MOTOR PRINCIPAL DE CÁLCULO ──────────────────────────────────────────────

export function calcularRenta(datos: DatosContribuyente): ResultadoFiscal {
  // ── 1. RENDIMIENTOS NETOS ──

  // Rendimiento neto del trabajo
  const gastosDeduciblesTrabajo =
    datos.cotizacionSS +
    Math.min(datos.cuotasSindicales, 500) +
    Math.min(datos.cuotasColegiosProfesionales, 500) +
    2000; // Gasto deducible general (Art. 19.2.f LIRPF)

  const rendimientoNetoTrabajoAntes = Math.max(0, datos.ingresosTrabajo - gastosDeduciblesTrabajo);
  const reduccionTrabajo = calcularReduccionTrabajo(rendimientoNetoTrabajoAntes);
  const rendimientoNetoTrabajo = Math.max(0, rendimientoNetoTrabajoAntes - reduccionTrabajo);

  // Rendimiento neto capital inmobiliario
  let rendimientoNetoCapitalInmobiliario = Math.max(0, datos.ingresosAlquiler - datos.gastosAlquiler);
  // Reducción del 60% si es alquiler de vivienda habitual del inquilino (Art. 23.2 LIRPF)
  if (datos.esAlquilerViviendaHabitual && rendimientoNetoCapitalInmobiliario > 0) {
    rendimientoNetoCapitalInmobiliario = rendimientoNetoCapitalInmobiliario * 0.40; // Solo tributa el 40%
  }

  // Rendimiento neto capital mobiliario (ahorro)
  const rendimientoNetoCapitalMobiliario = Math.max(0, datos.dividendos + datos.intereses);

  // Rendimiento neto actividades económicas
  const rendimientoNetoActividades = Math.max(0, datos.ingresosAutonomo);

  // Ganancias/pérdidas patrimoniales netas
  const gananciaPatrimonialNeta = Math.max(0, datos.gananciasPatrimoniales - datos.perdidasPatrimoniales);

  // ── 2. BASE IMPONIBLE ──

  const baseImponibleGeneral =
    rendimientoNetoTrabajo +
    rendimientoNetoCapitalInmobiliario +
    rendimientoNetoActividades;

  const baseImponibleAhorro =
    rendimientoNetoCapitalMobiliario +
    gananciaPatrimonialNeta;

  // ── 3. REDUCCIONES DE LA BASE ──

  // Reducción por aportaciones a planes de pensiones (Art. 51 LIRPF)
  // Límite: menor de 1.500 € o 30% de los rendimientos netos del trabajo y actividades
  const limiteRendimientos = (rendimientoNetoTrabajo + rendimientoNetoActividades) * 0.30;
  const reduccionPlanPensiones = Math.min(datos.aportacionesPlanPensiones, 1500, limiteRendimientos);

  // Reducción por declaración conjunta (Art. 84 LIRPF)
  const reduccionDeclaracionConjunta = datos.declaracionConjunta ? 3400 : 0;

  // ── 4. BASE LIQUIDABLE ──

  const baseLiquidableGeneral = Math.max(0,
    baseImponibleGeneral - reduccionPlanPensiones - reduccionDeclaracionConjunta
  );
  const baseLiquidableAhorro = baseImponibleAhorro;

  // ── 5. MÍNIMO PERSONAL Y FAMILIAR ──

  const minimoPersonal = calcularMinimoPersonal(datos);
  const minimoDescendientes = calcularMinimoDescendientes(datos);
  const minimoAscendientes = calcularMinimoAscendientes(datos);
  const minimoDiscapacidad = calcularMinimoDiscapacidad(datos);
  const minimoTotal = minimoPersonal + minimoDescendientes + minimoAscendientes + minimoDiscapacidad;

  // ── 6. CUOTA ÍNTEGRA ──

  // El mínimo personal y familiar se aplica a la escala general
  // Si la base liquidable general < mínimo, el exceso se aplica a la base del ahorro
  const minimoAplicableGeneral = Math.min(minimoTotal, baseLiquidableGeneral);
  const minimoAplicableAhorro = Math.max(0, minimoTotal - minimoAplicableGeneral);

  // Cuota íntegra estatal
  const cuotaGeneralEstatal = aplicarEscala(baseLiquidableGeneral, ESCALA_GENERAL_ESTATAL);
  const cuotaMinimoEstatal = aplicarEscala(minimoAplicableGeneral, ESCALA_GENERAL_ESTATAL);
  const cuotaAhorroEstatal = aplicarEscala(baseLiquidableAhorro, ESCALA_AHORRO_ESTATAL);
  const cuotaMinimoAhorroEstatal = aplicarEscala(minimoAplicableAhorro, ESCALA_AHORRO_ESTATAL);
  const cuotaIntegraEstatal = Math.max(0,
    (cuotaGeneralEstatal - cuotaMinimoEstatal) +
    (cuotaAhorroEstatal - cuotaMinimoAhorroEstatal)
  );

  // Cuota íntegra autonómica
  const escalaAutonomica = ESCALAS_AUTONOMICAS[datos.comunidadAutonoma] || ESCALAS_AUTONOMICAS.madrid;
  const cuotaGeneralAutonomica = aplicarEscala(baseLiquidableGeneral, escalaAutonomica);
  const cuotaMinimoAutonomico = aplicarEscala(minimoAplicableGeneral, escalaAutonomica);
  const cuotaAhorroAutonomica = aplicarEscala(baseLiquidableAhorro, ESCALA_AHORRO_AUTONOMICA);
  const cuotaMinimoAhorroAutonomico = aplicarEscala(minimoAplicableAhorro, ESCALA_AHORRO_AUTONOMICA);
  const cuotaIntegraAutonomica = Math.max(0,
    (cuotaGeneralAutonomica - cuotaMinimoAutonomico) +
    (cuotaAhorroAutonomica - cuotaMinimoAhorroAutonomico)
  );

  const cuotaIntegraTotal = cuotaIntegraEstatal + cuotaIntegraAutonomica;

  // ── 7. DEDUCCIONES ──

  const deduccionesEstatales = calcularDeduccionesEstatales(datos, cuotaIntegraEstatal, cuotaIntegraAutonomica);
  const deduccionesAutonomicas = calcularDeduccionesAutonomicas(datos, baseLiquidableGeneral);

  const totalDeduccionesEstatales = deduccionesEstatales.reduce((s, d) => s + d.importe, 0);
  const totalDeduccionesAutonomicas = deduccionesAutonomicas.reduce((s, d) => s + d.importe, 0);

  // ── 8. CUOTA LÍQUIDA ──

  const cuotaLiquidaEstatal = Math.max(0, cuotaIntegraEstatal - totalDeduccionesEstatales);
  const cuotaLiquidaAutonomica = Math.max(0, cuotaIntegraAutonomica - totalDeduccionesAutonomicas);
  const cuotaLiquidaTotal = cuotaLiquidaEstatal + cuotaLiquidaAutonomica;

  // ── 9. RESULTADO FINAL ──

  const totalRetenciones =
    datos.retencionesIRPF +
    datos.retencionesAlquiler +
    datos.retencionesCapitalMobiliario +
    datos.pagosAcuentaAutonomo;

  const cuotaDiferencial = cuotaLiquidaTotal - totalRetenciones;

  const resultado: "devolucion" | "pagar" | "cero" =
    cuotaDiferencial < -0.01 ? "devolucion" : cuotaDiferencial > 0.01 ? "pagar" : "cero";

  const importeResultado = Math.abs(cuotaDiferencial);

  const tipoMedioEfectivo =
    baseLiquidableGeneral + baseLiquidableAhorro > 0
      ? (cuotaLiquidaTotal / (baseLiquidableGeneral + baseLiquidableAhorro)) * 100
      : 0;

  // Ahorro potencial: diferencia entre no aplicar deducciones y aplicarlas
  const ahorroPotencial = totalDeduccionesEstatales + totalDeduccionesAutonomicas;

  // ── 10. REDUCCIÓN MÍNIMOS (para mostrar en el resultado) ──
  const reduccionMinimosPersonalesFamiliares = minimoTotal;

  return {
    rendimientoNetoTrabajo,
    rendimientoNetoCapitalInmobiliario,
    rendimientoNetoCapitalMobiliario,
    rendimientoNetoActividades,
    gananciaPatrimonialNeta,
    baseImponibleGeneral,
    baseImponibleAhorro,
    reduccionPlanPensiones,
    reduccionDeclaracionConjunta,
    reduccionMinimosPersonalesFamiliares,
    baseLiquidableGeneral,
    baseLiquidableAhorro,
    minimoPersonal,
    minimoDescendientes,
    minimoAscendientes,
    minimoDiscapacidad,
    minimoTotal,
    cuotaIntegraEstatal,
    cuotaIntegraAutonomica,
    cuotaIntegraTotal,
    deduccionesEstatales,
    deduccionesAutonomicas,
    totalDeduccionesEstatales,
    totalDeduccionesAutonomicas,
    cuotaLiquidaEstatal,
    cuotaLiquidaAutonomica,
    cuotaLiquidaTotal,
    totalRetenciones,
    cuotaDiferencial,
    resultado,
    importeResultado,
    tipoMedioEfectivo,
    ahorroPotencial,
  };
}

/** Formatea un número como moneda española */
export function formatEuro(valor: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

/** Verifica si un contribuyente está obligado a declarar (Art. 96 LIRPF) */
export function estaObligadoADeclarar(datos: DatosContribuyente): {
  obligado: boolean;
  motivo: string;
} {
  const ingresosTotalesTrabajo = datos.ingresosTrabajo;
  const ingresosOtros = datos.ingresosAlquiler + datos.dividendos + datos.intereses + datos.gananciasPatrimoniales;

  // Un solo pagador
  if (ingresosTotalesTrabajo > 22000) {
    return { obligado: true, motivo: "Rendimientos del trabajo superiores a 22.000 € con un solo pagador." };
  }

  // Dos o más pagadores (segundo pagador > 1.500 €)
  if (ingresosTotalesTrabajo > 15000) {
    return { obligado: true, motivo: "Rendimientos del trabajo superiores a 15.000 € con más de un pagador." };
  }

  // Rendimientos del capital o ganancias patrimoniales > 1.600 €
  if (ingresosOtros > 1600) {
    return { obligado: true, motivo: "Rendimientos del capital mobiliario o ganancias patrimoniales superiores a 1.600 €." };
  }

  // Rendimientos inmobiliarios > 1.000 €
  if (datos.ingresosAlquiler > 1000) {
    return { obligado: true, motivo: "Rendimientos del capital inmobiliario (alquiler) superiores a 1.000 €." };
  }

  // Autónomos con cualquier ingreso
  if (datos.esAutonomo && datos.ingresosAutonomo > 0) {
    return { obligado: true, motivo: "Rendimientos de actividades económicas (autónomo)." };
  }

  return { obligado: false, motivo: "No obligado a declarar según los umbrales del Art. 96 LIRPF." };
}

/** Crea un objeto DatosContribuyente con valores por defecto */
export function crearDatosVacios(): DatosContribuyente {
  return {
    edad: 35,
    discapacidadPorcentaje: 0,
    comunidadAutonoma: "madrid",
    declaracionConjunta: false,
    conyugeDiscapacidad: false,
    ingresosTrabajo: 0,
    cotizacionSS: 0,
    retencionesIRPF: 0,
    ingresosAutonomo: 0,
    esAutonomo: false,
    ingresosAlquiler: 0,
    gastosAlquiler: 0,
    esAlquilerViviendaHabitual: false,
    dividendos: 0,
    intereses: 0,
    gananciasPatrimoniales: 0,
    perdidasPatrimoniales: 0,
    numHijos: 0,
    edadesHijos: [],
    hijosDiscapacitados: [],
    numAscendientes: 0,
    ascendientesDiscapacitados: false,
    familiaNumerosa: false,
    familiaNumerosaEspecial: false,
    madreTrabajaFueraHogar: false,
    hijosMenores3: 0,
    alquilerViviendaHabitual: false,
    alquilerAnual: 0,
    contratoAlquilerAntes2015: false,
    hipotecaAntes2013: false,
    hipotecaAnual: 0,
    aportacionesPlanPensiones: 0,
    aportacionesMutualidades: 0,
    obrasEficienciaEnergetica: false,
    importeObrasEnergeticas: 0,
    tipoMejoraEnergetica: "ninguna",
    donativos: 0,
    donativosHabitualONG: false,
    cuotasSindicales: 0,
    cuotasColegiosProfesionales: 0,
    retencionesAlquiler: 0,
    retencionesCapitalMobiliario: 0,
    pagosAcuentaAutonomo: 0,
    alquilerJoven: false,
    adquisicionViviendaJoven: false,
    gastosEscolaridad: 0,
    gastosGuarderia: 0,
  };
}
