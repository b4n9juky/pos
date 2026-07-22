ALTER TABLE `order_items` ADD `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `products` ADD `deleted_at` timestamp;