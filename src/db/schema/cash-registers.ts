import { mysqlTable, int, decimal, varchar, text, timestamp, index } from "drizzle-orm/mysql-core"
import { users } from "./users"

export const cashRegisters = mysqlTable("cash_registers", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").references(() => users.id).notNull(),
  openedAt: timestamp("opened_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
  openingBalance: decimal("opening_balance", { precision: 12, scale: 0 }).notNull(),
  closingBalance: decimal("closing_balance", { precision: 12, scale: 0 }),
  expectedBalance: decimal("expected_balance", { precision: 12, scale: 0 }),
  status: varchar("status", { length: 20 }).notNull().default("open"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("user_register_idx").on(table.userId),
  index("status_idx").on(table.status),
])
