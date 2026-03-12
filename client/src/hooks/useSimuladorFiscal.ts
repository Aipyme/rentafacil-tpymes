import { useState, useMemo } from "react";

// Tramos IRPF 2025 - Base General ESTATAL
const TRAMOS_ESTATAL = [
  { hasta: 12450, tipo: 0.095 },
  { hasta: 20200, tipo: 0.12 },
  { hasta: 35200, tipo: 0.15 },
  { hasta: 60000, tipo: 0.185 },
  { hasta: 300000, tipo: 0.225 },
  { hasta: Infinity, tipo: 0.245 },
];

// Tramos IRPF 2025 - Base General AUTONÓMICO (general, varía por CCAA)
// Usamos los tramos medios como aproximación general
const TRAMOS_AUTONOMICO: Record<string, { hasta: number; tipo: number }[]> = {
  default: [
    { hasta: 12450, tipo: 0.095 },
    { hasta: 20200, tipo: 0.12 },
    { hasta: 35200, tipo: 0.15 },
    { hasta: 60000, tipo: 0.185 },
    { hasta: 300000, tipo: 0.225 },
    { hasta: Infinity, tipo: 0.245 },
  ],
  madrid: [
    { hasta: 12960, tipo: 0.085 },
    { hasta: 18025, tipo: 0.1075 },
    { hasta: 34550, tipo: 0.128 },
    { hasta: 55000, tipo: 0.179 },
    { hasta: 300000, tipo: 0.207 },
    { hasta: Infinity, tipo: 0.215 },
  ],
  andalucia: [
    { hasta: 13000, tipo: 0.10 },
    { hasta: 21000, tipo: 0.12 },
    { hasta: 35200, tipo: 0.15 },
    { hasta: 60000, tipo: 0.187 },
    { hasta: 120000, tipo: 0.235 },
    { hasta: Infinity, tipo: 0.245 },
  ],
  cataluna: [
    { hasta: 12450, tipo: 0.105 },
    { hasta: 17707, tipo: 0.12 },
    { hasta: 33007, tipo: 0.15 },
    { hasta: 53407, tipo: 0.187 },
    { hasta: 90000, tipo: 0.215 },
    { hasta: 120000, tipo: 0.235 },
    { hasta: 175000, tipo: 0.245 },
    { hasta: Infinity, tipo: 0.255 },
  ],
  valencia: [
    { hasta: 12450, tipo: 0.10 },
    { hasta: 17000, tipo: 0.12 },
    { hasta: 30000, tipo: 0.14 },
    { hasta: 50000, tipo: 0.18 },
    { hasta: 65000, tipo: 0.225 },
    { hasta: 80000, tipo: 0.24 },
    { hasta: 120000, tipo: 0.245 },
    { hasta: Infinity, tipo: 0.255 },
  ],
};

// Tramos base del ahorro 2025
const TRAMOS_AHORRO = [
  { hasta: 6000, tipo: 0.19 },
  { hasta: 50000, tipo: 0.21 },
  { hasta: 200000, tipo: 0.23 },
  { hasta: 300000, tipo: 0.27 },
  { hasta: Infinity, tipo: 0.30 },
];

// Mínimo personal y familiar
const MINIMO_CONTRIBUYENTE = 5550;
const MINIMO_MAYOR_65 = 1150;
const MINIMO_MAYOR_75 = 1400; // adicional al de 65
const MINIMOS_HIJOS = [2400, 2700, 4000, 4500];
const MINIMO_HIJO_MENOR_3 = 2800;
const MINIMO_ASCENDIENTE_65 = 1150;
const MINIMO_ASCENDIENTE_75 = 2550; // total (incluye el de 65)

// Reducción por rendimientos del trabajo
function reduccionTrabajo(rendimientoNeto: number): number {
  if (rendimientoNeto <= 14047.5) return 6498;
  if (rendimientoNeto <= 19747.5) return 6498 - 1.14 * (rendimientoNeto - 14047.5);
  return 0;
}

// Gastos deducibles del trabajo (SS + otros)
const GASTOS_TRABAJO = 2000;

function calcularCuotaTramos(base: number, tramos: { hasta: number; tipo: number }[]): number {
  if (base <= 0) return 0;
  let cuota = 0;
  let baseRestante = base;
  let limiteAnterior = 0;

  for (const tramo of tramos) {
    const baseTramo = Math.min(baseRestante, tramo.hasta - limiteAnterior);
    if (baseTramo <= 0) break;
    cuota += baseTramo * tramo.tipo;
    baseRestante -= baseTramo;
    limiteAnterior = tramo.hasta;
  }

  return cuota;
}

export type ComunidadAutonoma =
  | "default"
  | "madrid"
  | "andalucia"
  | "cataluna"
  | "valencia"
  | "galicia"
  | "pais_vasco"
  | "castilla_leon"
  | "castilla_la_mancha"
  | "canarias"
  | "aragon"
  | "murcia"
  | "extremadura"
  | "baleares"
  | "asturias"
  | "cantabria"
  | "navarra"
  | "la_rioja";

