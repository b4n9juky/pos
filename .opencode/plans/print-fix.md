# Print System Fix Plan

## 1. Fix character set di route.ts

**File:** `src/app/api/print-receipt/route.ts`

**Baris 148-154 — ganti:**
```ts
const printer = new ThermalPrinter({
  type: PrinterTypes.EPSON,
  interface: "tcp://0.0.0.0:1",
  width: getChars(data.paperWidth),
  characterSet: CharacterSet.PC437_USA,
  removeSpecialCharacters: false,
})
```

**Menjadi:**
```ts
const printer = new ThermalPrinter({
  type: PrinterTypes.EPSON,
  interface: "tcp://0.0.0.0:1",
  width: getChars(data.paperWidth),
  characterSet: CharacterSet.PC850_MULTILINGUAL,
  removeSpecialCharacters: false,
  options: { timeout: 5000 },
})
```

Perubahan: `PC437_USA` → `PC850_MULTILINGUAL` (konsisten dengan `server.js`) + tambah `options`.

---

## 2. Tambah endpoint /diagnose di server.js

**File:** `print-server/server.js`

**Sebelum `app.listen(...)` (baris 228), tambah:**
```js
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
```

---

## 3. Tambah endpoint /diagnose di agent.ps1

**File:** `print-server/agent.ps1`

**Di dalam switch statement, sebelum `default`, tambah:**
```powershell
"POST /diagnose" {
  $reader = New-Object System.IO.StreamReader($req.InputStream)
  $json = $reader.ReadToEnd()
  $reader.Close()
  $data = $json | ConvertFrom-Json

  if (-not $data.printerName) {
    SendJson $ctx (@{error="printerName is required"} | ConvertTo-Json -Compress) 400
    continue
  }

  $bytes = BuildReceiptBytes $data
  $hex = [System.BitConverter]::ToString($bytes) -replace '-', ''
  $ascii = [System.Text.Encoding]::ASCII.GetString($bytes) -replace '[^\x20-\x7E]', '.'

  SendJson $ctx (@{hex=$hex; length=$bytes.Length; ascii=$ascii} | ConvertTo-Json -Compress)
}
```

---

## Cara pakai diagnose

Kirim POST request yang sama ke kedua agent untuk membandingkan hex buffer:

```powershell
# Test payload
$body = @{
  printerName = "Nama Printer Anda"
  paperWidth = 58
  storeName = "TOKO TEST"
  orderNumber = "TEST-001"
  items = @(@{name="Item 1"; quantity=1; price=10000; subtotal=10000})
  subtotal = 10000
  tax = 1000
  discount = 0
  total = 11000
  paymentMethod = "cash"
  amountPaid = 20000
  change = 9000
} | ConvertTo-Json -Compress

# Test di Node.js server (start.bat)
curl.exe -s -X POST http://localhost:8090/diagnose -H "Content-Type: application/json" -d $body

# Test di PowerShell agent (start-agent.bat)
curl.exe -s -X POST http://localhost:8090/diagnose -H "Content-Type: application/json" -d $body
```

Bandingkan output `hex` dari keduanya — byte yang berbeda menunjukkan letak masalah.

---

## Catatan

Karakter set antara:
- `server.js` (Node.js + node-thermal-printer): ✅ proper
- `agent.ps1` (PowerShell native): ❌ berantakan

Keduanya pakai CP850 (`ESC t 2`) dan initialization sequence yang mirip. Perbedaan mungkin ada di:
1. Cara `iconv-lite` (Node.js) vs `[System.Text.Encoding]::GetEncoding(850)` (.NET) encode string
2. Penempatan `ESC @` (di awal vs di akhir)
3. Penanganan error/fallback code page switching di `node-thermal-printer`
