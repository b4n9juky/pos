import { mysqlTable, int, varchar, boolean, timestamp } from "drizzle-orm/mysql-core"

export const taxSettings = mysqlTable("tax_settings", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull().default("PPN"),
  rate: int("rate").notNull().default(10),
  type: varchar("type", { length: 50 }).notNull().default("percentage"),
  isDefault: boolean("is_default").notNull().default(true),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
})
