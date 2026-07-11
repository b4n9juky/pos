export interface User {
  id: number
  name: string
  email: string
  role: "admin" | "cashier"
  active: boolean
  image?: string
}

export interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  product_count?: number
  created_at: string
}

export interface Product {
  id: number
  name: string
  sku: string
  barcode: string | null
  description: string | null
  price: number
  cost_price: number | null
  stock: number
  min_stock: number
  category_id: number | null
  category_name?: string
  image: string | null
  taxable: boolean
  taxRate?: number | null
  active: boolean
  created_at: string
}

export interface Customer {
  id: number
  name: string
  email: string | null
  phone: string | null
  address: string | null
  loyalty_points: number
  created_at: string
}

export type OrderStatus = "completed" | "cancelled" | "refunded"
export type PaymentMethod = "cash" | "card" | "qris" | "transfer"
export type PaymentStatus = "paid" | "pending" | "refunded"
export type RegisterStatus = "open" | "closed"

export interface Order {
  id: number
  order_number: string
  customer_id: number | null
  customer_name: string | null
  user_id: number
  user_name: string
  subtotal: number
  tax: number
  discount: number
  total: number
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  status: OrderStatus
  notes: string | null
  items: OrderItem[]
  created_at: string
}

export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface CashRegister {
  id: number
  user_id: number
  user_name: string
  opened_at: string
  closed_at: string | null
  opening_balance: number
  closing_balance: number | null
  expected_balance: number | null
  status: RegisterStatus
  notes: string | null
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface SalesSummary {
  total_sales: number
  total_orders: number
  total_products_sold: number
  total_customers: number
  daily_sales: { date: string; total: number }[]
  top_products: { name: string; quantity: number; revenue: number }[]
}
