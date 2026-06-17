export const APP_NAME = "POS"
export const APP_NAME_FULL = "Point of Sales"

export const CURRENCY = "IDR"
export const LOCALE = "id-ID"

export const ORDER_PREFIX = "INV"

export const ROLES = {
  ADMIN: "admin" as const,
  CASHIER: "cashier" as const,
}

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "qris", label: "QRIS" },
  { value: "transfer", label: "Bank Transfer" },
] as const

export const ORDER_STATUSES = [
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
] as const

export const ITEMS_PER_PAGE = 10

export const SIDEBAR_NAV = [
  { href: "/pos", label: "POS", icon: "ShoppingCart" },
  { href: "/products", label: "Products", icon: "Package" },
  { href: "/categories", label: "Categories", icon: "FolderTree" },
  { href: "/customers", label: "Customers", icon: "Users" },
  { href: "/orders", label: "Orders", icon: "FileText" },
  { href: "/reports", label: "Reports", icon: "BarChart3" },
  { href: "/register", label: "Register", icon: "CashRegister" },
  { href: "/settings", label: "Settings", icon: "Settings" },
] as const
