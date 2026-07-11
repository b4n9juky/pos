CREATE TABLE `store_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`store_name` varchar(255) NOT NULL DEFAULT 'My Store',
	`store_address` text,
	`store_phone` varchar(50),
	`store_email` varchar(255),
	`tax_rate` int NOT NULL DEFAULT 10,
	`currency` varchar(10) NOT NULL DEFAULT 'IDR',
	`receipt_footer` text,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `store_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tax_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL DEFAULT 'PPN',
	`rate` int NOT NULL DEFAULT 10,
	`type` varchar(50) NOT NULL DEFAULT 'percentage',
	`is_default` boolean NOT NULL DEFAULT true,
	`active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tax_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cash_registers` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `categories` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `order_items` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `taxable` boolean DEFAULT true NOT NULL;