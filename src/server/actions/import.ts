"use server"

import { db } from "@/db"
import { products, categories } from "@/db/schema"
import { revalidatePath } from "next/cache"

interface ImportRowError {
  row: number
  errors: string[]
}

interface ImportResult {
  success: number
  failed: number
  errors: ImportRowError[]
}

function parseBool(val: unknown): boolean {
  if (typeof val === "boolean") return val
  if (typeof val === "number") return val !== 0
  if (typeof val === "string") return ["yes", "true", "1", "y"].includes(val.toLowerCase())
  return true
}

function parseNumber(val: unknown): number | null {
  if (val == null || val === "") return null
  if (typeof val === "number") return val
  const n = Number(String(val).replace(/[^0-9.-]/g, ""))
  return isNaN(n) ? null : n
}

function parseString(val: unknown): string | null {
  if (val == null || val === "") return null
  return String(val).trim()
}

export async function importProducts(rows: Record<string, unknown>[]): Promise<ImportResult> {
  const result: ImportResult = { success: 0, failed: 0, errors: [] }

  const allCategories = await db.select().from(categories)
  const categoryMap = new Map<string, number>()
  for (const c of allCategories) {
    categoryMap.set(c.name.toLowerCase(), c.id)
  }

  const existingSkus = new Set<string>()
  const existing = await db.select({ sku: products.sku }).from(products)
  for (const p of existing) {
    existingSkus.add(p.sku)
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2
    const errors: string[] = []

    const name = parseString(row["Name"])
    if (!name) errors.push("Name is required")

    const sku = parseString(row["SKU"])
    if (!sku) errors.push("SKU is required")
    else if (existingSkus.has(sku)) errors.push(`SKU "${sku}" already exists`)

    const price = parseNumber(row["Price"])
    if (price == null) errors.push("Price is required and must be a number")

    const stock = parseNumber(row["Stock"])
    const stockVal = stock ?? 0

    const barcode = parseString(row["Barcode"])
    const description = parseString(row["Description"])
    const costPrice = parseNumber(row["Cost Price"])
    const minStock = parseNumber(row["Min Stock"])

    let categoryId: number | null = null
    const catName = parseString(row["Category Name"])
    if (catName) {
      const found = categoryMap.get(catName.toLowerCase())
      if (found) {
        categoryId = found
      } else {
        errors.push(`Category "${catName}" not found`)
      }
    }

    const taxable = parseBool(row["Taxable"])
    const active = parseBool(row["Active"])

    if (errors.length > 0) {
      result.failed++
      result.errors.push({ row: rowNum, errors })
      continue
    }

    try {
      await db.insert(products).values({
        name: name!,
        sku: sku!,
        barcode: barcode ?? null,
        description: description ?? null,
        price: String(Math.round(price!)),
        costPrice: costPrice != null ? String(Math.round(costPrice)) : null,
        stock: stockVal,
        minStock: minStock ?? 5,
        categoryId,
        taxable,
        active,
      })
      existingSkus.add(sku!)
      result.success++
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Database error"
      result.failed++
      result.errors.push({ row: rowNum, errors: [msg] })
    }
  }

  revalidatePath("/products")
  return result
}

export async function importCategories(rows: Record<string, unknown>[]): Promise<ImportResult> {
  const result: ImportResult = { success: 0, failed: 0, errors: [] }

  const existingSlugs = new Set<string>()
  const existing = await db.select({ slug: categories.slug }).from(categories)
  for (const c of existing) {
    existingSlugs.add(c.slug)
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2
    const errors: string[] = []

    const name = parseString(row["Name"])
    if (!name) errors.push("Name is required")

    let slug = parseString(row["Slug"])
    if (!slug && name) {
      slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    }
    if (!slug) errors.push("Slug is required (or auto-generated from name)")

    if (slug && existingSlugs.has(slug)) {
      errors.push(`Slug "${slug}" already exists`)
    }

    const description = parseString(row["Description"])

    if (errors.length > 0) {
      result.failed++
      result.errors.push({ row: rowNum, errors })
      continue
    }

    try {
      await db.insert(categories).values({
        name: name!,
        slug: slug!,
        description: description ?? null,
      })
      existingSlugs.add(slug!)
      result.success++
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Database error"
      result.failed++
      result.errors.push({ row: rowNum, errors: [msg] })
    }
  }

  revalidatePath("/categories")
  return result
}
