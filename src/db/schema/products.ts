import { mysqlTable, varchar, text, decimal, int, timestamp, boolean, index, uniqueIndex } from "drizzle-orm/mysql-core"
import { categories } from "./categories"

export const products = mysqlTable("products", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  barcode: varchar("barcode", { length: 100 }),
  description: text("description"),
  price: decimal("price", { precision: 12, scale: 0 }).notNull(),
  costPrice: decimal("cost_price", { precision: 12, scale: 0 }),
  stock: int("stock").notNull().default(0),
  minStock: int("min_stock").notNull().default(5),
  categoryId: int("category_id").references(() => categories.id, { onDelete: "set null" }),
  image: varchar("image", { length: 500 }),
  taxable: boolean("taxable").notNull().default(true),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }),
  active: boolean("active").notNull().default(true),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("sku_idx").on(table.sku),
  uniqueIndex("barcode_idx").on(table.barcode),
  index("category_idx").on(table.categoryId),
])
