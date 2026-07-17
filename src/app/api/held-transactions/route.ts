import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { heldTransactions } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { randomInt } from "node:crypto"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = Number(session.user.id)
  const rows = await db
    .select()
    .from(heldTransactions)
    .where(eq(heldTransactions.userId, userId))
    .orderBy(desc(heldTransactions.createdAt))

  const normalized = rows.map((r) => ({
    ...r,
    items: parseItems(r.items),
  }))

  return NextResponse.json(normalized)
}

function parseItems(data: unknown): any[] {
  if (Array.isArray(data)) return data
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : parseItems(parsed)
    } catch {
      return []
    }
  }
  return []
}

function generateReference(existing: string[]): string {
  for (let i = 1; i < 9999; i++) {
    const ref = `HOLD-${String(i).padStart(3, "0")}`
    if (!existing.includes(ref)) return ref
  }
  return `HOLD-${String(randomInt(0, 9999)).padStart(4, "0")}`
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const userId = Number(session.user.id)
    const customerId = body.customerId ? Number(body.customerId) : null
    const discount = String(body.discount ?? 0)

    const existing = await db
      .select({ reference: heldTransactions.reference })
      .from(heldTransactions)
      .then((rows) => rows.map((r) => r.reference))

    const reference = generateReference(existing)

    const result = await db.insert(heldTransactions).values({
      userId,
      reference,
      customerId,
      discount,
      items: body.items ?? [],
    })

    const id = Number(result[0].insertId)

    return NextResponse.json({ id, reference })
  } catch (e: any) {
    console.error("POST /api/held-transactions error:", e)
    return NextResponse.json({ error: e?.message ?? "Internal server error" }, { status: 500 })
  }
}
