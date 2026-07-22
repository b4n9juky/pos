import { migrate } from "drizzle-orm/mysql2/migrator"
import { drizzle } from "drizzle-orm/mysql2"
import mysql from "mysql2/promise"

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) {
  console.error("DATABASE_URL is required")
  process.exit(1)
}

let retries = 30
while (retries > 0) {
  try {
    const connection = await mysql.createConnection(dbUrl)
    const db = drizzle(connection, { mode: "default" })

    await migrate(db, { migrationsFolder: "./src/db/migrations" })
    console.log("Migrations complete")
    await connection.end()
    process.exit(0)
  } catch (err) {
    retries--
    if (retries === 0) {
      console.error("Migration failed after retries:", err)
      process.exit(1)
    }
    console.log(`DB not ready yet, retrying... (${retries} left)`)
    await new Promise((r) => setTimeout(r, 2000))
  }
}
