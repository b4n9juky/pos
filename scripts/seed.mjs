import mysql from "mysql2/promise"
import bcrypt from "bcryptjs"

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) {
  console.error("DATABASE_URL is required")
  process.exit(1)
}

const conn = await mysql.createConnection(dbUrl)
const passwordHash = await bcrypt.hash("password", 10)

try {
  await conn.execute(
    "INSERT INTO `users` (`name`, `email`, `password_hash`, `role`, `active`) VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)",
    [
      "Admin User", "admin@pos.com", passwordHash, "admin", true,
      "Cashier One", "cashier@pos.com", passwordHash, "cashier", true,
      "Staff Gudang", "gudang@pos.com", passwordHash, "warehouse", true,
      "Owner User", "owner@pos.com", passwordHash, "owner", true,
    ]
  )
  console.log("Users seeded")

  await conn.execute(
    "INSERT INTO `categories` (`name`, `slug`, `description`) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?), (?, ?, ?), (?, ?, ?)",
    [
      "Food & Beverages", "food-beverages", "All food and drink items",
      "Electronics", "electronics", "Electronic devices and accessories",
      "Clothing", "clothing", "Apparel and fashion items",
      "Stationery", "stationery", "Office and school supplies",
      "Health & Beauty", "health-beauty", "Personal care and beauty products",
    ]
  )
  console.log("Categories seeded")

  await conn.execute(
    `INSERT INTO \`products\` (\`name\`, \`sku\`, \`barcode\`, \`description\`, \`price\`, \`cost_price\`, \`stock\`, \`min_stock\`, \`category_id\`, \`taxable\`, \`active\`)
     VALUES (?,?,?,?,?,?,?,?,?,?,?), (?,?,?,?,?,?,?,?,?,?,?), (?,?,?,?,?,?,?,?,?,?,?),
            (?,?,?,?,?,?,?,?,?,?,?), (?,?,?,?,?,?,?,?,?,?,?), (?,?,?,?,?,?,?,?,?,?,?),
            (?,?,?,?,?,?,?,?,?,?,?), (?,?,?,?,?,?,?,?,?,?,?), (?,?,?,?,?,?,?,?,?,?,?),
            (?,?,?,?,?,?,?,?,?,?,?), (?,?,?,?,?,?,?,?,?,?,?), (?,?,?,?,?,?,?,?,?,?,?)`,
    [
      "Nasi Goreng", "FNB-001", "8991234567890", "Indonesian fried rice", "25000", "15000", 50, 10, 1, true, true,
      "Mie Goreng", "FNB-002", "8991234567891", "Indonesian fried noodles", "22000", "13000", 45, 10, 1, true, true,
      "Es Teh Manis", "FNB-003", "8991234567892", "Sweet iced tea", "8000", "3000", 100, 20, 1, true, true,
      "Kopi Susu", "FNB-004", "8991234567893", "Iced coffee with milk", "18000", "8000", 60, 15, 1, true, true,
      "Wireless Mouse", "ELC-001", "8991234567894", "Ergonomic wireless mouse", "85000", "55000", 30, 5, 2, true, true,
      "USB-C Hub", "ELC-002", "8991234567895", "7-in-1 USB-C hub", "150000", "95000", 20, 5, 2, true, true,
      "Bluetooth Speaker", "ELC-003", "8991234567896", "Portable bluetooth speaker", "120000", "75000", 25, 5, 2, true, true,
      "T-Shirt Casual", "CLT-001", "8991234567897", "Cotton casual t-shirt", "65000", "35000", 80, 20, 3, true, true,
      "Jeans Slim Fit", "CLT-002", "8991234567898", "Slim fit denim jeans", "150000", "90000", 40, 10, 3, true, true,
      "Notebook A5", "STN-001", "8991234567899", "Hardcover notebook A5", "25000", "12000", 100, 30, 4, true, true,
      "Hand Sanitizer", "HLT-001", "8991234567890", "Alcohol-based hand sanitizer 60ml", "15000", "8000", 75, 20, 5, true, true,
      "Face Mask Box", "HLT-002", "8991234567891", "50 pcs disposable face masks", "35000", "20000", 40, 10, 5, true, true,
    ]
  )
  console.log("Products seeded")

  await conn.execute(
    `INSERT INTO \`customers\` (\`name\`, \`email\`, \`phone\`, \`address\`, \`loyalty_points\`)
     VALUES (?,?,?,?,?), (?,?,?,?,?), (?,?,?,?,?), (?,?,?,?,?), (?,?,?,?,?)`,
    [
      "John Doe", "john@example.com", "081234567890", "Jl. Merdeka No. 1", 150,
      "Jane Smith", "jane@example.com", "081234567891", "Jl. Sudirman No. 5", 320,
      "Bob Johnson", "bob@example.com", "081234567892", "Jl. Thamrin No. 10", 80,
      "Alice Williams", "alice@example.com", "081234567893", "Jl. Gatot Subroto No. 3", 500,
      "Charlie Brown", "charlie@example.com", "081234567894", "Jl. Kuningan No. 7", 210,
    ]
  )
  console.log("Customers seeded")

  await conn.execute(
    `INSERT INTO \`store_settings\` (\`store_name\`, \`store_address\`, \`store_phone\`, \`store_email\`, \`tax_rate\`, \`currency\`, \`receipt_footer\`)
     VALUES (?,?,?,?,?,?,?)`,
    ["Toko Maju Jaya", "Jl. Example No. 123, Jakarta", "021-12345678", "contact@tokomajujaya.com", 10, "IDR", "Terima kasih telah berbelanja!"]
  )
  console.log("Store settings seeded")

  await conn.execute(
    `INSERT INTO \`tax_settings\` (\`name\`, \`rate\`, \`type\`, \`is_default\`, \`active\`)
     VALUES (?,?,?,?,?)`,
    ["PPN", 10, "percentage", true, true]
  )
  console.log("Tax settings seeded")

  console.log("")
  console.log("Seed complete!")
  console.log("Admin login:  admin@pos.com / password")
  console.log("Cashier login: cashier@pos.com / password")
  console.log("Warehouse:    gudang@pos.com / password")
  console.log("Owner:        owner@pos.com / password")
} catch (err) {
  console.error("Seed failed:", err.message)
  process.exit(1)
} finally {
  await conn.end()
}
