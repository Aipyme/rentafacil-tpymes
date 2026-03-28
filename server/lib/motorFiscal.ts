/**
 * Motor Fiscal IRPF 2025 - Renta Fácil TPymes
 * Implementa el cálculo completo del IRPF 2025 con deducciones estatales y autonómicas.
 * Todos los importes en euros.
 */

export interface RespuestasSimulador {
  // Sección A - Clasificación inicial
  situacion: "Asalariado" | "Pensionista" | "Autónomo" | "Desempleado" | "Mixto";
  mas_de_un_pagador?: boolean;
  segundo_pagador_importe?: number;       // importe del segundo pagador (umbral 1.500€)
  compra_vivienda?: boolean;
  personas_a_cargo?: boolean;
  deducciones_check?: string[];

  // Bloque Autónomo
  regimen_autonomo?: "estimacion_directa" | "estimacion_objetiva" | "ambos";
  tiene_trabajadores?: boolean;           // trabajadores a cargo o subcontrataciones

  // Prestaciones y otros rendimientos del trabajo
  tiene_prestaciones?: boolean;           // desempleo, maternidad, IT...
  tipo_prestacion?: string;               // detalle de la prestación

  // Rendimientos del capital
  tiene_capital_mobiliario?: boolean;     // dividendos, intereses, fondos...
  importe_capital_mobiliario?: number;
  tiene_capital_inmobiliario?: boolean;   // alquiler de inmuebles (propietario)
  importe_capital_inmobiliario?: number;
  tiene_ganancias_patrimoniales?: boolean; // venta de acciones, inmuebles, criptos
  importe_ganancias_patrimoniales?: number;

