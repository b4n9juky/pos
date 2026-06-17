import { getUser, updateUser, toggleUserActive } from "@/server/actions/users"
import { NextResponse } from "next/server"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getUser(Number(id))
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    await updateUser(Number(id), body)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error("PATCH /api/users error:", e?.message ?? e)
    return NextResponse.json({ error: e?.message ?? "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await toggleUserActive(Number(id))
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error("DELETE /api/users error:", e?.message ?? e)
    return NextResponse.json({ error: e?.message ?? "Internal server error" }, { status: 500 })
  }
}
