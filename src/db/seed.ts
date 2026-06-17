import "dotenv/config"
import { db } from "./index"
import { users, categories, products, customers, orders, orderItems, cashRegisters, storeSettings, taxSettings } from "./schema"
import { hash } from "bcryptjs"

async function seed() {
  console.log("Seeding database...")

  const passwordHash = await hash("password", 10)

  await db.insert(users).values([
    { name: "Admin User", email: "admin@pos.com", passwordHash, role: "admin", active: true },
    { name: "Cashier One", email: "cashier@pos.com", passwordHash, role: "cashier", active: true },
  ])
  console.log("Users seeded")

  await db.insert(categories).values([
    { name: "Food & Beverages", slug: "food-beverages", description: "All food and drink items" },
    { name: "Electronics", slug: "electronics", description: "Electronic devices and accessories" },
    { name: "Clothing", slug: "clothing", description: "Apparel and fashion items" },
    { name: "Stationery", slug: "stationery", description: "Office and school supplies" },
    { name: "Health & Beauty", slug: "health-beauty", description: "Personal care and beauty products" },
  ])
  console.log("Categories seeded")

  await db.insert(products).values([
    { name: "Nasi Goreng", sku: "FNB-001", barcode: "8991234567890", description: "Indonesian fried rice", price: "25000", costPrice: "15000", stock: 50, minStock: 10, categoryId: 1, active: true },
    { name: "Mie Goreng", sku: "FNB-002", barcode: "8991234567891", description: "Indonesian fried noodles", price: "22000", costPrice: "13000", stock: 45, minStock: 10, categoryId: 1, active: true },
    { name: "Es Teh Manis", sku: "FNB-003", barcode: "8991234567892", description: "Sweet iced tea", price: "8000", costPrice: "3000", stock: 100, minStock: 20, categoryId: 1, active: true },
    { name: "Kopi Susu", sku: "FNB-004", barcode: "8991234567893", description: "Iced coffee with milk", price: "18000", costPrice: "8000", stock: 60, minStock: 15, categoryId: 1, active: true },
    { name: "Wireless Mouse", sku: "ELC-001", barcode: "8991234567894", description: "Ergonomic wireless mouse", price: "85000", costPrice: "55000", stock: 30, minStock: 5, categoryId: 2, active: true },
    { name: "USB-C Hub", sku: "ELC-002", barcode: "8991234567895", description: "7-in-1 USB-C hub", price: "150000", costPrice: "95000", stock: 20, minStock: 5, categoryId: 2, active: true },
    { name: "Bluetooth Speaker", sku: "ELC-003", barcode: "8991234567896", description: "Portable bluetooth speaker", price: "120000", costPrice: "75000", stock: 25, minStock: 5, categoryId: 2, active: true },
    { name: "T-Shirt Casual", sku: "CLT-001", barcode: "8991234567897", description: "Cotton casual t-shirt", price: "65000", costPrice: "35000", stock: 80, minStock: 20, categoryId: 3, active: true },
    { name: "Jeans Slim Fit", sku: "CLT-002", barcode: "8991234567898", description: "Slim fit denim jeans", price: "150000", costPrice: "90000", stock: 40, minStock: 10, categoryId: 3, active: true },
    { name: "Notebook A5", sku: "STN-001", barcode: "8991234567899", description: "Hardcover notebook A5", price: "25000", costPrice: "12000", stock: 100, minStock: 30, categoryId: 4, active: true },
    { name: "Hand Sanitizer", sku: "HLT-001", barcode: "8991234567900", description: "Alcohol-based hand sanitizer 60ml", price: "15000", costPrice: "8000", stock: 75, minStock: 20, categoryId: 5, active: true },
    { name: "Face Mask Box", sku: "HLT-002", barcode: "8991234567901", description: "50 pcs disposable face masks", price: "35000", costPrice: "20000", stock: 40, minStock: 10, categoryId: 5, active: true },
  ])
  console.log("Products seeded")

  await db.insert(customers).values([
    { name: "John Doe", email: "john@example.com", phone: "081234567890", address: "Jl. Merdeka No. 1", loyaltyPoints: 150 },
    { name: "Jane Smith", email: "jane@example.com", phone: "081234567891", address: "Jl. Sudirman No. 5", loyaltyPoints: 320 },
    { name: "Bob Johnson", email: "bob@example.com", phone: "081234567892", address: "Jl. Thamrin No. 10", loyaltyPoints: 80 },
    { name: "Alice Williams", email: "alice@example.com", phone: "081234567893", address: "Jl. Gatot Subroto No. 3", loyaltyPoints: 500 },
    { name: "Charlie Brown", email: "charlie@example.com", phone: "081234567894", address: "Jl. Kuningan No. 7", loyaltyPoints: 210 },
  ])
  console.log("Customers seeded")

  await db.insert(orders).values([
    { orderNumber: "INV-20250601-001", customerId: 1, userId: 1, subtotal: "53000", tax: "5300", discount: "0", total: "58300", paymentMethod: "cash", paymentStatus: "paid", status: "completed" },
    { orderNumber: "INV-20250601-002", userId: 2, subtotal: "22000", tax: "2200", discount: "2000", total: "22200", paymentMethod: "qris", paymentStatus: "paid", status: "completed" },
    { orderNumber: "INV-20260601-003", customerId: 2, userId: 1, subtotal: "200000", tax: "20000", discount: "10000", total: "210000", paymentMethod: "card", paymentStatus: "paid", status: "completed" },
    { orderNumber: "INV-20260602-001", customerId: 3, userId: 1, subtotal: "33000", tax: "3300", discount: "0", total: "36300", paymentMethod: "transfer", paymentStatus: "paid", status: "completed" },
  ])
  console.log("Orders seeded")

  await db.insert(orderItems).values([
    { orderId: 1, productId: 1, quantity: 2, unitPrice: "25000", subtotal: "50000" },
    { orderId: 1, productId: 3, quantity: 1, unitPrice: "8000", subtotal: "8000" },
    { orderId: 2, productId: 2, quantity: 1, unitPrice: "22000", subtotal: "22000" },
    { orderId: 3, productId: 5, quantity: 1, unitPrice: "85000", subtotal: "85000" },
    { orderId: 3, productId: 6, quantity: 1, unitPrice: "150000", subtotal: "150000" },
    { orderId: 4, productId: 10, quantity: 3, unitPrice: "25000", subtotal: "75000" },
  ])
  console.log("Order items seeded")

  await db.insert(cashRegisters).values([
    { userId: 1, openedAt: new Date("2025-06-01T08:00:00Z"), closedAt: new Date("2025-06-01T17:00:00Z"), openingBalance: "500000", closingBalance: "1250000", expectedBalance: "1280000", status: "closed" },
    { userId: 2, openedAt: new Date("2025-06-02T08:00:00Z"), openingBalance: "500000", status: "open", notes: "Shift 1" },
  ])
  console.log("Cash registers seeded")

  await db.insert(storeSettings).values({
    storeName: "Toko Maju Jaya",
    storeAddress: "Jl. Example No. 123, Jakarta",
    storePhone: "021-12345678",
    storeEmail: "contact@tokomajujaya.com",
    taxRate: 10,
    currency: "IDR",
    receiptFooter: "Terima kasih telah berbelanja!",
  })
  console.log("Store settings seeded")

  await db.insert(taxSettings).values({
    name: "PPN",
    rate: 10,
    type: "percentage",
    isDefault: true,
    active: true,
  })
  console.log("Tax settings seeded")

  console.log("Seed complete!")
}

seed().catch(console.error)
