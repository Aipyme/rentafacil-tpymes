import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabla de documentos subidos por asesores y clientes.
 * Cada documento está asociado a un caso (id_caso del Google Sheet).
 * El archivo binario se almacena en S3; aquí guardamos solo metadatos.
 */
export const documentos = mysqlTable("documentos", {
  id: int("id").autoincrement().primaryKey(),
  /** ID del caso en el Google Sheet (ej: RENTA-2025-MN4CXQB8) */
  casoId: varchar("casoId", { length: 64 }).notNull(),
  /** Nombre original del archivo tal como lo subió el usuario */
  nombreArchivo: varchar("nombreArchivo", { length: 255 }).notNull(),
  /** Clave del objeto en S3 (ruta relativa dentro del bucket) */
  s3Key: varchar("s3Key", { length: 512 }).notNull(),
  /** URL pública del archivo en S3 */
  url: text("url").notNull(),
  /** Tipo MIME del archivo (application/pdf, image/jpeg, etc.) */
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  /** Tamaño del archivo en bytes */
  tamano: bigint("tamano", { mode: "number" }).notNull(),
  /** Quién subió el documento: "asesor" o "cliente" */
  subidoPor: mysqlEnum("subidoPor", ["asesor", "cliente"]).notNull(),
  /** Nombre o identificador del usuario que subió el documento */
  subidoPorNombre: varchar("subidoPorNombre", { length: 128 }),
  /** Categoría del documento para organización */
  categoria: varchar("categoria", { length: 64 }),
  /** Notas opcionales sobre el documento */
  notas: text("notas"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Documento = typeof documentos.$inferSelect;
export type InsertDocumento = typeof documentos.$inferInsert;

/**
 * Historial de documentos rechazados por el asesor.
 * Cuando el asesor elimina un documento del cliente con motivo,
 * se guarda un registro aquí para que el cliente lo vea en /seguimiento.
 */
export const rechazosDocumentos = mysqlTable("rechazos_documentos", {
  id: int("id").autoincrement().primaryKey(),
  /** ID del caso en el Google Sheet */
  casoId: varchar("casoId", { length: 64 }).notNull(),
  /** Nombre del archivo rechazado */
  nombreArchivo: varchar("nombreArchivo", { length: 255 }).notNull(),
  /** Categoría del documento rechazado */
  categoria: varchar("categoria", { length: 64 }),
  /** Motivo del rechazo escrito por el asesor */
  motivo: text("motivo"),
  /** Nombre del asesor que rechazó el documento */
  rechazadoPor: varchar("rechazadoPor", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RechazoDocumento = typeof rechazosDocumentos.$inferSelect;
export type InsertRechazoDocumento = typeof rechazosDocumentos.$inferInsert;