export interface DatosSimulador {
  ingresosBrutos: number;
  retencionesEmpresa: number;
  situacionPersonal: "soltero" | "casado" | "familia_monoparental";
  edad: number;
  numHijos: number;
  hijosmenor3: number;
  tieneHipotecaPre2013: boolean;
  pagadoHipoteca: number;
  alquilerVivienda: boolean;
  pagadoAlquiler: number;
  aportacionPensiones: number;
  donaciones: number;
  discapacidad: boolean;
  gradoDiscapacidad: "ninguna" | "33_64" | "65_mas";
  tieneSegundoPagador: boolean;
  ingresosSegundoPagador: number;
  comunidadAutonoma: ComunidadAutonoma;
  tieneVehiculoElectrico: boolean;
  valorVehiculoElectrico: number;
  obraEficienciaEnergetica: boolean;
  importeObraEficiencia: number;
  esFamiliaNumerosa: boolean;
  familiaNumerosaCategoria: "general" | "especial" | "ninguna";
}

export interface ResultadoSimulador {
  baseImponible: number;
  minimoPersonalFamiliar: number;
  baseGravable: number;
  cuotaIntegra: number;
  cuotaEstatal: number;
  cuotaAutonomica: number;
  deducciones: number;
  cuotaLiquida: number;
  retenciones: number;
  resultado: number; // positivo = a devolver, negativo = a pagar
  detallesDeducciones: { concepto: string; importe: number }[];
  complejidad: "simple" | "medio" | "complejo";
  obligadoDeclarar: boolean;
  motivoObligacion: string;
}

const DEFAULTS: DatosSimulador = {
  ingresosBrutos: 25000,
  retencionesEmpresa: 3500,
  situacionPersonal: "soltero",
  edad: 35,
  numHijos: 0,
  hijosmenor3: 0,
  tieneHipotecaPre2013: false,
  pagadoHipoteca: 0,
  alquilerVivienda: false,
  pagadoAlquiler: 0,
  aportacionPensiones: 0,
  donaciones: 0,
  discapacidad: false,
  gradoDiscapacidad: "ninguna",
  tieneSegundoPagador: false,
  ingresosSegundoPagador: 0,
  comunidadAutonoma: "default",
  tieneVehiculoElectrico: false,
  valorVehiculoElectrico: 0,
  obraEficienciaEnergetica: false,
  importeObraEficiencia: 0,
  esFamiliaNumerosa: false,
  familiaNumerosaCategoria: "ninguna",
};

