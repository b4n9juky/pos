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

export type DatePreset = "today" | "yesterday" | "7d" | "30d" | "custom"

export interface DateRange {
  from: string
  to: string
  label: string
}
