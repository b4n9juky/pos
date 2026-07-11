import { importProducts } from "@/server/actions/import"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json()
  if (!Array.isArray(body.rows)) {
    return NextResponse.json({ error: "rows must be an array" }, { status: 400 })
  }
  const result = await importProducts(body.rows)
  return NextResponse.json(result)
}
