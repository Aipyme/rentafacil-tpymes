import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Declaration / tax filing record
export const declarations = pgTable("declarations", {
  id: varchar("id").primaryKey(),
  // Step 1
  nombreCompleto: text("nombre_completo").notNull(),
  nif: text("nif").notNull(),
  email: text("email").notNull(),
  telefono: text("telefono").notNull(),
  comunidadAutonoma: text("comunidad_autonoma").notNull(),
  // Step 2
  estadoCivil: text("estado_civil").notNull(),
  numHijos: integer("num_hijos").notNull().default(0),
  tipoVivienda: text("tipo_vivienda").notNull(),
  hipotecaAnterior2013: boolean("hipoteca_anterior_2013").notNull().default(false),
  // Step 3
  rendimientosTrabajo: integer("rendimientos_trabajo").notNull(),
  numPagadores: integer("num_pagadores").notNull().default(1),
  tieneOtrosRendimientos: boolean("tiene_otros_rendimientos").notNull().default(false),
  otrosRendimientosDescripcion: text("otros_rendimientos_descripcion"),
  tieneInmueblesAlquilados: boolean("tiene_inmuebles_alquilados").notNull().default(false),
  tieneInversiones: boolean("tiene_inversiones").notNull().default(false),
  tieneActividadEconomica: boolean("tiene_actividad_economica").notNull().default(false),
  // Step 4
  deduccionesConocidas: text("deducciones_conocidas"),
  tieneDiscapacidad: boolean("tiene_discapacidad").notNull().default(false),
  porcentajeDiscapacidad: integer("porcentaje_discapacidad"),
  realizaDonaciones: boolean("realiza_donaciones").notNull().default(false),
  tienePlanPensiones: boolean("tiene_plan_pensiones").notNull().default(false),
  // Meta
  aceptaPolitica: boolean("acepta_politica").notNull().default(true),
  aceptaTratamiento: boolean("acepta_tratamiento").notNull().default(true),
  estado: text("estado").notNull().default("recibido"),
  tipo: text("tipo").notNull().default("simple"),
  resultado: integer("resultado"),
  fecha: text("fecha").notNull(),
});

export const insertDeclarationSchema = createInsertSchema(declarations).omit({ id: true });

export type InsertDeclaration = z.infer<typeof insertDeclarationSchema>;
export type Declaration = typeof declarations.$inferSelect;

// Keep users for compatibility
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
