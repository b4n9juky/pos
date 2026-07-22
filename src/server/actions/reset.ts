"use server"

import { db } from "@/db"
import { products, orders, orderItems } from "@/db/schema"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

export async function resetProductsAndOrders() {
  const session = await auth()
  if (session?.user?.role !== "admin") throw new Error("Unauthorized")

  const now = new Date()

  await db.update(orderItems).set({ deletedAt: now })
  await db.update(orders).set({ deletedAt: now })
  await db.update(products).set({ deletedAt: now })

  revalidatePath("/products")
  revalidatePath("/orders")
  revalidatePath("/reports")
  revalidatePath("/pos")
}
