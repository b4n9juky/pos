import mysql from "mysql2/promise"
import { compare } from "bcryptjs"

const url = process.env.DATABASE_URL || "mysql://root:Masterwong**123@db:3306/pos_rahmat"
const conn = await mysql.createConnection(url)

const [rows] = await conn.execute("SELECT id, name, email, password_hash, role FROM users")
if (rows.length === 0) {
  console.log("❌ No users in database — seed belum pernah jalan")
} else {
  console.log(`✅ ${rows.length} users found`)
  for (const row of rows) {
    const isValid = await compare("password", row.password_hash)
    console.log(`  ${row.email} role=${row.role} password_match=${isValid}`)
  }
}
await conn.end()
