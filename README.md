# POS — Point of Sales

Next.js 16 POS application with Drizzle ORM (MySQL), NextAuth v5, Tailwind CSS v4, and shadcn/ui.

## Prerequisites

- Node.js 20+
- MySQL running on `localhost:3306`
- Database `pos_db` created (`CREATE DATABASE pos_db;`)

## Setup

```bash
npm install
```

Create `.env` in the project root:

```
DATABASE_URL=mysql://root:@localhost:3306/pos_db
AUTH_SECRET=<any-random-string>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Push schema and seed data:

```bash
npm run db:push
npm run db:seed
```

Start dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Default credentials

| Role     | Email            | Password |
|----------|------------------|----------|
| Admin    | admin@pos.com    | password |
| Cashier  | cashier@pos.com  | password |

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run db:seed` | Seed database |
| `npm run db:generate` | Generate Drizzle migration |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:studio` | Open Drizzle Studio |

## Keyboard shortcuts (POS page)

| Key | Context | Action |
|-----|---------|--------|
| `F2` | Anywhere | Focus search input |
| `Escape` | Search focused | Clear search and blur input |
| `1`–`9` | Grid visible | Add the Nth visible product to cart |
| `Delete` | Cart has items | Remove the last cart item |
| `F4` | Cart has items | Open checkout modal |
| `F8` | Checkout modal | Quick-cash: auto-fills cash amount and submits |
| `Escape` | Modal open | Close modal (native) |

Page-level shortcuts (`F2`, `Escape`, `1-9`, `Delete`, `F4`) are disabled while the checkout modal is open to avoid conflicts. Modal shortcuts (`F8`, `Escape`) only fire when the modal is open.

Architecture: `src/hooks/use-keyboard.ts` registers global `keydown` listeners. The POS page (`src/app/(dashboard)/pos/page.tsx`) orchestrates page shortcuts. `CheckoutModal` handles `F8` internally.

## Tech stack

- **Framework:** Next.js 16 (App Router)
- **Auth:** NextAuth v5 (credentials, JWT)
- **Database:** MySQL + Drizzle ORM
- **UI:** shadcn/ui (base-nova), Tailwind CSS v4
- **State:** TanStack React Query + React Context (cart)
- **Icons:** lucide-react
