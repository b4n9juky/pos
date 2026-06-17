"use server"

import { db } from "@/db"
import { products, categories } from "@/db/schema"
import { eq, like, or } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

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
      active: products.active,
      createdAt: products.createdAt,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
}

export async function getProducts(search?: string) {
  if (search) {
    const q = `%${search}%`
    return getProductBaseQuery().where(
      or(like(products.name, q), like(products.sku, q), like(products.barcode, q))
    )
  }
  return getProductBaseQuery()
}

export async function getProduct(id: number) {
  return getProductBaseQuery().where(eq(products.id, id)).then((r) => r[0])
}

export async function createProduct(data: z.infer<typeof productSchema>) {
  const parsed = productSchema.parse(data)
  await db.insert(products).values({
    ...parsed,
    price: String(parsed.price),
    costPrice: parsed.costPrice ? String(parsed.costPrice) : null,
  })
  revalidatePath("/products")
}

export async function updateProduct(id: number, data: z.infer<typeof productSchema>) {
  const parsed = productSchema.parse(data)
  await db
    .update(products)
    .set({
      ...parsed,
      price: String(parsed.price),
      costPrice: parsed.costPrice ? String(parsed.costPrice) : null,
    })
    .where(eq(products.id, id))
  revalidatePath("/products")
}

export async function deactivateProduct(id: number) {
  await db.update(products).set({ active: false }).where(eq(products.id, id))
  revalidatePath("/products")
}
