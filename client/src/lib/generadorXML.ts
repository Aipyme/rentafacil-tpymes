/**
 * Generador de fichero XML Modelo 100 IRPF 2024
 * Compatible con Renta Web (AEAT) - Importación directa
 * 
 * Cubre casos de renta simple:
 * - Asalariado con 1-2 pagadores
 * - Sin actividades económicas
 * - Con/sin capital mobiliario básico
 * - Con/sin deducciones autonómicas
 */

// ─────────────────────────────────────────────
// Tipos de datos
// ─────────────────────────────────────────────

export interface Pagador {
  importeIntegro: number;       // Sueldo bruto anual
  retenciones: number;          // Retenciones practicadas
  cuotasSS?: number;            // Cotizaciones Seguridad Social
  cuotasSindicato?: number;     // Cuotas sindicales
  cuotasColegio?: number;       // Cuotas colegiales
  gastoDefensa?: number;        // Gastos defensa jurídica
}

export interface CapitalMobiliario {
  importeIntegro: number;       // Intereses + dividendos brutos
  retenciones: number;          // Retenciones practicadas
}

export interface Inmueble {
  referenciaCatastral: string;
  uso: "VH" | "A" | "IR";       // VH=vivienda habitual, A=alquiler, IR=imputación rentas
  importeAlquiler?: number;
  retencionesAlquiler?: number;
  valorCatastral?: number;
}

export interface DeduccionAndalucia {
  alquilerVivienda?: number;
  nacimientoAdopcion?: number;
  cuidadoFamiliares?: number;
  discapacidad?: number;
}

export interface DatosDeclaracion {
  // Datos del declarante
  nif: string;
  apellidosNombre: string;        // "GARCIA LOPEZ JUAN"
  fechaNacimiento: string;        // "01/01/1980" o "15031982"
  sexo: "H" | "M";
  estadoCivil: "1" | "2" | "3" | "4" | "5"; // 1=Soltero, 2=Casado, 3=Viudo, 4=Separado, 5=Divorciado
  comunidadAutonoma: string;      // "01"=Andalucía, "13"=Madrid, etc.
  tipoTributacion?: "1" | "2";   // 1=Individual, 2=Conjunta
  
  // Rendimientos del trabajo
  pagadores?: Pagador[];
  
  // Capital mobiliario
  capitalMobiliario?: CapitalMobiliario;
  
  // Inmuebles
  inmuebles?: Inmueble[];
  
  // Reducciones
  aportacionesPP?: number;
  
  // Situación familiar
  numHijos?: number;
  ascendientesCargo?: number;
  gradoDiscapacidad?: number;
  
  // Deducciones autonómicas
  deduccionAndalucia?: DeduccionAndalucia;
  
  // Resultado
  resultadoTipo?: "D" | "I" | "N"; // D=Devolver, I=Ingresar, N=Negativo/cero
  resultadoImporte?: number;
  cuentaDevolucion?: string;
  
  // Cónyuge (solo tributación conjunta)
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
  // Formatea en céntimos (multiplica x100, sin decimales)
  return String(Math.round(valor * 100));
}

