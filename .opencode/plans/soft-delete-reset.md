# Plan: Soft-Delete Products + Orders (Data Reset Button)

## Goal
Add **soft delete** to `products`, `orders`, and `order_items`, and provide an
**admin-only in-app reset button** that soft-deletes all products/orders (and
their relation `order_items`). Soft delete keeps rows in the DB (preserving FK
integrity — no `onDelete` cascade issues) while hiding them from all reads.

## Why soft delete
- `order_items.productId → products.id` has **no** `onDelete` rule (RESTRICT).
  A hard `DELETE` of products with existing order_items would fail / break FKs.
- `orders.id → order_items.orderId` is `onDelete: "cascade"`, but we want to
  *retain* history, just hide it. Soft delete avoids all FK problems and is
  reversible (set `deletedAt = NULL`) without re-seeding.

## DB schema changes (migrations)
Add a nullable `deletedAt` column to three tables (drizzle-kit push/migrate):
- `products.deletedAt: timestamp("deleted_at")`
- `orders.deletedAt: timestamp("deleted_at")`
- `order_items.deletedAt: timestamp("deleted_at")`

Files: `src/db/schema/products.ts`, `src/db/schema/orders.ts`,
`src/db/schema/order-items.ts` — add `deletedAt: timestamp("deleted_at")` to each.
Then run `npm run db:generate` + `npm run db:migrate` (or `db:push`).

## Read filters (the core change)
Every product/order read must exclude `deletedAt IS NOT NULL` via `isNull(...)`.
Centralize in the existing base-query helpers:

1. `src/server/actions/products.ts`
   - `getProductBaseQuery()` → add `.where(isNull(products.deletedAt))`.
   - `getProducts` already builds `and(...conditions)`; add the `isNull` condition
     into the array so search/active filters still combine correctly.
   - `getProduct(id)`, `getProductByBarcode(barcode)` → add `isNull` where.
   - `import.ts` SKU-existence check (`db.select().from(products)` line 59)
     should ignore soft-deleted rows: add `isNull(products.deletedAt)`.

2. `src/server/actions/orders.ts`
   - `getOrdersBaseQuery()` → add `.where(isNull(orders.deletedAt))`.
   - `getOrder(id)` → also filter `order_items` by `isNull(orderItems.deletedAt)`
     so a soft-deleted order's line items are excluded.

3. `src/server/actions/reports.ts`
   - All `orders`/`orderItems` aggregate reads (lines 14, 20, 33, 45, 61)
     must add `isNull(orders.deletedAt)` / `isNull(orderItems.deletedAt)`
     so dashboards/reports exclude wiped data.

`import` to add: `isNull` from `drizzle-orm` in each affected file.

## Replace hard delete with soft delete
`src/server/actions/products.ts` → `deleteProduct(id)`:
- Replace `await db.delete(products).where(eq(products.id, id))` with
  `await db.update(products).set({ deletedAt: new Date() }).where(eq(products.id, id))`.
- Remove the order-history guard (no longer needed — soft delete is always safe),
  OR keep it for the per-row UI delete. Decision: keep per-row delete as soft
  delete too, drop the "cannot delete with history" error. Update confirmation
  copy in `products/page.tsx` + `lang/id.ts` accordingly.

Also add `softDeleteAll()` server action (admin-only) in `products.ts`
(or a new `src/server/actions/reset.ts`):
```ts
export async function resetProductsAndOrders() {
  const session = await auth()
  if (session?.user?.role !== "admin") throw new Error("Unauthorized")
  const now = new Date()
  await db.update(orderItems).set({ deletedAt: now })      // all rows
  await db.update(orders).set({ deletedAt: now })          // all rows
  await db.update(products).set({ deletedAt: now })         // all rows
  revalidatePath("/products"); revalidatePath("/orders"); revalidatePath("/reports")
}
```
Order: order_items → orders → products (safe, no FKs violated).

## In-app reset button (UI)
1. Add a "Reset Data" / "Kosongkan Data" section to `src/app/(dashboard)/settings/page.tsx`
   (admin-only area). Button opens a confirm Dialog:
   "This will hide ALL products and orders. Data can be restored by an admin. Continue?"
2. On confirm → call `resetProductsAndOrders()` (new client wrapper in
   `src/server/actions/reset.ts` marked `"use server"`, or add to existing action
   file and import). Show toast on success/failure, `revalidatePath` handles cache.
3. Add translation keys to `src/lib/lang/id.ts`:
   - `"Reset product & order data"`: `"Kosongkan data produk & pesanan"`
   - `"This will hide all products and orders..."`: `...`
   - `"Data reset successfully"`: `"Data berhasil dikosongkan"`

## Files to change
- `src/db/schema/products.ts`, `src/db/schema/orders.ts`, `src/db/schema/order-items.ts` (add `deletedAt`)
- `src/server/actions/products.ts` (`getProductBaseQuery`, `getProducts`, `getProduct`, `getProductByBarcode`, `deleteProduct`, add `resetProductsAndOrders`)
- `src/server/actions/orders.ts` (`getOrdersBaseQuery`, `getOrder`)
- `src/server/actions/reports.ts` (4 aggregate queries)
- `src/server/actions/import.ts` (SKU check filter)
- `src/app/(dashboard)/settings/page.tsx` (reset button + dialog)
- `src/lib/lang/id.ts` (new keys)
- `src/app/(dashboard)/products/page.tsx` + confirm copy (optional cleanup of old delete guard text)

## Verification
- `npm run db:generate && npm run db:migrate`
- `npm run lint` (changed files only) + `npx tsc --noEmit`
- Manual: create products + orders, click Reset in Settings, confirm:
  - Products list empty, POS product grid empty, Orders list empty, Reports zeros.
  - DB rows still present with `deleted_at` set (verify via studio / query).
- Confirm old per-row product delete now soft-deletes (row hidden, not removed).
