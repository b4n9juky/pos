import { getProducts, createProduct } from "@/server/actions/products"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search")
  const data = await getProducts(search || undefined)
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()
  await createProduct(body)
  return NextResponse.json({ success: true })
}
