import { getProducts, createProduct } from "@/server/actions/products"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search")
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 200)
  const offset = Number(searchParams.get("offset")) || 0
  const activeParam = searchParams.get("active")
  const active = activeParam === "true" ? true : activeParam === "false" ? false : undefined
  const data = await getProducts(search || undefined, limit, offset, active)
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()
  await createProduct(body)
  return NextResponse.json({ success: true })
}
