import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
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
 * Documentos subidos por asesores y clientes.
 * Mantiene casoId para compatibilidad con el panel del asesor existente.
 */
export const documentos = mysqlTable("documentos", {
  id: int("id").autoincrement().primaryKey(),
  /** ID del caso en el Google Sheet o expedienteId */
  casoId: varchar("casoId", { length: 64 }).notNull(),
  nombreArchivo: varchar("nombreArchivo", { length: 255 }).notNull(),
  s3Key: varchar("s3Key", { length: 512 }).notNull(),
  url: text("url").notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  tamano: bigint("tamano", { mode: "number" }).notNull(),
  subidoPor: mysqlEnum("subidoPor", ["asesor", "cliente"]).notNull(),
  subidoPorNombre: varchar("subidoPorNombre", { length: 128 }),
  categoria: varchar("categoria", { length: 64 }),
  notas: text("notas"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Documento = typeof documentos.$inferSelect;
export type InsertDocumento = typeof documentos.$inferInsert;

/**
 * Historial de documentos rechazados por el asesor.
 */
export const rechazosDocumentos = mysqlTable("rechazos_documentos", {
  id: int("id").autoincrement().primaryKey(),
  casoId: varchar("casoId", { length: 64 }).notNull(),
  nombreArchivo: varchar("nombreArchivo", { length: 255 }).notNull(),
  categoria: varchar("categoria", { length: 64 }),
  motivo: text("motivo"),
  rechazadoPor: varchar("rechazadoPor", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RechazoDocumento = typeof rechazosDocumentos.$inferSelect;
export type InsertRechazoDocumento = typeof rechazosDocumentos.$inferInsert;

/**
 * Firmas digitales del cliente.
 * Mantiene casoId para compatibilidad con el panel del asesor existente.
 */
export const firmas = mysqlTable("firmas", {
  id: int("id").autoincrement().primaryKey(),
  casoId: varchar("casoId", { length: 64 }).notNull(),
  nif: varchar("nif", { length: 20 }).notNull(),
  firmaUrl: text("firmaUrl").notNull(),
  firmaS3Key: varchar("firmaS3Key", { length: 512 }).notNull(),
  ip: varchar("ip", { length: 64 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Firma = typeof firmas.$inferSelect;
export type InsertFirma = typeof firmas.$inferInsert;

/**
 * ============================================================
 * NUEVA PLATAFORMA DE RENTA AUTOMATIZADA
 * ============================================================
 */

/**
 * Declaraciones de renta - tabla principal.
 * Cada fila representa una declaración iniciada por un contribuyente.
 * El simulador puede usarse sin registro; el userId se asigna al pagar.
 */
export const declaraciones = mysqlTable("declaraciones", {
  id: int("id").autoincrement().primaryKey(),
  /** ID único de expediente (ej: RF2025-XXXX) */
  expedienteId: varchar("expedienteId", { length: 32 }).notNull().unique(),
  /** Usuario registrado (null si aún no ha pagado/registrado) */
  userId: int("userId"),
  /** Estado del expediente */
  estado: mysqlEnum("estado", [
    "simulacion",
    "pendiente_pago",
    "pagado",
    "en_proceso",
    "completado",
    "derivado",
    "cancelado"
  ]).default("simulacion").notNull(),
  /** Datos del contribuyente (JSON con todas las respuestas del simulador) */
  datosContribuyente: json("datosContribuyente"),
  /** Resultado del cálculo fiscal (JSON con casillas y valores) */
  resultadoCalculo: json("resultadoCalculo"),
  /** Precio base en céntimos */
  precioBase: int("precioBase").default(0),
  /** Suplementos aplicados (JSON: [{concepto, descripcion, importe}]) */
  suplementos: json("suplementos"),
  /** Precio total en céntimos */
  precioTotal: int("precioTotal").default(0),
  /** Si el caso fue marcado como complejo */
  esComplejo: boolean("esComplejo").default(false),
  /** Motivo por el que es complejo */
  motivoComplejidad: text("motivoComplejidad"),
  /** ID de sesión de pago de Stripe */
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  /** ID de pago de Stripe confirmado */
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  /** URL del informe PDF generado */
  informePdfUrl: text("informePdfUrl"),
  /** Clave S3 del informe PDF */
  informePdfS3Key: varchar("informePdfS3Key", { length: 512 }),
  /** Email del contribuyente */
  emailContacto: varchar("emailContacto", { length: 320 }),
  /** Teléfono del contribuyente */
  telefonoContacto: varchar("telefonoContacto", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Declaracion = typeof declaraciones.$inferSelect;
export type InsertDeclaracion = typeof declaraciones.$inferInsert;

/**
 * Configuración de precios - gestionada por el administrador.
 */
export const configuracionPrecios = mysqlTable("configuracion_precios", {
  id: int("id").autoincrement().primaryKey(),
  clave: varchar("clave", { length: 64 }).notNull().unique(),
  descripcion: text("descripcion").notNull(),
  importe: int("importe").notNull(),
  activo: boolean("activo").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ConfiguracionPrecio = typeof configuracionPrecios.$inferSelect;

/**
 * Solicitudes de contacto con asesor fiscal (casos complejos derivados).
 */
export const solicitudesAsesor = mysqlTable("solicitudes_asesor", {
  id: int("id").autoincrement().primaryKey(),
  /** ID del expediente original del simulador (puede ser null si contacta directo) */
  expedienteId: varchar("expedienteId", { length: 32 }),
  /** Nombre completo del contribuyente */
  nombre: varchar("nombre", { length: 255 }).notNull(),
  /** NIF/NIE */
  nif: varchar("nif", { length: 20 }).notNull(),
  /** Email de contacto */
  email: varchar("email", { length: 320 }).notNull(),
  /** Teléfono de contacto */
  telefono: varchar("telefono", { length: 20 }).notNull(),
  /** Franja horaria preferida para la llamada */
  franjaHoraria: varchar("franjaHoraria", { length: 64 }),
  /** Motivo de la complejidad (del motor fiscal) */
  motivoComplejidad: text("motivoComplejidad"),
  /** Descripción libre del usuario sobre su situación */
  descripcionSituacion: text("descripcionSituacion"),
  /** Estado de la solicitud */
  estado: mysqlEnum("estado", [
    "pendiente",
    "contactado",
    "en_gestion",
    "resuelto",
    "cancelado"
  ]).default("pendiente").notNull(),
  /** Notas internas del asesor */
  notasAsesor: text("notasAsesor"),
  /** Asesor asignado */
  asesorAsignado: varchar("asesorAsignado", { length: 128 }),
  /** Resultado del cálculo del simulador (JSON) para contexto del asesor */
  resultadoSimulador: json("resultadoSimulador"),
  /** Precio estimado del servicio complejo */
  precioEstimado: int("precioEstimado"),
  /** ID del webhook de n8n para tracking */
  n8nExecutionId: varchar("n8nExecutionId", { length: 128 }),
  /** Slot reservado como ISO datetime (ej: 2026-04-02T10:00:00+02:00) */
  reservedSlot: varchar("reservedSlot", { length: 64 }),
  /** Estado de la reserva del slot */
  slotStatus: mysqlEnum("slotStatus", ["tentative", "confirmed", "cancelled", "retrying"]).default("tentative"),
  /** Logs de auditoría: [{action, timestamp, ip, user_agent, details}] */
  auditLogs: json("auditLogs"),
  /** Registro de notificaciones enviadas: [{type, timestamp, status, payload}] */
  notificacionesSent: json("notificacionesSent"),
  /** ID del evento creado en Google Calendar */
  calendarEventId: varchar("calendarEventId", { length: 255 }),
  /** Modo de creación del evento Calendar (service_account | advisor_oauth | shared_calendar) */
  calendarCreatedBy: varchar("calendarCreatedBy", { length: 64 }),
  /** Asesor asignado (ID interno) */
  assignedAdvisorId: varchar("assignedAdvisorId", { length: 64 }),
  /** IP del cliente al enviar la solicitud */
  ipAddress: varchar("ipAddress", { length: 64 }),
  /** User agent del cliente */
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SolicitudAsesor = typeof solicitudesAsesor.$inferSelect;
export type InsertSolicitudAsesor = typeof solicitudesAsesor.$inferInsert;
