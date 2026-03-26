CREATE TABLE `asesores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`calendarMode` enum('shared_calendar','personal_oauth') NOT NULL DEFAULT 'shared_calendar',
	`googleCredentialId` varchar(128),
	`workingHours` json,
	`activo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `asesores_id` PRIMARY KEY(`id`),
	CONSTRAINT `asesores_email_unique` UNIQUE(`email`)
);