function fmtFecha(fecha: string): string {
  if (!fecha) return "";
  // Si ya está en formato DDMMYYYY
  if (/^\d{8}$/.test(fecha)) return fecha;
  // Si está en DD/MM/YYYY
  const partes = fecha.replace(/-/g, "/").split("/");
  if (partes.length === 3) {
    if (partes[2].length === 4) {
      return partes[0].padStart(2, "0") + partes[1].padStart(2, "0") + partes[2];
    } else {
      // YYYY-MM-DD
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

// ─────────────────────────────────────────────
// Generador XML
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
  lines.push('    </Declarante>');
  
  // Cónyuge (solo tributación conjunta)
  if (tipoTrib === "2" && datos.nifConyuge) {
    lines.push('    <Conyuge>');
    lines.push(`      <DPNIF_C>${escapeXml(fmtNif(datos.nifConyuge))}</DPNIF_C>`);
    lines.push(`      <DP_APENOM_C>${escapeXml((datos.apellidosNombreConyuge || "").toUpperCase())}</DP_APENOM_C>`);
    lines.push(`      <DPFNAC_C>${fmtFecha(datos.fechaNacimientoConyuge || "")}</DPFNAC_C>`);
    lines.push(`      <SEXO_C>${datos.sexoConyuge || "M"}</SEXO_C>`);
    lines.push('    </Conyuge>');
  }
  
  lines.push('  </DatosIdentificativos>');
  
  // ── DatosDID (resultado) ──
  lines.push('  <DatosDID>');
  lines.push(`    <TIPODECLARACION>${resultadoTipo}</TIPODECLARACION>`);
  
  if (resultadoTipo === "D" && resultadoImporte > 0) {
    lines.push('    <ADEVOLVER>');
    lines.push(`      <DEV_IMPORTE>${fmtImporte(resultadoImporte)}</DEV_IMPORTE>`);
    if (datos.cuentaDevolucion) {
      lines.push(`      <DEV_CUENTACORRIENTE>${escapeXml(datos.cuentaDevolucion.replace(/\s/g, ""))}</DEV_CUENTACORRIENTE>`);
    }
    lines.push('    </ADEVOLVER>');
  } else if (resultadoTipo === "I" && resultadoImporte > 0) {
    lines.push('    <AINGRESAR>');
    lines.push('      <PAGONOFRACC>');
    lines.push(`        <ING_IMPORTE>${fmtImporte(resultadoImporte)}</ING_IMPORTE>`);
    lines.push('      </PAGONOFRACC>');
    lines.push('    </AINGRESAR>');
  }
  
  lines.push('  </DatosDID>');
  
  // ── Datos económicos ──
  lines.push(`  <DatosEconomicos codigoCADeclaracion="${ccaa}" TIPOTRIBUTACION="${tipoTrib}">`);
  lines.push(`    <TomaDatosAmpliada codigoCA="${ccaa}" titular="D" nif="${nif}">`);
  
  // ── Rendimientos del trabajo ──
  if (pagadores.length > 0) {
    const totalRetenciones = pagadores.reduce((s, p) => s + p.retenciones, 0);
    
    lines.push('      <RdtoTrabajo>');
    for (const p of pagadores) {
      lines.push('        <RendimientoTrabajo>');
      lines.push(`          <IDII>${fmtImporte(p.importeIntegro)}</IDII>`);
      lines.push(`          <IDRE>${fmtImporte(p.retenciones)}</IDRE>`);
      if (p.cuotasSS && p.cuotasSS > 0) {
        lines.push(`          <GSS>${fmtImporte(p.cuotasSS)}</GSS>`);
      }
      if (p.cuotasSindicato && p.cuotasSindicato > 0) {
        lines.push(`          <GCS>${fmtImporte(p.cuotasSindicato)}</GCS>`);
      }
      if (p.cuotasColegio && p.cuotasColegio > 0) {
        lines.push(`          <GCC>${fmtImporte(p.cuotasColegio)}</GCC>`);
      }
      if (p.gastoDefensa && p.gastoDefensa > 0) {
        lines.push(`          <GDJ>${fmtImporte(p.gastoDefensa)}</GDJ>`);
      }
      lines.push('        </RendimientoTrabajo>');
    }
    lines.push(`        <TPDIN>${fmtImporte(totalRetenciones)}</TPDIN>`);
    lines.push('        <TPVA>0</TPVA>');
    lines.push('        <TPIC>0</TPIC>');
    lines.push('      </RdtoTrabajo>');
  }
  
  // ── Capital mobiliario ──
  if (datos.capitalMobiliario && datos.capitalMobiliario.importeIntegro > 0) {
    lines.push('      <RdtoCapitalMobiliario>');
    lines.push('        <RdtoCapitalMobiliarioAhorro>');
    lines.push('          <B11>');
    lines.push(`            <B11DIN>${fmtImporte(datos.capitalMobiliario.importeIntegro)}</B11DIN>`);
    lines.push(`            <B11RET>${fmtImporte(datos.capitalMobiliario.retenciones)}</B11RET>`);
    lines.push('          </B11>');
    lines.push('        </RdtoCapitalMobiliarioAhorro>');
    lines.push('      </RdtoCapitalMobiliario>');
  }
  
  // ── Inmuebles ──
  if (datos.inmuebles && datos.inmuebles.length > 0) {
    lines.push('      <Inmuebles>');
    for (const inm of datos.inmuebles) {
      lines.push('        <Inmueble>');
      lines.push(`          <REFCAT>${escapeXml(inm.referenciaCatastral.toUpperCase())}</REFCAT>`);
      lines.push(`          <USOINM>${inm.uso}</USOINM>`);
      if (inm.uso === "A" && inm.importeAlquiler && inm.importeAlquiler > 0) {
        lines.push(`          <IMPREN>${fmtImporte(inm.importeAlquiler)}</IMPREN>`);
        if (inm.retencionesAlquiler && inm.retencionesAlquiler > 0) {
          lines.push(`          <RETENC>${fmtImporte(inm.retencionesAlquiler)}</RETENC>`);
        }
      } else if (inm.uso === "IR" && inm.valorCatastral && inm.valorCatastral > 0) {
        lines.push(`          <VALCAT>${fmtImporte(inm.valorCatastral)}</VALCAT>`);
      }
      lines.push('        </Inmueble>');
    }
    lines.push('      </Inmuebles>');
  }
  
  // ── Reducción plan de pensiones ──
  if (datos.aportacionesPP && datos.aportacionesPP > 0) {
    lines.push('      <RedBaseImponible>');
    lines.push('        <ReduccionPP>');
    lines.push(`          <APORTPP>${fmtImporte(datos.aportacionesPP)}</APORTPP>`);
    lines.push('        </ReduccionPP>');
    lines.push('      </RedBaseImponible>');
  }
  
  // ── Datos adicionales (mínimos personales y familiares) ──
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
  
  // ── Deducciones autonómicas Andalucía ──
  if (datos.deduccionAndalucia && ccaa === "01") {
    const da = datos.deduccionAndalucia;
    const tieneDeduccion = (da.alquilerVivienda || 0) > 0 || 
                           (da.nacimientoAdopcion || 0) > 0 || 
                           (da.cuidadoFamiliares || 0) > 0 || 
                           (da.discapacidad || 0) > 0;
    if (tieneDeduccion) {
      lines.push('      <DeduccionAutonomica codigoCA="01">');
      lines.push('        <Andalucia>');
      if (da.alquilerVivienda && da.alquilerVivienda > 0) {
        lines.push(`          <AND_ALQUILER>${fmtImporte(da.alquilerVivienda)}</AND_ALQUILER>`);
      }
      if (da.nacimientoAdopcion && da.nacimientoAdopcion > 0) {
        lines.push(`          <AND_NACIMIENTO>${fmtImporte(da.nacimientoAdopcion)}</AND_NACIMIENTO>`);
      }
      if (da.cuidadoFamiliares && da.cuidadoFamiliares > 0) {
        lines.push(`          <AND_CUIDADO>${fmtImporte(da.cuidadoFamiliares)}</AND_CUIDADO>`);
      }
      if (da.discapacidad && da.discapacidad > 0) {
        lines.push(`          <AND_DISCAPACIDAD>${fmtImporte(da.discapacidad)}</AND_DISCAPACIDAD>`);
      }
      lines.push('        </Andalucia>');
      lines.push('      </DeduccionAutonomica>');
    }
  }
  
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
  
  // Crear blob con encoding ISO-8859-1
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
