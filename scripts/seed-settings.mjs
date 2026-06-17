import "dotenv/config"
import mysql from "mysql2/promise"

const conn = await mysql.createConnection(process.env.DATABASE_URL)
const [existing] = await conn.execute("SELECT id FROM store_settings LIMIT 1")
if (existing.length === 0) {
  await conn.execute(
    "INSERT INTO store_settings (store_name, store_address, store_phone, tax_rate, currency, receipt_footer) VALUES (?, ?, ?, ?, ?, ?)",
    ["Toko Maju Jaya", "Jl. Example No. 123, Jakarta", "021-12345678", 10, "IDR", "Terima kasih telah berbelanja!"]
  )
  console.log("Default settings seeded")
} else {
  console.log("Settings already exist, skipping")
}
await conn.end()
