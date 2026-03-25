/**
 * Motor Fiscal IRPF 2025 - Renta Fácil TPymes
 * Implementa el cálculo completo del IRPF 2025 con deducciones estatales y autonómicas.
 * Todos los importes en euros.
 */

export interface RespuestasSimulador {
  // Sección A - Clasificación inicial
  situacion: "Asalariado" | "Pensionista" | "Autónomo" | "Desempleado";
  mas_de_un_pagador?: boolean;
  compra_vivienda?: boolean;
  personas_a_cargo?: boolean;
  deducciones_check?: string[];

  // Sección B - Datos cuantificados
  ingresos_brutos?: number;
  retenciones?: number;
  vivienda_fecha?: string;
  vivienda_precio?: number;
  vivienda_hipoteca?: boolean;
  n_hijos?: number;
  gasto_gimnasio?: number;
  importe_donaciones?: number;
  importe_planes?: number;

  // Sección C - Comunidad y autonómicas
  comunidad?: string;
  autonomica_checks?: Record<string, boolean | number | string>;

  // Datos personales
  contribuyente?: {
    nif?: string;
    nombre?: string;
    apellidos?: string;
    edad?: number;
    discapacidad?: boolean;
    porcentaje_discapacidad?: number;
  };
}

export interface ResultadoCalculo {
  // Ingresos
  ingresos_brutos: number;
  retenciones: number;

  // Reducciones
  reduccion_trabajo: number;
  reduccion_planes: number;

  // Base imponible
  base_imponible_general: number;

  // Cuota íntegra estatal
  cuota_integra_estatal: number;
  // Cuota íntegra autonómica
  cuota_integra_autonomica: number;
  // Cuota íntegra total
  cuota_integra_total: number;

  // Deducciones
  deduccion_vivienda: number;
  deduccion_maternidad: number;
  deduccion_familia_numerosa: number;
  deduccion_discapacidad: number;
  deduccion_donaciones: number;
  deducciones_autonomicas: number;
  total_deducciones: number;

  // Cuota líquida
  cuota_liquida: number;

  // Resultado
  resultado: number; // positivo = a pagar, negativo = a devolver
  resultado_borrador: number; // estimación sin deducciones optimizadas
  ahorro_vs_borrador: number;

  // Casillas principales
  casillas: Record<string, number>;

  // Flags de complejidad
  flags: string[];
  es_complejo: boolean;
  motivo_complejidad?: string;

  // Desglose de deducciones para mostrar al usuario
  desglose_deducciones: Array<{
    concepto: string;
    importe: number;
    tipo: "estatal" | "autonomica";
  }>;
}

// ============================================================
// TRAMOS IRPF 2025 (Escala general estatal)
// ============================================================
const TRAMOS_ESTATALES = [
  { hasta: 12450, tipo: 0.095 },
  { hasta: 20200, tipo: 0.12 },
  { hasta: 35200, tipo: 0.15 },
  { hasta: 60000, tipo: 0.185 },
  { hasta: 300000, tipo: 0.225 },
  { hasta: Infinity, tipo: 0.245 },
];

// Escala autonómica (media aproximada; en producción usar la de cada CCAA)
const TRAMOS_AUTONOMICOS = [
  { hasta: 12450, tipo: 0.095 },
  { hasta: 20200, tipo: 0.12 },
  { hasta: 35200, tipo: 0.15 },
  { hasta: 60000, tipo: 0.185 },
  { hasta: 300000, tipo: 0.225 },
  { hasta: Infinity, tipo: 0.245 },
];

function calcularCuotaTramos(base: number, tramos: typeof TRAMOS_ESTATALES): number {
  let cuota = 0;
  let baseRestante = base;
  let limiteAnterior = 0;

  for (const tramo of tramos) {
    if (baseRestante <= 0) break;
    const tramoBruto = tramo.hasta - limiteAnterior;
    const baseEnTramo = Math.min(baseRestante, tramoBruto);
    cuota += baseEnTramo * tramo.tipo;
    baseRestante -= baseEnTramo;
    limiteAnterior = tramo.hasta;
  }

  return Math.round(cuota * 100) / 100;
}

// ============================================================
// REDUCCIÓN POR RENDIMIENTOS DEL TRABAJO (Art. 20 LIRPF)
// ============================================================
function calcularReduccionTrabajo(rendimientoNeto: number): number {
  if (rendimientoNeto <= 14047.5) return 6498;
  if (rendimientoNeto <= 19747.5) {
    return Math.round((6498 - 1.14 * (rendimientoNeto - 14047.5)) * 100) / 100;
  }
  return 2364;
}

