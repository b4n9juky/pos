import { mysqlTable, int, varchar, boolean, timestamp } from "drizzle-orm/mysql-core"

export const printerSettings = mysqlTable("printer_settings", {
  id: int("id").primaryKey().autoincrement(),
  printerName: varchar("printer_name", { length: 255 }),
  connectionType: varchar("connection_type", { length: 20 }).notNull().default("usb"),
  paperWidth: int("paper_width").notNull().default(58),
  autoCut: boolean("auto_cut").notNull().default(true),
  enabled: boolean("enabled").notNull().default(false),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
})
