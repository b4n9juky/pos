import type { Product, Category, Customer, Order, CashRegister, SalesSummary, User } from "@/types"

export const mockUsers: User[] = [
  { id: 1, name: "Admin User", email: "admin@pos.com", role: "admin", active: true },
  { id: 2, name: "Cashier One", email: "cashier@pos.com", role: "cashier", active: true },
]

export const mockCategories: Category[] = [
  { id: 1, name: "Food & Beverages", slug: "food-beverages", description: "All food and drink items", product_count: 8, created_at: "2025-01-01T00:00:00Z" },
  { id: 2, name: "Electronics", slug: "electronics", description: "Electronic devices and accessories", product_count: 5, created_at: "2025-01-01T00:00:00Z" },
  { id: 3, name: "Clothing", slug: "clothing", description: "Apparel and fashion items", product_count: 4, created_at: "2025-01-01T00:00:00Z" },
  { id: 4, name: "Stationery", slug: "stationery", description: "Office and school supplies", product_count: 3, created_at: "2025-01-01T00:00:00Z" },
  { id: 5, name: "Health & Beauty", slug: "health-beauty", description: "Personal care and beauty products", product_count: 6, created_at: "2025-01-01T00:00:00Z" },
]

export const mockProducts: Product[] = [
  { id: 1, name: "Nasi Goreng", sku: "FNB-001", barcode: "8991234567890", description: "Indonesian fried rice", price: 25000, cost_price: 15000, stock: 50, min_stock: 10, category_id: 1, category_name: "Food & Beverages", image: null, active: true, created_at: "2025-01-01T00:00:00Z" },
  { id: 2, name: "Mie Goreng", sku: "FNB-002", barcode: "8991234567891", description: "Indonesian fried noodles", price: 22000, cost_price: 13000, stock: 45, min_stock: 10, category_id: 1, category_name: "Food & Beverages", image: null, active: true, created_at: "2025-01-01T00:00:00Z" },
  { id: 3, name: "Es Teh Manis", sku: "FNB-003", barcode: "8991234567892", description: "Sweet iced tea", price: 8000, cost_price: 3000, stock: 100, min_stock: 20, category_id: 1, category_name: "Food & Beverages", image: null, active: true, created_at: "2025-01-01T00:00:00Z" },
  { id: 4, name: "Kopi Susu", sku: "FNB-004", barcode: "8991234567893", description: "Iced coffee with milk", price: 18000, cost_price: 8000, stock: 60, min_stock: 15, category_id: 1, category_name: "Food & Beverages", image: null, active: true, created_at: "2025-01-01T00:00:00Z" },
  { id: 5, name: "Wireless Mouse", sku: "ELC-001", barcode: "8991234567894", description: "Ergonomic wireless mouse", price: 85000, cost_price: 55000, stock: 30, min_stock: 5, category_id: 2, category_name: "Electronics", image: null, active: true, created_at: "2025-01-01T00:00:00Z" },
  { id: 6, name: "USB-C Hub", sku: "ELC-002", barcode: "8991234567895", description: "7-in-1 USB-C hub", price: 150000, cost_price: 95000, stock: 20, min_stock: 5, category_id: 2, category_name: "Electronics", image: null, active: true, created_at: "2025-01-01T00:00:00Z" },
  { id: 7, name: "Bluetooth Speaker", sku: "ELC-003", barcode: "8991234567896", description: "Portable bluetooth speaker", price: 120000, cost_price: 75000, stock: 25, min_stock: 5, category_id: 2, category_name: "Electronics", image: null, active: true, created_at: "2025-01-01T00:00:00Z" },
  { id: 8, name: "T-Shirt Casual", sku: "CLT-001", barcode: "8991234567897", description: "Cotton casual t-shirt", price: 65000, cost_price: 35000, stock: 80, min_stock: 20, category_id: 3, category_name: "Clothing", image: null, active: true, created_at: "2025-01-01T00:00:00Z" },
  { id: 9, name: "Jeans Slim Fit", sku: "CLT-002", barcode: "8991234567898", description: "Slim fit denim jeans", price: 150000, cost_price: 90000, stock: 40, min_stock: 10, category_id: 3, category_name: "Clothing", image: null, active: true, created_at: "2025-01-01T00:00:00Z" },
  { id: 10, name: "Notebook A5", sku: "STN-001", barcode: "8991234567899", description: "Hardcover notebook A5", price: 25000, cost_price: 12000, stock: 100, min_stock: 30, category_id: 4, category_name: "Stationery", image: null, active: true, created_at: "2025-01-01T00:00:00Z" },
  { id: 11, name: "Hand Sanitizer", sku: "HLT-001", barcode: "8991234567900", description: "Alcohol-based hand sanitizer 60ml", price: 15000, cost_price: 8000, stock: 75, min_stock: 20, category_id: 5, category_name: "Health & Beauty", image: null, active: true, created_at: "2025-01-01T00:00:00Z" },
  { id: 12, name: "Face Mask Box", sku: "HLT-002", barcode: "8991234567901", description: "50 pcs disposable face masks", price: 35000, cost_price: 20000, stock: 40, min_stock: 10, category_id: 5, category_name: "Health & Beauty", image: null, active: true, created_at: "2025-01-01T00:00:00Z" },
]