// ============================================================
// MÍNIMO PERSONAL Y FAMILIAR
// ============================================================
function calcularMinimoPersonal(datos: RespuestasSimulador): number {
  let minimo = 5550; // mínimo personal base

  // Por hijos
  const nHijos = datos.n_hijos || 0;
  if (nHijos >= 1) minimo += 2400;
  if (nHijos >= 2) minimo += 2700;
  if (nHijos >= 3) minimo += 4000;
  if (nHijos >= 4) minimo += 4500;

  // Por discapacidad del contribuyente
  const discapacidad = datos.contribuyente?.discapacidad;
  const pct = datos.contribuyente?.porcentaje_discapacidad || 0;
  if (discapacidad) {
    if (pct >= 65) minimo += 9000;
    else if (pct >= 33) minimo += 3000;
  }

  return minimo;
}

// ============================================================
// DEDUCCIONES ESTATALES
// ============================================================

function calcularDeduccionVivienda(datos: RespuestasSimulador): number {
  if (!datos.compra_vivienda || !datos.vivienda_fecha) return 0;
  const year = new Date(datos.vivienda_fecha).getFullYear();
  if (year >= 2013) return 0; // Solo aplica para compras pre-2013
  const baseDeduccion = Math.min(datos.vivienda_precio || 0, 9040);
  return Math.round(baseDeduccion * 0.15 * 100) / 100;
}

function calcularDeduccionDonaciones(importe: number): number {
  if (!importe || importe <= 0) return 0;
  if (importe <= 150) return Math.round(importe * 0.75 * 100) / 100;
  return Math.round((150 * 0.75 + (importe - 150) * 0.30) * 100) / 100;
}

function calcularDeduccionMaternidad(datos: RespuestasSimulador): number {
  // 1200€/año por hijo menor de 3 años (simplificado)
  if (!datos.personas_a_cargo) return 0;
  const nHijos = datos.n_hijos || 0;
  return nHijos > 0 ? Math.min(nHijos * 1200, 3600) : 0;
}

function calcularDeduccionFamiliaNumerosa(datos: RespuestasSimulador): number {
  const nHijos = datos.n_hijos || 0;
  if (nHijos >= 5) return 1200;
  if (nHijos >= 3) return 1200;
  return 0;
}

// ============================================================
// DEDUCCIONES AUTONÓMICAS
// ============================================================

