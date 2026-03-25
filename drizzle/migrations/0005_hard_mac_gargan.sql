ALTER TABLE `solicitudes_asesor` ADD `reservedSlot` varchar(64);--> statement-breakpoint
ALTER TABLE `solicitudes_asesor` ADD `slotStatus` enum('tentative','confirmed','cancelled','retrying') DEFAULT 'tentative';--> statement-breakpoint
ALTER TABLE `solicitudes_asesor` ADD `auditLogs` json;--> statement-breakpoint
ALTER TABLE `solicitudes_asesor` ADD `notificacionesSent` json;--> statement-breakpoint
ALTER TABLE `solicitudes_asesor` ADD `ipAddress` varchar(64);--> statement-breakpoint
ALTER TABLE `solicitudes_asesor` ADD `userAgent` text;