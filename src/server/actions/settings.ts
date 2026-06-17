"use server"

import { db } from "@/db"
import { storeSettings } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const settingsSchema = z.object({
  storeName: z.string().min(1).max(255),
  storeAddress: z.string().nullable(),
  storePhone: z.string().max(50).nullable(),
  storeEmail: z.string().email().max(255).nullable(),
  taxRate: z.number().min(0).max(100),
  currency: z.string().max(10),
  receiptFooter: z.string().nullable(),
})

export async function getSettings() {
  const rows = await db.select().from(storeSettings).limit(1)
  return rows[0] || null
}

export async function upsertSettings(data: z.infer<typeof settingsSchema>) {
  const parsed = settingsSchema.parse(data)
  const existing = await db.select({ id: storeSettings.id }).from(storeSettings).limit(1).then((r) => r[0])

  if (existing) {
    await db.update(storeSettings).set(parsed).where(eq(storeSettings.id, existing.id))
  } else {
    await db.insert(storeSettings).values(parsed)
  }

  revalidatePath("/settings")
}
