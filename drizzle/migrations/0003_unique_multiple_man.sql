CREATE TABLE `configuracion_precios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clave` varchar(64) NOT NULL,
	`descripcion` text NOT NULL,
	`importe` int NOT NULL,
	`activo` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `configuracion_precios_id` PRIMARY KEY(`id`),
	CONSTRAINT `configuracion_precios_clave_unique` UNIQUE(`clave`)
);
--> statement-breakpoint
CREATE TABLE `declaraciones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`expedienteId` varchar(32) NOT NULL,
	`userId` int,
	`estado` enum('simulacion','pendiente_pago','pagado','en_proceso','completado','derivado','cancelado') NOT NULL DEFAULT 'simulacion',
	`datosContribuyente` json,
	`resultadoCalculo` json,
	`precioBase` int DEFAULT 0,
	`suplementos` json,
	`precioTotal` int DEFAULT 0,
	`esComplejo` boolean DEFAULT false,
	`motivoComplejidad` text,
	`stripeSessionId` varchar(255),
	`stripePaymentIntentId` varchar(255),
	`informePdfUrl` text,
	`informePdfS3Key` varchar(512),
	`emailContacto` varchar(320),
	`telefonoContacto` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `declaraciones_id` PRIMARY KEY(`id`),
	CONSTRAINT `declaraciones_expedienteId_unique` UNIQUE(`expedienteId`)
);
