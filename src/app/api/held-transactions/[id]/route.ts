import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { heldTransactions } from "@/db/schema"
import { eq, and } from "drizzle-orm"

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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const userId = Number(session.user.id)
  const holdId = Number(id)

  const row = await db
    .select()
    .from(heldTransactions)
    .where(and(eq(heldTransactions.id, holdId), eq(heldTransactions.userId, userId)))
    .then((rows) => rows[0])

  if (!row) {
    return NextResponse.json({ error: "Held transaction not found" }, { status: 404 })
  }

  await db.delete(heldTransactions).where(eq(heldTransactions.id, holdId))

  const items = parseItems(row.items)

  return NextResponse.json({
    items,
    discount: Number(row.discount),
    customerId: row.customerId,
    reference: row.reference,
  })
}
