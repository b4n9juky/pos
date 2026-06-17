"use server"

import { db } from "@/db"
import { orders, orderItems, products, customers, users } from "@/db/schema"
import { eq, sql, desc } from "drizzle-orm"

export async function getSalesSummary() {
  const totalSales = await db
    .select({ total: sql<number>`COALESCE(SUM(${orders.total}), 0)` })
    .from(orders)
    .where(eq(orders.status, "completed"))
    .then((r) => Number(r[0].total))

  const totalOrders = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(orders)
    .where(eq(orders.status, "completed"))
    .then((r) => Number(r[0].count))

  const totalProductsSold = await db
    .select({ total: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)` })
    .from(orderItems)
    .then((r) => Number(r[0].total))

  const totalCustomers = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(customers)
    .then((r) => Number(r[0].count))

  const dailySales = await db
    .select({
      date: sql<string>`DATE(${orders.createdAt})`,
      total: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
    })
    .from(orders)
    .where(eq(orders.status, "completed"))
    .groupBy(sql`DATE(${orders.createdAt})`)
    .orderBy(desc(sql`DATE(${orders.createdAt})`))
    .then((r) => r.map((d) => ({ date: d.date, total: Number(d.total) })))

  const topProducts = await db
    .select({
      name: products.name,
      quantity: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`,
      revenue: sql<number>`COALESCE(SUM(${orderItems.subtotal}), 0)`,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .groupBy(orderItems.productId)
    .orderBy(desc(sql`COALESCE(SUM(${orderItems.quantity}), 0)`))
    .limit(5)
    .then((r) => r.map((p) => ({ name: p.name, quantity: Number(p.quantity), revenue: Number(p.revenue) })))

  const recentOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerName: customers.name,
      userName: users.name,
      total: orders.total,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt))
    .limit(5)
    .then((r) =>
      r.map((o) => ({
        id: o.id,
        order_number: o.orderNumber,
        customer_name: o.customerName || "Walk-in",
        user_name: o.userName,
        total: Number(o.total),
        created_at: o.createdAt,
      }))
    )

  return {
    total_sales: totalSales,
    total_orders: totalOrders,
    total_products_sold: totalProductsSold,
    total_customers: totalCustomers,
    daily_sales: dailySales,
    top_products: topProducts,
    recent_orders: recentOrders,
  }
}
