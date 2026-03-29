/**
 * Script: validate-calculos.ts
 * Ejecuta 10 casos de prueba representativos del motor fiscal IRPF 2025
 * y muestra las casillas clave: 003, 435, 596, 610, 670.
 *
 * Uso: npx tsx scripts/validate-calculos.ts
 */

import { calcularRenta } from "../server/lib/motorFiscal";
import type { RespuestasSimulador } from "../server/lib/motorFiscal";

// ── Tipos de resultado de prueba ───────────────────────────────────────────

interface CasoPrueba {
  id: number;
  descripcion: string;
  datos: RespuestasSimulador;
  esperar?: {
    resultado_signo?: "+" | "-" | "0"; // + = a pagar, - = a devolver, 0 = cero
    deducciones_min?: number;         // deducciones totales mínimas esperadas
    nota?: string;
  };
}

// ── 10 Casos de prueba ─────────────────────────────────────────────────────

const CASOS: CasoPrueba[] = [
  {
    id: 1,
    descripcion: "Asalariado simple 25k, soltero, sin deducciones — Madrid",
    datos: {
      situacion: "Asalariado",
      ingresos_brutos: 25000,
      retenciones: 3500,
      comunidad: "Madrid",
      n_hijos: 0,
    },
    esperar: {
      nota: "Resultado típico: pequeño importe a ingresar o devolver según retenciones",
    },
  },
  {
    id: 2,
    descripcion: "Asalariado 45k, casado, 2 hijos, hipoteca pre-2013 — Andalucía",
    datos: {
      situacion: "Asalariado",
      ingresos_brutos: 45000,
      retenciones: 9500,
      comunidad: "Andalucía",
      n_hijos: 2,
      personas_a_cargo: true,
      compra_vivienda: true,
      vivienda_fecha: "2010-06-15",
      vivienda_precio: 180000,
    },
    esperar: {
      deducciones_min: 1356, // deducción vivienda = 9040 * 15% = 1356€ mínimo
      nota: "Deducción vivienda pre-2013 debe aplicarse",
    },
  },
  {
    id: 3,
    descripcion: "Pensionista 18k — Cataluña",
    datos: {
      situacion: "Pensionista",
      ingresos_brutos: 18000,
      retenciones: 1800,
      comunidad: "Cataluña",
      n_hijos: 0,
    },
    esperar: {
      nota: "Pensionista con ingresos medios — posible devolución moderada",
    },
  },
  {
    id: 4,
    descripcion: "Autónomo 35k estimación directa — Comunitat Valenciana",
    datos: {
      situacion: "Autónomo",
      regimen_autonomo: "estimacion_directa",
      ingresos_brutos: 35000,
      retenciones: 7000,
      comunidad: "Comunitat Valenciana",
      n_hijos: 0,
    },
    esperar: {
      nota: "Caso complejo — es_complejo=true debe ser true",
    },
  },
  {
    id: 5,
    descripcion: "Asalariado 22k, 2 pagadores (segundo >1500€) — Galicia",
    datos: {
      situacion: "Asalariado",
      ingresos_brutos: 22000,
      retenciones: 2800,
      comunidad: "Galicia",
      mas_de_un_pagador: true,
      segundo_pagador_importe: 2500,
      n_hijos: 0,
    },
    esperar: {
      nota: "flag_review=true por segundo pagador relevante",
    },
  },
  {
    id: 6,
    descripcion: "Asalariado 30k Madrid, donaciones 500€",
    datos: {
      situacion: "Asalariado",
      ingresos_brutos: 30000,
      retenciones: 5500,
      comunidad: "Madrid",
      importe_donaciones: 500,
      n_hijos: 0,
    },
    esperar: {
      deducciones_min: 157, // 75% * 150 + 30% * 350 = 112.5 + 105 = 217.5
      nota: "Deducción donaciones debe aplicarse",
    },
  },
  {
    id: 7,
    descripcion: "Asalariado 30k Cataluña, donaciones 500€ (comparar diferencia autonómica con caso 6)",
    datos: {
      situacion: "Asalariado",
      ingresos_brutos: 30000,
      retenciones: 5500,
      comunidad: "Cataluña",
      importe_donaciones: 500,
      n_hijos: 0,
    },
    esperar: {
      nota: "Mayor presión fiscal autonómica que Madrid — resultado más desfavorable",
    },
  },
  {
    id: 8,
    descripcion: "Asalariado discapacidad 33%, 28k — Castilla y León",
    datos: {
      situacion: "Asalariado",
      ingresos_brutos: 28000,
      retenciones: 4500,
      comunidad: "Castilla y León",
      n_hijos: 0,
      contribuyente: {
        discapacidad: true,
        porcentaje_discapacidad: 33,
      },
    },
    esperar: {
      deducciones_min: 1150, // deducción discapacidad estatal 1150€
      nota: "Mínimo discapacidad 33% = 3000€ adicional en mínimo personal + deducción 1150€",
    },
  },
  {
    id: 9,
    descripcion: "Asalariado 60k complejo, con alquiler y fondos — Canarias",
    datos: {
      situacion: "Asalariado",
      ingresos_brutos: 60000,
      retenciones: 16000,
      comunidad: "Canarias",
      n_hijos: 1,
      tiene_capital_mobiliario: true,
      importe_capital_mobiliario: 2000,
      autonomica_checks: {
        alquiler_amount: 9600, // 800€/mes
      },
    },
    esperar: {
      nota: "Ingresos altos + capital mobiliario → flag_review=true. Alquiler autonómico Canarias.",
    },
  },
  {
    id: 10,
    descripcion: "Desempleado con prestación 15k — Andalucía",
    datos: {
      situacion: "Desempleado",
      ingresos_brutos: 15000,
      retenciones: 900,
      comunidad: "Andalucía",
      tiene_prestaciones: true,
      tipo_prestacion: "desempleo",
      n_hijos: 0,
    },
    esperar: {
      nota: "Desempleado con prestación — base baja, probable resultado a devolver",
    },
  },
];

