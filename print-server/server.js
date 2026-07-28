const express = require("express")
const cors = require("cors")
const { execSync } = require("child_process")
const { ThermalPrinter, PrinterTypes, CharacterSet } = require("node-thermal-printer")
const fs = require("fs")
const path = require("path")
const os = require("os")

const app = express()
const PORT = 8090

const PS1_CODE = `$cs = @"
using System;
using System.Runtime.InteropServices;
public class RawPrinter {
  [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)]
  static extern bool OpenPrinter(string p, out IntPtr h, IntPtr d);
  [DllImport("winspool.drv")] static extern bool ClosePrinter(IntPtr h);
  [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)]
  static extern int StartDocPrinter(IntPtr h, int l, ref DOCINFO d);
  [DllImport("winspool.drv")] static extern bool EndDocPrinter(IntPtr h);
  [DllImport("winspool.drv")] static extern bool WritePrinter(IntPtr h, IntPtr p, int c, out int w);
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  struct DOCINFO { public string pDocName; public string pOutputFile; public string pDataType; }
  public static void Print(string n, byte[] d, string t) {
    IntPtr h;
    if (!OpenPrinter(n, out h, IntPtr.Zero)) throw new Exception("E_OPEN:" + Marshal.GetLastWin32Error());
    try {
      var di = new DOCINFO { pDocName = "Receipt", pDataType = t };
      if (StartDocPrinter(h, 1, ref di) == 0) throw new Exception("E_STARTDOC:" + Marshal.GetLastWin32Error());
      var p = Marshal.AllocHGlobal(d.Length);
      Marshal.Copy(d, 0, p, d.Length);
      int w;
      if (!WritePrinter(h, p, d.Length, out w)) { int e = Marshal.GetLastWin32Error(); Marshal.FreeHGlobal(p); EndDocPrinter(h); throw new Exception("E_WRITE:" + e); }
      if (w != d.Length) { Marshal.FreeHGlobal(p); EndDocPrinter(h); throw new Exception("E_SHORT:" + w); }
      Marshal.FreeHGlobal(p);
      EndDocPrinter(h);
    } finally { ClosePrinter(h); }
  }
}
"@
Add-Type -TypeDefinition $cs
[RawPrinter]::Print('__PRINTER__', [System.IO.File]::ReadAllBytes('__FILE__'), 'RAW')
`

app.use(cors())
app.use(express.json({ limit: "1mb" }))

function sendRawToPrinter(printerName, buffer) {
  const tmpFile = path.join(os.tmpdir(), "pos-receipt-" + Date.now() + ".bin")
  const psFile = path.join(os.tmpdir(), "pos-print-" + Date.now() + ".ps1")
  const ps = PS1_CODE.replace(/__PRINTER__/g, printerName.replace(/'/g, "''")).replace(/__FILE__/g, tmpFile.replace(/'/g, "''"))

  fs.writeFileSync(tmpFile, buffer)
  fs.writeFileSync(psFile, ps, "utf8")
  try {
    execSync('powershell -NoProfile -ExecutionPolicy Bypass -File "' + psFile + '"', { timeout: 60000 })
  } finally {
    try { fs.unlinkSync(tmpFile) } catch {}
    try { fs.unlinkSync(psFile) } catch {}
  }
}

function fmt(n) {
  if (n == null) return "0"
  return Number(n).toLocaleString("id-ID")
}

function getChars(paperWidth) {
  if (paperWidth >= 80) return 48
  if (paperWidth >= 76) return 42
  return 40
}

function buildReceipt(printer, data) {
  const { storeName, storeAddress, storePhone, receiptFooter, orderNumber, date, customerName, paymentMethod, amountPaid, change, items, subtotal, tax, discount, total, paperWidth = 58, cashierName } = data

  const now = date ? new Date(date) : new Date()
  const dateStr = now.toLocaleDateString("id-ID", { year: "numeric", month: "2-digit", day: "2-digit" })
  const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  const W = getChars(paperWidth)

  printer.newLine()

  printer.alignCenter()
  printer.bold(true)
  printer.println(storeName || "My Store")
  printer.bold(false)
  if (storeAddress) printer.println(storeAddress)
  if (storePhone) printer.println("Tel: " + storePhone)
  printer.println(dateStr + " " + timeStr)
  printer.println(orderNumber)

  printer.alignLeft()
  printer.drawLine()
  if (customerName) {
    printer.println(customerName)
    printer.drawLine()
  }

  const cItem = Math.floor(W * 0.38)
  const cPrice = Math.floor(W * 0.18)
  const cQty = Math.floor(W * 0.12)
  const cSub = W - cItem - cPrice - cQty - 5

  printer.bold(true)
  printer.println("ITEM".padEnd(cItem) + " " + "PRICE".padStart(cPrice) + " " + "QTY".padStart(cQty) + " " + "SUBTOTAL".padStart(cSub))
  printer.bold(false)
  printer.drawLine()
  for (const item of items) {
    printer.println(
      item.name.substring(0, cItem).padEnd(cItem) + " " +
      fmt(item.price).padStart(cPrice) + " " +
      String(item.quantity).padStart(cQty) + " " +
      fmt(item.subtotal).padStart(cSub)
    )
  }
  printer.drawLine()

  printer.leftRight("TOTAL", fmt(total))
  if (paymentMethod === "cash") {
    if (amountPaid != null) printer.leftRight("TUNAI", fmt(amountPaid))
    if (change != null) printer.leftRight("KEMBALI", fmt(change))
  } else {
    printer.leftRight("TUNAI", fmt(total))
    printer.leftRight("KEMBALI", "0")
  }
  if (discount > 0) printer.leftRight("DISKON", fmt(discount))
  printer.newLine()
  if (cashierName) {
    printer.println("KASIR: " + cashierName)
  }
  if (receiptFooter) {
    printer.alignCenter()
    printer.println(receiptFooter)
  }
  printer.drawLine()
  printer.newLine()
  printer.newLine()
}

