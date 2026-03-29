/**
 * Script: cleanup-test-expedientes.ts
 * Elimina de la tabla `declaraciones` todos los registros de prueba:
 *   - expedienteId LIKE 'RF2025-test-%'
 *   - estado = 'test'
 *
 * Uso: npx tsx scripts/cleanup-test-expedientes.ts
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { declaraciones } from "../drizzle/schema";
import { like, or, eq, and } from "drizzle-orm";

async function main() {
  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.MYSQL_URL ||
    process.env.MYSQL_PUBLIC_URL;

  if (!dbUrl) {
    console.error("❌ ERROR: No se encontró DATABASE_URL en el entorno.");
    console.error(
      "   Asegúrate de tener un archivo .env con DATABASE_URL configurado."
    );
    process.exit(1);
  }

  console.log("🔌 Conectando a la base de datos...");
  const db = drizzle(dbUrl);

  // 1. Listar primero cuántos registros vamos a borrar (preview)
  const preview = await db
    .select({
      id: declaraciones.id,
      expedienteId: declaraciones.expedienteId,
      estado: declaraciones.estado,
      createdAt: declaraciones.createdAt,
    })
    .from(declaraciones)
    .where(
      or(
        like(declaraciones.expedienteId, "RF2025-test-%"),
        eq(declaraciones.estado, "test")
      )
    );

  if (preview.length === 0) {
    console.log("✅ No hay expedientes de prueba. Nada que limpiar.");
    process.exit(0);
  }

  console.log(`\n📋 Expedientes de prueba encontrados: ${preview.length}`);
  console.log("─".repeat(60));

  // Mostrar tabla de preview
  for (const row of preview) {
    console.log(
      `  [${row.id}] ${row.expedienteId.padEnd(24)} estado=${row.estado.padEnd(12)} creado=${row.createdAt.toISOString().substring(0, 10)}`
    );
  }

  console.log("─".repeat(60));
  console.log(`\n🗑️  Borrando ${preview.length} expedientes de prueba...`);

  // 2. Ejecutar el DELETE
  await db
    .delete(declaraciones)
    .where(
      or(
        like(declaraciones.expedienteId, "RF2025-test-%"),
        eq(declaraciones.estado, "test")
      )
    );

  console.log(`\n✅ Eliminados ${preview.length} expedientes de prueba.`);

  // 3. Verificación post-borrado
  const verificacion = await db
    .select({ count: declaraciones.id })
    .from(declaraciones)
    .where(
      or(
        like(declaraciones.expedienteId, "RF2025-test-%"),
        eq(declaraciones.estado, "test")
      )
    );

  const restantes = verificacion.length;
  if (restantes === 0) {
    console.log("✅ Verificación OK: no quedan expedientes de prueba.");
  } else {
    console.warn(`⚠️  Atención: aún quedan ${restantes} expedientes de prueba tras el borrado.`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error inesperado:", err);
  process.exit(1);
});
