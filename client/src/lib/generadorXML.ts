/**
 * Generador de fichero XML Modelo 100 IRPF 2024
 * Compatible con Renta Web (AEAT) - Importación directa
 * XSD: Renta2024.xsd v1.02
 *
 * Cubre deducciones autonómicas de las 15 comunidades de régimen común:
 * Andalucía, Aragón, Asturias, Baleares, Canarias, Cantabria,
 * Castilla-La Mancha, Castilla y León, Cataluña, Extremadura,
 * Galicia, Madrid, Murcia, La Rioja, Comunidad Valenciana
 */

// ─────────────────────────────────────────────
// Tipos de datos
// ─────────────────────────────────────────────

export interface Pagador {
  importeIntegro: number;
  retenciones: number;
  cuotasSS?: number;
  cuotasSindicato?: number;
  cuotasColegio?: number;
  gastoDefensa?: number;
}

export interface CapitalMobiliario {
  importeIntegro: number;
  retenciones: number;
}

export interface Inmueble {
  referenciaCatastral: string;
  uso: "VH" | "A" | "IR";
  importeAlquiler?: number;
  retencionesAlquiler?: number;
  valorCatastral?: number;
}

// ── Deducciones autonómicas por comunidad ──

export interface DeduccionAndalucia {
  // A3: Alquiler vivienda habitual
  alquilerVivienda?: number;
  alquilerConjunta?: boolean;
  // A1: Nacimiento/adopción (importe por menor)
  nacimientoImporteMenor?: number;
  nacimientoNumHijos?: number;
  // A9: Discapacidad ascendiente
  discapacidadAscendiente?: boolean;
  discapacidadNumAscendientes?: number;
  // A4: Cuidado familiares (NIF + importe)
  cuidadoFamiliarImporte1?: number;
  cuidadoFamiliarNif1?: string;
  // A7: Gastos escolares
  gastosEscolaresC01?: number;
  gastosEscolaresC02?: number;
}

export interface DeduccionAragon {
  // AR1: Nacimiento/adopción
  nacimientoDeduccion?: boolean;
  nacimientoImporteConyuge?: number;
  nacimientoImporteTitular?: number;
  // AR2: Familia numerosa
  familiaNumerosaDeduccion?: boolean;
  familiaNumerosaImporteConyuge?: number;
  familiaNumerosaImporteTitular?: number;
  // AR3: Discapacidad
  discapacidadDeduccion?: boolean;
  discapacidadImporteConyuge?: number;
  discapacidadTituloConyuge?: string;
  discapacidadImporteTitular?: number;
  discapacidadTituloTitular?: string;
  // AR4: Alquiler vivienda habitual
  alquilerVivienda?: number;
}

export interface DeduccionAsturias {
  // PA1: Nacimiento/adopción
  nacimientoImporteConyuge?: number;
  nacimientoImporteTitular?: number;
  nacimientoNumHijos?: number;
  // PA2: Familia numerosa
  familiaNumerosaImporte?: number;
  familiaNumerosaDeduccion?: boolean;
  familiaNumerosaNum?: number;
  // PA4: Discapacidad
  discapacidadImporte?: number;
  discapacidadNum?: number;
  // PA5: Alquiler vivienda habitual
  alquilerImporte1?: number;
  alquilerMeses1?: number;
  alquilerNum1?: number;
  alquilerNif1?: string;
}

export interface DeduccionBaleares {
  // IB1: Nacimiento/adopción
  nacimientoImporte1?: number;
  nacimientoRc1?: string;
  nacimientoImporte2?: number;
  nacimientoRc2?: string;
  // IB2: Familia numerosa
  familiaNumerosaImporte1?: number;
  familiaNumerosaC01?: number;
  familiaNumerosaC02?: number;
  familiaNumerosaConjunta?: boolean;
  // IB3: Discapacidad
  discapacidadImporte1?: number;
  discapacidadC01?: number;
  discapacidadC02?: number;
  discapacidadConjunta?: boolean;
  // IB4: Alquiler vivienda habitual
  alquilerVivienda?: number;
}

export interface DeduccionCanarias {
  // CAN1: Nacimiento/adopción
  nacimientoImporte?: number;
  // CAN2: Familia numerosa
  familiaNumerosaImporte?: number;
  // CAN3: Discapacidad
  discapacidadImporte?: number;
  // CAN4: Alquiler vivienda habitual
  alquilerConjunta?: boolean;
  alquilerDeduccion?: boolean;
  alquilerNum1?: number;
  alquilerNif1?: string;
  alquilerRc1?: string;
}

export interface DeduccionCantabria {
  // CANT1: Nacimiento/adopción
  nacimientoImporte1?: number;
  nacimientoNif1?: string;
  nacimientoImporte2?: number;
  nacimientoNif2?: string;
  // CANT2: Familia numerosa
  familiaNumerosaD01S?: number;
  familiaNumerosaD02S?: number;
  familiaNumerosaD01C?: number;
  familiaNumerosaD02C?: number;
  // CANT3: Discapacidad
  discapacidadImporteAnt1?: number;
  discapacidadImporteAnt2?: number;
  discapacidadImporte?: number;
  discapacidadNif?: string;
  // CANT4: Alquiler vivienda habitual
  alquilerImporte1?: number;
  alquilerImporte2?: number;
}

export interface DeduccionCastillaLaMancha {
  // CM5: Nacimiento/adopción
  nacimientoDeduccion?: boolean;
  // CM6: Familia numerosa (hasta 4 miembros)
  familiaNumerosaNif1?: string;
  familiaNumerosaNom1?: string;
  familiaNumerosaDed1?: number;
  familiaNumerosaNif2?: string;
  familiaNumerosaNom2?: string;
  familiaNumerosaDed2?: number;
  // CM7: Discapacidad
  discapacidadImporte?: number;
  // CM8: Alquiler vivienda habitual
  alquilerCat1?: number;
  alquilerCat1T?: number;
  alquilerCat2?: number;
  alquilerCat2T?: number;
  alquilerNum?: number;
}

export interface DeduccionCastillaYLeon {
  // CL1: Nacimiento/adopción
  nacimientoDeduccion?: boolean;
  nacimientoImporteConyuge?: number;
  nacimientoMayorConyuge?: boolean;
  nacimientoTitular?: string;
  nacimientoMayorTitular?: boolean;
  // CL2: Familia numerosa
  familiaNumerosaImporte?: number;
  // CL3: Discapacidad
  discapacidadImporte?: number;
  // CL4: Alquiler vivienda habitual
  alquilerVivienda?: number;
}

export interface DeduccionCatalunya {
  // CT1: Nacimiento/adopción
  nacimientoC01?: number;
  nacimientoC02?: number;
  nacimientoDeduccion?: boolean;
  // CT2: Alquiler vivienda habitual
  alquilerVivienda?: number;
  // CT3: Discapacidad
  discapacidadImporte1?: number;
  discapacidadDonacion?: boolean;
  discapacidadDonacionConyuge?: boolean;
  discapacidadImporte2?: number;
  // CT4: Familia numerosa
  familiaNumerosaImporte1?: number;
  familiaNumerosaNif1?: string;
  familiaNumerosaNum1?: number;
  familiaNumerosaDeduccion?: boolean;
  familiaNumerosaFamNum?: boolean;
}

export interface DeduccionExtremadura {
  // E1: Nacimiento/adopción
  nacimientoRural?: boolean;
  nacimientoFamNumeralRural?: boolean;
  nacimientoImporte1?: number;
  nacimientoNcon1?: number;
  nacimientoMr1?: boolean;
  nacimientoImporte2?: number;
  nacimientoNcon2?: number;
  nacimientoMr2?: boolean;
  // E3: Familia numerosa
  familiaNumerosaRural?: boolean;
  familiaNumerosaFnRural?: boolean;
  familiaNumerosaImporteConyuge1?: number;
  familiaNumerosaDeduccion1?: boolean;
  familiaNumerosaNum1?: number;
  // E4: Discapacidad
  discapacidadMenorConyuge?: number;
  discapacidadMenorTitular?: number;
  discapacidadHijosConyuge?: number;
  discapacidadHijosTitular?: number;
  discapacidadConjunta?: boolean;
  // E7: Alquiler vivienda habitual
  alquilerRural?: boolean;
  alquilerFnRural?: boolean;
  alquilerC01?: number;
  alquilerC02?: number;
  alquilerConjunta?: boolean;
}

export interface DeduccionGalicia {
  // GA1: Nacimiento/adopción (complejo)
  nacimientoOrden1?: number;
  nacimientoDeduccion1?: number;
  nacimientoDiscapacidad1?: boolean;
  nacimientoOrden1AA?: string;
  // GA2: Familia numerosa
  familiaNumerosaFnumC?: boolean;
  familiaNumerosaFnumT?: boolean;
  familiaNumerosaFnEspC?: boolean;
  familiaNumerosaFnEspT?: boolean;
  familiaNumerosaDisC?: boolean;
  familiaNumerosaDisT?: boolean;
  familiaNumerosaConjunta?: boolean;
  familiaNumerosaNumPer?: number;
  // GA3: Discapacidad
  discapacidadImporte11?: number;
  discapacidadImporte12?: number;
  discapacidadNum1?: number;
  discapacidadC01?: number;
  discapacidadC02?: number;
  // GA4: Alquiler vivienda habitual
  alquilerRequerido?: boolean;
  alquilerImporte?: number;
}

