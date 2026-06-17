import { getRegisters, getActiveRegister, openRegister } from "@/server/actions/register"
import { NextResponse } from "next/server"

export async function GET() {
  const [registers, active] = await Promise.all([getRegisters(), getActiveRegister()])
  return NextResponse.json({ registers, active })
}

export async function POST(req: Request) {
  const body = await req.json()
  await openRegister(body.userId, body.openingBalance)
  return NextResponse.json({ success: true })
}
