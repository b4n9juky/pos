import { resetProductsAndOrders } from "@/server/actions/reset"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    await resetProductsAndOrders()
    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
