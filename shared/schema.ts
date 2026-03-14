import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
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
