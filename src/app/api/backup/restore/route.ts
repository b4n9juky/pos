import { auth } from "@/lib/auth"
import mysql from "mysql2/promise"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const session = await auth()
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const url = process.env.DATABASE_URL
  if (!url) {
    return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  if (!file.name.endsWith(".sql")) {
    return NextResponse.json({ error: "Only .sql files are accepted" }, { status: 400 })
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 })
  }

  const sql = await file.text()

  let conn
  try {
    conn = await mysql.createConnection({ uri: url, connectTimeout: 10000 })
  } catch {
    return NextResponse.json({ error: "Failed to connect to database" }, { status: 500 })
  }

  try {
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"))

    await conn.query("SET FOREIGN_KEY_CHECKS = 0")
    await conn.query("SET UNIQUE_CHECKS = 0")
    await conn.query("SET sql_mode = ''")

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i]
      try {
        await conn.query(stmt)
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error"
        return NextResponse.json(
          { error: `Error at statement ${i + 1}: ${msg}` },
          { status: 500 },
        )
      }
    }

    await conn.query("SET FOREIGN_KEY_CHECKS = 1")
    await conn.query("SET UNIQUE_CHECKS = 1")

    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  } finally {
    await conn.end()
  }
}
