import { getSalesSummary } from "@/server/actions/reports"
import { NextResponse } from "next/server"

export async function GET() {
  const data = await getSalesSummary()
  return NextResponse.json(data)
}
