import { getSettings, upsertSettings } from "@/server/actions/settings"
import { NextResponse } from "next/server"

export async function GET() {
  const data = await getSettings()
  return NextResponse.json(data)
}

export async function PATCH(req: Request) {
  const body = await req.json()
  await upsertSettings(body)
  return NextResponse.json({ success: true })
}
