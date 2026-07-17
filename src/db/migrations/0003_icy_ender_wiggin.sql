CREATE TABLE `held_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`reference` varchar(20) NOT NULL,
	`customer_id` int,
	`discount` decimal(12,0) NOT NULL DEFAULT '0',
	`items` json NOT NULL,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `held_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `held_transactions` ADD CONSTRAINT `held_transactions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `held_transactions` ADD CONSTRAINT `held_transactions_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `hold_user_idx` ON `held_transactions` (`user_id`);--> statement-breakpoint
CREATE INDEX `hold_created_idx` ON `held_transactions` (`created_at`);