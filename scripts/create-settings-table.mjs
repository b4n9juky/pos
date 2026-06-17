import "dotenv/config"
import mysql from "mysql2/promise"

const conn = await mysql.createConnection(process.env.DATABASE_URL)
await conn.execute(`
  CREATE TABLE IF NOT EXISTS store_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_name VARCHAR(255) NOT NULL DEFAULT 'My Store',
    store_address TEXT,
    store_phone VARCHAR(50),
    tax_rate INT NOT NULL DEFAULT 10,
    currency VARCHAR(10) NOT NULL DEFAULT 'IDR',
    receipt_footer TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`)
console.log("store_settings table created")
await conn.end()
