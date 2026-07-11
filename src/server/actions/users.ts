"use server"

import { db } from "@/db"
import { users } from "@/db/schema"
import { eq, count, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { hash } from "bcryptjs"
import { z } from "zod"
import { auth } from "@/lib/auth"

const createUserSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  password: z.string().min(6).max(255),
  role: z.enum(["admin", "cashier"]),
})

const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().max(255).optional(),
  password: z.string().min(6).max(255).optional(),
  role: z.enum(["admin", "cashier"]).optional(),
  active: z.boolean().optional(),
})

export async function getUsers() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
      image: users.image,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(users.id)
}

export async function getUser(id: number) {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
      image: users.image,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .then((r) => r[0] || null)
}

export async function createUser(data: z.infer<typeof createUserSchema>) {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") throw new Error("Unauthorized")
  const parsed = createUserSchema.parse(data)
  const passwordHash = await hash(parsed.password, 10)
  await db.insert(users).values({
    name: parsed.name,
    email: parsed.email,
    passwordHash,
    role: parsed.role,
    active: true,
  })
  revalidatePath("/settings")
}

export async function updateUser(id: number, data: z.infer<typeof updateUserSchema>) {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") throw new Error("Unauthorized")
  const parsed = updateUserSchema.parse(data)
  const updateData: Record<string, any> = {}
  if (parsed.name !== undefined) updateData.name = parsed.name
  if (parsed.email !== undefined) updateData.email = parsed.email
  if (parsed.role !== undefined) updateData.role = parsed.role
  if (parsed.active !== undefined) updateData.active = parsed.active
  if (parsed.password) {
    updateData.passwordHash = await hash(parsed.password, 10)
  }
  if (Object.keys(updateData).length > 0) {
    await db.update(users).set(updateData).where(eq(users.id, id))
  }
  revalidatePath("/settings")
}

export async function toggleUserActive(id: number) {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") throw new Error("Unauthorized")
  const user = await db.select().from(users).where(eq(users.id, id)).then((r) => r[0])
  if (!user) throw new Error("User not found")

  if (user.active && user.role === "admin") {
    const [{ count: adminCount }] = await db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.role, "admin"), eq(users.active, true)))
    if (adminCount <= 1) {
      throw new Error("Cannot deactivate the last admin user")
    }
  }

  await db.update(users).set({ active: !user.active }).where(eq(users.id, id))
  revalidatePath("/settings")
}
