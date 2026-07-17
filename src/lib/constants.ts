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
  { value: "cash", label: "Tunai" },
  { value: "card", label: "Kartu" },
  { value: "qris", label: "QRIS" },
  { value: "transfer", label: "Transfer Bank" },
] as const

export const ORDER_STATUSES = [
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
  { value: "refunded", label: "Dikembalikan" },
] as const

export const ITEMS_PER_PAGE = 10

export const SIDEBAR_NAV = [
  { href: "/pos", label: "POS", icon: "ShoppingCart" },
  { href: "/products", label: "Produk", icon: "Package" },
  { href: "/categories", label: "Kategori", icon: "FolderTree" },
  { href: "/customers", label: "Pelanggan", icon: "Users" },
  { href: "/orders", label: "Pesanan", icon: "FileText" },
  { href: "/reports", label: "Laporan", icon: "BarChart3" },
  { href: "/register", label: "Kasir", icon: "CashRegister" },
  { href: "/settings", label: "Pengaturan", icon: "Settings" },
] as const
