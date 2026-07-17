"use server"

import { db } from "@/db"
import { categories } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/lib/auth"

const categorySchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().nullable(),
})

export async function getCategories() {
  return db.select().from(categories)
}

export async function getCategory(id: number) {
  return db.select().from(categories).where(eq(categories.id, id)).then((r) => r[0])
}

export async function createCategory(data: z.infer<typeof categorySchema>) {
  const session = await auth()
  if (session?.user?.role !== "admin") throw new Error("Unauthorized")
  const parsed = categorySchema.parse(data)
  await db.insert(categories).values(parsed)
  revalidatePath("/categories")
}

export async function updateCategory(id: number, data: z.infer<typeof categorySchema>) {
  const session = await auth()
  if (session?.user?.role !== "admin") throw new Error("Unauthorized")
  const parsed = categorySchema.parse(data)
  await db.update(categories).set(parsed).where(eq(categories.id, id))
  revalidatePath("/categories")
}

export async function deleteCategory(id: number) {
  const session = await auth()
  if (session?.user?.role !== "admin") throw new Error("Unauthorized")
  await db.delete(categories).where(eq(categories.id, id))
  revalidatePath("/categories")
}
