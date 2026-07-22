import { getProduct, updateProduct, deactivateProduct, reactivateProduct, deleteProduct } from "@/server/actions/products"
import { NextResponse } from "next/server"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getProduct(Number(id))
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  await updateProduct(Number(id), body)
  return NextResponse.json({ success: true })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await reactivateProduct(Number(id))
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const url = new URL(req.url)
  const hard = url.searchParams.get("hard") === "true"
  if (hard) {
    await deleteProduct(Number(id))
  } else {
    await deactivateProduct(Number(id))
  }
  return NextResponse.json({ success: true })
}
