import * as XLSX from "xlsx"
import { NextResponse } from "next/server"

const headers = [
  "Name",
  "SKU",
  "Barcode",
  "Description",
  "Price",
  "Cost Price",
  "Stock",
  "Min Stock",
  "Category Name",
  "Taxable",
  "Active",
]

export async function GET() {
  const wb = XLSX.utils.book_new()

  const sheets: { name: string; example: (string | number)[] }[] = [
    {
      name: "Minuman",
      example: ["Cola", "SKU-001", "8991234567890", "Soft drink", 5000, 4000, 100, 5, "", "Yes", "Yes"],
    },
    {
      name: "Makanan",
      example: ["Keripik", "SKU-002", "", "Potato chips", 10000, 8000, 50, 10, "", "Yes", "Yes"],
    },
    {
      name: "Lainnya",
      example: ["Sabun", "SKU-003", "", "Hand soap", 15000, 12000, 30, 5, "", "Yes", "Yes"],
    },
  ]

  for (const { name, example } of sheets) {
    const ws = XLSX.utils.aoa_to_sheet([headers, example])
    ws["!cols"] = [
      { wch: 30 },
      { wch: 15 },
      { wch: 18 },
      { wch: 30 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 20 },
      { wch: 10 },
      { wch: 10 },
    ]
    XLSX.utils.book_append_sheet(wb, ws, name)
  }

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="products-template.xlsx"`,
    },
  })
}
