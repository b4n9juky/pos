import { closeRegister, getActiveRegister } from "@/server/actions/register"
import { NextResponse } from "next/server"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  await closeRegister(Number(id), body.closingBalance)
  return NextResponse.json({ success: true })
}
