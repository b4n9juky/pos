import { getOrders, createOrder } from "@/server/actions/orders"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search")
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 200)
  const offset = Number(searchParams.get("offset")) || 0
  const userId = searchParams.has("userId") ? Number(searchParams.get("userId")) : undefined
  const data = await getOrders(search || undefined, limit, offset, userId)
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const result = await createOrder(body)
    return NextResponse.json(result)
  } catch (e: any) {
    console.error("POST /api/orders error:", e)
    return NextResponse.json({ error: e?.message ?? "Internal server error" }, { status: 500 })
  }
}