  // Imputaciones de renta
  tiene_imputacion_rentas?: boolean;      // inmuebles a disposición, transparencia fiscal

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
    porcentaje_discapacidad?: number;     // 0, 33, 65
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
  flag_review: boolean;           // revisión humana recomendada aunque no sea complejo
  motivo_complejidad?: string;
  plan_code: "SIMPLE" | "SIMPLE_REVIEW" | "COMPLEJA" | "CRM"; // contrato MOTOE

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
// Implementa las reglas del árbol de decisión v2 (validado con Cristina)
// ============================================================
function detectarComplejidad(datos: RespuestasSimulador): { esComplejo: boolean; motivo?: string; flags: string[]; flag_review: boolean } {
  const flags: string[] = [];
  const motivos: string[] = [];

  // --- Bloque Asalariado ---
  if (datos.mas_de_un_pagador) {
    flags.push("varios_pagadores");
    // Segundo pagador > 1.500€ activa flag_review (posible obligación de declarar)
    if ((datos.segundo_pagador_importe || 0) > 1500) {
      flags.push("segundo_pagador_relevante");
      motivos.push("Segundo pagador superior a 1.500€");
    }
  }

  if (datos.tiene_prestaciones) {
    flags.push("prestaciones");
    // Prestaciones + actividad económica simultánea = complejo
    if (datos.situacion === "Autónomo" || datos.situacion === "Mixto") {
      flags.push("prestaciones_con_actividad");
      motivos.push("Prestaciones compatibles con actividad económica");
    }
  }

  // --- Bloque Autónomo ---
  if (datos.situacion === "Autónomo" || datos.situacion === "Mixto") {
    flags.push("autonomo");
    motivos.push("Actividad económica por cuenta propia");

    if (datos.regimen_autonomo === "ambos") {
      flags.push("regimen_mixto_autonomo");
      motivos.push("Estimación directa y módulos simultáneos");
    }
    if (datos.tiene_trabajadores) {
      flags.push("trabajadores_a_cargo");
      motivos.push("Trabajadores a cargo o subcontrataciones");
    }
  }

  if (datos.situacion === "Mixto") {
    flags.push("contribuyente_mixto");
    motivos.push("Rendimientos del trabajo y actividad económica simultáneos");
  }

  // --- Bloque Vivienda ---
  if (datos.compra_vivienda && datos.vivienda_fecha) {
    const year = new Date(datos.vivienda_fecha).getFullYear();
    if (year >= 2013) {
      flags.push("vivienda_post2013");
    } else {
      flags.push("vivienda_pre2013");
    }
  }

  // --- Rendimientos del capital ---
  if (datos.tiene_capital_mobiliario) {
    flags.push("capital_mobiliario");
    if ((datos.importe_capital_mobiliario || 0) > 1600) {
      flags.push("capital_mobiliario_relevante");
      motivos.push("Rendimientos del capital mobiliario superiores a 1.600€");
    }
  }

  if (datos.tiene_capital_inmobiliario) {
    flags.push("capital_inmobiliario");
    motivos.push("Rendimientos de alquiler de inmuebles");
    // Alquiler + actividad económica = complejidad adicional
    if (datos.situacion === "Autónomo" || datos.situacion === "Mixto") {
      flags.push("capital_inmobiliario_con_actividad");
      motivos.push("Rentas inmobiliarias con actividad económica simultánea");
    }
  }

  if (datos.tiene_ganancias_patrimoniales) {
    flags.push("ganancias_patrimoniales");
    motivos.push("Ganancias o pérdidas patrimoniales (venta de activos)");
  }

  if (datos.tiene_imputacion_rentas) {
    flags.push("imputacion_rentas");
    motivos.push("Imputación de rentas inmobiliarias");
  }

  // --- Ingresos altos ---
  if ((datos.ingresos_brutos || 0) > 60000) {
    flags.push("ingresos_altos");
    motivos.push("Ingresos superiores a 60.000€");
  }

  // --- Discapacidad relevante ---
  if ((datos.contribuyente?.porcentaje_discapacidad || 0) >= 65) {
    flags.push("discapacidad_severa");
    motivos.push("Discapacidad ≥65% con reglas adicionales");
  }

  // --- Regla de complejidad final (cualquiera de estas condiciones) ---
  const esComplejo =
    flags.includes("autonomo") ||
    flags.includes("contribuyente_mixto") ||
    flags.includes("regimen_mixto_autonomo") ||
    flags.includes("capital_inmobiliario") ||
    flags.includes("ganancias_patrimoniales") ||
    flags.includes("imputacion_rentas") ||
    flags.includes("prestaciones_con_actividad") ||
    flags.includes("capital_inmobiliario_con_actividad") ||
    (flags.includes("ingresos_altos") && flags.includes("capital_mobiliario_relevante"));

  // --- flag_review: revisión humana aunque no sea complejo ---
  const flag_review =
    esComplejo ||
    flags.includes("segundo_pagador_relevante") ||
    flags.includes("trabajadores_a_cargo") ||
    flags.includes("discapacidad_severa") ||
    flags.includes("ingresos_altos");

  const motivo = motivos.length > 0 ? motivos.join(" | ") : undefined;

  return { esComplejo, motivo, flags, flag_review };
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
  const { esComplejo, motivo, flags, flag_review } = detectarComplejidad(datos);

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
    flag_review,
    motivo_complejidad: motivo,
    plan_code: esComplejo ? "COMPLEJA" : flag_review ? "SIMPLE_REVIEW" : "SIMPLE",
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
  base: 3900, // 39€ — Renta Simple
  suplementos: {
    autonomo: 6000,        // +60€ (sube a 99€ mínimo → Renta Premium)
    vivienda: 2000,        // +20€ por inmueble/propiedad
    discapacidad: 1000,    // +10€ por discapacidad
    varios_pagadores: 1000,// +10€ por 2+ pagadores
    ingresos_altos: 2000,  // +20€ por ingresos >60k
    donaciones: 500,       // +5€ por donativos
    planes: 500,           // +5€ por planes pensiones
    inversiones: 1500,     // +15€ por inversiones
    hipoteca_pre2013: 1000,// +10€ por hipoteca pre-2013
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
