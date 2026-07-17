# POS — Agent Guide

## Stack specifics (not defaults)

- **Next.js 16.2.9** — auth middleware uses `src/proxy.ts` (convention, not deprecated `middleware.ts`). Export is `export default auth(handler)` from NextAuth v5 wrapper.
- **Tailwind CSS v4** — no `tailwind.config.ts`. Uses `@import "tailwindcss"` in CSS. The `@tailwindcss/postcss` plugin replaces the old `tailwindcss` package.
- **NextAuth v5 beta** — credentials provider, JWT strategy, no adapter. `auth()` wrapper pattern in proxy, standalone `await auth()` in server actions / route handlers.
- **shadcn/ui** (base-nova style) — components in `src/components/ui/`. Run `npx shadcn add` to add new ones.
- **Drizzle ORM + MySQL** — decimal type `{ precision: 12, scale: 0 }` for IDR (no fractional digits). All money values stored as strings in DB, converted with `Number()` on reads, `String()` on writes.

## Data access patterns

| Type | Mechanism | Location |
|------|-----------|----------|
| Writes | Server Actions (`"use server"`) | `src/server/actions/*.ts` |
| Reads (client) | API routes (GET) + React Query | `src/app/api/*/route.ts` |
| Writes (client) | fetch() to API routes (POST/PATCH/DELETE) | Same API routes |

Server Actions call `revalidatePath()` after mutations. React Query calls `invalidateQueries()` on the client for cache sync.

## Auth

- Two roles: `admin`, `cashier`
- `src/proxy.ts` protects all routes. Admin-only routes (`/settings`, `/api/users`, `/api/settings`, `/api/tax-settings`) redirect non-admin to `/pos`.
- Server actions for admin operations (`users.ts`, `settings.ts`, `tax-settings.ts`) call `await auth()` internally and throw `"Unauthorized"` if role is not admin.
- Session is JWT-based, no DB call on `auth()` — just cookie decode.

## Database

```
users, categories, products, customers, orders, order_items, cash_registers, store_settings, tax_settings
```

- `products.price`, `cost_price`, `tax_rate`: decimal(12,0) — handled as string in/out
- `orders.subtotal`, `tax`, `discount`, `total`: decimal(12,0)
- `order_items.unit_price`, `subtotal`: decimal(12,0)
- `store_settings.tax_rate`: int (percentage)
- `tax_settings.rate`: int (percentage)
- Connection pool: mysql2 with `enableKeepAlive`, 10s connect timeout

## Dev commands

```sh
npm run dev         # next dev
npm run build       # next build
npm run lint        # eslint (flat config, v9)
npm run db:seed     # node --import tsx src/db/seed.ts
npm run db:generate # drizzle-kit generate
npm run db:push     # drizzle-kit push
npm run db:migrate  # drizzle-kit migrate
npm run db:studio   # drizzle-kit studio
```

No test framework or test files exist currently.

## Env

```
DATABASE_URL=mysql://root:@localhost:3306/pos_db
AUTH_SECRET=<any-random-string>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`.env*` is gitignored. `src/db/index.ts` loads it via `import "dotenv/config"`.

## Keyboard shortcuts

`src/hooks/use-keyboard.ts` — generic hook. Registers `keydown` on `window`. Accepts `Shortcut[]` (key + handler + optional `ignoreWhenInput`) and an `enabled` flag. Uses a ref pattern (updates ref in a `useEffect`) to avoid stale closures.

| Layer | File | Shortcuts |
|-------|------|-----------|
| Page | `src/app/(dashboard)/pos/page.tsx` | F2 (focus search), Escape (clear search), Delete (remove last item), 1-9 (add Nth product), F4 (open checkout) |
| Modal | `src/components/pos/checkout-modal.tsx` | F8 (quick-cash: auto-fills cash + submits) |

Page shortcuts are disabled when `checkoutOpen` is true. Modal shortcuts are only active when `open && step === "payment"`.

To add a new shortcut: add a `useKeyboard` call in the relevant component with `{ key, handler, ignoreWhenInput }`. If it conflicts with modal state, gate it behind the modal-open boolean.

## Cart system

`src/hooks/use-cart.tsx` — React Context + `useReducer`. State: items array + discount. Computed: subtotal, taxableSubtotal, tax, total, itemCount. Fetches default tax rate from `/api/tax-settings/default` on mount via `useEffect`.

## Order creation flow

1. Client: `CheckoutModal` → `fetch("POST /api/orders")`
2. API route: `createOrder()` server action
3. Zod validation, order number with `crypto.randomInt(0, 999999)`
4. Insert order → batch insert order items → concurrent stock updates via `Promise.all`
5. `revalidatePath("/orders", "/products", "/reports")`

## Misc

- Currency: IDR, locale id-ID, 0 fraction digits
- Order number format: `INV-YYYYMMDD-######`
- Alias `@/` → `./src/*`
- `tsconfig.json`: `strict: true`, `moduleResolution: "bundler"`, `incremental: true`
- `drizzle.config.ts` in root, schema at `src/db/schema/*.ts`, migrations at `src/db/migrations/`
- ESLint: flat config `eslint.config.mjs`, Next.js core-web-vitals + TypeScript

## Portable deployment

Batch files in `portable/` (synced to `dist/` by `tools/build-portable.ps1`):

| File | Purpose |
|------|---------|
| `setup.bat` | One-time install: init MariaDB, create DB, run migrations, seed, generate `.env`, create shortcut |
| `start.bat` | Daily start: kill old processes, start MariaDB (port 3307), start print server (8090), start Next.js app (3000) |
| `uninstall.bat` | Remove all data, config, shortcut |
| `seed-db.bat` | Re-run seed.sql |

### Key fixes applied during development:

1. **Error visibility**: Removed `>nul 2>&1` from all critical MariaDB/MySQL commands in `setup.bat` and `start.bat`. Errors now show on screen and are logged to MariaDB `.err` files.
2. **Longer MariaDB wait**: `start.bat` now waits up to 60 seconds (was 15) for MariaDB crash recovery.
3. **Cleanup on reinstall**: `setup.bat` kills existing MariaDB processes and cleans `data\mysql\` before re-initializing.
4. **`s start command fix**: Replaced fragile `start /MIN cmd /c "cd /d && ..."` pattern with temp batch file (`%TEMP%\pos-start-{app,print}.bat`) to avoid quoting/parsing issues.
5. **Don't kill all node.exe**: `start.bat` no longer runs `taskkill /f /im node.exe` (was killing unrelated Node processes).
6. **AUTH_URL fix**: Generated `.env` now includes `AUTH_URL=http://localhost:3000` — required by NextAuth v5 for correct logout redirects. Without it, redirect defaults to `http://0.0.0.0:3000`.
7. **`.env` validation**: `start.bat` exits with error if `.env` is missing.
8. **Error log tail**: If MariaDB fails to start, error shows the last 10 lines from `data\mysql\*.err` + `netstat` port check. If Next.js fails, shows last 10 lines of `app\server.log`.

### End-user requirements on target computer:
- Node.js v22.14.0 portable (ZIP) extracted to `node/`
- MariaDB 11.7.2 portable (ZIP) extracted to `mariadb/`
- `setup.bat` must be run as Administrator before first use
- Ports: 3000 (app), 3307 (MariaDB), 8090 (print server)
