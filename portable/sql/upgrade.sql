CREATE TABLE IF NOT EXISTS `held_transactions` (
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

SELECT COUNT(*) INTO @fk_exists FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'held_transactions'
  AND CONSTRAINT_NAME = 'held_transactions_user_id_users_id_fk' AND CONSTRAINT_TYPE = 'FOREIGN KEY';
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE `held_transactions` ADD CONSTRAINT `held_transactions_user_id_users_id_fk`
   FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @fk_exists FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'held_transactions'
  AND CONSTRAINT_NAME = 'held_transactions_customer_id_customers_id_fk' AND CONSTRAINT_TYPE = 'FOREIGN KEY';
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE `held_transactions` ADD CONSTRAINT `held_transactions_customer_id_customers_id_fk`
   FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE INDEX IF NOT EXISTS `hold_user_idx` ON `held_transactions` (`user_id`);
CREATE INDEX IF NOT EXISTS `hold_created_idx` ON `held_transactions` (`created_at`);

-- Migration 0004: store_settings columns
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'store_settings' AND COLUMN_NAME = 'membership_enabled';
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `store_settings` ADD `membership_enabled` boolean DEFAULT true NOT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'store_settings' AND COLUMN_NAME = 'membership_threshold';
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `store_settings` ADD `membership_threshold` int DEFAULT 50000 NOT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'store_settings' AND COLUMN_NAME = 'points_per_amount';
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `store_settings` ADD `points_per_amount` int DEFAULT 1 NOT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'store_settings' AND COLUMN_NAME = 'points_per_unit';
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `store_settings` ADD `points_per_unit` int DEFAULT 1000 NOT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Migration 0005: soft delete columns
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'deleted_at';
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `order_items` ADD `deleted_at` timestamp',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'deleted_at';
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `orders` ADD `deleted_at` timestamp',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'deleted_at';
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `products` ADD `deleted_at` timestamp',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Migration 0006: barcode unique constraint
SELECT COUNT(*) INTO @idx_exists FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND INDEX_NAME = 'barcode_idx';
SET @sql = IF(@idx_exists > 0,
  'DROP INDEX `barcode_idx` ON `products`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @con_exists FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'products'
  AND CONSTRAINT_NAME = 'barcode_idx' AND CONSTRAINT_TYPE = 'UNIQUE';
SET @sql = IF(@con_exists = 0,
  'ALTER TABLE `products` ADD CONSTRAINT `barcode_idx` UNIQUE(`barcode`)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
