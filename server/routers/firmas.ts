/**
 * Router de firmas digitales
 *
 * Permite al cliente firmar digitalmente la autorización para presentar su declaración.
 * La firma (PNG en base64) se sube a S3 y se registra en la BD con metadatos de trazabilidad.
 * También actualiza la columna firmaUrl (AZ) del Google Sheet via WF02.
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { firmas } from "../../drizzle/schema";
import { storagePut } from "../storage";
import { eq } from "drizzle-orm";
import { ENV } from "../_core/env";

// Sufijo aleatorio para evitar colisiones en S3
function randomSuffix(): string {
  return Math.random().toString(36).substring(2, 10);
}

export const firmasRouter = router({
  /**
   * Guardar la firma digital del cliente.
   * Recibe el PNG en base64, lo sube a S3, guarda en BD y actualiza el Sheet.
   */
  guardar: publicProcedure
    .input(z.object({
      casoId: z.string().min(1),
      nif: z.string().min(1),
      firmaBase64: z.string().min(100), // PNG en base64 (data:image/png;base64,...)
      rowIndex: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // 1. Convertir base64 a Buffer
        const base64Data = input.firmaBase64.replace(/^data:image\/png;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        if (buffer.length < 100) {
          return { success: false, error: "La firma está vacía o es demasiado pequeña" };
        }

        // 2. Subir a S3
        const s3Key = `firmas/${input.casoId}-${randomSuffix()}.png`;
        const { url: firmaUrl } = await storagePut(s3Key, buffer, "image/png");

        // 3. Obtener IP y User-Agent del cliente
        const ip = (ctx.req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
          || ctx.req.socket?.remoteAddress
          || "desconocida";
        const userAgent = ctx.req.headers["user-agent"] || "";

        // 4. Guardar en BD
        const db = await getDb();
        if (!db) throw new Error("Base de datos no disponible");
        await db.insert(firmas).values({
          casoId: input.casoId,
          nif: input.nif.toUpperCase(),
          firmaUrl,
          firmaS3Key: s3Key,
          ip,
          userAgent,
        });

        // 5. Actualizar el Sheet via WF02 (columna AZ: firmaUrl)
        const updateUrl = ENV.n8nUpdateWebhookUrl || ENV.n8nWebhookUrl;
        if (updateUrl) {
          try {
            await fetch(updateUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id_caso: input.casoId,
                rowIndex: input.rowIndex,
                firmaUrl,
                firmaFecha: new Date().toISOString(),
              }),
            });
          } catch {
            // No crítico — la firma ya está en BD y S3
          }
        }

        return {
          success: true,
          firmaUrl,
          fecha: new Date().toISOString(),
          ip,
        };
      } catch (e) {
        console.error("[firmas.guardar] Error:", e);
        return { success: false, error: e instanceof Error ? e.message : String(e) };
      }
    }),

  /**
   * Verificar si un caso ya tiene firma registrada.
   */
  verificar: publicProcedure
    .input(z.object({
      casoId: z.string(),
      nif: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return { firmado: false, firma: null };
        const resultado = await db
          .select()
          .from(firmas)
          .where(eq(firmas.casoId, input.casoId.toUpperCase()))
          .limit(1);

        if (resultado.length === 0) {
          return { firmado: false, firma: null };
        }

        const firma = resultado[0];
        return {
          firmado: true,
          firma: {
            firmaUrl: firma.firmaUrl,
            fecha: firma.createdAt,
            ip: firma.ip,
          },
        };
      } catch {
        return { firmado: false, firma: null };
      }
    }),

  /**
   * Obtener la firma de un caso (para el asesor en el panel).
   */
  obtenerParaAsesor: publicProcedure
    .input(z.object({ casoId: z.string() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return { firma: null };
        const resultado = await db
          .select()
          .from(firmas)
          .where(eq(firmas.casoId, input.casoId))
          .limit(1);

        if (resultado.length === 0) return { firma: null };

        const f = resultado[0];
        return {
          firma: {
            firmaUrl: f.firmaUrl,
            nif: f.nif,
            fecha: f.createdAt,
            ip: f.ip,
          },
        };
      } catch {
        return { firma: null };
      }
    }),
});
