"use server"

import { db } from "@/db"
import { products, categories } from "@/db/schema"
import { eq, like, or, and, isNull, asc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/lib/auth"

const productSchema = z.object({
  name: z.string().min(1).max(255),
  sku: z.string().min(1).max(100),
  barcode: z.string().max(100).nullable(),
  description: z.string().nullable(),
  price: z.number().min(0),
  costPrice: z.number().min(0).nullable(),
  stock: z.number().int().min(0),
  minStock: z.number().int().min(0),
  categoryId: z.number().int().nullable(),
  taxable: z.boolean(),
  taxRate: z.number().min(0).max(100).nullable().optional(),
  active: z.boolean(),
})

function getProductBaseQuery() {
  return db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      barcode: products.barcode,
      description: products.description,
      price: products.price,
      costPrice: products.costPrice,
      stock: products.stock,
      minStock: products.minStock,
      categoryId: products.categoryId,
      categoryName: categories.name,
      image: products.image,
      taxable: products.taxable,
      taxRate: products.taxRate,
      active: products.active,
      createdAt: products.createdAt,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
}

export async function getProducts(search?: string, limit = 50, offset = 0, active?: boolean) {
  const base = getProductBaseQuery()
  const conditions = [isNull(products.deletedAt)]
  if (search) {
    const q = `%${search}%`
    const searchCond = or(like(products.name, q), like(products.sku, q), like(products.barcode, q))
    if (searchCond) conditions.push(searchCond)
  }
  if (active !== undefined) {
    conditions.push(eq(products.active, active))
  }
  return base.where(and(...conditions)).orderBy(asc(products.name)).limit(limit).offset(offset)
}

export async function getProduct(id: number) {
  return getProductBaseQuery().where(and(eq(products.id, id), isNull(products.deletedAt))).then((r) => r[0])
}

export async function getProductByBarcode(barcode: string) {
  return getProductBaseQuery().where(and(eq(products.barcode, barcode), isNull(products.deletedAt))).then((r) => r[0] ?? null)
}

export async function createProduct(data: z.infer<typeof productSchema>) {
  const session = await auth()
  if (session?.user?.role !== "admin" && session?.user?.role !== "warehouse") throw new Error("Unauthorized")
  const parsed = productSchema.parse(data)
  await db.insert(products).values({
    ...parsed,
    price: String(parsed.price),
    costPrice: parsed.costPrice ? String(parsed.costPrice) : null,
    taxRate: parsed.taxRate != null ? String(parsed.taxRate) : null,
  })
  revalidatePath("/products")
}

export async function updateProduct(id: number, data: z.infer<typeof productSchema>) {
  const session = await auth()
  if (session?.user?.role !== "admin" && session?.user?.role !== "warehouse") throw new Error("Unauthorized")
  const parsed = productSchema.parse(data)
  await db
    .update(products)
    .set({
      ...parsed,
      price: String(parsed.price),
      costPrice: parsed.costPrice ? String(parsed.costPrice) : null,
      taxRate: parsed.taxRate != null ? String(parsed.taxRate) : null,
    })
    .where(eq(products.id, id))
  revalidatePath("/products")
}

export async function deactivateProduct(id: number) {
  const session = await auth()
  if (session?.user?.role !== "admin" && session?.user?.role !== "warehouse") throw new Error("Unauthorized")
  await db.update(products).set({ active: false }).where(eq(products.id, id))
  revalidatePath("/products")
}

export async function reactivateProduct(id: number) {
  const session = await auth()
  if (session?.user?.role !== "admin" && session?.user?.role !== "warehouse") throw new Error("Unauthorized")
  await db.update(products).set({ active: true }).where(eq(products.id, id))
  revalidatePath("/products")
}

export async function deleteProduct(id: number) {
  const session = await auth()
  if (session?.user?.role !== "admin" && session?.user?.role !== "warehouse") throw new Error("Unauthorized")
  await db.update(products).set({ deletedAt: new Date() }).where(eq(products.id, id))
  revalidatePath("/products")
}
