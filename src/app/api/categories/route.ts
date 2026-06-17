import { getCategories, createCategory, updateCategory } from "@/server/actions/categories"
import { NextResponse } from "next/server"

export async function GET() {
  const data = await getCategories()
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()
  await createCategory(body)
  return NextResponse.json({ success: true })
}

export async function PATCH(req: Request) {
  const body = await req.json()
  await updateCategory(body.id, body)
  return NextResponse.json({ success: true })
}
