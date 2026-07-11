import * as XLSX from "xlsx"
import { NextResponse } from "next/server"

export async function GET() {
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

  const example = [
    "Example Product",
    "SKU-001",
    "8991234567890",
    "Product description here",
    50000,
    40000,
    100,
    5,
    "Category Name",
    "Yes",
    "Yes",
  ]

  const wb = XLSX.utils.book_new()
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

  XLSX.utils.book_append_sheet(wb, ws, "Products")

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="products-template.xlsx"`,
    },
  })
}
