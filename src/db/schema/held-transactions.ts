import { mysqlTable, varchar, int, decimal, json, text, timestamp, index } from "drizzle-orm/mysql-core"
import { users } from "./users"
import { customers } from "./customers"

export const heldTransactions = mysqlTable("held_transactions", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").references(() => users.id).notNull(),
  reference: varchar("reference", { length: 20 }).notNull(),
  customerId: int("customer_id").references(() => customers.id, { onDelete: "set null" }),
  discount: decimal("discount", { precision: 12, scale: 0 }).notNull().default("0"),
  items: json("items").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("hold_user_idx").on(table.userId),
  index("hold_created_idx").on(table.createdAt),
])
