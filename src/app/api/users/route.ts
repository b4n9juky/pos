import { getUsers, createUser } from "@/server/actions/users"
import { NextResponse } from "next/server"

export async function GET() {
  const data = await getUsers()
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    await createUser(body)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error("POST /api/users error:", e?.message ?? e)
    return NextResponse.json({ error: e?.message ?? "Internal server error" }, { status: 500 })
  }
}