function createPrinter(paperWidth) {
  return new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: "tcp://0.0.0.0:1",
    width: getChars(paperWidth),
    characterSet: CharacterSet.PC437_USA,
    removeSpecialCharacters: false,
    options: { timeout: 5000 },
  })
}

function buildAndPrint(data) {
  // 1. Send text content only
  const printer = createPrinter(data.paperWidth || 58)
  buildReceipt(printer, data)
  printer.openCashDrawer()
  sendRawToPrinter(data.printerName, printer.getBuffer())

  // 2. Wait for printer to finish printing, then cut separately
  if (data.autoCut !== false) {
    setTimeout(() => {
      const cutPrinter = createPrinter(data.paperWidth || 58)
      cutPrinter.cut({ verticalTabAmount: 0 })
      sendRawToPrinter(data.printerName, cutPrinter.getBuffer())
    }, 2000)
  }
}

app.get("/status", (_req, res) => {
  res.json({ status: "running", version: "2.0.0", port: PORT, escpos: true })
})

app.get("/detect", (_req, res) => {
  try {
    const raw = execSync(
      'powershell -NoProfile -Command "Get-Printer | Select-Object -ExpandProperty Name"',
      { encoding: "utf8", timeout: 5000 }
    )
    const printers = raw.trim().split(/\r?\n/).filter(Boolean)
    res.json({ printers })
  } catch {
    res.json({ printers: [], error: "Could not detect printers." })
  }
})

app.post("/print", async (req, res) => {
  try {
    const data = req.body
    if (!data.printerName) return res.status(400).json({ error: "printerName is required" })

    buildAndPrint(data)

    console.log(`  [${new Date().toLocaleTimeString()}] Printed ${data.orderNumber} on ${data.printerName}`)
    res.json({ success: true })
  } catch (err) {
    console.error(`  [ERROR] Print failed: ${err.message}`)
    res.status(500).json({ error: err.message || "Print failed" })
  }
})

app.post("/test", async (req, res) => {
  try {
    const { printerName, paperWidth = 58 } = req.body
    if (!printerName) return res.status(400).json({ error: "printerName is required" })

    const testData = {
      printerName,
      storeName: "RAHMAT TOYS",
      storeAddress: "Jl. A. Yani No 21",
      storePhone: "08767654332",
      receiptFooter: "Terima kasih!",
      orderNumber: "TEST-001",
      date: new Date().toISOString(),
      paperWidth,
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
      cashierName: "Admin",
    }

    buildAndPrint(testData)

    console.log(`  [${new Date().toLocaleTimeString()}] Test print sent to ${printerName}`)
    res.json({ success: true })
  } catch (err) {
    console.error(`  [ERROR] Test print failed: ${err.message}`)
    res.status(500).json({ error: err.message || "Test print failed" })
  }
})

app.post("/diagnose", async (req, res) => {
  try {
    const data = req.body
    if (!data.printerName) {
      return res.status(400).json({ error: "printerName is required" })
    }

    const printer = createPrinter(data.paperWidth || 58)
    buildReceipt(printer, data)
    if (data.autoCut !== false) printer.cut()
    printer.openCashDrawer()

    const buf = printer.getBuffer()
    res.json({
      hex: buf.toString("hex"),
      length: buf.length,
      ascii: buf.toString("ascii").replace(/[^\x20-\x7E]/g, "."),
    })
  } catch (err) {
    res.status(500).json({ error: err.message || "Diagnose failed" })
  }
})

app.listen(PORT, () => {
  console.log(`POS Print Server (ESC/POS) running on http://localhost:${PORT}`)
  console.log("  " + "-".repeat(45))
  console.log("  Status:     GET  http://localhost:" + PORT + "/status")
  console.log("  Detect:     GET  http://localhost:" + PORT + "/detect")
  console.log("  Print:     POST http://localhost:" + PORT + "/print")
  console.log("  Test:      POST http://localhost:" + PORT + "/test")
  console.log("  " + "-".repeat(45))
  console.log("  ESC/POS enabled - proper alignment, cut, bold")
})
