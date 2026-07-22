import { mysqlTable, int, decimal, timestamp, index } from "drizzle-orm/mysql-core"
import { orders } from "./orders"
import { products } from "./products"

export const orderItems = mysqlTable("order_items", {
  id: int("id").primaryKey().autoincrement(),
  orderId: int("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  productId: int("product_id").references(() => products.id).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 0 }).notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 0 }).notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("order_idx").on(table.orderId),
  index("product_idx").on(table.productId),
])
