CREATE TABLE `firmas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`casoId` varchar(64) NOT NULL,
	`nif` varchar(20) NOT NULL,
	`firmaUrl` text NOT NULL,
	`firmaS3Key` varchar(512) NOT NULL,
	`ip` varchar(64),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `firmas_id` PRIMARY KEY(`id`)
);