export interface DeduccionMadrid {
  // M1: Nacimiento/adopción
  nacimientoCom1?: number;
  nacimientoDeduccion1?: boolean;
  nacimientoConjunta?: boolean;
  nacimientoCom2?: number;
  nacimientoDeduccion2?: boolean;
  // M2: Acogimiento
  acogimientoC01?: number;
  acogimientoC02?: number;
  acogimientoConjunta?: boolean;
  // M3: Familia numerosa
  familiaNumerosaCom1?: number;
  familiaNumerosaDeduccion1?: boolean;
  familiaNumerosaConjunta?: boolean;
  // M4: Discapacidad
  discapacidadC01?: number;
  discapacidadC02?: number;
  discapacidadNum1?: number;
  // M5: Alquiler vivienda habitual
  alquilerImporte1?: number;
  alquilerNif1?: string;
  alquilerImporte2?: number;
  alquilerNif2?: string;
  // M11: Gastos educación
  educacionNif1?: string;
  educacionImp11?: number;
  educacionImp21?: number;
  educacionImp31?: number;
}

export interface DeduccionMurcia {
  // MU1: Nacimiento/adopción
  nacimientoImporte1?: number;
  nacimientoTipoReg1?: string;
  nacimientoImporte2?: number;
  nacimientoTipoReg2?: string;
  // MU2: Familia numerosa
  familiaNumerosaImporte?: number;
  // MU3: Discapacidad
  discapacidadImp1A?: number;
  discapacidadImp2A?: number;
  discapacidadImp1B?: number;
  discapacidadImp2B?: number;
  discapacidadNum1?: number;
  discapacidadNum2?: number;
  // MU4: Alquiler vivienda habitual
  alquilerImporte1?: number;
  alquilerRc1?: string;
  alquilerRcNo1?: string;
  alquilerTotal1?: number;
}

export interface DeduccionLaRioja {
  // LR1: Nacimiento/adopción
  nacimientoVg11?: number;
  nacimientoVg21?: number;
  nacimientoVg12?: number;
  nacimientoVg22?: number;
  nacimientoConjunta?: boolean;
  nacimientoPmo?: number;
  nacimientoPmd?: number;
  // LR2: Familia numerosa
  familiaNumerosaImporte?: number;
  // LR3: Discapacidad
  discapacidadImporte?: number;
  // LR4: Alquiler vivienda habitual
  alquilerImporte?: number;
  alquilerNcon?: number;
}

export interface DeduccionValenciana {
  // VA1: Nacimiento/adopción
  nacimientoCom1?: number;
  nacimientoDeduccion1?: boolean;
  nacimientoCom2?: number;
  nacimientoDeduccion2?: boolean;
  nacimientoNum1?: number;
  nacimientoDiasO?: number;
  nacimientoDiasT?: number;
  // VA3: Familia numerosa
  familiaNumerosaMenorConyuge?: number;
  familiaNumerosaMenorTitular?: number;
  familiaNumerosaHijosConyuge?: number;
  familiaNumerosaHijosTitular?: number;
  familiaNumerosaConjunta?: boolean;
  // VA5: Discapacidad
  discapacidadTipo1?: string;
  discapacidadMeses1?: number;
  discapacidadVal21?: number;
  discapacidadNum1?: number;
  // VA14: Alquiler vivienda habitual
  alquilerTipo1?: string;
  alquilerClave1?: string;
  alquilerImporte1?: number;
  alquilerMeses1?: number;
  alquilerNum1?: number;
  alquilerNif1?: string;
}

