import { NextResponse } from "next/server"
import { ThermalPrinter, PrinterTypes, CharacterSet } from "node-thermal-printer"
import { execSync } from "child_process"
import path from "path"
import os from "os"
import fs from "fs"

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
  const tmpFile = path.join(os.tmpdir(), "pos-test-" + Date.now() + ".bin")
  const psFile = path.join(os.tmpdir(), "pos-test-print-" + Date.now() + ".ps1")
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
    const { printerName, paperWidth = 58 } = await req.json()
    if (!printerName) {
      return NextResponse.json({ error: "printerName is required" }, { status: 400 })
    }

    const W = paperWidth >= 80 ? 48 : paperWidth >= 76 ? 42 : 38

    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: "tcp://0.0.0.0:1",
      width: W,
      characterSet: CharacterSet.PC437_USA,
      removeSpecialCharacters: false,
    })

    printer.alignCenter()
    printer.bold(true)
    printer.setTextSize(1, 2)
    printer.println("TEST PRINT")
    printer.setTextNormal()
    printer.bold(false)
    printer.println("Printer: " + printerName)
    printer.drawLine()
    printer.alignLeft()
    printer.println("Tanggal: " + new Date().toLocaleDateString("id-ID"))
    printer.println("Waktu: " + new Date().toLocaleTimeString("id-ID"))
    printer.newLine()
    printer.println("Baris 1: Normal")
    printer.bold(true)
    printer.println("Baris 2: Bold")
    printer.bold(false)
    printer.drawLine()
    printer.alignCenter()
    printer.println("Jika terbaca dengan baik,")
    printer.println("printer siap digunakan!")
    printer.newLine()
    printer.newLine()

    sendRawToPrinter(printerName, printer.getBuffer())

    setTimeout(() => {
      const cutPrinter = new ThermalPrinter({
        type: PrinterTypes.EPSON,
        interface: "tcp://0.0.0.0:1",
        width: W,
        characterSet: CharacterSet.PC437_USA,
        removeSpecialCharacters: false,
      })
      cutPrinter.cut()
      sendRawToPrinter(printerName, cutPrinter.getBuffer())
    }, 2000)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Test print error:", err.message)
    return NextResponse.json({ error: err.message || "Test print failed" }, { status: 500 })
  }
}