function calcularDeduccionesAutonomicas(
  datos: RespuestasSimulador
): { total: number; desglose: Array<{ concepto: string; importe: number }> } {
  const desglose: Array<{ concepto: string; importe: number }> = [];
  const checks = datos.autonomica_checks || {};
  const comunidad = datos.comunidad || "";

  const add = (concepto: string, importe: number) => {
    if (importe > 0) desglose.push({ concepto, importe });
  };

  switch (comunidad) {
    case "Andalucía": {
      // Gimnasio (Decreto-ley 7/2021 Andalucía)
      const gastoGim = Number(datos.gasto_gimnasio || 0);
      if (gastoGim > 0 && (datos.deducciones_check || []).includes("Gimnasio")) {
        add("Deducción gastos deportivos (Andalucía)", Math.min(gastoGim * 0.15, 150));
      }
      // Alquiler Andalucía
      const alqAndalucia = Number(checks.alquiler || 0);
      if (alqAndalucia > 0) {
        add("Deducción alquiler vivienda habitual (Andalucía)", Math.min(alqAndalucia * 0.15, 500));
      }
      // Nacimiento
      if (checks.nacimiento) {
        add("Deducción por nacimiento/adopción (Andalucía)", 200);
      }
      break;
    }
    case "Madrid": {
      // Guardería
      const guarderiaAmount = Number(checks.guarderia_amount || 0);
      if (guarderiaAmount > 0) {
        add("Deducción gastos guardería (Madrid)", Math.min(guarderiaAmount * 0.20, 1000));
      }
      // Nacimiento/adopción
      if (checks.nacimiento) {
        add("Deducción por nacimiento/adopción (Madrid)", 600);
      }
      // Familia numerosa
      const nHijosMad = datos.n_hijos || 0;
      if (nHijosMad >= 3) {
        add("Deducción familia numerosa (Madrid)", nHijosMad >= 5 ? 1200 : 900);
      }
      break;
    }
    case "Cataluña": {
      // Alquiler Cataluña
      const alqCat = Number(checks.alquiler || 0);
      if (alqCat > 0) {
        add("Deducción alquiler (Cataluña)", Math.min(alqCat * 0.10, 300));
      }
      // Familia
      const nHijosCat = datos.n_hijos || 0;
      if (nHijosCat >= 3) {
        add("Deducción familia numerosa (Cataluña)", nHijosCat * 150);
      }
      break;
    }
    case "Comunitat Valenciana": {
      // Vivienda joven
      if (checks.vivienda_joven) {
        add("Deducción vivienda joven (C. Valenciana)", 500);
      }
      // Conciliación
      const concAmount = Number(checks.conciliacion_amount || 0);
      if (concAmount > 0) {
        add("Deducción conciliación (C. Valenciana)", Math.min(concAmount * 0.15, 418));
      }
      break;
    }
    case "Canarias": {
      const vivCanAmount = Number(checks.vivienda_amount || 0);
      if (vivCanAmount > 0) {
        add("Deducción vivienda (Canarias)", Math.min(vivCanAmount * 0.20, 2000));
      }
      break;
    }
    case "Galicia": {
      const alqGal = Number(checks.alquiler || 0);
      if (alqGal > 0) {
        add("Deducción alquiler (Galicia)", Math.min(alqGal * 0.10, 300));
      }
      break;
    }
    case "Castilla y León": {
      const nHijosCyl = datos.n_hijos || 0;
      if (nHijosCyl >= 3) {
        add("Deducción familia numerosa (Castilla y León)", nHijosCyl * 246);
      }
      break;
    }
    case "Aragón": {
      const alqAr = Number(checks.alquiler || 0);
      if (alqAr > 0) {
        add("Deducción alquiler (Aragón)", Math.min(alqAr * 0.10, 300));
      }
      break;
    }
    case "Islas Baleares": {
      const alqBal = Number(checks.alquiler || 0);
      if (alqBal > 0) {
        add("Deducción alquiler (Baleares)", Math.min(alqBal * 0.15, 530));
      }
      break;
    }
    case "Asturias": {
      const guarderiaAs = Number(checks.guarderia_amount || 0);
      if (guarderiaAs > 0) {
        add("Deducción guardería (Asturias)", Math.min(guarderiaAs * 0.15, 330));
      }
      break;
    }
    case "Extremadura": {
      const alqEx = Number(checks.alquiler || 0);
      if (alqEx > 0) {
        add("Deducción alquiler (Extremadura)", Math.min(alqEx * 0.10, 300));
      }
      break;
    }
    case "La Rioja": {
      const nHijosLR = datos.n_hijos || 0;
      if (nHijosLR >= 3) {
        add("Deducción familia numerosa (La Rioja)", 150 * nHijosLR);
      }
      break;
    }
    case "Murcia": {
      const nHijosMu = datos.n_hijos || 0;
      if (nHijosMu >= 3) {
        add("Deducción familia numerosa (Murcia)", 100 * nHijosMu);
      }
      break;
    }
    case "Cantabria": {
      if (checks.vivienda) {
        add("Deducción vivienda (Cantabria)", 300);
      }
      break;
    }
    case "Castilla-La Mancha": {
      if (checks.vivienda) {
        add("Deducción vivienda (Castilla-La Mancha)", 300);
      }
      break;
    }
    case "País Vasco": {
      if (checks.vivienda) {
        add("Deducción vivienda (País Vasco)", 1530);
      }
      break;
    }
    case "Navarra": {
      const alqNav = Number(checks.alquiler || 0);
      if (alqNav > 0) {
        add("Deducción alquiler (Navarra)", Math.min(alqNav * 0.15, 900));
      }
      break;
    }
    default:
      break;
  }

  const total = desglose.reduce((sum, d) => sum + d.importe, 0);
  return { total: Math.round(total * 100) / 100, desglose };
}

// ============================================================
// DETECCIÓN DE CASOS COMPLEJOS
// ============================================================
function detectarComplejidad(datos: RespuestasSimulador): { esComplejo: boolean; motivo?: string; flags: string[] } {
  const flags: string[] = [];

  if (datos.situacion === "Autónomo") flags.push("autonomo");
  if (datos.mas_de_un_pagador) flags.push("varios_pagadores");
  if (datos.compra_vivienda && datos.vivienda_fecha) {
    const year = new Date(datos.vivienda_fecha).getFullYear();
    if (year >= 2013) flags.push("vivienda_post2013");
  }
  if ((datos.ingresos_brutos || 0) > 60000) flags.push("ingresos_altos");

  const esComplejo = flags.includes("autonomo") || flags.includes("ingresos_altos");
  const motivo = esComplejo
    ? flags.includes("autonomo")
      ? "Actividad económica como autónomo requiere revisión especializada"
      : "Ingresos superiores a 60.000€ requieren revisión especializada"
    : undefined;

  return { esComplejo, motivo, flags };
}

