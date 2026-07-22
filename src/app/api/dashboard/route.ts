import { getDashboardData } from "@/server/actions/dashboard"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const from = searchParams.get("from") ?? undefined
  const to = searchParams.get("to") ?? undefined
  const data = await getDashboardData(from, to)
  return NextResponse.json(data)
}
