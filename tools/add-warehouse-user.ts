import "dotenv/config"
import { db } from "../src/db/index"
import { users } from "../src/db/schema/index"
import { eq } from "drizzle-orm"
import { hash } from "bcryptjs"

async function main() {
  const existing = await db.select().from(users).where(eq(users.email, "gudang@pos.com"))
  if (existing.length > 0) {
    console.log("Warehouse user already exists")
    return
  }
  const passwordHash = await hash("password", 10)
  await db.insert(users).values({
    name: "Staff Gudang",
    email: "gudang@pos.com",
    passwordHash,
    role: "warehouse",
    active: true,
  })
  console.log("Warehouse user created: gudang@pos.com / password")
}

main().catch(console.error)
