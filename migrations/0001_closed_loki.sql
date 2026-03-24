CREATE TABLE "documentos" (
	"id" serial PRIMARY KEY NOT NULL,
	"caso_id" text NOT NULL,
	"nombre_archivo" text NOT NULL,
	"s3_key" text NOT NULL,
	"url" text NOT NULL,
	"mime_type" text NOT NULL,
	"tamano" integer NOT NULL,
	"subido_por" text NOT NULL,
	"subido_por_nombre" text,
	"categoria" text,
	"notas" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
