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
NEXT_PUBLIC_APP_URL=https://pos.berkahutama.web.id
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
6. **AUTH_URL removed**: `AUTH_URL` is no longer set in `.env`. NextAuth v5 has `trustHost: true`, so callback URLs use the request's Host header. This makes login work from any LAN IP without reconfiguring when IPs change. Previously `AUTH_URL` hardcoded the LAN IP, breaking login when IPs changed or from different hosts.
7. **`.env` validation**: `start.bat` exits with error if `.env` is missing.
8. **Error log tail**: If MariaDB fails to start, error shows the last 10 lines from `data\mysql\*.err` + `netstat` port check. If Next.js fails, shows last 10 lines of `app\server.log`.

### End-user requirements on target computer:
- Node.js v22.14.0 portable (ZIP) extracted to `node/`
- MariaDB 11.7.2 portable (ZIP) extracted to `mariadb/`
- `setup.bat` must be run as Administrator before first use
- Ports: 3000 (app), 3307 (MariaDB), 8090 (print server)

## Docker deployment

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build for Next.js standalone |
| `docker-compose.yml` | MariaDB + App services |
| `.dockerignore` | Exclude unnecessary files from build context |
| `scripts/docker-entrypoint.sh` | Entrypoint: auto-migrate + optional seed + start server |
| `scripts/migrate.mjs` | Drizzle migration runner (uses `drizzle-orm/mysql2/migrator`) |
| `scripts/seed.mjs` | Seed script (plain JS, uses `mysql2` + `bcryptjs`) |

### Docker commands

```sh
# Build & run
docker compose build
docker compose up -d

# First deploy with seed data
DB_SEED=true docker compose up -d

# Rebuild after code changes
docker compose build --no-cache app
docker compose up -d

# View logs
docker compose logs -f app

# Run migrations manually
docker compose exec app node scripts/migrate.mjs

# Run seed manually
docker compose exec app node scripts/seed.mjs

# Access DB shell
docker compose exec db mariadb -uroot -p${DB_PASSWORD} pos_rahmat
```

### Environment variables (set in `.env` or Portainer)

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_PASSWORD` | Yes | MariaDB root password |
| `AUTH_SECRET` | Yes | NextAuth JWT secret (min 32 chars) |
| `APP_URL` | Yes | Public URL of the app (e.g. `https://pos.berkahutama.web.id`) |
| `DB_SEED` | No | Set to `true` to seed demo data on first deploy |
| `DB_MIGRATE` | No | Set to `false` to skip auto-migration (default `true`) |

### Nginx integration (dengan existing nginx)

Pos-rahmat tidak pakai nginx sendiri. Gunakan nginx yang sudah ada (yang handle apps lain).

Referensi config ada di `nginx/nginx.conf`. HTTP block sudah include `location /.well-known/acme-challenge/` untuk certbot.

**1. Hubungkan existing nginx ke network `pos-network`**

Di Portainer: container nginx existing → **Network** → Join `pos-network`

Atau via command:
```sh
docker network connect pos-network <existing-nginx-container>
```

**2. Tambah server block ke nginx existing**

Copy isi `nginx/nginx.conf` ke config nginx (misal `/etc/nginx/conf.d/pos.conf`).

**3. Reload nginx**

```sh
docker exec <existing-nginx-container> nginx -t && docker exec <existing-nginx-container> nginx -s reload
```

**4. SSL certificate — auto-renew with Portainer**

Deploy `docker-compose.portainer.yml` sebagai stack terpisah di Portainer:

Portainer → **Stacks** → **Add Stack** → name: `pos-certbot` → paste isi file → **Deploy**

Stack ini berisi:
- `certbot-init` — container standby (sleep infinity) untuk generate SSL pertama
- `certbot-renew` — auto-renew setiap hari jam 3 pagi + reload nginx otomatis

**Generate SSL pertama kali:**

Portainer → **Containers** → `pos-certbot-init` → **Console** → jalankan:
```sh
certbot certonly --webroot -w /var/www/certbot -d pos.berkahutama.web.id
```

Ikuti interaksi (email, agree TOS). Setelah selesai, file cert akan muncul di volume `hadirq_certs_data`.

**5. Verifikasi**

```sh
docker exec <existing-nginx-container> nginx -t && docker exec <existing-nginx-container> nginx -s reload
```

Buka `https://pos.berkahutama.web.id` — harusnya sudah HTTPS.

### Portainer deploy steps

1. Push code changes to GitHub:
   ```sh
   git add .
   git commit -m "update"
   git push
   ```
2. In Portainer: **Stacks → Add Stack**
3. Name: `pos-rahmat`
4. **Build method**: select **Git Repository**
5. Repository URL: `https://github.com/username/pos-rahmat`
6. Branch: `main` (or your default branch)
7. Compose path: `docker-compose.yml`
8. Add environment variables (set via Portainer UI):
   - `DB_PASSWORD` — MariaDB root password
   - `AUTH_SECRET` — NextAuth JWT secret (min 32 chars)
   - `APP_URL` — e.g. `https://pos.berkahutama.web.id`
   - `DB_SEED` — set to `true` only on first deploy
9. **Deploy the stack**

Portainer will clone the repo, build the image using the `Dockerfile`, and create all containers (db, app). For subsequent updates, use **Stack → Re-pull and redeploy** after pushing new code.

### Printing in Docker

Printer USB terhubung ke PC kasir (bukan server). Alur printing:

1. PC kasir jalankan `print-server/start-agent.bat` (PowerShell, tanpa Node.js)
2. Browser di PC kasir → `http://localhost:8090` → print-server → winspool → printer
3. Fallback: browser `window.print()` jika print-server tidak tersedia

Tidak ada perubahan kode — `src/lib/print.ts` sudah pakai `http://localhost:8090` yang mengacu ke localhost browser (PC kasir).
