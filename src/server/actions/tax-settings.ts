"use server"

import { db } from "@/db"
import { taxSettings } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/lib/auth"

const taxSettingSchema = z.object({
  name: z.string().min(1).max(255),
  rate: z.number().int().min(0).max(100),
  type: z.enum(["percentage", "fixed"]),
  isDefault: z.boolean(),
  active: z.boolean(),
})

export async function getTaxSettings() {
  return db.select().from(taxSettings).orderBy(taxSettings.id)
}

export async function getDefaultTaxRate() {
  const setting = await db
    .select()
    .from(taxSettings)
    .where(and(eq(taxSettings.isDefault, true), eq(taxSettings.active, true)))
    .limit(1)
    .then((r) => r[0] || null)

  return { rate: setting?.rate ?? 10, name: setting?.name ?? "PPN", id: setting?.id ?? null }
}

export async function upsertTaxSetting(data: z.infer<typeof taxSettingSchema>) {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") throw new Error("Unauthorized")
  const parsed = taxSettingSchema.parse(data)

  if (parsed.isDefault) {
    await db.update(taxSettings).set({ isDefault: false }).where(eq(taxSettings.isDefault, true))
  }

  const existing = await db.select({ id: taxSettings.id }).from(taxSettings).limit(1).then((r) => r[0])

  if (existing) {
    await db.update(taxSettings).set(parsed).where(eq(taxSettings.id, existing.id))
  } else {
    await db.insert(taxSettings).values(parsed)
  }

  revalidatePath("/settings")
}

export async function deleteTaxSetting(id: number) {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") throw new Error("Unauthorized")
  await db.update(taxSettings).set({ active: false }).where(eq(taxSettings.id, id))
  revalidatePath("/settings")
}
