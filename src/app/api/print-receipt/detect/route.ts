import { NextResponse } from "next/server"
import { execSync } from "child_process"

export async function GET() {
  try {
    const raw = execSync(
      'powershell -NoProfile -Command "Get-Printer | Where-Object { $_.PrinterStatus -eq 3 -or $_.PrinterStatus -eq 4 -or $_.PrinterStatus -eq 7 } | Select-Object -ExpandProperty Name"',
      { encoding: "utf8", timeout: 10000 }
    )
    const printers = raw.trim().split(/\r?\n/).filter(Boolean)
    return NextResponse.json({ printers })
  } catch {
    return NextResponse.json({ printers: [] })
  }
}