export interface DatosDeclaracion {
  nif: string;
  apellidosNombre: string;
  fechaNacimiento: string;
  sexo: "H" | "M";
  estadoCivil: "1" | "2" | "3" | "4" | "5";
  comunidadAutonoma: string;
  tipoTributacion?: "1" | "2";
  pagadores?: Pagador[];
  capitalMobiliario?: CapitalMobiliario;
  inmuebles?: Inmueble[];
  aportacionesPP?: number;
  numHijos?: number;
  ascendientesCargo?: number;
  gradoDiscapacidad?: number;
  // Deducciones autonómicas
  deduccionAndalucia?: DeduccionAndalucia;
  deduccionAragon?: DeduccionAragon;
  deduccionAsturias?: DeduccionAsturias;
  deduccionBaleares?: DeduccionBaleares;
  deduccionCanarias?: DeduccionCanarias;
  deduccionCantabria?: DeduccionCantabria;
  deduccionCastillaLaMancha?: DeduccionCastillaLaMancha;
  deduccionCastillaYLeon?: DeduccionCastillaYLeon;
  deduccionCatalunya?: DeduccionCatalunya;
  deduccionExtremadura?: DeduccionExtremadura;
  deduccionGalicia?: DeduccionGalicia;
  deduccionMadrid?: DeduccionMadrid;
  deduccionMurcia?: DeduccionMurcia;
  deduccionLaRioja?: DeduccionLaRioja;
  deduccionValenciana?: DeduccionValenciana;
  // Resultado
  resultadoTipo?: "D" | "I" | "N";
  resultadoImporte?: number;
  cuentaDevolucion?: string;
  // Cónyuge
  nifConyuge?: string;
  apellidosNombreConyuge?: string;
  fechaNacimientoConyuge?: string;
  sexoConyuge?: "H" | "M";
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const CCAA_MAP: Record<string, string> = {
  "andalucia": "01", "01": "01",
  "aragon": "02", "02": "02",
  "asturias": "03", "03": "03",
  "baleares": "04", "04": "04",
  "canarias": "05", "05": "05",
  "cantabria": "06", "06": "06",
  "castilla_la_mancha": "07", "07": "07",
  "castilla_y_leon": "08", "08": "08",
  "cataluna": "09", "09": "09",
  "extremadura": "10", "10": "10",
  "galicia": "11", "11": "11",
  "madrid": "13", "13": "13",
  "murcia": "14", "14": "14",
  "navarra": "15", "15": "15",
  "pais_vasco": "16", "16": "16",
  "la_rioja": "17", "17": "17",
  "comunidad_valenciana": "18", "18": "18",
  "ceuta": "19", "19": "19",
  "melilla": "20", "20": "20",
  "Andalucía": "01",
  "Aragón": "02",
  "Asturias": "03",
  "Baleares": "04",
  "Canarias": "05",
  "Cantabria": "06",
  "Castilla-La Mancha": "07",
  "Castilla y León": "08",
  "Cataluña": "09",
  "Extremadura": "10",
  "Galicia": "11",
  "Madrid": "13",
  "Murcia": "14",
  "Navarra": "15",
  "País Vasco": "16",
  "La Rioja": "17",
  "Comunidad Valenciana": "18",
  "Ceuta": "19",
  "Melilla": "20",
};

function fmtImporte(valor: number): string {
  return String(Math.round(valor * 100));
}

function fmtFecha(fecha: string): string {
  if (!fecha) return "";
  if (/^\d{8}$/.test(fecha)) return fecha;
  const partes = fecha.replace(/-/g, "/").split("/");
  if (partes.length === 3) {
    if (partes[2].length === 4) {
      return partes[0].padStart(2, "0") + partes[1].padStart(2, "0") + partes[2];
    } else {
      return partes[2].padStart(2, "0") + partes[1].padStart(2, "0") + partes[0];
    }
  }
  return fecha;
}

function fmtNif(nif: string): string {
  return nif.toUpperCase().replace(/[\s\-]/g, "");
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function logico(val?: boolean): string {
  return val ? "S" : "N";
}

// ─────────────────────────────────────────────
// Generadores de bloques autonómicos
// ─────────────────────────────────────────────

function genAndalucia(da: DeduccionAndalucia, lines: string[]): void {
  const tiene = (da.alquilerVivienda || 0) > 0 ||
    (da.nacimientoImporteMenor || 0) > 0 ||
    da.discapacidadAscendiente ||
    (da.cuidadoFamiliarImporte1 || 0) > 0 ||
    (da.gastosEscolaresC01 || 0) > 0;
  if (!tiene) return;

  lines.push('      <DeduccionAutonomica codigoCA="01">');
  lines.push('        <Andalucia>');

  // A3: Alquiler vivienda habitual
  if ((da.alquilerVivienda || 0) > 0) {
    lines.push('          <A3>');
    lines.push(`            <IMPA3>${fmtImporte(da.alquilerVivienda!)}</IMPA3>`);
    if (da.alquilerConjunta) lines.push('            <CONYA3>S</CONYA3>');
    lines.push('          </A3>');
  }

  // A1: Nacimiento/adopción
  if ((da.nacimientoImporteMenor || 0) > 0) {
    lines.push('          <A1>');
    lines.push(`            <MENORA1>${fmtImporte(da.nacimientoImporteMenor!)}</MENORA1>`);
    if (da.nacimientoNumHijos) lines.push(`            <NUM1A1>${da.nacimientoNumHijos}</NUM1A1>`);
    lines.push('          </A1>');
  }

  // A9: Discapacidad ascendiente
  if (da.discapacidadAscendiente) {
    lines.push('          <A9>');
    lines.push('            <REQA9>S</REQA9>');
    if (da.discapacidadNumAscendientes) lines.push(`            <ASCA9>${da.discapacidadNumAscendientes}</ASCA9>`);
    lines.push('          </A9>');
  }

  // A4: Cuidado familiares
  if ((da.cuidadoFamiliarImporte1 || 0) > 0) {
    lines.push('          <A4>');
    lines.push(`            <IMP1A4>${fmtImporte(da.cuidadoFamiliarImporte1!)}</IMP1A4>`);
    if (da.cuidadoFamiliarNif1) lines.push(`            <VNIF1A4>${escapeXml(da.cuidadoFamiliarNif1)}</VNIF1A4>`);
    lines.push('          </A4>');
  }

  // A7: Gastos escolares
  if ((da.gastosEscolaresC01 || 0) > 0) {
    lines.push('          <A7>');
    lines.push(`            <C01A7>${fmtImporte(da.gastosEscolaresC01!)}</C01A7>`);
    if (da.gastosEscolaresC02) lines.push(`            <C02A7>${fmtImporte(da.gastosEscolaresC02)}</C02A7>`);
    lines.push('          </A7>');
  }

  lines.push('        </Andalucia>');
  lines.push('      </DeduccionAutonomica>');
}

function genAragon(da: DeduccionAragon, lines: string[]): void {
  const tiene = da.nacimientoDeduccion || (da.familiaNumerosaImporteConyuge || 0) > 0 ||
    da.discapacidadDeduccion || (da.alquilerVivienda || 0) > 0;
  if (!tiene) return;

  lines.push('      <DeduccionAutonomica codigoCA="02">');
  lines.push('        <Aragon>');

  if (da.nacimientoDeduccion) {
    lines.push('          <AR1>');
    lines.push('            <DECAR1>S</DECAR1>');
    if ((da.nacimientoImporteConyuge || 0) > 0) lines.push(`            <C01AR1>${fmtImporte(da.nacimientoImporteConyuge!)}</C01AR1>`);
    if ((da.nacimientoImporteTitular || 0) > 0) lines.push(`            <C02AR1>${fmtImporte(da.nacimientoImporteTitular!)}</C02AR1>`);
    lines.push('          </AR1>');
  }

  if ((da.familiaNumerosaImporteConyuge || 0) > 0 || (da.familiaNumerosaImporteTitular || 0) > 0) {
    lines.push('          <AR2>');
    lines.push('            <DECAR2>S</DECAR2>');
    if ((da.familiaNumerosaImporteConyuge || 0) > 0) lines.push(`            <C01AR2>${fmtImporte(da.familiaNumerosaImporteConyuge!)}</C01AR2>`);
    if ((da.familiaNumerosaImporteTitular || 0) > 0) lines.push(`            <C02AR2>${fmtImporte(da.familiaNumerosaImporteTitular!)}</C02AR2>`);
    lines.push('          </AR2>');
  }

  if (da.discapacidadDeduccion) {
    lines.push('          <AR3>');
    lines.push('            <DECAR3>S</DECAR3>');
    if ((da.discapacidadImporteConyuge || 0) > 0) lines.push(`            <COM1AR3>${fmtImporte(da.discapacidadImporteConyuge!)}</COM1AR3>`);
    if (da.discapacidadTituloConyuge) lines.push(`            <TIT1AR3>${escapeXml(da.discapacidadTituloConyuge)}</TIT1AR3>`);
    if ((da.discapacidadImporteTitular || 0) > 0) lines.push(`            <COM2AR3>${fmtImporte(da.discapacidadImporteTitular!)}</COM2AR3>`);
    if (da.discapacidadTituloTitular) lines.push(`            <TIT2AR3>${escapeXml(da.discapacidadTituloTitular)}</TIT2AR3>`);
    lines.push('          </AR3>');
  }

  if ((da.alquilerVivienda || 0) > 0) {
    lines.push('          <AR4>');
    lines.push(`            <IMPAR4>${fmtImporte(da.alquilerVivienda!)}</IMPAR4>`);
    lines.push('          </AR4>');
  }

  lines.push('        </Aragon>');
  lines.push('      </DeduccionAutonomica>');
}

function genAsturias(da: DeduccionAsturias, lines: string[]): void {
  const tiene = (da.nacimientoImporteConyuge || 0) > 0 || (da.nacimientoImporteTitular || 0) > 0 ||
    (da.familiaNumerosaImporte || 0) > 0 || (da.discapacidadImporte || 0) > 0 ||
    (da.alquilerImporte1 || 0) > 0;
  if (!tiene) return;

  lines.push('      <DeduccionAutonomica codigoCA="03">');
  lines.push('        <Asturias>');

  if ((da.nacimientoImporteConyuge || 0) > 0 || (da.nacimientoImporteTitular || 0) > 0) {
    lines.push('          <PA1>');
    if ((da.nacimientoImporteConyuge || 0) > 0) lines.push(`            <C01PA1>${fmtImporte(da.nacimientoImporteConyuge!)}</C01PA1>`);
    if ((da.nacimientoImporteTitular || 0) > 0) lines.push(`            <C02PA1>${fmtImporte(da.nacimientoImporteTitular!)}</C02PA1>`);
    if (da.nacimientoNumHijos) lines.push(`            <NUM1PA1>${da.nacimientoNumHijos}</NUM1PA1>`);
    lines.push('          </PA1>');
  }

  if ((da.familiaNumerosaImporte || 0) > 0) {
    lines.push('          <PA2>');
    lines.push(`            <IMPPA2>${fmtImporte(da.familiaNumerosaImporte!)}</IMPPA2>`);
    if (da.familiaNumerosaDeduccion) lines.push('            <DECPA2>S</DECPA2>');
    if (da.familiaNumerosaNum) lines.push(`            <NUMPA2>${da.familiaNumerosaNum}</NUMPA2>`);
    lines.push('          </PA2>');
  }

  if ((da.discapacidadImporte || 0) > 0) {
    lines.push('          <PA4>');
    lines.push(`            <IMPPA4>${fmtImporte(da.discapacidadImporte!)}</IMPPA4>`);
    if (da.discapacidadNum) lines.push(`            <NUMPA4>${da.discapacidadNum}</NUMPA4>`);
    lines.push('          </PA4>');
  }

  if ((da.alquilerImporte1 || 0) > 0) {
    lines.push('          <PA5>');
    lines.push(`            <IMP1PA5>${fmtImporte(da.alquilerImporte1!)}</IMP1PA5>`);
    if (da.alquilerMeses1) lines.push(`            <MR1PA5>${da.alquilerMeses1}</MR1PA5>`);
    if (da.alquilerNum1) lines.push(`            <NUM1PA5>${da.alquilerNum1}</NUM1PA5>`);
    if (da.alquilerNif1) lines.push(`            <NIF1PA5>${escapeXml(da.alquilerNif1)}</NIF1PA5>`);
    lines.push('          </PA5>');
  }

  lines.push('        </Asturias>');
  lines.push('      </DeduccionAutonomica>');
}

function genBaleares(da: DeduccionBaleares, lines: string[]): void {
  const tiene = (da.nacimientoImporte1 || 0) > 0 || (da.familiaNumerosaImporte1 || 0) > 0 ||
    (da.discapacidadImporte1 || 0) > 0 || (da.alquilerVivienda || 0) > 0;
  if (!tiene) return;

  lines.push('      <DeduccionAutonomica codigoCA="04">');
  lines.push('        <IBaleares>');

  if ((da.nacimientoImporte1 || 0) > 0) {
    lines.push('          <IB1>');
    lines.push(`            <IMP1IB1>${fmtImporte(da.nacimientoImporte1!)}</IMP1IB1>`);
    if (da.nacimientoRc1) lines.push(`            <RC1IB1>${escapeXml(da.nacimientoRc1)}</RC1IB1>`);
    if ((da.nacimientoImporte2 || 0) > 0) lines.push(`            <IMP2IB1>${fmtImporte(da.nacimientoImporte2!)}</IMP2IB1>`);
    if (da.nacimientoRc2) lines.push(`            <RC2IB1>${escapeXml(da.nacimientoRc2)}</RC2IB1>`);
    lines.push('          </IB1>');
  }

  if ((da.familiaNumerosaImporte1 || 0) > 0) {
    lines.push('          <IB2>');
    lines.push(`            <IMP1IB2>${fmtImporte(da.familiaNumerosaImporte1!)}</IMP1IB2>`);
    if (da.familiaNumerosaC01) lines.push(`            <C01IB2>${fmtImporte(da.familiaNumerosaC01)}</C01IB2>`);
    if (da.familiaNumerosaC02) lines.push(`            <C02IB2>${fmtImporte(da.familiaNumerosaC02)}</C02IB2>`);
    if (da.familiaNumerosaConjunta) lines.push('            <CONVIB2>S</CONVIB2>');
    lines.push('          </IB2>');
  }

  if ((da.discapacidadImporte1 || 0) > 0) {
    lines.push('          <IB3>');
    lines.push(`            <IMP1IB3>${fmtImporte(da.discapacidadImporte1!)}</IMP1IB3>`);
    if (da.discapacidadC01) lines.push(`            <C01IB3>${fmtImporte(da.discapacidadC01)}</C01IB3>`);
    if (da.discapacidadC02) lines.push(`            <C02IB3>${fmtImporte(da.discapacidadC02)}</C02IB3>`);
    if (da.discapacidadConjunta) lines.push('            <CONVIB3>S</CONVIB3>');
    lines.push('          </IB3>');
  }

  if ((da.alquilerVivienda || 0) > 0) {
    lines.push('          <IB4>');
    lines.push(`            <IMPIB4>${fmtImporte(da.alquilerVivienda!)}</IMPIB4>`);
    lines.push('          </IB4>');
  }

  lines.push('        </IBaleares>');
  lines.push('      </DeduccionAutonomica>');
}

function genCanarias(da: DeduccionCanarias, lines: string[]): void {
  const tiene = (da.nacimientoImporte || 0) > 0 || (da.familiaNumerosaImporte || 0) > 0 ||
    (da.discapacidadImporte || 0) > 0 || da.alquilerDeduccion;
  if (!tiene) return;

  lines.push('      <DeduccionAutonomica codigoCA="05">');
  lines.push('        <Canarias>');

  if ((da.nacimientoImporte || 0) > 0) {
    lines.push('          <CAN1>');
    lines.push(`            <IMPCAN1>${fmtImporte(da.nacimientoImporte!)}</IMPCAN1>`);
    lines.push('          </CAN1>');
  }

  if ((da.familiaNumerosaImporte || 0) > 0) {
    lines.push('          <CAN2>');
    lines.push(`            <IMPCAN2>${fmtImporte(da.familiaNumerosaImporte!)}</IMPCAN2>`);
    lines.push('          </CAN2>');
  }

  if ((da.discapacidadImporte || 0) > 0) {
    lines.push('          <CAN3>');
    lines.push(`            <IMPCAN3>${fmtImporte(da.discapacidadImporte!)}</IMPCAN3>`);
    lines.push('          </CAN3>');
  }

  if (da.alquilerDeduccion) {
    lines.push('          <CAN4>');
    if (da.alquilerConjunta) lines.push('            <CONCAN4>S</CONCAN4>');
    lines.push('            <DECCAN4>S</DECCAN4>');
    if (da.alquilerNum1) lines.push(`            <NUM1CAN4>${da.alquilerNum1}</NUM1CAN4>`);
    if (da.alquilerNif1) lines.push(`            <NIF1CAN4>${escapeXml(da.alquilerNif1)}</NIF1CAN4>`);
    if (da.alquilerRc1) lines.push(`            <RC1CAN4>${escapeXml(da.alquilerRc1)}</RC1CAN4>`);
    lines.push('          </CAN4>');
  }

  lines.push('        </Canarias>');
  lines.push('      </DeduccionAutonomica>');
}

function genCantabria(da: DeduccionCantabria, lines: string[]): void {
  const tiene = (da.nacimientoImporte1 || 0) > 0 || (da.familiaNumerosaD01S || 0) > 0 ||
    (da.discapacidadImporte || 0) > 0 || (da.alquilerImporte1 || 0) > 0;
  if (!tiene) return;

  lines.push('      <DeduccionAutonomica codigoCA="06">');
  lines.push('        <Cantabria>');

  if ((da.nacimientoImporte1 || 0) > 0) {
    lines.push('          <CANT1>');
    lines.push(`            <IMP1CANT1>${fmtImporte(da.nacimientoImporte1!)}</IMP1CANT1>`);
    if (da.nacimientoNif1) lines.push(`            <VNIF1CANT1>${escapeXml(da.nacimientoNif1)}</VNIF1CANT1>`);
    if ((da.nacimientoImporte2 || 0) > 0) lines.push(`            <IMP2CANT1>${fmtImporte(da.nacimientoImporte2!)}</IMP2CANT1>`);
    if (da.nacimientoNif2) lines.push(`            <VNIF2CANT1>${escapeXml(da.nacimientoNif2)}</VNIF2CANT1>`);
    lines.push('          </CANT1>');
  }

  if ((da.familiaNumerosaD01S || 0) > 0 || (da.familiaNumerosaD01C || 0) > 0) {
    lines.push('          <CANT2>');
    if ((da.familiaNumerosaD01S || 0) > 0) lines.push(`            <D01SCANT2>${fmtImporte(da.familiaNumerosaD01S!)}</D01SCANT2>`);
    if ((da.familiaNumerosaD02S || 0) > 0) lines.push(`            <D02SCANT2>${fmtImporte(da.familiaNumerosaD02S!)}</D02SCANT2>`);
    if ((da.familiaNumerosaD01C || 0) > 0) lines.push(`            <D01CCANT2>${fmtImporte(da.familiaNumerosaD01C!)}</D01CCANT2>`);
    if ((da.familiaNumerosaD02C || 0) > 0) lines.push(`            <D02CCANT2>${fmtImporte(da.familiaNumerosaD02C!)}</D02CCANT2>`);
    lines.push('          </CANT2>');
  }

  if ((da.discapacidadImporte || 0) > 0) {
    lines.push('          <CANT3>');
    if ((da.discapacidadImporteAnt1 || 0) > 0) lines.push(`            <IMPANT1CANT3>${fmtImporte(da.discapacidadImporteAnt1!)}</IMPANT1CANT3>`);
    if ((da.discapacidadImporteAnt2 || 0) > 0) lines.push(`            <IMPANT2CANT3>${fmtImporte(da.discapacidadImporteAnt2!)}</IMPANT2CANT3>`);
    lines.push(`            <IMPCANT3>${fmtImporte(da.discapacidadImporte!)}</IMPCANT3>`);
    if (da.discapacidadNif) lines.push(`            <VNIFCANT3>${escapeXml(da.discapacidadNif)}</VNIFCANT3>`);
    lines.push('          </CANT3>');
  }

  if ((da.alquilerImporte1 || 0) > 0) {
    lines.push('          <CANT4>');
    lines.push(`            <IMP1CANT4>${fmtImporte(da.alquilerImporte1!)}</IMP1CANT4>`);
    if ((da.alquilerImporte2 || 0) > 0) lines.push(`            <IMP2CANT4>${fmtImporte(da.alquilerImporte2!)}</IMP2CANT4>`);
    lines.push('          </CANT4>');
  }

  lines.push('        </Cantabria>');
  lines.push('      </DeduccionAutonomica>');
}

function genCastillaLaMancha(da: DeduccionCastillaLaMancha, lines: string[]): void {
  const tiene = da.nacimientoDeduccion || (da.familiaNumerosaDed1 || 0) > 0 ||
    (da.discapacidadImporte || 0) > 0 || (da.alquilerCat1 || 0) > 0;
  if (!tiene) return;

  lines.push('      <DeduccionAutonomica codigoCA="07">');
  lines.push('        <CastillaLaMancha>');

  if (da.nacimientoDeduccion) {
    lines.push('          <CM5>');
    lines.push('            <DECCM5>S</DECCM5>');
    lines.push('          </CM5>');
  }

  if ((da.familiaNumerosaDed1 || 0) > 0) {
    lines.push('          <CM6>');
    if (da.familiaNumerosaNif1) lines.push(`            <NIF1CM6>${escapeXml(da.familiaNumerosaNif1)}</NIF1CM6>`);
    if (da.familiaNumerosaNom1) lines.push(`            <NOM1CM6>${escapeXml(da.familiaNumerosaNom1)}</NOM1CM6>`);
    lines.push(`            <DED1CM6>${fmtImporte(da.familiaNumerosaDed1!)}</DED1CM6>`);
    if ((da.familiaNumerosaDed2 || 0) > 0) {
      if (da.familiaNumerosaNif2) lines.push(`            <NIF2CM6>${escapeXml(da.familiaNumerosaNif2)}</NIF2CM6>`);
      if (da.familiaNumerosaNom2) lines.push(`            <NOM2CM6>${escapeXml(da.familiaNumerosaNom2)}</NOM2CM6>`);
      lines.push(`            <DED2CM6>${fmtImporte(da.familiaNumerosaDed2!)}</DED2CM6>`);
    }
    lines.push('          </CM6>');
  }

  if ((da.discapacidadImporte || 0) > 0) {
    lines.push('          <CM7>');
    lines.push(`            <IMPCM7>${fmtImporte(da.discapacidadImporte!)}</IMPCM7>`);
    lines.push('          </CM7>');
  }

  if ((da.alquilerCat1 || 0) > 0) {
    lines.push('          <CM8>');
    lines.push(`            <CAT1CM8>${fmtImporte(da.alquilerCat1!)}</CAT1CM8>`);
    if (da.alquilerCat1T) lines.push(`            <CAT1TCM8>${fmtImporte(da.alquilerCat1T)}</CAT1TCM8>`);
    if ((da.alquilerCat2 || 0) > 0) lines.push(`            <CAT2CM8>${fmtImporte(da.alquilerCat2!)}</CAT2CM8>`);
    if (da.alquilerNum) lines.push(`            <NUMCM8>${da.alquilerNum}</NUMCM8>`);
    lines.push('          </CM8>');
  }

  lines.push('        </CastillaLaMancha>');
  lines.push('      </DeduccionAutonomica>');
}

function genCastillaYLeon(da: DeduccionCastillaYLeon, lines: string[]): void {
  const tiene = da.nacimientoDeduccion || (da.familiaNumerosaImporte || 0) > 0 ||
    (da.discapacidadImporte || 0) > 0 || (da.alquilerVivienda || 0) > 0;
  if (!tiene) return;

  lines.push('      <DeduccionAutonomica codigoCA="08">');
  lines.push('        <CastillaYLeon>');

  if (da.nacimientoDeduccion) {
    lines.push('          <CL1>');
    lines.push('            <DECCL1>S</DECCL1>');
    if ((da.nacimientoImporteConyuge || 0) > 0) lines.push(`            <COMCL1>${fmtImporte(da.nacimientoImporteConyuge!)}</COMCL1>`);
    if (da.nacimientoMayorConyuge) lines.push('            <MAYCCL1>S</MAYCCL1>');
    if (da.nacimientoTitular) lines.push(`            <TITCL1>${escapeXml(da.nacimientoTitular)}</TITCL1>`);
    if (da.nacimientoMayorTitular) lines.push('            <MAYTCL1>S</MAYTCL1>');
    lines.push('          </CL1>');
  }

  if ((da.familiaNumerosaImporte || 0) > 0) {
    lines.push('          <CL2>');
    lines.push(`            <IMPCL2>${fmtImporte(da.familiaNumerosaImporte!)}</IMPCL2>`);
    lines.push('          </CL2>');
  }

  if ((da.discapacidadImporte || 0) > 0) {
    lines.push('          <CL3>');
    lines.push(`            <IMPCL3>${fmtImporte(da.discapacidadImporte!)}</IMPCL3>`);
    lines.push('          </CL3>');
  }

  if ((da.alquilerVivienda || 0) > 0) {
    lines.push('          <CL4>');
    lines.push(`            <IMPCL4>${fmtImporte(da.alquilerVivienda!)}</IMPCL4>`);
    lines.push('          </CL4>');
  }

  lines.push('        </CastillaYLeon>');
  lines.push('      </DeduccionAutonomica>');
}

function genCatalunya(da: DeduccionCatalunya, lines: string[]): void {
  const tiene = (da.nacimientoC01 || 0) > 0 || (da.alquilerVivienda || 0) > 0 ||
    (da.discapacidadImporte1 || 0) > 0 || (da.familiaNumerosaImporte1 || 0) > 0;
  if (!tiene) return;

  lines.push('      <DeduccionAutonomica codigoCA="09">');
  lines.push('        <Catalunya>');

  if ((da.nacimientoC01 || 0) > 0 || (da.nacimientoC02 || 0) > 0) {
    lines.push('          <CT1>');
    if ((da.nacimientoC01 || 0) > 0) lines.push(`            <C01CT1>${fmtImporte(da.nacimientoC01!)}</C01CT1>`);
    if ((da.nacimientoC02 || 0) > 0) lines.push(`            <C02CT1>${fmtImporte(da.nacimientoC02!)}</C02CT1>`);
    if (da.nacimientoDeduccion) lines.push('            <DECCT1>S</DECCT1>');
    lines.push('          </CT1>');
  }

  if ((da.alquilerVivienda || 0) > 0) {
    lines.push('          <CT2>');
    lines.push(`            <IMPCT2>${fmtImporte(da.alquilerVivienda!)}</IMPCT2>`);
    lines.push('          </CT2>');
  }

  if ((da.discapacidadImporte1 || 0) > 0) {
    lines.push('          <CT3>');
    lines.push(`            <IMP1CT3>${fmtImporte(da.discapacidadImporte1!)}</IMP1CT3>`);
    if (da.discapacidadDonacion) lines.push('            <DONECT3>S</DONECT3>');
    if (da.discapacidadDonacionConyuge) lines.push('            <DONECJCT3>S</DONECJCT3>');
    if ((da.discapacidadImporte2 || 0) > 0) lines.push(`            <IMP2CT3>${fmtImporte(da.discapacidadImporte2!)}</IMP2CT3>`);
    lines.push('          </CT3>');
  }

  if ((da.familiaNumerosaImporte1 || 0) > 0) {
    lines.push('          <CT4>');
    lines.push(`            <IMP1CT4>${fmtImporte(da.familiaNumerosaImporte1!)}</IMP1CT4>`);
    if (da.familiaNumerosaNif1) lines.push(`            <NIF1CT4>${escapeXml(da.familiaNumerosaNif1)}</NIF1CT4>`);
    if (da.familiaNumerosaNum1) lines.push(`            <NUM1CT4>${da.familiaNumerosaNum1}</NUM1CT4>`);
    if (da.familiaNumerosaDeduccion) lines.push('            <DECCT4>S</DECCT4>');
    if (da.familiaNumerosaFamNum) lines.push('            <FAMNUMCT4>S</FAMNUMCT4>');
    lines.push('          </CT4>');
  }

  lines.push('        </Catalunya>');
  lines.push('      </DeduccionAutonomica>');
}

function genExtremadura(da: DeduccionExtremadura, lines: string[]): void {
  const tiene = (da.nacimientoImporte1 || 0) > 0 || (da.familiaNumerosaImporteConyuge1 || 0) > 0 ||
    (da.discapacidadMenorConyuge || 0) > 0 || (da.alquilerC01 || 0) > 0;
  if (!tiene) return;

  lines.push('      <DeduccionAutonomica codigoCA="10">');
  lines.push('        <Extremadura>');

  if ((da.nacimientoImporte1 || 0) > 0) {
    lines.push('          <E1>');
    if (da.nacimientoRural) lines.push('            <RURALE1>S</RURALE1>');
    lines.push(`            <IMP1E1>${fmtImporte(da.nacimientoImporte1!)}</IMP1E1>`);
    if (da.nacimientoNcon1) lines.push(`            <NCON1E1>${da.nacimientoNcon1}</NCON1E1>`);
    if (da.nacimientoMr1) lines.push('            <MR1E1>S</MR1E1>');
    if ((da.nacimientoImporte2 || 0) > 0) lines.push(`            <IMP2E1>${fmtImporte(da.nacimientoImporte2!)}</IMP2E1>`);
    if (da.nacimientoNcon2) lines.push(`            <NCON2E1>${da.nacimientoNcon2}</NCON2E1>`);
    if (da.nacimientoMr2) lines.push('            <MR2E1>S</MR2E1>');
    lines.push('          </E1>');
  }

  if ((da.familiaNumerosaImporteConyuge1 || 0) > 0) {
    lines.push('          <E3>');
    if (da.familiaNumerosaRural) lines.push('            <RURALE3>S</RURALE3>');
    lines.push(`            <COM1E3>${fmtImporte(da.familiaNumerosaImporteConyuge1!)}</COM1E3>`);
    if (da.familiaNumerosaDeduccion1) lines.push('            <DEC1E3>S</DEC1E3>');
    if (da.familiaNumerosaNum1) lines.push(`            <NUM1E3>${da.familiaNumerosaNum1}</NUM1E3>`);
    lines.push('          </E3>');
  }

  if ((da.discapacidadMenorConyuge || 0) > 0 || (da.discapacidadMenorTitular || 0) > 0) {
    lines.push('          <E4>');
    if ((da.discapacidadMenorConyuge || 0) > 0) lines.push(`            <MENORCJE4>${fmtImporte(da.discapacidadMenorConyuge!)}</MENORCJE4>`);
    if ((da.discapacidadMenorTitular || 0) > 0) lines.push(`            <MENORDE4>${fmtImporte(da.discapacidadMenorTitular!)}</MENORDE4>`);
    if ((da.discapacidadHijosConyuge || 0) > 0) lines.push(`            <HIJOSCJE4>${fmtImporte(da.discapacidadHijosConyuge!)}</HIJOSCJE4>`);
    if ((da.discapacidadHijosTitular || 0) > 0) lines.push(`            <HIJOSDE4>${fmtImporte(da.discapacidadHijosTitular!)}</HIJOSDE4>`);
    if (da.discapacidadConjunta) lines.push('            <CONVE4>S</CONVE4>');
    lines.push('          </E4>');
  }

  if ((da.alquilerC01 || 0) > 0) {
    lines.push('          <E7>');
    if (da.alquilerRural) lines.push('            <RURALE7>S</RURALE7>');
    lines.push(`            <C01E7>${fmtImporte(da.alquilerC01!)}</C01E7>`);
    if ((da.alquilerC02 || 0) > 0) lines.push(`            <C02E7>${fmtImporte(da.alquilerC02!)}</C02E7>`);
    if (da.alquilerConjunta) lines.push('            <CONVE7>S</CONVE7>');
    lines.push('          </E7>');
  }

  lines.push('        </Extremadura>');
  lines.push('      </DeduccionAutonomica>');
}

function genGalicia(da: DeduccionGalicia, lines: string[]): void {
  const tiene = (da.nacimientoOrden1 || 0) > 0 || da.familiaNumerosaFnumC ||
    (da.discapacidadImporte11 || 0) > 0 || da.alquilerRequerido;
  if (!tiene) return;

  lines.push('      <DeduccionAutonomica codigoCA="11">');
  lines.push('        <Galicia>');

  if ((da.nacimientoOrden1 || 0) > 0) {
    lines.push('          <GA1>');
    lines.push(`            <O1GA1>${da.nacimientoOrden1}</O1GA1>`);
    if ((da.nacimientoDeduccion1 || 0) > 0) lines.push(`            <D1GA1>${fmtImporte(da.nacimientoDeduccion1!)}</D1GA1>`);
    if (da.nacimientoDiscapacidad1) lines.push('            <DIS1GA1>S</DIS1GA1>');
    lines.push('          </GA1>');
  }

  if (da.familiaNumerosaFnumC || da.familiaNumerosaFnumT) {
    lines.push('          <GA2>');
    if (da.familiaNumerosaFnumC) lines.push('            <FNUMCGA2>S</FNUMCGA2>');
    if (da.familiaNumerosaFnumT) lines.push('            <FNUMTGA2>S</FNUMTGA2>');
    if (da.familiaNumerosaFnEspC) lines.push('            <FNESPCGA2>S</FNESPCGA2>');
    if (da.familiaNumerosaFnEspT) lines.push('            <FNESPTGA2>S</FNESPTGA2>');
    if (da.familiaNumerosaDisC) lines.push('            <DISCGA2>S</DISCGA2>');
    if (da.familiaNumerosaDisT) lines.push('            <DISTGA2>S</DISTGA2>');
    if (da.familiaNumerosaConjunta) lines.push('            <CONVGA2>S</CONVGA2>');
    if (da.familiaNumerosaNumPer) lines.push(`            <NUMPERGA2>${da.familiaNumerosaNumPer}</NUMPERGA2>`);
    lines.push('          </GA2>');
  }

  if ((da.discapacidadImporte11 || 0) > 0) {
    lines.push('          <GA3>');
    lines.push(`            <IMP11GA3>${fmtImporte(da.discapacidadImporte11!)}</IMP11GA3>`);
    if ((da.discapacidadImporte12 || 0) > 0) lines.push(`            <IMP12GA3>${fmtImporte(da.discapacidadImporte12!)}</IMP12GA3>`);
    if (da.discapacidadNum1) lines.push(`            <NUM1GA3>${da.discapacidadNum1}</NUM1GA3>`);
    if (da.discapacidadC01) lines.push(`            <C01GA3>${fmtImporte(da.discapacidadC01)}</C01GA3>`);
    if (da.discapacidadC02) lines.push(`            <C02GA3>${fmtImporte(da.discapacidadC02)}</C02GA3>`);
    lines.push('          </GA3>');
  }

  if (da.alquilerRequerido) {
    lines.push('          <GA4>');
    lines.push('            <REQGA4>S</REQGA4>');
    if ((da.alquilerImporte || 0) > 0) lines.push(`            <IMPGA4>${fmtImporte(da.alquilerImporte!)}</IMPGA4>`);
    lines.push('          </GA4>');
  }

  lines.push('        </Galicia>');
  lines.push('      </DeduccionAutonomica>');
}

function genMadrid(da: DeduccionMadrid, lines: string[]): void {
  const tiene = (da.nacimientoCom1 || 0) > 0 || (da.acogimientoC01 || 0) > 0 ||
    (da.familiaNumerosaCom1 || 0) > 0 || (da.discapacidadC01 || 0) > 0 ||
    (da.alquilerImporte1 || 0) > 0 || (da.educacionImp11 || 0) > 0;
  if (!tiene) return;

  lines.push('      <DeduccionAutonomica codigoCA="13">');
  lines.push('        <Madrid>');

  if ((da.nacimientoCom1 || 0) > 0) {
    lines.push('          <M1>');
    lines.push(`            <COM1M1>${fmtImporte(da.nacimientoCom1!)}</COM1M1>`);
    if (da.nacimientoDeduccion1) lines.push('            <DEC1M1>S</DEC1M1>');
    if (da.nacimientoConjunta) lines.push('            <CONVM1>S</CONVM1>');
    if ((da.nacimientoCom2 || 0) > 0) lines.push(`            <COM2M1>${fmtImporte(da.nacimientoCom2!)}</COM2M1>`);
    if (da.nacimientoDeduccion2) lines.push('            <DEC2M1>S</DEC2M1>');
    lines.push('          </M1>');
  }

  if ((da.acogimientoC01 || 0) > 0) {
    lines.push('          <M2>');
    lines.push(`            <C01M2>${fmtImporte(da.acogimientoC01!)}</C01M2>`);
    if ((da.acogimientoC02 || 0) > 0) lines.push(`            <C02M2>${fmtImporte(da.acogimientoC02!)}</C02M2>`);
    if (da.acogimientoConjunta) lines.push('            <CONVM2>S</CONVM2>');
    lines.push('          </M2>');
  }

  if ((da.familiaNumerosaCom1 || 0) > 0) {
    lines.push('          <M3>');
    lines.push(`            <COM1M3>${fmtImporte(da.familiaNumerosaCom1!)}</COM1M3>`);
    if (da.familiaNumerosaDeduccion1) lines.push('            <DEC1M3>S</DEC1M3>');
    if (da.familiaNumerosaConjunta) lines.push('            <CONVM3>S</CONVM3>');
    lines.push('          </M3>');
  }

  if ((da.discapacidadC01 || 0) > 0) {
    lines.push('          <M4>');
    lines.push(`            <C01M4>${fmtImporte(da.discapacidadC01!)}</C01M4>`);
    if ((da.discapacidadC02 || 0) > 0) lines.push(`            <C02M4>${fmtImporte(da.discapacidadC02!)}</C02M4>`);
    if (da.discapacidadNum1) lines.push(`            <NUM1M4>${da.discapacidadNum1}</NUM1M4>`);
    lines.push('          </M4>');
  }

  if ((da.alquilerImporte1 || 0) > 0) {
    lines.push('          <M5>');
    lines.push(`            <IMP1M5>${fmtImporte(da.alquilerImporte1!)}</IMP1M5>`);
    if (da.alquilerNif1) lines.push(`            <VNIF1M5>${escapeXml(da.alquilerNif1)}</VNIF1M5>`);
    if ((da.alquilerImporte2 || 0) > 0) lines.push(`            <IMP2M5>${fmtImporte(da.alquilerImporte2!)}</IMP2M5>`);
    if (da.alquilerNif2) lines.push(`            <VNIF2M5>${escapeXml(da.alquilerNif2)}</VNIF2M5>`);
    lines.push('          </M5>');
  }

  if ((da.educacionImp11 || 0) > 0 && da.educacionNif1) {
    lines.push('          <M11>');
    lines.push(`            <NIF1M11>${escapeXml(da.educacionNif1)}</NIF1M11>`);
    lines.push(`            <IMP11M11>${fmtImporte(da.educacionImp11!)}</IMP11M11>`);
    if ((da.educacionImp21 || 0) > 0) lines.push(`            <IMP21M11>${fmtImporte(da.educacionImp21!)}</IMP21M11>`);
    if ((da.educacionImp31 || 0) > 0) lines.push(`            <IMP31M11>${fmtImporte(da.educacionImp31!)}</IMP31M11>`);
    lines.push('          </M11>');
  }

  lines.push('        </Madrid>');
  lines.push('      </DeduccionAutonomica>');
}

function genMurcia(da: DeduccionMurcia, lines: string[]): void {
  const tiene = (da.nacimientoImporte1 || 0) > 0 || (da.familiaNumerosaImporte || 0) > 0 ||
    (da.discapacidadImp1A || 0) > 0 || (da.alquilerImporte1 || 0) > 0;
  if (!tiene) return;

  lines.push('      <DeduccionAutonomica codigoCA="14">');
  lines.push('        <Murcia>');

  if ((da.nacimientoImporte1 || 0) > 0) {
    lines.push('          <MU1>');
    lines.push(`            <IMP1MU1>${fmtImporte(da.nacimientoImporte1!)}</IMP1MU1>`);
    if (da.nacimientoTipoReg1) lines.push(`            <TIPREG1MU1>${escapeXml(da.nacimientoTipoReg1)}</TIPREG1MU1>`);
    if ((da.nacimientoImporte2 || 0) > 0) lines.push(`            <IMP2MU1>${fmtImporte(da.nacimientoImporte2!)}</IMP2MU1>`);
    if (da.nacimientoTipoReg2) lines.push(`            <TIPREG2MU1>${escapeXml(da.nacimientoTipoReg2)}</TIPREG2MU1>`);
    lines.push('          </MU1>');
  }

  if ((da.familiaNumerosaImporte || 0) > 0) {
    lines.push('          <MU2>');
    lines.push(`            <IMPMU2>${fmtImporte(da.familiaNumerosaImporte!)}</IMPMU2>`);
    lines.push('          </MU2>');
  }

  if ((da.discapacidadImp1A || 0) > 0) {
    lines.push('          <MU3>');
    lines.push(`            <IMP1AMU3>${fmtImporte(da.discapacidadImp1A!)}</IMP1AMU3>`);
    if ((da.discapacidadImp2A || 0) > 0) lines.push(`            <IMP2AMU3>${fmtImporte(da.discapacidadImp2A!)}</IMP2AMU3>`);
    if ((da.discapacidadImp1B || 0) > 0) lines.push(`            <IMP1BMU3>${fmtImporte(da.discapacidadImp1B!)}</IMP1BMU3>`);
    if ((da.discapacidadImp2B || 0) > 0) lines.push(`            <IMP2BMU3>${fmtImporte(da.discapacidadImp2B!)}</IMP2BMU3>`);
    if (da.discapacidadNum1) lines.push(`            <NUM1MU3>${da.discapacidadNum1}</NUM1MU3>`);
    if (da.discapacidadNum2) lines.push(`            <NUM2MU3>${da.discapacidadNum2}</NUM2MU3>`);
    lines.push('          </MU3>');
  }

  if ((da.alquilerImporte1 || 0) > 0) {
    lines.push('          <MU4>');
    lines.push(`            <IMP1MU4>${fmtImporte(da.alquilerImporte1!)}</IMP1MU4>`);
    if (da.alquilerRc1) lines.push(`            <RC1MU4>${escapeXml(da.alquilerRc1)}</RC1MU4>`);
    if (da.alquilerRcNo1) lines.push(`            <RCNO1MU4>${escapeXml(da.alquilerRcNo1)}</RCNO1MU4>`);
    if ((da.alquilerTotal1 || 0) > 0) lines.push(`            <TOTAL1MU4>${fmtImporte(da.alquilerTotal1!)}</TOTAL1MU4>`);
    lines.push('          </MU4>');
  }

  lines.push('        </Murcia>');
  lines.push('      </DeduccionAutonomica>');
}

function genLaRioja(da: DeduccionLaRioja, lines: string[]): void {
  const tiene = (da.nacimientoVg11 || 0) > 0 || (da.familiaNumerosaImporte || 0) > 0 ||
    (da.discapacidadImporte || 0) > 0 || (da.alquilerImporte || 0) > 0;
  if (!tiene) return;

  lines.push('      <DeduccionAutonomica codigoCA="17">');
  lines.push('        <LaRioja>');

  if ((da.nacimientoVg11 || 0) > 0) {
    lines.push('          <LR1>');
    lines.push(`            <VG11LR1>${fmtImporte(da.nacimientoVg11!)}</VG11LR1>`);
    if ((da.nacimientoVg21 || 0) > 0) lines.push(`            <VG21LR1>${fmtImporte(da.nacimientoVg21!)}</VG21LR1>`);
    if ((da.nacimientoVg12 || 0) > 0) lines.push(`            <VG12LR1>${fmtImporte(da.nacimientoVg12!)}</VG12LR1>`);
    if ((da.nacimientoVg22 || 0) > 0) lines.push(`            <VG22LR1>${fmtImporte(da.nacimientoVg22!)}</VG22LR1>`);
    if (da.nacimientoConjunta) lines.push('            <CONVLR1>S</CONVLR1>');
    if (da.nacimientoPmo) lines.push(`            <PMOLR1>${fmtImporte(da.nacimientoPmo)}</PMOLR1>`);
    if (da.nacimientoPmd) lines.push(`            <PMDLR1>${fmtImporte(da.nacimientoPmd)}</PMDLR1>`);
    lines.push('          </LR1>');
  }

  if ((da.familiaNumerosaImporte || 0) > 0) {
    lines.push('          <LR2>');
    lines.push(`            <IMPLR2>${fmtImporte(da.familiaNumerosaImporte!)}</IMPLR2>`);
    lines.push('          </LR2>');
  }

  if ((da.discapacidadImporte || 0) > 0) {
    lines.push('          <LR3>');
    lines.push(`            <IMPLR3>${fmtImporte(da.discapacidadImporte!)}</IMPLR3>`);
    lines.push('          </LR3>');
  }

  if ((da.alquilerImporte || 0) > 0) {
    lines.push('          <LR4>');
    lines.push(`            <IMPLR4>${fmtImporte(da.alquilerImporte!)}</IMPLR4>`);
    if (da.alquilerNcon) lines.push(`            <NCONLR4>${da.alquilerNcon}</NCONLR4>`);
    lines.push('          </LR4>');
  }

  lines.push('        </LaRioja>');
  lines.push('      </DeduccionAutonomica>');
}

function genValenciana(da: DeduccionValenciana, lines: string[]): void {
  const tiene = (da.nacimientoCom1 || 0) > 0 || (da.familiaNumerosaMenorConyuge || 0) > 0 ||
    (da.discapacidadTipo1 !== undefined) || (da.alquilerImporte1 || 0) > 0;
  if (!tiene) return;

  lines.push('      <DeduccionAutonomica codigoCA="18">');
  lines.push('        <CValenciana>');

  if ((da.nacimientoCom1 || 0) > 0) {
    lines.push('          <VA1>');
    lines.push(`            <COM1VA1>${fmtImporte(da.nacimientoCom1!)}</COM1VA1>`);
    if (da.nacimientoDeduccion1) lines.push('            <DEC1VA1>S</DEC1VA1>');
    if ((da.nacimientoCom2 || 0) > 0) lines.push(`            <COM2VA1>${fmtImporte(da.nacimientoCom2!)}</COM2VA1>`);
    if (da.nacimientoDeduccion2) lines.push('            <DEC2VA1>S</DEC2VA1>');
    if (da.nacimientoNum1) lines.push(`            <NUM1VA1>${da.nacimientoNum1}</NUM1VA1>`);
    if (da.nacimientoDiasO) lines.push(`            <DIASOVA1>${da.nacimientoDiasO}</DIASOVA1>`);
    if (da.nacimientoDiasT) lines.push(`            <DIASTVA1>${da.nacimientoDiasT}</DIASTVA1>`);
    lines.push('          </VA1>');
  }

  if ((da.familiaNumerosaMenorConyuge || 0) > 0 || (da.familiaNumerosaMenorTitular || 0) > 0) {
    lines.push('          <VA3>');
    if ((da.familiaNumerosaMenorConyuge || 0) > 0) lines.push(`            <MENORCJVA3>${fmtImporte(da.familiaNumerosaMenorConyuge!)}</MENORCJVA3>`);
    if ((da.familiaNumerosaMenorTitular || 0) > 0) lines.push(`            <MENORDVA3>${fmtImporte(da.familiaNumerosaMenorTitular!)}</MENORDVA3>`);
    if ((da.familiaNumerosaHijosConyuge || 0) > 0) lines.push(`            <HIJOSCJVA3>${fmtImporte(da.familiaNumerosaHijosConyuge!)}</HIJOSCJVA3>`);
    if ((da.familiaNumerosaHijosTitular || 0) > 0) lines.push(`            <HIJOSDVA3>${fmtImporte(da.familiaNumerosaHijosTitular!)}</HIJOSDVA3>`);
    if (da.familiaNumerosaConjunta) lines.push('            <CONVVA3>S</CONVVA3>');
    lines.push('          </VA3>');
  }

  if (da.discapacidadTipo1) {
    lines.push('          <VA5>');
    lines.push(`            <TIPO1VA5>${escapeXml(da.discapacidadTipo1)}</TIPO1VA5>`);
    if (da.discapacidadMeses1) lines.push(`            <MESES1VA5>${da.discapacidadMeses1}</MESES1VA5>`);
    if ((da.discapacidadVal21 || 0) > 0) lines.push(`            <VAL21VA5>${fmtImporte(da.discapacidadVal21!)}</VAL21VA5>`);
    if (da.discapacidadNum1) lines.push(`            <NUM1VA5>${da.discapacidadNum1}</NUM1VA5>`);
    lines.push('          </VA5>');
  }

  if ((da.alquilerImporte1 || 0) > 0) {
    lines.push('          <VA14>');
    if (da.alquilerTipo1) lines.push(`            <TIPO1VA14>${escapeXml(da.alquilerTipo1)}</TIPO1VA14>`);
    if (da.alquilerClave1) lines.push(`            <CLAVE1VA14>${escapeXml(da.alquilerClave1)}</CLAVE1VA14>`);
    lines.push(`            <IMP1VA14>${fmtImporte(da.alquilerImporte1!)}</IMP1VA14>`);
    if (da.alquilerMeses1) lines.push(`            <MESES1VA14>${da.alquilerMeses1}</MESES1VA14>`);
    if (da.alquilerNum1) lines.push(`            <NUM1VA14>${da.alquilerNum1}</NUM1VA14>`);
    if (da.alquilerNif1) lines.push(`            <NIF1VA14>${escapeXml(da.alquilerNif1)}</NIF1VA14>`);
    lines.push('          </VA14>');
  }

  lines.push('        </CValenciana>');
  lines.push('      </DeduccionAutonomica>');
}

// ─────────────────────────────────────────────
// Generador XML principal
// ─────────────────────────────────────────────

export function generarXMLModelo100(datos: DatosDeclaracion): string {
  const ccaa = CCAA_MAP[datos.comunidadAutonoma] || datos.comunidadAutonoma || "13";
  const tipoTrib = datos.tipoTributacion || "1";
  const nif = fmtNif(datos.nif);
  const pagadores = datos.pagadores || [];
  const resultadoTipo = datos.resultadoTipo || "D";
  const resultadoImporte = datos.resultadoImporte || 0;

  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="ISO-8859-1"?>');
  lines.push('<RENTA xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="Renta2024.xsd">');

  // ── Cabecera ──
  lines.push('  <Cabecera>');
  lines.push('    <Modelo>100</Modelo>');
  lines.push('    <Ejercicio>2024</Ejercicio>');
  lines.push('    <VersionXSD>1.02</VersionXSD>');
  lines.push('    <TipoSoporte>T</TipoSoporte>');
  lines.push('    <AlcanceDeclaracion>I</AlcanceDeclaracion>');
  lines.push('  </Cabecera>');

  // ── Datos identificativos ──
  lines.push('  <DatosIdentificativos>');
  lines.push('    <Declarante>');
  lines.push(`      <DPNIF_D>${escapeXml(nif)}</DPNIF_D>`);
  lines.push(`      <DP_APENOM_D>${escapeXml(datos.apellidosNombre.toUpperCase())}</DP_APENOM_D>`);
  lines.push(`      <ECIVIL>${datos.estadoCivil}</ECIVIL>`);
  lines.push(`      <DPFNAC_D>${fmtFecha(datos.fechaNacimiento)}</DPFNAC_D>`);
  lines.push(`      <SEXO_D>${datos.sexo}</SEXO_D>`);
  lines.push(`      <CCAA>${ccaa}</CCAA>`);
  lines.push(`      <TIPOTRB>${tipoTrib}</TIPOTRB>`);
  lines.push('    </Declarante>');

  if (tipoTrib === "2" && datos.nifConyuge) {
    lines.push('    <Conyuge>');
    lines.push(`      <DPNIF_C>${escapeXml(fmtNif(datos.nifConyuge))}</DPNIF_C>`);
    if (datos.apellidosNombreConyuge) lines.push(`      <DP_APENOM_C>${escapeXml(datos.apellidosNombreConyuge.toUpperCase())}</DP_APENOM_C>`);
    if (datos.fechaNacimientoConyuge) lines.push(`      <DPFNAC_C>${fmtFecha(datos.fechaNacimientoConyuge)}</DPFNAC_C>`);
    if (datos.sexoConyuge) lines.push(`      <SEXO_C>${datos.sexoConyuge}</SEXO_C>`);
    lines.push('    </Conyuge>');
  }

  lines.push('  </DatosIdentificativos>');

  // ── Datos económicos ──
  lines.push('  <DatosEconomicos>');
  lines.push('    <TomaDatosAmpliada>');

  // Rendimientos del trabajo
  if (pagadores.length > 0) {
    lines.push('      <RdtoTrabajo>');
    pagadores.forEach((p, i) => {
      lines.push(`        <Pagador${i + 1}>`);
      lines.push(`          <TPRDTO${i + 1}>${fmtImporte(p.importeIntegro)}</TPRDTO${i + 1}>`);
      lines.push(`          <TPRET${i + 1}>${fmtImporte(p.retenciones)}</TPRET${i + 1}>`);
      if (p.cuotasSS && p.cuotasSS > 0) lines.push(`          <TPSS${i + 1}>${fmtImporte(p.cuotasSS)}</TPSS${i + 1}>`);
      if (p.cuotasSindicato && p.cuotasSindicato > 0) lines.push(`          <TPSIND${i + 1}>${fmtImporte(p.cuotasSindicato)}</TPSIND${i + 1}>`);
      if (p.cuotasColegio && p.cuotasColegio > 0) lines.push(`          <TPCOL${i + 1}>${fmtImporte(p.cuotasColegio)}</TPCOL${i + 1}>`);
      if (p.gastoDefensa && p.gastoDefensa > 0) lines.push(`          <TPDEF${i + 1}>${fmtImporte(p.gastoDefensa)}</TPDEF${i + 1}>`);
      lines.push(`        </Pagador${i + 1}>`);
    });
    lines.push('      </RdtoTrabajo>');
  }

  // Capital mobiliario
  if (datos.capitalMobiliario && datos.capitalMobiliario.importeIntegro > 0) {
    lines.push('      <CapitalMobiliario>');
    lines.push(`        <TPCM>${fmtImporte(datos.capitalMobiliario.importeIntegro)}</TPCM>`);
    lines.push(`        <TPRETCM>${fmtImporte(datos.capitalMobiliario.retenciones)}</TPRETCM>`);
    lines.push('      </CapitalMobiliario>');
  }

  // Inmuebles
  if (datos.inmuebles && datos.inmuebles.length > 0) {
    lines.push('      <Inmuebles>');
    datos.inmuebles.forEach(inm => {
      lines.push('        <Inmueble>');
      lines.push(`          <REFCAT>${escapeXml(inm.referenciaCatastral)}</REFCAT>`);
      lines.push(`          <USO>${inm.uso}</USO>`);
      if (inm.uso === "A" && inm.importeAlquiler && inm.importeAlquiler > 0) {
        lines.push(`          <ALQUILER>${fmtImporte(inm.importeAlquiler)}</ALQUILER>`);
        if (inm.retencionesAlquiler && inm.retencionesAlquiler > 0) {
          lines.push(`          <RETENC>${fmtImporte(inm.retencionesAlquiler)}</RETENC>`);
        }
      } else if (inm.uso === "IR" && inm.valorCatastral && inm.valorCatastral > 0) {
        lines.push(`          <VALCAT>${fmtImporte(inm.valorCatastral)}</VALCAT>`);
      }
      lines.push('        </Inmueble>');
    });
    lines.push('      </Inmuebles>');
  }

  // Reducción plan de pensiones
  if (datos.aportacionesPP && datos.aportacionesPP > 0) {
    lines.push('      <RedBaseImponible>');
    lines.push('        <ReduccionPP>');
    lines.push(`          <APORTPP>${fmtImporte(datos.aportacionesPP)}</APORTPP>`);
    lines.push('        </ReduccionPP>');
    lines.push('      </RedBaseImponible>');
  }

  // Datos adicionales (mínimos personales y familiares)
  lines.push('      <DatosAdicionales>');
  lines.push('        <MIPER>1</MIPER>');
  if (datos.numHijos && datos.numHijos > 0) {
    lines.push(`        <NUMHIJOS>${datos.numHijos}</NUMHIJOS>`);
  }
  if (datos.ascendientesCargo && datos.ascendientesCargo > 0) {
    lines.push(`        <NUMASCE>${datos.ascendientesCargo}</NUMASCE>`);
  }
  if (datos.gradoDiscapacidad && datos.gradoDiscapacidad >= 33) {
    lines.push(`        <DPGMIN_D>${datos.gradoDiscapacidad}</DPGMIN_D>`);
  }
  lines.push('      </DatosAdicionales>');

  // ── Deducciones autonómicas (15 comunidades régimen común) ──
  if (ccaa === "01" && datos.deduccionAndalucia) genAndalucia(datos.deduccionAndalucia, lines);
  if (ccaa === "02" && datos.deduccionAragon) genAragon(datos.deduccionAragon, lines);
  if (ccaa === "03" && datos.deduccionAsturias) genAsturias(datos.deduccionAsturias, lines);
  if (ccaa === "04" && datos.deduccionBaleares) genBaleares(datos.deduccionBaleares, lines);
  if (ccaa === "05" && datos.deduccionCanarias) genCanarias(datos.deduccionCanarias, lines);
  if (ccaa === "06" && datos.deduccionCantabria) genCantabria(datos.deduccionCantabria, lines);
  if (ccaa === "07" && datos.deduccionCastillaLaMancha) genCastillaLaMancha(datos.deduccionCastillaLaMancha, lines);
  if (ccaa === "08" && datos.deduccionCastillaYLeon) genCastillaYLeon(datos.deduccionCastillaYLeon, lines);
  if (ccaa === "09" && datos.deduccionCatalunya) genCatalunya(datos.deduccionCatalunya, lines);
  if (ccaa === "10" && datos.deduccionExtremadura) genExtremadura(datos.deduccionExtremadura, lines);
  if (ccaa === "11" && datos.deduccionGalicia) genGalicia(datos.deduccionGalicia, lines);
  if (ccaa === "13" && datos.deduccionMadrid) genMadrid(datos.deduccionMadrid, lines);
  if (ccaa === "14" && datos.deduccionMurcia) genMurcia(datos.deduccionMurcia, lines);
  if (ccaa === "17" && datos.deduccionLaRioja) genLaRioja(datos.deduccionLaRioja, lines);
  if (ccaa === "18" && datos.deduccionValenciana) genValenciana(datos.deduccionValenciana, lines);

  lines.push('    </TomaDatosAmpliada>');

  // ── Resultados ──
  lines.push('    <Resultados>');

  if (pagadores.length > 0) {
    const totalIntegro = pagadores.reduce((s, p) => s + p.importeIntegro, 0);
    const totalSS = pagadores.reduce((s, p) => s + (p.cuotasSS || 0), 0);
    const totalOtros = pagadores.reduce((s, p) => s + (p.cuotasSindicato || 0) + (p.cuotasColegio || 0) + (p.gastoDefensa || 0), 0);
    const reduccionTrabajo = 2000;
    const rnTrabajo = Math.max(0, totalIntegro - totalSS - totalOtros - reduccionTrabajo);

    lines.push('      <RdtoTrabajoRes>');
    lines.push(`        <TPRDTO>${fmtImporte(rnTrabajo)}</TPRDTO>`);
    lines.push(`        <TPTOTAL>${fmtImporte(rnTrabajo)}</TPTOTAL>`);
    lines.push('      </RdtoTrabajoRes>');
  }

  if (datos.capitalMobiliario && datos.capitalMobiliario.importeIntegro > 0) {
    lines.push('      <RdtoCapitalMobiliarioRes>');
    lines.push('        <RdtoCapitalMobiliarioAhorroRes>');
    lines.push(`          <SUMB1RNR>${fmtImporte(datos.capitalMobiliario.importeIntegro)}</SUMB1RNR>`);
    lines.push('        </RdtoCapitalMobiliarioAhorroRes>');
    lines.push('      </RdtoCapitalMobiliarioRes>');
  }

  lines.push('    </Resultados>');
  lines.push('  </DatosEconomicos>');
  lines.push('</RENTA>');

  return lines.join("\n");
}

// ─────────────────────────────────────────────
// Función de descarga del XML
// ─────────────────────────────────────────────

export function descargarXML(datos: DatosDeclaracion, nombreFichero?: string): void {
  const xml = generarXMLModelo100(datos);
  const nif = fmtNif(datos.nif);
  const nombre = nombreFichero || `Modelo100_${nif}_2024.xml`;

  const encoder = new TextEncoder();
  const bytes = encoder.encode(xml);
  const blob = new Blob([bytes], { type: "application/xml;charset=ISO-8859-1" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
