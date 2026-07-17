"use server"

import { db } from "@/db"
import { printerSettings } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/lib/auth"

const printerSettingsSchema = z.object({
  printerName: z.string().nullable(),
  connectionType: z.string().max(20).default("usb"),
  paperWidth: z.number().min(1).max(100).default(58),
  autoCut: z.boolean().default(true),
  enabled: z.boolean().default(false),
})

export async function getPrinterSettings() {
  const rows = await db.select().from(printerSettings).limit(1)
  return rows[0] || null
}

export async function upsertPrinterSettings(data: z.infer<typeof printerSettingsSchema>) {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") throw new Error("Unauthorized")

  const parsed = printerSettingsSchema.parse(data)
  const existing = await db.select({ id: printerSettings.id }).from(printerSettings).limit(1).then((r) => r[0])

  if (existing) {
    await db.update(printerSettings).set(parsed).where(eq(printerSettings.id, existing.id))
  } else {
    await db.insert(printerSettings).values(parsed)
  }

  revalidatePath("/settings")
}
