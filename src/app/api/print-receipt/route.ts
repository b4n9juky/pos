import { NextResponse } from "next/server"
import { ThermalPrinter, PrinterTypes, CharacterSet } from "node-thermal-printer"
import { execSync } from "child_process"
import path from "path"
import os from "os"
import fs from "fs"
import { getSettings } from "@/server/actions/settings"

function fmt(n: any) {
  if (n == null) return "0"
  return Number(n).toLocaleString("id-ID")
}

function getChars(paperWidth: number): number {
  if (paperWidth >= 80) return 48
  if (paperWidth >= 76) return 42
  return 40
}

function buildReceipt(printer: ThermalPrinter, data: any) {
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
  const cQty = Math.floor(W * 0.10)
  const cSub = W - cItem - cPrice - cQty - 3

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

function sendRawToPrinter(printerName: string, buffer: Buffer): void {
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

export async function POST(req: Request) {
  try {
    const data = await req.json()
    if (!data.printerName) {
      return NextResponse.json({ error: "printerName is required" }, { status: 400 })
    }

    const store = await getSettings()
    if (store) {
      data.storeName ??= store.storeName ?? null
      data.storeAddress ??= store.storeAddress ?? null
      data.storePhone ??= store.storePhone ?? null
      data.receiptFooter ??= store.receiptFooter ?? null
    }

    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: "tcp://0.0.0.0:1",
      width: getChars(data.paperWidth),
      characterSet: CharacterSet.PC850_MULTILINGUAL,
      removeSpecialCharacters: false,
      options: { timeout: 5000 },
    })

    buildReceipt(printer, data)
    printer.openCashDrawer()

    // Send text content first — printer prints immediately
    sendRawToPrinter(data.printerName, printer.getBuffer())

    // Wait for printer to finish printing all lines, THEN cut
    if (data.autoCut !== false) {
      setTimeout(() => {
        const cutPrinter = new ThermalPrinter({
          type: PrinterTypes.EPSON,
          interface: "tcp://0.0.0.0:1",
          width: getChars(data.paperWidth),
      characterSet: CharacterSet.PC437_USA,
          removeSpecialCharacters: false,
          options: { timeout: 5000 },
        })
        cutPrinter.cut({ verticalTabAmount: 0 })
        sendRawToPrinter(data.printerName, cutPrinter.getBuffer())
      }, 2000)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Print error:", err.message)
    return NextResponse.json({ error: err.message || "Print failed" }, { status: 500 })
  }
}
