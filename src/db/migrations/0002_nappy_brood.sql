CREATE TABLE `printer_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`printer_name` varchar(255),
	`connection_type` varchar(20) NOT NULL DEFAULT 'usb',
	`paper_width` int NOT NULL DEFAULT 58,
	`auto_cut` boolean NOT NULL DEFAULT true,
	`enabled` boolean NOT NULL DEFAULT false,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `printer_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `products` ADD `tax_rate` decimal(5,2);--> statement-breakpoint
ALTER TABLE `store_settings` ADD `auto_print` boolean DEFAULT true NOT NULL;