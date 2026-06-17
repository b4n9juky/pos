"use server"

import { db } from "@/db"
import { cashRegisters } from "@/db/schema"
import { eq, and, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getRegisters() {
  return db.select().from(cashRegisters).orderBy(cashRegisters.openedAt)
}

export async function getActiveRegister() {
  return db
    .select()
    .from(cashRegisters)
    .where(and(eq(cashRegisters.status, "open"), isNull(cashRegisters.closedAt)))
    .then((r) => r[0] || null)
}

export async function openRegister(userId: number, openingBalance: number) {
  await db.insert(cashRegisters).values({
    userId,
    openingBalance: String(openingBalance),
    status: "open",
  })
  revalidatePath("/register")
}

export async function closeRegister(id: number, closingBalance: number) {
  await db
    .update(cashRegisters)
    .set({
      closingBalance: String(closingBalance),
      closedAt: new Date(),
      status: "closed",
    })
    .where(eq(cashRegisters.id, id))
  revalidatePath("/register")
}
