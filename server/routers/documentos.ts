/**
 * Router: documentos
 * Gestiona la subida, listado y eliminación de documentos asociados a casos.
 * Los archivos se almacenan en S3; los metadatos en la base de datos MySQL.
 *
 * Endpoints:
 *   - documentos.listar(casoId)        → lista todos los docs de un caso
 *   - documentos.subir(casoId, ...)    → sube un archivo a S3 y guarda metadatos
 *   - documentos.eliminar(id)          → elimina un doc de S3 y de la BD
 *   - documentos.getUploadUrl(...)     → genera URL presignada para subida directa desde el cliente
 */

import { z } from "zod";
import { eq, desc, inArray, count, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { documentos, rechazosDocumentos } from "../../drizzle/schema";
import { storagePut, storageGet } from "../storage";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { notifyOwner } from "../_core/notification";

const APP_URL = "https://rentatpymes.aicheckpyme.co";

// S3 client para operaciones de eliminación y presigned URLs
const s3 = new S3Client({
  region: process.env.S3_REGION ?? "us-east-1",
  ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT, forcePathStyle: true } : {}),
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  },
});

const BUCKET = process.env.S3_BUCKET ?? "";
const REGION = process.env.S3_REGION ?? "us-east-1";
const CDN_BASE = process.env.S3_CDN_BASE ?? "";

function randomSuffix() {
  return Math.random().toString(36).substring(2, 10);
}

