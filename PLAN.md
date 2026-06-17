# POS (Point of Sales) Application Plan

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 14 (App Router)** — Server Components, Server Actions |
| Auth | **NextAuth.js v5** — credentials provider (email/password) |
| Database | **Drizzle ORM + mysql2** — type-safe SQL, migrations |
| Client State | **TanStack React Query** — server-state caching, optimistic updates |
| Tables | **TanStack Table** — sorting, filtering, pagination |
| UI | **shadcn/ui + Tailwind CSS** — accessible, themed components |
| Forms | **React Hook Form + Zod** — validated forms |
| Printing | **@react-print** + iframe-based receipt rendering |

---

## Database Schema (7 tables)

```
users ──┐
         ├── orders ── order_items ── products
         │                              └── categories
         └── cash_registers
customers ──┘
payments ──┘
```

### Tables

- **users** — id, name, email, password_hash, role (admin/cashier), active, timestamps
- **categories** — id, name, slug, description, timestamps
- **products** — id, name, sku, barcode, description, price, cost_price, stock, min_stock, category_id, image, active, timestamps
- **customers** — id, name, email, phone, address, loyalty_points, timestamps
- **orders** — id, order_number, customer_id, user_id, subtotal, tax, discount, total, payment_method, payment_status, status, notes, timestamps
- **order_items** — id, order_id, product_id, quantity, unit_price, subtotal
- **payments** — id, order_id, amount, payment_method, reference
- **cash_registers** — id, user_id, opened_at, closed_at, opening_balance, closing_balance, expected_balance, status, notes

---

## Project Structure

```
pos/
├── src/
│   ├── app/
│   │   ├── (auth)/login/
│   │   ├── (dashboard)/
│   │   │   ├── pos/
│   │   │   ├── products/
│   │   │   ├── categories/
│   │   │   ├── customers/
│   │   │   ├── orders/
│   │   │   ├── reports/
│   │   │   ├── register/
│   │   │   └── settings/
│   │   ├── api/auth/[...nextauth]/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/          (shadcn primitives)
│   │   ├── pos/         (Cart, ProductGrid, PaymentModal, Receipt)
│   │   ├── tables/      (TanStack Table wrappers)
│   │   ├── forms/       (ProductForm, CustomerForm, CategoryForm)
│   │   └── layout/      (Sidebar, Header, Nav)
│   ├── db/
│   │   ├── schema/      (Drizzle schema files)
│   │   └── index.ts     (Connection + client)
│   ├── lib/             (Auth config, constants, utils)
│   ├── hooks/           (useCart, useDebounce)
│   ├── server/actions/  (Server Actions — mutations)
│   ├── providers/       (QueryClient, Session, Theme)
│   └── styles/globals.css
├── drizzle.config.ts
├── next.config.ts
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## Data Flow

```
User Action
    ↓
Server Action (mutation) ──→ Drizzle ORM ──→ MySQL
    ↓
revalidatePath / revalidateTag
    ↓
React Query refetch ←── Server Component re-render
    ↓
TanStack Table / UI updates
```

- **Mutations**: Server Actions → Drizzle → revalidate + invalidate React Query cache
- **Queries**: Server Components fetch directly; client components use React Query + TanStack Table

---

## Implementation Order

| Step | Description |
|------|-------------|
| 1 | Scaffold Next.js + deps, configure Tailwind + shadcn |
| 2 | Drizzle schemas + migration |
| 3 | NextAuth v5 setup + middleware |
| 4 | Auth pages + dashboard layout with sidebar |
| 5 | Products & Categories CRUD |
| 6 | Customers CRUD |
| 7 | POS Checkout (cart, product grid, checkout modal) |
| 8 | Orders management + receipt printing |
| 9 | Cash Register module |
| 10 | Sales Reports + seed script |

---

## Route Design

| Route | Purpose |
|-------|---------|
| `/login` | Auth page |
| `/pos` | Main POS checkout interface |
| `/products` | Product list with search/filter |
| `/products/new` | Add new product |
| `/products/[id]` | Edit product |
| `/categories` | Category management |
| `/customers` | Customer list |
| `/customers/new` | Add customer |
| `/orders` | Order history |
| `/orders/[id]` | Order detail |
| `/reports` | Sales reports dashboard |
| `/register` | Cash register open/close |
| `/settings` | User management, store settings |