export const mockCustomers: Customer[] = [
  { id: 1, name: "John Doe", email: "john@example.com", phone: "081234567890", address: "Jl. Merdeka No. 1", loyalty_points: 150, created_at: "2025-01-15T00:00:00Z" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", phone: "081234567891", address: "Jl. Sudirman No. 5", loyalty_points: 320, created_at: "2025-02-10T00:00:00Z" },
  { id: 3, name: "Bob Johnson", email: "bob@example.com", phone: "081234567892", address: "Jl. Thamrin No. 10", loyalty_points: 80, created_at: "2025-03-05T00:00:00Z" },
  { id: 4, name: "Alice Williams", email: "alice@example.com", phone: "081234567893", address: "Jl. Gatot Subroto No. 3", loyalty_points: 500, created_at: "2025-01-20T00:00:00Z" },
  { id: 5, name: "Charlie Brown", email: "charlie@example.com", phone: "081234567894", address: "Jl. Kuningan No. 7", loyalty_points: 210, created_at: "2025-04-01T00:00:00Z" },
]

export const mockOrders: Order[] = [
  {
    id: 1, order_number: "INV-20250601-001", customer_id: 1, customer_name: "John Doe",
    user_id: 1, user_name: "Admin User", subtotal: 53000, tax: 5300, discount: 0, total: 58300,
    payment_method: "cash", payment_status: "paid", status: "completed", notes: null,
    items: [
      { id: 1, order_id: 1, product_id: 1, product_name: "Nasi Goreng", quantity: 2, unit_price: 25000, subtotal: 50000 },
      { id: 2, order_id: 1, product_id: 3, product_name: "Es Teh Manis", quantity: 1, unit_price: 8000, subtotal: 8000 },
    ],
    created_at: "2025-06-01T10:30:00Z",
  },
  {
    id: 2, order_number: "INV-20250601-002", customer_id: null, customer_name: null,
    user_id: 2, user_name: "Cashier One", subtotal: 22000, tax: 2200, discount: 2000, total: 22200,
    payment_method: "qris", payment_status: "paid", status: "completed", notes: null,
    items: [
      { id: 3, order_id: 2, product_id: 2, product_name: "Mie Goreng", quantity: 1, unit_price: 22000, subtotal: 22000 },
    ],
    created_at: "2025-06-01T11:15:00Z",
  },
  {
    id: 3, order_number: "INV-20260601-003", customer_id: 2, customer_name: "Jane Smith",
    user_id: 1, user_name: "Admin User", subtotal: 200000, tax: 20000, discount: 10000, total: 210000,
    payment_method: "card", payment_status: "paid", status: "completed", notes: null,
    items: [
      { id: 4, order_id: 3, product_id: 5, product_name: "Wireless Mouse", quantity: 1, unit_price: 85000, subtotal: 85000 },
      { id: 5, order_id: 3, product_id: 6, product_name: "USB-C Hub", quantity: 1, unit_price: 150000, subtotal: 150000 },
    ],
    created_at: "2025-06-01T14:00:00Z",
  },
  {
    id: 4, order_number: "INV-20260602-001", customer_id: 3, customer_name: "Bob Johnson",
    user_id: 1, user_name: "Admin User", subtotal: 33000, tax: 3300, discount: 0, total: 36300,
    payment_method: "transfer", payment_status: "paid", status: "completed", notes: null,
    items: [
      { id: 6, order_id: 4, product_id: 10, product_name: "Notebook A5", quantity: 3, unit_price: 25000, subtotal: 75000 },
    ],
    created_at: "2025-06-02T09:00:00Z",
  },
]

export const mockRegisters: CashRegister[] = [
  { id: 1, user_id: 1, user_name: "Admin User", opened_at: "2025-06-01T08:00:00Z", closed_at: "2025-06-01T17:00:00Z", opening_balance: 500000, closing_balance: 1250000, expected_balance: 1280000, status: "closed", notes: null },
  { id: 2, user_id: 2, user_name: "Cashier One", opened_at: "2025-06-02T08:00:00Z", closed_at: null, opening_balance: 500000, closing_balance: null, expected_balance: null, status: "open", notes: "Shift 1" },
]

export const mockSalesSummary: SalesSummary = {
  total_sales: 326800,
  total_orders: 4,
  total_products_sold: 8,
  total_customers: 5,
  daily_sales: [
    { date: "2025-06-01", total: 280500 },
    { date: "2025-06-02", total: 75000 },
    { date: "2025-06-03", total: 0 },
  ],
  top_products: [
    { name: "Nasi Goreng", quantity: 2, revenue: 50000 },
    { name: "Mie Goreng", quantity: 1, revenue: 22000 },
    { name: "Notebook A5", quantity: 3, revenue: 75000 },
  ],
}
