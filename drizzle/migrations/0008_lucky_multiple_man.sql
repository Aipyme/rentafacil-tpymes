ALTER TABLE `declaraciones` MODIFY COLUMN `estado` enum('recibido','pendiente_clasificacion','clasificado','pendiente_pago','pagado','pendiente_documentacion','derivado_asesor','cita_propuesta','cita_confirmada','en_preparacion','pendiente_validacion_cliente','cerrado','incidencia','simulacion','en_proceso','completado','derivado','cancelado') NOT NULL DEFAULT 'recibido';--> statement-breakpoint
ALTER TABLE `declaraciones` ADD `subestado` varchar(64);--> statement-breakpoint
ALTER TABLE `declaraciones` ADD `environment` varchar(8) DEFAULT 'prod' NOT NULL;--> statement-breakpoint
ALTER TABLE `declaraciones` ADD `estadoUpdatedAt` timestamp;--> statement-breakpoint
ALTER TABLE `declaraciones` ADD `estadoUpdatedBy` varchar(64);--> statement-breakpoint
ALTER TABLE `declaraciones` ADD `stripeEventId` varchar(255);--> statement-breakpoint
ALTER TABLE `declaraciones` ADD `paymentConfirmedAt` timestamp;--> statement-breakpoint
ALTER TABLE `declaraciones` ADD CONSTRAINT `declaraciones_stripeEventId_unique` UNIQUE(`stripeEventId`);