function buildPublicUrl(key: string): string {
  if (CDN_BASE) return `${CDN_BASE.replace(/\/$/, "")}/${key}`;
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

export const documentosRouter = router({
  /**
   * Listar todos los documentos de un caso
   */
  listar: publicProcedure
    .input(z.object({ casoId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { documentos: [] };

      const docs = await db
        .select()
        .from(documentos)
        .where(eq(documentos.casoId, input.casoId))
        .orderBy(desc(documentos.createdAt));

      return { documentos: docs };
    }),

  /**
   * Generar URL presignada para subida directa desde el navegador.
   * El cliente sube el archivo directamente a S3 sin pasar por el servidor.
   * Después llama a documentos.confirmarSubida para guardar los metadatos.
   */
  getUploadUrl: publicProcedure
    .input(z.object({
      casoId: z.string(),
      nombreArchivo: z.string(),
      mimeType: z.string(),
      tamano: z.number().max(20 * 1024 * 1024, "El archivo no puede superar 20MB"),
      subidoPor: z.enum(["asesor", "cliente"]),
      subidoPorNombre: z.string().optional(),
      categoria: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      if (!BUCKET) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "S3 no configurado. Contacta con el administrador.",
        });
      }

      const ext = input.nombreArchivo.split(".").pop() ?? "bin";
      const s3Key = `documentos/${input.casoId}/${input.subidoPor}/${randomSuffix()}-${input.nombreArchivo.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

      const uploadUrl = await getSignedUrl(
        s3,
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: s3Key,
          ContentType: input.mimeType,
          ContentLength: input.tamano,
        }),
        { expiresIn: 300 } // 5 minutos para completar la subida
      );

      const publicUrl = buildPublicUrl(s3Key);

      return { uploadUrl, s3Key, publicUrl };
    }),

  /**
   * Confirmar subida: guardar metadatos en la BD después de que el cliente
   * haya subido el archivo directamente a S3 via URL presignada.
   */
  confirmarSubida: publicProcedure
    .input(z.object({
      casoId: z.string(),
      nombreArchivo: z.string(),
      s3Key: z.string(),
      url: z.string(),
      mimeType: z.string(),
      tamano: z.number(),
      subidoPor: z.enum(["asesor", "cliente"]),
      subidoPorNombre: z.string().optional(),
      categoria: z.string().optional(),
      notas: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Base de datos no disponible",
        });
      }

      await db.insert(documentos).values({
        casoId: input.casoId,
        nombreArchivo: input.nombreArchivo,
        s3Key: input.s3Key,
        url: input.url,
        mimeType: input.mimeType,
        tamano: input.tamano,
        subidoPor: input.subidoPor,
        subidoPorNombre: input.subidoPorNombre ?? null,
        categoria: input.categoria ?? null,
        notas: input.notas ?? null,
      });

      // Notificar al asesor si el documento lo sube el cliente
      if (input.subidoPor === "cliente") {
        const panelUrl = `${APP_URL}/panel-asesor`;
        notifyOwner({
          title: `📄 Nuevo documento de cliente — ${input.casoId}`,
          content: `El cliente **${input.subidoPorNombre ?? "Desconocido"}** ha subido un documento al caso **${input.casoId}**.\n\n` +
            `**Archivo:** ${input.nombreArchivo}\n` +
            `**Categoría:** ${input.categoria ?? "Sin categoría"}\n` +
            `**Tamaño:** ${(input.tamano / 1024).toFixed(1)} KB\n\n` +
            `[Ver en el panel del asesor](${panelUrl})`,
        }).catch(() => { /* silencioso si falla */ });
      }

      return { success: true };
    }),

  /**
   * Subida directa desde el servidor (para archivos pequeños o cuando no se puede
   * usar presigned URL). El archivo llega como base64.
   */
  subirBase64: publicProcedure
    .input(z.object({
      casoId: z.string(),
      nombreArchivo: z.string(),
      mimeType: z.string(),
      tamano: z.number().max(10 * 1024 * 1024, "El archivo no puede superar 10MB en subida directa"),
      base64Data: z.string(),
      subidoPor: z.enum(["asesor", "cliente"]),
      subidoPorNombre: z.string().optional(),
      categoria: z.string().optional(),
      notas: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      if (!BUCKET) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "S3 no configurado. Contacta con el administrador.",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Base de datos no disponible",
        });
      }

      const buffer = Buffer.from(input.base64Data, "base64");
      const s3Key = `documentos/${input.casoId}/${input.subidoPor}/${randomSuffix()}-${input.nombreArchivo.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

      const { url } = await storagePut(s3Key, buffer, input.mimeType);

      await db.insert(documentos).values({
        casoId: input.casoId,
        nombreArchivo: input.nombreArchivo,
        s3Key,
        url,
        mimeType: input.mimeType,
        tamano: input.tamano,
        subidoPor: input.subidoPor,
        subidoPorNombre: input.subidoPorNombre ?? null,
        categoria: input.categoria ?? null,
        notas: input.notas ?? null,
      });

      // Notificar al asesor si el documento lo sube el cliente
      if (input.subidoPor === "cliente") {
        const panelUrl = `${APP_URL}/panel-asesor`;
        notifyOwner({
          title: `📄 Nuevo documento de cliente — ${input.casoId}`,
          content: `El cliente **${input.subidoPorNombre ?? "Desconocido"}** ha subido un documento al caso **${input.casoId}**.\n\n` +
            `**Archivo:** ${input.nombreArchivo}\n` +
            `**Categoría:** ${input.categoria ?? "Sin categoría"}\n` +
            `**Tamaño:** ${(input.tamano / 1024).toFixed(1)} KB\n\n` +
            `[Ver en el panel del asesor](${panelUrl})`,
        }).catch(() => { /* silencioso si falla */ });
      }

      return { success: true, url, s3Key };
    }),

  /**
   * Eliminar un documento (de S3 y de la BD).
   * Si se proporciona motivo y el doc es del cliente, guarda un registro de rechazo.
   */
  eliminar: publicProcedure
    .input(z.object({
      id: z.number(),
      motivo: z.string().optional(),
      rechazadoPor: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Base de datos no disponible",
        });
      }

      // Obtener el documento para saber su s3Key y datos
      const docs = await db
        .select()
        .from(documentos)
        .where(eq(documentos.id, input.id))
        .limit(1);

      if (docs.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Documento no encontrado" });
      }

      const doc = docs[0];

      // Si el doc es del cliente y hay motivo, guardar registro de rechazo
      if (doc.subidoPor === "cliente" && input.motivo) {
        await db.insert(rechazosDocumentos).values({
          casoId: doc.casoId,
          nombreArchivo: doc.nombreArchivo,
          categoria: doc.categoria ?? null,
          motivo: input.motivo,
          rechazadoPor: input.rechazadoPor ?? null,
        });
      }

      // Eliminar de S3
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: doc.s3Key }));
      } catch (err) {
        console.warn("[S3] No se pudo eliminar el archivo:", err);
        // Continuar aunque falle S3 — eliminar de la BD igualmente
      }

      // Eliminar de la BD
      await db.delete(documentos).where(eq(documentos.id, input.id));

      return { success: true };
    }),

  /**
   * Listar el historial de documentos rechazados de un caso.
   * Usado en /seguimiento para que el cliente vea qué documentos fueron rechazados y por qué.
   */
  listarRechazos: publicProcedure
    .input(z.object({ casoId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { rechazos: [] };

      const rechazos = await db
        .select()
        .from(rechazosDocumentos)
        .where(eq(rechazosDocumentos.casoId, input.casoId))
        .orderBy(desc(rechazosDocumentos.createdAt));

      return { rechazos };
    }),

  /**
   * Obtener URL de descarga presignada (para archivos privados)
   */
  getDownloadUrl: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "BD no disponible" });

      const docs = await db
        .select()
        .from(documentos)
        .where(eq(documentos.id, input.id))
        .limit(1);

      if (docs.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Documento no encontrado" });
      }

      const doc = docs[0];
      const { url } = await storageGet(doc.s3Key, 3600);
      return { url, nombreArchivo: doc.nombreArchivo };
    }),

  /**
   * Obtener conteo de documentos del cliente para múltiples casos a la vez.
   * Usado por el sidebar del panel del asesor para mostrar badges.
   * Devuelve un mapa { [casoId]: númeroDocumentosCliente }
   */
  contarPorCasos: publicProcedure
    .input(z.object({ casoIds: z.array(z.string()).max(200) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db || input.casoIds.length === 0) return { conteos: {} as Record<string, number> };

      const rows = await db
        .select({ casoId: documentos.casoId, total: count() })
        .from(documentos)
        .where(
          and(
            inArray(documentos.casoId, input.casoIds),
            eq(documentos.subidoPor, "cliente")
          )
        )
        .groupBy(documentos.casoId);

      const conteos: Record<string, number> = {};
      for (const row of rows) {
        conteos[row.casoId] = Number(row.total);
      }
      return { conteos };
    }),
});
