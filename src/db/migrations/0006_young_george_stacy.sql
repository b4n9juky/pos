DROP INDEX `barcode_idx` ON `products`;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `barcode_idx` UNIQUE(`barcode`);