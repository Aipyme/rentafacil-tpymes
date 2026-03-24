import { pgTable, text, serial, integer, boolean, timestamp, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const declarations = pgTable("declarations", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  email: text("email").notNull(),
  telefono: text("telefono").notNull(),
  nif: text("nif").notNull(),
  ejercicio: text("ejercicio").notNull().default("2024"),
  numPagadores: integer("num_pagadores").notNull().default(1),
  tieneInmueblesAlquilados: boolean("tiene_inmuebles_alquilados").notNull().default(false),
  tieneActividadEconomica: boolean("tiene_actividad_economica").notNull().default(false),
  tipo: text("tipo").notNull().default("simple"),
  estado: text("estado").notNull().default("recibido"),
  fecha: text("fecha").notNull(),
  precio: integer("precio").notNull().default(0),
  notas: text("notas"),
});

export const insertDeclarationSchema = createInsertSchema(declarations).omit({
  id: true,
});

export type InsertDeclaration = z.infer<typeof insertDeclarationSchema>;
export type Declaration = typeof declarations.$inferSelect;

/**
 * Tabla de documentos subidos por asesores y clientes.
 * Cada documento está asociado a un caso (id_caso del Google Sheet).
 * El archivo binario se almacena en S3; aquí guardamos solo metadatos.
 */
export const documentos = pgTable("documentos", {
  id: serial("id").primaryKey(),
  /** ID del caso en el Google Sheet (ej: RENTA-2025-MN4CXQB8) */
  casoId: text("caso_id").notNull(),
  /** Nombre original del archivo tal como lo subió el usuario */
  nombreArchivo: text("nombre_archivo").notNull(),
  /** Clave del objeto en S3 (ruta relativa dentro del bucket) */
  s3Key: text("s3_key").notNull(),
  /** URL pública del archivo en S3 */
  url: text("url").notNull(),
  /** Tipo MIME del archivo (application/pdf, image/jpeg, etc.) */
  mimeType: text("mime_type").notNull(),
  /** Tamaño del archivo en bytes */
  tamano: integer("tamano").notNull(),
  /** Quién subió el documento: "asesor" o "cliente" */
  subidoPor: text("subido_por").notNull(),
  /** Nombre o identificador del usuario que subió el documento */
  subidoPorNombre: text("subido_por_nombre"),
  /** Categoría del documento para organización */
  categoria: text("categoria"),
  /** Notas opcionales sobre el documento */
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Documento = typeof documentos.$inferSelect;
export type InsertDocumento = typeof documentos.$inferInsert;

// Webhook integration for n8n or Zapier
export const webhookSchema = z.object({
  nombre: z.string().min(1),
  email: z.string().email(),
  telefono: z.string().min(9),
  nif: z.string().min(9),
  ejercicio: z.string().default("2024"),
  numPagadores: z.number().default(1),
  tieneInmueblesAlquilados: z.boolean().default(false),
  tieneActividadEconomica: z.boolean().default(false),
  tipo: z.string().optional(),
  estado: z.string().default("recibido"),
  fecha: z.string(),
  precio: z.number().default(0),
  notas: z.string().optional(),
});
