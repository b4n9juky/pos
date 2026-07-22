ALTER TABLE `store_settings` ADD `membership_enabled` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `store_settings` ADD `membership_threshold` int DEFAULT 50000 NOT NULL;--> statement-breakpoint
ALTER TABLE `store_settings` ADD `points_per_amount` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `store_settings` ADD `points_per_unit` int DEFAULT 1000 NOT NULL;