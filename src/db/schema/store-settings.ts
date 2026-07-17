import { mysqlTable, int, varchar, text, timestamp, boolean } from "drizzle-orm/mysql-core"

export const storeSettings = mysqlTable("store_settings", {
  id: int("id").primaryKey().autoincrement(),
  storeName: varchar("store_name", { length: 255 }).notNull().default("My Store"),
  storeAddress: text("store_address"),
  storePhone: varchar("store_phone", { length: 50 }),
  storeEmail: varchar("store_email", { length: 255 }),
  taxRate: int("tax_rate").notNull().default(10),
  currency: varchar("currency", { length: 10 }).notNull().default("IDR"),
  receiptFooter: text("receipt_footer"),
  autoPrint: boolean("auto_print").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
})
