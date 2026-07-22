import { mysqlTable, varchar, int, decimal, text, timestamp, index, boolean } from "drizzle-orm/mysql-core"
import { users } from "./users"
import { customers } from "./customers"

export const orders = mysqlTable("orders", {
  id: int("id").primaryKey().autoincrement(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  customerId: int("customer_id").references(() => customers.id, { onDelete: "set null" }),
  userId: int("user_id").references(() => users.id).notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 0 }).notNull(),
  tax: decimal("tax", { precision: 12, scale: 0 }).notNull(),
  discount: decimal("discount", { precision: 12, scale: 0 }).notNull().default("0"),
  total: decimal("total", { precision: 12, scale: 0 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 20 }).notNull(),
  paymentStatus: varchar("payment_status", { length: 20 }).notNull().default("paid"),
  status: varchar("status", { length: 20 }).notNull().default("completed"),
  notes: text("notes"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("order_number_idx").on(table.orderNumber),
  index("customer_idx").on(table.customerId),
  index("user_idx").on(table.userId),
  index("created_at_idx").on(table.createdAt),
])
