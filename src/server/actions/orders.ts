"use server"

import { db } from "@/db"
import { orders, orderItems, products, customers, users } from "@/db/schema"
import { eq, desc, like, or, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { randomInt } from "node:crypto"

const orderItemSchema = z.object({
  productId: z.number(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  subtotal: z.number().min(0),
})

const createOrderSchema = z.object({
  customerId: z.number().nullable(),
  userId: z.number(),
  subtotal: z.number().min(0),
  tax: z.number().min(0),
  discount: z.number().min(0),
  total: z.number().min(0),
  paymentMethod: z.string(),
  items: z.array(orderItemSchema),
})

function getOrdersBaseQuery() {
  return db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerId: orders.customerId,
      customerName: customers.name,
      userId: orders.userId,
      userName: users.name,
      subtotal: orders.subtotal,
      tax: orders.tax,
      discount: orders.discount,
      total: orders.total,
      paymentMethod: orders.paymentMethod,
      paymentStatus: orders.paymentStatus,
      status: orders.status,
      notes: orders.notes,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(users, eq(orders.userId, users.id))
}

export async function getOrders(search?: string, limit = 50, offset = 0) {
  const base = getOrdersBaseQuery().orderBy(desc(orders.createdAt))
  if (search) {
    const q = `%${search}%`
    return base
      .where(or(like(orders.orderNumber, q), like(customers.name, q)))
      .limit(limit)
      .offset(offset)
  }
  return base.limit(limit).offset(offset)
}

export async function getOrder(id: number) {
  const order = await getOrdersBaseQuery()
    .where(eq(orders.id, id))
    .then((r) => r[0])

  if (!order) return null

  const items = await db
    .select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      productId: orderItems.productId,
      productName: products.name,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      subtotal: orderItems.subtotal,
      taxable: products.taxable,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, id))

  return { ...order, items }
}

export async function createOrder(data: z.infer<typeof createOrderSchema>) {
  const parsed = createOrderSchema.parse(data)
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "")
  const random = String(randomInt(0, 999999)).padStart(6, "0")
  const orderNumber = `INV-${dateStr}-${random}`

  const result = await db.insert(orders).values({
    orderNumber,
    customerId: parsed.customerId,
    userId: parsed.userId,
    subtotal: String(parsed.subtotal),
    tax: String(parsed.tax),
    discount: String(parsed.discount),
    total: String(parsed.total),
    paymentMethod: parsed.paymentMethod,
    paymentStatus: "paid",
    status: "completed",
  })

  const orderId = Number(result[0].insertId)

  await db.insert(orderItems).values(
    parsed.items.map((item) => ({
      orderId,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: String(item.unitPrice),
      subtotal: String(item.subtotal),
    }))
  )

  await Promise.all(
    parsed.items.map((item) =>
      db
        .update(products)
        .set({ stock: sql`stock - ${item.quantity}` })
        .where(eq(products.id, item.productId))
    )
  )

  revalidatePath("/orders")
  revalidatePath("/products")
  revalidatePath("/reports")
  return { orderNumber }
}
