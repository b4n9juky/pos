import { getDefaultTaxRate } from "@/server/actions/tax-settings"
import { NextResponse } from "next/server"

export async function GET() {
  const data = await getDefaultTaxRate()
  return NextResponse.json(data)
}
