import { getPrinterSettings, upsertPrinterSettings } from "@/server/actions/printer"
import { NextResponse } from "next/server"

export async function GET() {
  const data = await getPrinterSettings()
  return NextResponse.json(data)
}

export async function PATCH(req: Request) {
  const body = await req.json()
  await upsertPrinterSettings(body)
  return NextResponse.json({ success: true })
}
