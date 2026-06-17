import { createCustomer } from "@/server/actions/customers"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json()
  await createCustomer(body)
  return NextResponse.json({ success: true })
}
