CREATE TABLE `rechazos_documentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`casoId` varchar(64) NOT NULL,
	`nombreArchivo` varchar(255) NOT NULL,
	`categoria` varchar(64),
	`motivo` text,
	`rechazadoPor` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rechazos_documentos_id` PRIMARY KEY(`id`)
);
