import { getCustomers, createCustomer } from "@/server/actions/customers"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search")
  const data = await getCustomers(search || undefined)
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()
  await createCustomer(body)
  return NextResponse.json({ success: true })
}
