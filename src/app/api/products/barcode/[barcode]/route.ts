import { getProductByBarcode } from "@/server/actions/products"
import { NextResponse } from "next/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ barcode: string }> }
) {
  const { barcode } = await params
  if (!barcode) {
    return NextResponse.json({ error: "Barcode is required" }, { status: 400 })
  }
  const product = await getProductByBarcode(barcode)
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }
  return NextResponse.json(product)
}
