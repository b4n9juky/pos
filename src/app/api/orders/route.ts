import { getOrders, createOrder } from "@/server/actions/orders"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search")
  const data = await getOrders(search || undefined)
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const result = await createOrder(body)
    return NextResponse.json(result)
  } catch (e: any) {
    console.error("POST /api/orders error:", e?.message ?? e)
    return NextResponse.json({ error: e?.message ?? "Internal server error" }, { status: 500 })
  }
}