// ── Formato de números ─────────────────────────────────────────────────────

function fmt(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}€`;
}

function fmtCasilla(n: number | undefined): string {
  if (n === undefined || n === null) return "   N/D  ";
  return n.toFixed(2).padStart(10);
}

// ── Runner ─────────────────────────────────────────────────────────────────

function ejecutarCasos() {
  const SEPARADOR = "═".repeat(80);
  const SEP_FINO = "─".repeat(80);

  console.log(`\n${SEPARADOR}`);
  console.log(" 🧮  VALIDACIÓN MOTOR FISCAL IRPF 2025 — Renta Fácil TPymes");
  console.log(`${SEPARADOR}\n`);

  const resultados: Array<{
    id: number;
    descripcion: string;
    casillas: Record<string, number>;
    resultado: number;
    esComplejo: boolean;
    flagReview: boolean;
    totalDeducciones: number;
    ok: boolean;
    alertas: string[];
  }> = [];

  for (const caso of CASOS) {
    const resultado = calcularRenta(caso.datos);
    const casillas = resultado.casillas;
    const alertas: string[] = [];
    let ok = true;

    // Validaciones adicionales según expectativas
    if (caso.esperar) {
      if (
        caso.esperar.resultado_signo === "+" &&
        resultado.resultado <= 0
      ) {
        alertas.push(`⚠️  Se esperaba resultado positivo (a pagar), obtenido: ${resultado.resultado}`);
        ok = false;
      }
      if (
        caso.esperar.resultado_signo === "-" &&
        resultado.resultado >= 0
      ) {
        alertas.push(`⚠️  Se esperaba resultado negativo (a devolver), obtenido: ${resultado.resultado}`);
        ok = false;
      }
      if (
        caso.esperar.deducciones_min !== undefined &&
        resultado.total_deducciones < caso.esperar.deducciones_min
      ) {
        alertas.push(
          `⚠️  Total deducciones ${resultado.total_deducciones.toFixed(2)}€ < mínimo esperado ${caso.esperar.deducciones_min}€`
        );
        ok = false;
      }
    }

    // Validaciones de integridad básica
    if ((casillas["435"] || 0) < 0) {
      alertas.push("⚠️  Casilla 435 (base imponible) negativa — error de cálculo");
      ok = false;
    }
    if ((casillas["596"] || 0) > (casillas["003"] || 0)) {
      alertas.push("⚠️  Retenciones (596) > Ingresos (003) — revisar datos");
    }

    resultados.push({
      id: caso.id,
      descripcion: caso.descripcion,
      casillas,
      resultado: resultado.resultado,
      esComplejo: resultado.es_complejo,
      flagReview: resultado.flag_review,
      totalDeducciones: resultado.total_deducciones,
      ok,
      alertas,
    });
  }

  // ── Tabla de resultados ─────────────────────────────────────────────────

  console.log(
    `${"ID".padEnd(3)} ${"Descripción".padEnd(45)} ${"003(Ingr.)".padStart(12)} ${"435(Base)".padStart(12)} ${"596(Reten.)".padStart(12)} ${"610(DifCuota)".padStart(13)} ${"670(Result.)".padStart(12)} ${"Compl.".padStart(6)}`
  );
  console.log(SEP_FINO);

  for (const r of resultados) {
    const icon = r.ok ? "✅" : "❌";
    const compl = r.esComplejo ? "🔴SÍ" : r.flagReview ? "🟡REV" : "🟢NO";

    const linea = [
      icon,
      String(r.id).padEnd(2),
      r.descripcion.substring(0, 44).padEnd(44),
      fmtCasilla(r.casillas["003"]),
      fmtCasilla(r.casillas["435"]),
      fmtCasilla(r.casillas["596"]),
      fmtCasilla(r.casillas["610"]),
      fmtCasilla(r.casillas["670"]),
      compl,
    ].join(" ");

    console.log(linea);

    // Detalles adicionales
    const detalles = [
      `     → Ingr.${fmt(r.casillas["003"] || 0)}`,
      `Base.${fmt(r.casillas["435"] || 0)}`,
      `Reten.${fmt(r.casillas["596"] || 0)}`,
      `Deduc.Total=${fmt(r.totalDeducciones)}`,
      `Resultado=${fmt(r.resultado)}`,
    ].join("  ");
    console.log(`     ${detalles}`);

    for (const alerta of r.alertas) {
      console.log(`     ${alerta}`);
    }
  }

  console.log(`\n${SEP_FINO}`);

  // ── Resumen detallado caso a caso ──────────────────────────────────────

  console.log("\n📊 DETALLE COMPLETO POR CASO\n");

  for (const caso of CASOS) {
    const r = resultados.find((x) => x.id === caso.id)!;

    console.log(`\n${SEP_FINO}`);
    console.log(
      `CASO ${caso.id} ${r.ok ? "✅" : "❌"}  ${caso.descripcion}`
    );
    console.log(SEP_FINO);

    console.log("  Casillas clave:");
    console.log(`    003 Ingresos brutos:          ${fmtCasilla(r.casillas["003"])}`);
    console.log(`    435 Base imponible general:   ${fmtCasilla(r.casillas["435"])}`);
    console.log(`    596 Retenciones trabajo:      ${fmtCasilla(r.casillas["596"])}`);
    console.log(`    610 Cuota diferencial:        ${fmtCasilla(r.casillas["610"])}`);
    console.log(`    670 Resultado final:          ${fmtCasilla(r.casillas["670"])}`);

    console.log("\n  Resultado:");
    const signo = r.resultado > 0 ? "A INGRESAR" : r.resultado < 0 ? "A DEVOLVER" : "CERO";
    console.log(`    ${signo}: ${fmt(Math.abs(r.resultado))}`);
    console.log(`    Total deducciones: ${fmt(r.totalDeducciones)}`);
    console.log(`    Es complejo: ${r.esComplejo ? "SÍ" : "NO"}  |  Flag revisión: ${r.flagReview ? "SÍ" : "NO"}`);

    if (caso.esperar?.nota) {
      console.log(`\n  📝 Nota: ${caso.esperar.nota}`);
    }
    if (r.alertas.length > 0) {
      console.log("\n  Alertas:");
      for (const a of r.alertas) console.log(`    ${a}`);
    }
  }

  // ── Comparación Madrid vs Cataluña (casos 6 y 7) ───────────────────────

  const r6 = resultados.find((x) => x.id === 6)!;
  const r7 = resultados.find((x) => x.id === 7)!;
  const diferencia = r7.resultado - r6.resultado;

  console.log(`\n${SEPARADOR}`);
  console.log(" 📈  COMPARACIÓN MADRID vs CATALUÑA (mismos datos, distinta CCAA)");
  console.log(`${SEPARADOR}`);
  console.log(`  Madrid  (caso 6): Resultado = ${fmt(r6.resultado)}`);
  console.log(`  Cataluña (caso 7): Resultado = ${fmt(r7.resultado)}`);
  console.log(`  Diferencia (Cataluña - Madrid): ${fmt(diferencia)}`);
  if (diferencia > 0) {
    console.log(`  → Cataluña es ${fmt(diferencia)} más cara que Madrid con los mismos datos.`);
  } else if (diferencia < 0) {
    console.log(`  → Cataluña es ${fmt(Math.abs(diferencia))} más barata que Madrid (verificar).`);
  } else {
    console.log(`  → Resultado idéntico (verificar tramos autonómicos).`);
  }

  // ── Resumen final ────────────────────────────────────────────────────────

  const totalOk = resultados.filter((r) => r.ok).length;
  const totalFail = resultados.filter((r) => !r.ok).length;

  console.log(`\n${SEPARADOR}`);
  console.log(` ✅  RESULTADO: ${totalOk}/10 casos OK   ${totalFail > 0 ? `❌ ${totalFail} FALLOS` : ""}`);
  console.log(`${SEPARADOR}\n`);

  process.exit(totalFail > 0 ? 1 : 0);
}

ejecutarCasos();
