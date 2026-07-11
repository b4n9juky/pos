import * as XLSX from "xlsx"
import { NextResponse } from "next/server"

export async function GET() {
  const headers = ["Name", "Slug", "Description"]

  const example = ["Example Category", "example-category", "Category description here"]

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([headers, example])

  ws["!cols"] = [
    { wch: 30 },
    { wch: 30 },
    { wch: 40 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, "Categories")

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="categories-template.xlsx"`,
    },
  })
}
