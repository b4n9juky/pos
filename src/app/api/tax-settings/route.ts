import { getTaxSettings, upsertTaxSetting } from "@/server/actions/tax-settings"
import { NextResponse } from "next/server"

export async function GET() {
  const data = await getTaxSettings()
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    await upsertTaxSetting(body)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error("POST /api/tax-settings error:", e?.message ?? e)
    return NextResponse.json({ error: e?.message ?? "Internal server error" }, { status: 500 })
  }
}
