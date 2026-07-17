const express = require("express")
const cors = require("cors")
const { execSync } = require("child_process")
const path = require("path")
const fs = require("fs")
const os = require("os")

const app = express()
const PORT = 8090

app.use(cors())
app.use(express.json({ limit: "1mb" }))

const DOTNET_PRINT = path.join(__dirname, "dotnet-print2.ps1")

function fmt(n) {
  if (n == null) return "0"
  return Number(n).toLocaleString("id-ID")
}

function center(s, w) {
  const pad = Math.max(0, w - s.length)
  return " ".repeat(Math.floor(pad / 2)) + s + " ".repeat(Math.ceil(pad / 2))
}

function padEnd(s, w) {
  return String(s).padEnd(w).substring(0, w)
}

function padStart(s, w) {
  return String(s).padStart(w)
}

function buildReceipt(data) {
  const {
    storeName, storeAddress, storePhone, receiptFooter,
    orderNumber, date, customerName,
    paymentMethod, amountPaid, change,
    items, subtotal, tax, discount, total,
    paperWidth = 58,
  } = data

  const W = paperWidth === 58 ? 32 : 42
  const D = "=".repeat(W)
  const d = "-".repeat(W)
  const now = date ? new Date(date) : new Date()
  const dateStr = now.toLocaleDateString("id-ID", { year: "numeric", month: "2-digit", day: "2-digit" })
  const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })

  const lines = []

  lines.push(center(storeName || "My Store", W))
  if (storeAddress) lines.push(center(storeAddress, W))
  if (storePhone) lines.push(center(`Telp: ${storePhone}`, W))
  lines.push(center(`${dateStr} ${timeStr}`, W))
  lines.push(center(orderNumber, W))
  lines.push(D)

  if (customerName) {
    lines.push(`  ${customerName}`)
    lines.push(d)
  }

  const c1 = Math.floor(W * 0.38)
  const c2 = Math.floor(W * 0.2)
  const c34 = W - c1 - c2

  lines.push(padEnd("Item", c1) + padEnd("Qty", c2) + " " + padEnd("Subtotal", c34 - 1))

  for (const item of items) {
    const name = padEnd(item.name.substring(0, c1), c1)
    const qty = padEnd(`x${item.quantity}`, c2)
    const sub = padStart(fmt(item.subtotal), c34 - 2)
    lines.push(name + qty + "  " + sub)
  }

  lines.push(D)
  lines.push(padEnd("Subtotal", c1 + c2) + " " + padStart(fmt(subtotal), c34 - 1))
  if (tax > 0) lines.push(padEnd("Tax", c1 + c2) + " " + padStart(fmt(tax), c34 - 1))
  if (discount > 0) lines.push(padEnd("Discount", c1 + c2) + " " + padStart(`-${fmt(discount)}`, c34 - 1))
  lines.push(d)
  lines.push(padEnd("TOTAL", c1 + c2) + " " + padStart(fmt(total), c34 - 1))
  lines.push("")

  if (paymentMethod === "cash") {
    if (amountPaid != null) lines.push(padEnd("Cash", c1 + c2) + " " + padStart(fmt(amountPaid), c34 - 1))
    if (change != null) lines.push(padEnd("Change", c1 + c2) + " " + padStart(fmt(change), c34 - 1))
  } else {
    lines.push(padEnd("Payment", c1 + c2) + " " + padStart(paymentMethod.toUpperCase(), c34 - 1))
  }
  lines.push("")

  if (receiptFooter) {
    lines.push(center(receiptFooter, W))
    lines.push("")
  }

  for (let i = 0; i < 6; i++) lines.push("")

  return lines.join("\r\n")
}

function sendToPrinter(text, printerName) {
  const tmpFile = path.join(os.tmpdir(), `pos-receipt-${Date.now()}.txt`)
  fs.writeFileSync(tmpFile, text, "utf8")
  try {
    execSync(
      `powershell -NoProfile -ExecutionPolicy Bypass -File "${DOTNET_PRINT}" -PrinterName "${printerName}" -TextFile "${tmpFile}"`,
      { timeout: 60000 }
    )
  } finally {
    try { fs.unlinkSync(tmpFile) } catch {}
  }
}

app.get("/status", (_req, res) => {
  res.json({ status: "running", version: "1.0.0", port: PORT })
})

app.get("/detect", (_req, res) => {
  try {
    const raw = execSync('powershell -NoProfile -Command "Get-Printer | Select-Object -ExpandProperty Name"', {
      encoding: "utf8",
      timeout: 5000,
    })
    const printers = raw.trim().split(/\r?\n/).filter(Boolean)
    res.json({ printers })
  } catch {
    res.json({ printers: [], error: "Could not detect printers." })
  }
})

app.post("/print", (req, res) => {
  try {
    const data = req.body
    if (!data.printerName) return res.status(400).json({ error: "printerName is required" })
    const text = buildReceipt(data)
    sendToPrinter(text, data.printerName)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message || "Print failed" })
  }
})

app.post("/test", (req, res) => {
  try {
    const { printerName } = req.body
    if (!printerName) return res.status(400).json({ error: "printerName is required" })
    const testData = {
      printerName,
      storeName: "RAHMAT TOYS",
      storeAddress: "Jl. A. Yani No 21",
      storePhone: "08767654332",
      receiptFooter: "Terima kasih!",
      orderNumber: "TEST-001",
      date: new Date().toISOString(),
      items: [
        { name: "Mainan Edukasi", quantity: 2, price: 25000, subtotal: 50000 },
        { name: "Boneka Kecil", quantity: 1, price: 15000, subtotal: 15000 },
      ],
      subtotal: 65000,
      tax: 6500,
      discount: 5000,
      total: 66500,
      paymentMethod: "cash",
      amountPaid: 100000,
      change: 33500,
    }
    const text = buildReceipt(testData)
    sendToPrinter(text, printerName)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message || "Test print failed" })
  }
})

app.listen(PORT, () => {
  console.log(`POS Print Proxy running on http://localhost:${PORT}`)
  console.log(`Detect printers: http://localhost:${PORT}/detect`)
  console.log(`Print receipt:   POST http://localhost:${PORT}/print`)
  console.log(`Test print:      POST http://localhost:${PORT}/test`)
})
