import { useState, useMemo } from "react";

// Tramos IRPF 2025 (Estatal + Autonómico general)
const TRAMOS_IRPF = [
  { hasta: 12450, tipo: 0.19 },
  { hasta: 20200, tipo: 0.24 },
  { hasta: 35200, tipo: 0.30 },
  { hasta: 60000, tipo: 0.37 },
  { hasta: 300000, tipo: 0.45 },
  { hasta: Infinity, tipo: 0.47 },
];

// Mínimo personal y familiar
const MINIMO_CONTRIBUYENTE = 5550;
const MINIMO_MAYOR_65 = 1150;
const MINIMO_MAYOR_75 = 1400;
const MINIMOS_HIJOS = [2400, 2700, 4000, 4500];
const MINIMO_HIJO_MENOR_3 = 2800;

// Reducción por rendimientos del trabajo
function reduccionTrabajo(rendimientoNeto: number): number {
  if (rendimientoNeto <= 14047.5) return 6498;
  if (rendimientoNeto <= 19747.5) return 6498 - 1.14 * (rendimientoNeto - 14047.5);
  return 0;
}

// Gastos deducibles del trabajo (SS + otros)
const GASTOS_TRABAJO = 2000;

function calcularCuota(base: number): number {
  if (base <= 0) return 0;
  let cuota = 0;
  let baseRestante = base;
  let limiteAnterior = 0;

  for (const tramo of TRAMOS_IRPF) {
    const baseTramo = Math.min(baseRestante, tramo.hasta - limiteAnterior);
    if (baseTramo <= 0) break;
    cuota += baseTramo * tramo.tipo;
    baseRestante -= baseTramo;
    limiteAnterior = tramo.hasta;
  }

  return cuota;
}

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
}

export interface ResultadoSimulador {
  baseImponible: number;
  minimoPersonalFamiliar: number;
  baseGravable: number;
  cuotaIntegra: number;
  deducciones: number;
  cuotaLiquida: number;
  retenciones: number;
  resultado: number; // positivo = a devolver, negativo = a pagar
  detallesDeducciones: { concepto: string; importe: number }[];
  complejidad: "simple" | "medio" | "complejo";
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
};

export function useSimuladorFiscal() {
  const [datos, setDatos] = useState<DatosSimulador>(DEFAULTS);

  const resultado = useMemo<ResultadoSimulador>(() => {
    const detallesDeducciones: { concepto: string; importe: number }[] = [];

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
        detallesDeducciones.push({ concepto: "Planes de pensiones", importe: maxPensiones });
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

    // 5. Cuota íntegra
    const cuotaBase = calcularCuota(baseImponible);
    const cuotaMinimo = calcularCuota(minimoPersonalFamiliar);
    const cuotaIntegra = Math.max(0, cuotaBase - cuotaMinimo);

    // 6. Deducciones en cuota
    let deducciones = 0;

    // Hipoteca pre-2013
    if (datos.tieneHipotecaPre2013 && datos.pagadoHipoteca > 0) {
      const baseHipoteca = Math.min(datos.pagadoHipoteca, 9040);
      const deduccionHipoteca = baseHipoteca * 0.15;
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

    // 7. Cuota líquida
    const cuotaLiquida = Math.max(0, cuotaIntegra - deducciones);

    // 8. Resultado
    const resultadoFinal = datos.retencionesEmpresa - cuotaLiquida;

    // 9. Complejidad
    let complejidad: "simple" | "medio" | "complejo" = "simple";
    if (datos.tieneSegundoPagador || datos.tieneHipotecaPre2013 || datos.alquilerVivienda) {
      complejidad = "medio";
    }
    if (datos.gradoDiscapacidad !== "ninguna" || datos.numHijos > 2) {
      complejidad = "medio";
    }
    if (datos.ingresosBrutos > 60000) {
      complejidad = "complejo";
    }

    return {
      baseImponible,
      minimoPersonalFamiliar,
      baseGravable: Math.max(0, baseImponible - minimoPersonalFamiliar),
      cuotaIntegra,
      deducciones,
      cuotaLiquida,
      retenciones: datos.retencionesEmpresa,
      resultado: resultadoFinal,
      detallesDeducciones,
      complejidad,
    };
  }, [datos]);

  const updateDatos = (partial: Partial<DatosSimulador>) => {
    setDatos((prev) => ({ ...prev, ...partial }));
  };

  const resetDatos = () => setDatos(DEFAULTS);

  return { datos, resultado, updateDatos, resetDatos };
}