export function useSimuladorFiscal() {
  const [datos, setDatos] = useState<DatosSimulador>(DEFAULTS);

  const resultado = useMemo<ResultadoSimulador>(() => {
    const detallesDeducciones: { concepto: string; importe: number }[] = [];

    // 0. Obligación de declarar
    let obligadoDeclarar = false;
    let motivoObligacion = "";
    if (datos.tieneSegundoPagador) {
      if (datos.ingresosBrutos > 15876) {
        obligadoDeclarar = true;
        motivoObligacion = "Ingresos superiores a 15.876€ con dos o más pagadores";
      }
    } else {
      if (datos.ingresosBrutos > 22000) {
        obligadoDeclarar = true;
        motivoObligacion = "Ingresos superiores a 22.000€ con un pagador";
      }
    }
    if (datos.tieneHipotecaPre2013 || datos.donaciones > 0 || datos.aportacionPensiones > 0) {
      obligadoDeclarar = true;
      motivoObligacion += motivoObligacion ? ". Además, te interesa declarar para aplicar deducciones." : "Te interesa declarar para aplicar deducciones aunque no estés obligado.";
    }

    // 1. Rendimiento neto del trabajo
    const rendimientoNeto = Math.max(0, datos.ingresosBrutos - GASTOS_TRABAJO);
    const reduccion = reduccionTrabajo(rendimientoNeto);
    const rendimientoNetoReducido = Math.max(0, rendimientoNeto - reduccion);

    // 2. Reducciones en base imponible
    let reduccionesBase = 0;
    if (datos.aportacionPensiones > 0) {
      const maxPensiones = Math.min(datos.aportacionPensiones, 1500);
      reduccionesBase += maxPensiones;
      if (maxPensiones > 0) {
        detallesDeducciones.push({ concepto: "Planes de pensiones (reducción base)", importe: maxPensiones });
      }
    }

    // 3. Base imponible general
    const baseImponible = Math.max(0, rendimientoNetoReducido - reduccionesBase);

    // 4. Mínimo personal y familiar
    let minimoPersonal = MINIMO_CONTRIBUYENTE;
    if (datos.edad >= 65) minimoPersonal += MINIMO_MAYOR_65;
    if (datos.edad >= 75) minimoPersonal += MINIMO_MAYOR_75;

    let minimoHijos = 0;
    for (let i = 0; i < datos.numHijos; i++) {
      minimoHijos += MINIMOS_HIJOS[Math.min(i, 3)];
    }
    minimoHijos += datos.hijosmenor3 * MINIMO_HIJO_MENOR_3;

    let minimoDiscapacidad = 0;
    if (datos.gradoDiscapacidad === "33_64") minimoDiscapacidad = 3000;
    if (datos.gradoDiscapacidad === "65_mas") minimoDiscapacidad = 9000;

    const minimoPersonalFamiliar = minimoPersonal + minimoHijos + minimoDiscapacidad;

    // 5. Cuota íntegra (estatal + autonómica por separado)
    const tramosAutonomicos = TRAMOS_AUTONOMICO[datos.comunidadAutonoma] || TRAMOS_AUTONOMICO.default;

    const cuotaEstatalBase = calcularCuotaTramos(baseImponible, TRAMOS_ESTATAL);
    const cuotaEstatalMinimo = calcularCuotaTramos(minimoPersonalFamiliar, TRAMOS_ESTATAL);
    const cuotaEstatal = Math.max(0, cuotaEstatalBase - cuotaEstatalMinimo);

    const cuotaAutonomicaBase = calcularCuotaTramos(baseImponible, tramosAutonomicos);
    const cuotaAutonomicaMinimo = calcularCuotaTramos(minimoPersonalFamiliar, tramosAutonomicos);
    const cuotaAutonomica = Math.max(0, cuotaAutonomicaBase - cuotaAutonomicaMinimo);

    const cuotaIntegra = cuotaEstatal + cuotaAutonomica;

    // 6. Deducciones en cuota
    let deducciones = 0;

    // Hipoteca pre-2013
    if (datos.tieneHipotecaPre2013 && datos.pagadoHipoteca > 0) {
      const baseHipoteca = Math.min(datos.pagadoHipoteca, 9040);
      const deduccionHipoteca = baseHipoteca * 0.15; // 7,5% estatal + 7,5% autonómico
      deducciones += deduccionHipoteca;
      detallesDeducciones.push({ concepto: "Vivienda habitual (pre-2013)", importe: deduccionHipoteca });
    }

    // Donaciones
    if (datos.donaciones > 0) {
      const primeros250 = Math.min(datos.donaciones, 250) * 0.80;
      const resto = Math.max(0, datos.donaciones - 250) * 0.40;
      const deduccionDonaciones = primeros250 + resto;
      deducciones += deduccionDonaciones;
      detallesDeducciones.push({ concepto: "Donaciones", importe: deduccionDonaciones });
    }

    // Familia numerosa
    if (datos.esFamiliaNumerosa) {
      const importeFN = datos.familiaNumerosaCategoria === "especial" ? 2400 : 1200;
      deducciones += importeFN;
      detallesDeducciones.push({ concepto: `Familia numerosa (${datos.familiaNumerosaCategoria})`, importe: importeFN });
    }

    // Vehículo eléctrico (novedad 2025)
    if (datos.tieneVehiculoElectrico && datos.valorVehiculoElectrico > 0) {
      const baseVE = Math.min(datos.valorVehiculoElectrico, 20000);
      const deduccionVE = baseVE * 0.15;
      deducciones += deduccionVE;
      detallesDeducciones.push({ concepto: "Vehículo eléctrico", importe: deduccionVE });
    }

    // Eficiencia energética
    if (datos.obraEficienciaEnergetica && datos.importeObraEficiencia > 0) {
      const baseEE = Math.min(datos.importeObraEficiencia, 5000);
      const deduccionEE = baseEE * 0.20;
      deducciones += deduccionEE;
      detallesDeducciones.push({ concepto: "Obras eficiencia energética", importe: deduccionEE });
    }

    // 7. Cuota líquida
    const cuotaLiquida = Math.max(0, cuotaIntegra - deducciones);

    // 8. Resultado
    const resultadoFinal = datos.retencionesEmpresa - cuotaLiquida;

    // 9. Complejidad
    let complejidad: "simple" | "medio" | "complejo" = "simple";
    if (datos.tieneSegundoPagador || datos.tieneHipotecaPre2013 || datos.alquilerVivienda) {
      complejidad = "medio";
    }
    if (datos.gradoDiscapacidad !== "ninguna" || datos.numHijos > 2 || datos.esFamiliaNumerosa) {
      complejidad = "medio";
    }
    if (datos.ingresosBrutos > 60000 || datos.tieneVehiculoElectrico || datos.obraEficienciaEnergetica) {
      complejidad = "complejo";
    }

    return {
      baseImponible,
      minimoPersonalFamiliar,
      baseGravable: Math.max(0, baseImponible - minimoPersonalFamiliar),
      cuotaIntegra,
      cuotaEstatal,
      cuotaAutonomica,
      deducciones,
      cuotaLiquida,
      retenciones: datos.retencionesEmpresa,
      resultado: resultadoFinal,
      detallesDeducciones,
      complejidad,
      obligadoDeclarar,
      motivoObligacion,
    };
  }, [datos]);

  const updateDatos = (partial: Partial<DatosSimulador>) => {
    setDatos((prev) => ({ ...prev, ...partial }));
  };

  const resetDatos = () => setDatos(DEFAULTS);

  return { datos, resultado, updateDatos, resetDatos };
}
