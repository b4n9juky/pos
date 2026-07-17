require("dotenv").config({ path: require("path").join(__dirname, ".env") })
const mysql = require("mysql2/promise")

async function seed() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL)
  const bcrypt = require("bcryptjs")
  const passwordHash = await bcrypt.hash("password", 10)

  await conn.execute(
    "INSERT INTO `users` (`name`, `email`, `password_hash`, `role`, `active`) VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)",
    [
      "Admin User", "admin@pos.com", passwordHash, "admin", true,
      "Cashier One", "cashier@pos.com", passwordHash, "cashier", true,
    ]
  )

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
      "Hand Sanitizer", "HLT-001", "8991234567900", "Alcohol-based hand sanitizer 60ml", "15000", "8000", 75, 20, 5, true, true,
      "Face Mask Box", "HLT-002", "8991234567901", "50 pcs disposable face masks", "35000", "20000", 40, 10, 5, true, true,
    ]
  )

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

  await conn.execute(
    `INSERT INTO \`orders\` (\`order_number\`, \`customer_id\`, \`user_id\`, \`subtotal\`, \`tax\`, \`discount\`, \`total\`, \`payment_method\`, \`payment_status\`, \`status\`)
     VALUES (?,?,?,?,?,?,?,?,?,?), (?,?,?,?,?,?,?,?,?,?), (?,?,?,?,?,?,?,?,?,?), (?,?,?,?,?,?,?,?,?,?)`,
    [
      "INV-20250601-001", 1, 1, "53000", "5300", "0", "58300", "cash", "paid", "completed",
      "INV-20250601-002", null, 2, "22000", "2200", "2000", "22200", "qris", "paid", "completed",
      "INV-20260601-003", 2, 1, "200000", "20000", "10000", "210000", "card", "paid", "completed",
      "INV-20260602-001", 3, 1, "33000", "3300", "0", "36300", "transfer", "paid", "completed",
    ]
  )

  await conn.execute(
    `INSERT INTO \`order_items\` (\`order_id\`, \`product_id\`, \`quantity\`, \`unit_price\`, \`subtotal\`)
     VALUES (?,?,?,?,?), (?,?,?,?,?), (?,?,?,?,?), (?,?,?,?,?), (?,?,?,?,?), (?,?,?,?,?)`,
    [
      1, 1, 2, "25000", "50000",
      1, 3, 1, "8000", "8000",
      2, 2, 1, "22000", "22000",
      3, 5, 1, "85000", "85000",
      3, 6, 1, "150000", "150000",
      4, 10, 3, "25000", "75000",
    ]
  )

  await conn.execute(
    `INSERT INTO \`cash_registers\` (\`user_id\`, \`opened_at\`, \`closed_at\`, \`opening_balance\`, \`closing_balance\`, \`expected_balance\`, \`status\`)
     VALUES (?,?,?,?,?,?,?), (?,?,?,?,?,?,?)`,
    [
      1, "2025-06-01 08:00:00", "2025-06-01 17:00:00", "500000", "1250000", "1280000", "closed",
      2, "2025-06-02 08:00:00", null, "500000", null, null, "open",
    ]
  )

  await conn.execute(
    `INSERT INTO \`store_settings\` (\`store_name\`, \`store_address\`, \`store_phone\`, \`store_email\`, \`tax_rate\`, \`currency\`, \`receipt_footer\`)
     VALUES (?,?,?,?,?,?,?)`,
    ["Toko Maju Jaya", "Jl. Example No. 123, Jakarta", "021-12345678", "contact@tokomajujaya.com", 10, "IDR", "Terima kasih telah berbelanja!"]
  )

  await conn.execute(
    `INSERT INTO \`tax_settings\` (\`name\`, \`rate\`, \`type\`, \`is_default\`, \`active\`)
     VALUES (?,?,?,?,?)`,
    ["PPN", 10, "percentage", true, true]
  )

  console.log("Database seeded successfully!")
  console.log("Admin login:  admin@pos.com / password")
  console.log("Cashier login: cashier@pos.com / password")

  await conn.end()
}

seed().catch((err) => {
  console.error("Seed failed:", err.message)
  process.exit(1)
})
