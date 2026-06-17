import { getCustomer, updateCustomer } from "@/server/actions/customers"
import { NextResponse } from "next/server"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getCustomer(Number(id))
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  await updateCustomer(Number(id), body)
  return NextResponse.json({ success: true })
}
