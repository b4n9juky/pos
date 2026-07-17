"use server"

import { db } from "@/db"
import { products, categories } from "@/db/schema"
import { eq, like, or } from "drizzle-orm"
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

export async function getProducts(search?: string, limit = 50, offset = 0) {
  const base = getProductBaseQuery()
  if (search) {
    const q = `%${search}%`
    return base.where(
      or(like(products.name, q), like(products.sku, q), like(products.barcode, q))
    ).limit(limit).offset(offset)
  }
  return base.limit(limit).offset(offset)
}

export async function getProduct(id: number) {
  return getProductBaseQuery().where(eq(products.id, id)).then((r) => r[0])
}

export async function getProductByBarcode(barcode: string) {
  return getProductBaseQuery().where(eq(products.barcode, barcode)).then((r) => r[0] ?? null)
}

export async function createProduct(data: z.infer<typeof productSchema>) {
  const session = await auth()
  if (session?.user?.role !== "admin") throw new Error("Unauthorized")
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
  if (session?.user?.role !== "admin") throw new Error("Unauthorized")
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
  if (session?.user?.role !== "admin") throw new Error("Unauthorized")
  await db.update(products).set({ active: false }).where(eq(products.id, id))
  revalidatePath("/products")
}
