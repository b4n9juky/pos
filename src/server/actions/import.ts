"use server"

import { db } from "@/db"
import { products, categories } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

interface ImportRowError {
  row: number
  errors: string[]
}

interface ImportRowWarning {
  row: number
  message: string
}

interface ImportResult {
  success: number
  updated: number
  failed: number
  errors: ImportRowError[]
  warnings: ImportRowWarning[]
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
  const session = await auth()
  if (session?.user?.role !== "admin" && session?.user?.role !== "warehouse") throw new Error("Unauthorized")
  const result: ImportResult = { success: 0, updated: 0, failed: 0, errors: [], warnings: [] }

  const allCategories = await db.select().from(categories)
  const categoryMap = new Map<string, number>()
  for (const c of allCategories) {
    categoryMap.set(c.name.toLowerCase(), c.id)
  }

  const sheetNames = [...new Set(rows.map((r) => parseString(r.__sheet)).filter(Boolean) as string[])]
  for (const name of sheetNames) {
    if (!categoryMap.has(name.toLowerCase())) {
      const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
      const [{ insertId }] = await db.insert(categories).values({ name, slug })
      categoryMap.set(name.toLowerCase(), insertId)
    }
  }

  const allProducts = await db.select({
    id: products.id,
    sku: products.sku,
    barcode: products.barcode,
    name: products.name,
  }).from(products)

  const existingBySku = new Map<string, number>()
  const existingByBarcode = new Map<string, number>()
  const existingByName = new Map<string, number>()
  for (const p of allProducts) {
    existingBySku.set(p.sku, p.id)
    if (p.barcode) existingByBarcode.set(p.barcode, p.id)
    existingByName.set(p.name.toLowerCase(), p.id)
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2
    const errors: string[] = []

    const name = parseString(row["Name"])
    if (!name) errors.push("Name is required")

    const sku = parseString(row["SKU"])
    if (!sku) errors.push("SKU is required")

    const price = parseNumber(row["Price"])
    if (price == null) errors.push("Price is required and must be a number")

    const stock = parseNumber(row["Stock"])
    const stockVal = stock ?? 0

    const barcode = parseString(row["Barcode"])
    const description = parseString(row["Description"])
    const costPrice = parseNumber(row["Cost Price"])
    const minStock = parseNumber(row["Min Stock"])

    let categoryId: number | null = null
    const sheetCat = parseString(row.__sheet)
    if (sheetCat) {
      const found = categoryMap.get(sheetCat.toLowerCase())
      if (found) categoryId = found
    } else {
      const catName = parseString(row["Category Name"])
      if (catName) {
        const found = categoryMap.get(catName.toLowerCase())
        if (found) {
          categoryId = found
        } else {
          errors.push(`Category "${catName}" not found`)
        }
      }
    }

    const taxable = parseBool(row["Taxable"])
    const active = parseBool(row["Active"])

    if (errors.length > 0) {
      result.failed++
      result.errors.push({ row: rowNum, errors })
      continue
    }

    const existingId = sku ? existingBySku.get(sku) : undefined
    if (existingId != null) {
      try {
        await db.update(products).set({
          name: name!,
          barcode: barcode ?? null,
          description: description ?? null,
          price: String(Math.round(price!)),
          costPrice: costPrice != null ? String(Math.round(costPrice)) : null,
          stock: stockVal,
          minStock: minStock ?? 5,
          categoryId,
          taxable,
          active,
          deletedAt: null,
        }).where(eq(products.id, existingId))
        result.warnings.push({ row: rowNum, message: `SKU "${sku}" already exists — updated` })
        result.updated++
        if (barcode) existingByBarcode.set(barcode, existingId)
        if (name) existingByName.set(name.toLowerCase(), existingId)
        continue
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Database error"
        result.failed++
        result.errors.push({ row: rowNum, errors: [msg] })
        continue
      }
    }

    if (barcode && existingByBarcode.has(barcode)) {
      result.warnings.push({ row: rowNum, message: `Barcode "${barcode}" already used by another product — skipped` })
      result.failed++
      continue
    }

    if (name && existingByName.has(name.toLowerCase())) {
      result.warnings.push({ row: rowNum, message: `Name "${name}" already exists — skipped` })
      result.failed++
      continue
    }

    try {
      const [{ insertId }] = await db.insert(products).values({
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
      existingBySku.set(sku!, insertId)
      if (barcode) existingByBarcode.set(barcode, insertId)
      if (name) existingByName.set(name.toLowerCase(), insertId)
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
  const session = await auth()
  if (session?.user?.role !== "admin") throw new Error("Unauthorized")
  const result: ImportResult = { success: 0, updated: 0, failed: 0, errors: [], warnings: [] }

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

    const description = parseString(row["Description"])

    if (errors.length > 0) {
      result.failed++
      result.errors.push({ row: rowNum, errors })
      continue
    }

    if (slug && existingSlugs.has(slug)) {
      try {
        await db.update(categories).set({
          name: name!,
          description: description ?? null,
        }).where(eq(categories.slug, slug))
        result.warnings.push({ row: rowNum, message: `Slug "${slug}" already exists — updated` })
        result.updated++
        continue
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Database error"
        result.failed++
        result.errors.push({ row: rowNum, errors: [msg] })
        continue
      }
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