// ============================================================
// FUNCIÓN PRINCIPAL DE CÁLCULO
// ============================================================
export function calcularRenta(datos: RespuestasSimulador): ResultadoCalculo {
  const ingresos = datos.ingresos_brutos || 0;
  const retenciones = datos.retenciones || 0;

  // 1. Rendimiento neto del trabajo
  const reduccionTrabajo = calcularReduccionTrabajo(ingresos);
  const rendimientoNetoTrabajo = Math.max(0, ingresos - reduccionTrabajo);

  // 2. Reducción por planes de pensiones
  const reduccionPlanes = Math.min(datos.importe_planes || 0, 2000);

  // 3. Base imponible general
  const baseImponibleGeneral = Math.max(0, rendimientoNetoTrabajo - reduccionPlanes);

  // 4. Mínimo personal y familiar
  const minimoPersonal = calcularMinimoPersonal(datos);

  // 5. Cuota íntegra
  const cuotaEstatales = calcularCuotaTramos(baseImponibleGeneral, TRAMOS_ESTATALES);
  const cuotaMinimo = calcularCuotaTramos(minimoPersonal, TRAMOS_ESTATALES);
  const cuotaIntegraNeta = Math.max(0, cuotaEstatales - cuotaMinimo);
  const cuotaIntegra = cuotaIntegraNeta;
  const cuotaIntegra50 = cuotaIntegraNeta / 2; // mitad estatal, mitad autonómica

  // 6. Deducciones estatales
  const deduccionVivienda = calcularDeduccionVivienda(datos);
  const deduccionDonaciones = calcularDeduccionDonaciones(datos.importe_donaciones || 0);
  const deduccionMaternidad = calcularDeduccionMaternidad(datos);
  const deduccionFamiliaNumerosa = calcularDeduccionFamiliaNumerosa(datos);
  const deduccionDiscapacidad = datos.contribuyente?.discapacidad ? 1150 : 0;

  // 7. Deducciones autonómicas
  const { total: deduccionesAutonomicasTotal, desglose: desgloseAut } = calcularDeduccionesAutonomicas(datos);

  const totalDeducciones = deduccionVivienda + deduccionDonaciones + deduccionMaternidad +
    deduccionFamiliaNumerosa + deduccionDiscapacidad + deduccionesAutonomicasTotal;

  // 8. Cuota líquida
  const cuotaLiquida = Math.max(0, cuotaIntegra - totalDeducciones);

  // 9. Resultado
  const resultado = Math.round((cuotaLiquida - retenciones) * 100) / 100;

  // 10. Estimación borrador (sin deducciones optimizadas - solo retenciones vs cuota básica)
  const cuotaBorrador = calcularCuotaTramos(baseImponibleGeneral, TRAMOS_ESTATALES);
  const resultadoBorrador = Math.round((cuotaBorrador - retenciones) * 100) / 100;
  const ahorroVsBorrador = Math.round((resultadoBorrador - resultado) * 100) / 100;

  // 11. Complejidad
  const { esComplejo, motivo, flags } = detectarComplejidad(datos);

  // 12. Casillas principales del modelo 100
  const casillas: Record<string, number> = {
    "001": ingresos,
    "003": reduccionTrabajo,
    "007": reduccionPlanes,
    "011": baseImponibleGeneral,
    "019": cuotaIntegra50,
    "020": cuotaIntegra50,
    "547": deduccionVivienda,
    "563": deduccionDonaciones,
    "545": deduccionMaternidad,
    "588": deduccionFamiliaNumerosa,
    "590": deduccionDiscapacidad,
    "620": cuotaLiquida,
    "621": retenciones,
    "670": resultado,
  };

  // 13. Desglose de deducciones para UI
  const desgloseEstatales: Array<{ concepto: string; importe: number; tipo: "estatal" | "autonomica" }> = [];
  if (deduccionVivienda > 0) desgloseEstatales.push({ concepto: "Deducción vivienda habitual (pre-2013)", importe: deduccionVivienda, tipo: "estatal" });
  if (deduccionDonaciones > 0) desgloseEstatales.push({ concepto: "Deducción por donativos", importe: deduccionDonaciones, tipo: "estatal" });
  if (deduccionMaternidad > 0) desgloseEstatales.push({ concepto: "Deducción por maternidad", importe: deduccionMaternidad, tipo: "estatal" });
  if (deduccionFamiliaNumerosa > 0) desgloseEstatales.push({ concepto: "Deducción familia numerosa", importe: deduccionFamiliaNumerosa, tipo: "estatal" });
  if (deduccionDiscapacidad > 0) desgloseEstatales.push({ concepto: "Deducción por discapacidad", importe: deduccionDiscapacidad, tipo: "estatal" });

  const desgloseAutonomicasTyped = desgloseAut.map(d => ({ ...d, tipo: "autonomica" as const }));

  return {
    ingresos_brutos: ingresos,
    retenciones,
    reduccion_trabajo: reduccionTrabajo,
    reduccion_planes: reduccionPlanes,
    base_imponible_general: baseImponibleGeneral,
    cuota_integra_estatal: cuotaIntegra50,
    cuota_integra_autonomica: cuotaIntegra50,
    cuota_integra_total: cuotaIntegra,
    deduccion_vivienda: deduccionVivienda,
    deduccion_maternidad: deduccionMaternidad,
    deduccion_familia_numerosa: deduccionFamiliaNumerosa,
    deduccion_discapacidad: deduccionDiscapacidad,
    deduccion_donaciones: deduccionDonaciones,
    deducciones_autonomicas: deduccionesAutonomicasTotal,
    total_deducciones: totalDeducciones,
    cuota_liquida: cuotaLiquida,
    resultado,
    resultado_borrador: resultadoBorrador,
    ahorro_vs_borrador: ahorroVsBorrador,
    casillas,
    flags,
    es_complejo: esComplejo,
    motivo_complejidad: motivo,
    desglose_deducciones: [...desgloseEstatales, ...desgloseAutonomicasTyped],
  };
}

