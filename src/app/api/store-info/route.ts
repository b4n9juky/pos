import { getSettings } from "@/server/actions/settings"
import { NextResponse } from "next/server"

export async function GET() {
  const data = await getSettings()
  return NextResponse.json({
    storeName: data?.storeName ?? null,
    storeAddress: data?.storeAddress ?? null,
    storePhone: data?.storePhone ?? null,
    receiptFooter: data?.receiptFooter ?? null,
  })
}
