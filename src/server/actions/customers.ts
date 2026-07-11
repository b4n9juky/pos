"use server"

import { db } from "@/db"
import { customers } from "@/db/schema"
import { eq, like, or } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const customerSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255).nullable(),
  phone: z.string().max(50).nullable(),
  address: z.string().nullable(),
})

export async function getCustomers(search?: string, limit = 50, offset = 0) {
  const base = db.select().from(customers)
  if (search) {
    const q = `%${search}%`
    return base.where(
      or(
        like(customers.name, q),
        like(customers.email, q),
        like(customers.phone, q)
      )
    ).limit(limit).offset(offset)
  }
  return base.limit(limit).offset(offset)
}

export async function getCustomer(id: number) {
  return db.select().from(customers).where(eq(customers.id, id)).then((r) => r[0])
}

export async function createCustomer(data: z.infer<typeof customerSchema>) {
  const parsed = customerSchema.parse(data)
  await db.insert(customers).values(parsed)
  revalidatePath("/customers")
}

export async function updateCustomer(id: number, data: z.infer<typeof customerSchema>) {
  const parsed = customerSchema.parse(data)
  await db.update(customers).set(parsed).where(eq(customers.id, id))
  revalidatePath("/customers")
}