// ============================================================
// CÁLCULO DE PRECIO
// ============================================================
export interface PrecioConfig {
  base: number; // en céntimos
  suplementos: Record<string, number>; // clave -> céntimos
}

export const PRECIO_DEFAULT: PrecioConfig = {
  base: 2900, // 29€
  suplementos: {
    autonomo: 2000,        // +20€
    vivienda: 1500,        // +15€
    discapacidad: 1000,    // +10€
    varios_pagadores: 500, // +5€
    ingresos_altos: 2000,  // +20€
    donaciones: 500,       // +5€
    planes: 500,           // +5€
  },
};

export function calcularPrecio(
  datos: RespuestasSimulador,
  config: PrecioConfig = PRECIO_DEFAULT
): { precioBase: number; suplementos: Array<{ concepto: string; descripcion: string; importe: number }>; precioTotal: number } {
  const suplementosAplicados: Array<{ concepto: string; descripcion: string; importe: number }> = [];

  if (datos.situacion === "Autónomo") {
    suplementosAplicados.push({ concepto: "autonomo", descripcion: "Actividad económica (autónomo)", importe: config.suplementos.autonomo || 0 });
  }
  if (datos.compra_vivienda) {
    suplementosAplicados.push({ concepto: "vivienda", descripcion: "Compraventa de vivienda", importe: config.suplementos.vivienda || 0 });
  }
  if (datos.contribuyente?.discapacidad) {
    suplementosAplicados.push({ concepto: "discapacidad", descripcion: "Situación de discapacidad", importe: config.suplementos.discapacidad || 0 });
  }
  if (datos.mas_de_un_pagador) {
    suplementosAplicados.push({ concepto: "varios_pagadores", descripcion: "Más de un pagador", importe: config.suplementos.varios_pagadores || 0 });
  }
  if ((datos.ingresos_brutos || 0) > 60000) {
    suplementosAplicados.push({ concepto: "ingresos_altos", descripcion: "Ingresos superiores a 60.000€", importe: config.suplementos.ingresos_altos || 0 });
  }
  if ((datos.importe_donaciones || 0) > 0) {
    suplementosAplicados.push({ concepto: "donaciones", descripcion: "Deducciones por donativos", importe: config.suplementos.donaciones || 0 });
  }
  if ((datos.importe_planes || 0) > 0) {
    suplementosAplicados.push({ concepto: "planes", descripcion: "Planes de pensiones", importe: config.suplementos.planes || 0 });
  }

  const totalSupl = suplementosAplicados.reduce((s, x) => s + x.importe, 0);
  const precioTotal = config.base + totalSupl;

  return {
    precioBase: config.base,
    suplementos: suplementosAplicados,
    precioTotal,
  };
}
