import "dotenv/config"
import mysql from "mysql2/promise"

const conn = await mysql.createConnection(process.env.DATABASE_URL)
try {
  await conn.execute("ALTER TABLE store_settings ADD COLUMN store_email VARCHAR(255) DEFAULT NULL")
  console.log("store_email column added")
} catch {
  console.log("store_email column already exists")
}
await conn.end()
