CREATE TABLE "declarations" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"email" text NOT NULL,
	"telefono" text NOT NULL,
	"nif" text NOT NULL,
	"ejercicio" text DEFAULT '2024' NOT NULL,
	"num_pagadores" integer DEFAULT 1 NOT NULL,
	"tiene_inmuebles_alquilados" boolean DEFAULT false NOT NULL,
	"tiene_actividad_economica" boolean DEFAULT false NOT NULL,
	"tipo" text DEFAULT 'simple' NOT NULL,
	"estado" text DEFAULT 'recibido' NOT NULL,
	"fecha" text NOT NULL,
	"precio" integer DEFAULT 0 NOT NULL,
	"notas" text
);
