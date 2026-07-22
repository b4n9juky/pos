import { auth } from "@/lib/auth"
import mysql from "mysql2/promise"
import { NextResponse } from "next/server"

function escape(val: unknown): string {
  if (val === null || val === undefined) return "NULL"
  if (typeof val === "number") return String(val)
  if (val instanceof Date) {
    return `'${val.toISOString().slice(0, 19).replace("T", " ")}'`
  }
  const s = String(val)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
  return `'${s}'`
}

export async function GET() {
  const session = await auth()
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const url = process.env.DATABASE_URL
  if (!url) {
    return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 })
  }

  let conn
  try {
    conn = await mysql.createConnection({ uri: url, connectTimeout: 10000 })
  } catch {
    return NextResponse.json({ error: "Failed to connect to database" }, { status: 500 })
  }

  try {
    const [dbName] = await conn.query("SELECT DATABASE() AS db")
    const database = (dbName as { db: string }[])[0].db

    const [tables] = await conn.query("SHOW TABLES")
    const tableNames = (tables as { [key: string]: string }[]).map((r) => Object.values(r)[0] as string)

    const lines: string[] = [
      `-- Backup: ${database}`,
      `-- Generated: ${new Date().toISOString()}`,
      "",
      `CREATE DATABASE IF NOT EXISTS \`${database}\`;`,
      `USE \`${database}\`;`,
      "",
    ]

    for (const table of tableNames) {
      const [createResult] = await conn.query(`SHOW CREATE TABLE \`${table}\``)
      const createStmt = (createResult as { [key: string]: string }[])[0]["Create Table"]

      lines.push(`DROP TABLE IF EXISTS \`${table}\`;`)
      lines.push(`${createStmt};`)
      lines.push("")

      const [rows] = await conn.query(`SELECT * FROM \`${table}\``)
      const data = rows as Record<string, unknown>[]
      if (data.length === 0) continue

      const columns = Object.keys(data[0])
      const colList = columns.map((c) => `\`${c}\``).join(", ")

      for (const row of data) {
        const values = columns.map((c) => escape(row[c])).join(", ")
        lines.push(`INSERT INTO \`${table}\` (${colList}) VALUES (${values});`)
      }
      lines.push("")
    }

    const content = lines.join("\n")
    const buf = Buffer.from(content, "utf-8")

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "")
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/sql",
        "Content-Disposition": `attachment; filename="${database}-backup-${dateStr}.sql"`,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  } finally {
    await conn.end()
  }
}
