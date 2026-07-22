"use server"

import { db } from "@/db"
import { orders, orderItems, products, customers, users } from "@/db/schema"
import { eq, and, sql, desc, isNull, gte, lte } from "drizzle-orm"

export interface DashboardData {
  currentPeriod: {
    totalSales: number
    orderCount: number
    avgOrderValue: number
    itemsSold: number
  }
  previousPeriod: {
    totalSales: number
    orderCount: number
  }
  salesOverTime: Array<{ date: string; total: number; count: number }>
  hourlySales: Array<{ hour: number; total: number; count: number }>
  topProducts: Array<{ name: string; quantity: number; revenue: number }>
  paymentMethods: Array<{ method: string; total: number; count: number }>
  recentOrders: Array<{
    id: number
    orderNumber: string
    customerName: string
    userName: string
    total: number
    paymentMethod: string
    createdAt: Date
  }>
  lowStockProducts: Array<{
    id: number
    name: string
    stock: number
    minStock: number
    price: number
  }>
}

export async function getDashboardData(from?: string, to?: string): Promise<DashboardData> {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 86400000 - 1)

  const fromDate = from ? new Date(from) : todayStart
  const toDate = to ? new Date(to + "T23:59:59") : todayEnd

  const periodMs = toDate.getTime() - fromDate.getTime()
  const prevFromDate = new Date(fromDate.getTime() - periodMs - 1)
  const prevToDate = new Date(fromDate.getTime() - 1)

  const completedFilter = and(eq(orders.status, "completed"), isNull(orders.deletedAt))
  const dateFilter = and(gte(orders.createdAt, fromDate), lte(orders.createdAt, toDate))
  const prevDateFilter = and(gte(orders.createdAt, prevFromDate), lte(orders.createdAt, prevToDate))

  const [currentKPI, previousKPI, itemsSoldResult, salesOverTime, hourlySales, topProducts, paymentMethods, recentOrders, lowStockProducts] =
    await Promise.all([
      db
        .select({
          totalSales: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
          orderCount: sql<number>`COUNT(*)`,
          avgOrderValue: sql<number>`COALESCE(AVG(${orders.total}), 0)`,
        })
        .from(orders)
        .where(and(completedFilter, dateFilter))
        .then((r) => r[0]),

      db
        .select({
          totalSales: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
          orderCount: sql<number>`COUNT(*)`,
        })
        .from(orders)
        .where(and(completedFilter, prevDateFilter))
        .then((r) => r[0]),

      db
        .select({ total: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)` })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(and(eq(orders.status, "completed"), isNull(orderItems.deletedAt), dateFilter))
        .then((r) => Number(r[0].total)),

      db
        .select({
          date: sql<string>`DATE(${orders.createdAt})`,
          total: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(orders)
        .where(and(completedFilter, dateFilter))
        .groupBy(sql`DATE(${orders.createdAt})`)
        .orderBy(sql`DATE(${orders.createdAt})`)
        .then((r) => r.map((d) => ({ date: d.date, total: Number(d.total), count: Number(d.count) }))),

      db
        .select({
          hour: sql<number>`HOUR(${orders.createdAt})`,
          total: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(orders)
        .where(and(completedFilter, dateFilter))
        .groupBy(sql`HOUR(${orders.createdAt})`)
        .orderBy(sql`HOUR(${orders.createdAt})`)
        .then((r) => r.map((d) => ({ hour: Number(d.hour), total: Number(d.total), count: Number(d.count) }))),

      db
        .select({
          name: products.name,
          quantity: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`,
          revenue: sql<number>`COALESCE(SUM(${orderItems.subtotal}), 0)`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(and(eq(orders.status, "completed"), isNull(orderItems.deletedAt), dateFilter))
        .groupBy(orderItems.productId)
        .orderBy(desc(sql`COALESCE(SUM(${orderItems.quantity}), 0)`))
        .limit(5)
        .then((r) => r.map((p) => ({ name: p.name ?? "Unknown", quantity: Number(p.quantity), revenue: Number(p.revenue) }))),

      db
        .select({
          method: orders.paymentMethod,
          total: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(orders)
        .where(and(completedFilter, dateFilter))
        .groupBy(orders.paymentMethod)
        .then((r) => r.map((m) => ({ method: m.method, total: Number(m.total), count: Number(m.count) }))),

      db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          customerName: customers.name,
          userName: users.name,
          total: orders.total,
          paymentMethod: orders.paymentMethod,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .leftJoin(customers, eq(orders.customerId, customers.id))
        .leftJoin(users, eq(orders.userId, users.id))
        .where(and(completedFilter, dateFilter))
        .orderBy(desc(orders.createdAt))
        .limit(10)
        .then((r) =>
          r.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            customerName: o.customerName ?? "Walk-in",
            userName: o.userName ?? "",
            total: Number(o.total),
            paymentMethod: o.paymentMethod,
            createdAt: o.createdAt,
          }))
        ),

      db
        .select({
          id: products.id,
          name: products.name,
          stock: products.stock,
          minStock: products.minStock,
          price: products.price,
        })
        .from(products)
        .where(
          and(
            sql`${products.stock} <= ${products.minStock}`,
            eq(products.active, true),
            isNull(products.deletedAt)
          )
        )
        .orderBy(sql`${products.stock} - ${products.minStock}`)
        .limit(5)
        .then((r) =>
          r.map((p) => ({
            id: p.id,
            name: p.name,
            stock: p.stock,
            minStock: p.minStock,
            price: Number(p.price),
          }))
        ),
    ])

  return {
    currentPeriod: {
      totalSales: Number(currentKPI.totalSales),
      orderCount: Number(currentKPI.orderCount),
      avgOrderValue: Number(currentKPI.avgOrderValue),
      itemsSold: itemsSoldResult,
    },
    previousPeriod: {
      totalSales: Number(previousKPI.totalSales),
      orderCount: Number(previousKPI.orderCount),
    },
    salesOverTime,
    hourlySales,
    topProducts,
    paymentMethods,
    recentOrders,
    lowStockProducts,
  }
}
