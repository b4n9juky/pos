import "dotenv/config"
import mysql from "mysql2/promise"

const conn = await mysql.createConnection(process.env.DATABASE_URL)
await conn.execute(`
  CREATE TABLE IF NOT EXISTS tax_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL DEFAULT 'PPN',
    rate INT NOT NULL DEFAULT 10,
    type VARCHAR(50) NOT NULL DEFAULT 'percentage',
    is_default TINYINT(1) NOT NULL DEFAULT 1,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`)
console.log("tax_settings table created")

const [existing] = await conn.execute("SELECT id FROM tax_settings LIMIT 1")
if (existing.length === 0) {
  await conn.execute(
    "INSERT INTO tax_settings (name, rate, type, is_default, active) VALUES (?, ?, ?, ?, ?)",
    ["PPN", 10, "percentage", true, true]
  )
  console.log("Default tax setting seeded")
} else {
  console.log("Tax settings already exist, skipping")
}

await conn.end()
