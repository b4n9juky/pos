# POS Rahmat — Point of Sales

Aplikasi kasir berbasis web untuk toko ritel. Dibangun dengan Next.js 16, Drizzle ORM (MySQL), NextAuth v5, Tailwind CSS v4, dan shadcn/ui.

**Fitur:**
- Manajemen produk, kategori, pelanggan
- Transaksi POS dengan cart system & keyboard shortcuts
- Cetak struk thermal (USB printer)
- Laporan penjualan & riwayat transaksi
- Multi-user (admin & cashier)
- Multi-payment (cash, qris, card, transfer)
- Manajemen kas register
- Hold & recall transaksi (suspend sementara, lanjutkan nanti)

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
| `F6` | Cart has items | Hold (suspend) current transaction |
| `F7` | Held transactions exist | Fire (recall) most recent held transaction |
| `F8` | Checkout modal | Quick-cash: auto-fills cash amount and submits |
| `Escape` | Modal open | Close modal (native) |

Page-level shortcuts (`F2`, `Escape`, `1-9`, `Delete`, `F4`, `F6`, `F7`) are disabled while the checkout modal is open to avoid conflicts. Modal shortcuts (`F8`, `Escape`) only fire when the modal is open.

Architecture: `src/hooks/use-keyboard.ts` registers global `keydown` listeners. The POS page (`src/app/(dashboard)/pos/page.tsx`) orchestrates page shortcuts. `HoldTransactions` component handles `F6`/`F7`. `CheckoutModal` handles `F8` internally.

`F6`/`F7` call `e.preventDefault()` to override browser defaults (F6 = address bar, F7 = caret browsing).

## Portable Package (Windows 10+)

Build paket portable yang bisa dijalankan tanpa install Node.js/MySQL secara manual.

### Build di komputer developer

```powershell
# 1. Build portable package
npm run build:portable

# 2. Download Node.js portable
#    https://nodejs.org/dist/v22.14.0/node-v22.14.0-win-x64.zip
#    Extract ke: dist\node\

# 3. Download MariaDB portable
#    https://archive.mariadb.org/mariadb-11.7.2/winx64-packages/mariadb-11.7.2-winx64.zip
#    Extract ke: dist\mariadb\
```

### Struktur folder setelah setup

```
dist/
├── app/                  # Next.js standalone (pre-built)
├── print-server/         # Print proxy (port 8090)
├── node/                 # Node.js portable
├── mariadb/              # MariaDB portable
├── data/mysql/           # Database files (auto-init)
├── sql/schema.sql        # Migrations
├── .env                  # Auto-generated
├── setup.bat             # ✦ Install (1x)
├── start.bat             # ✦ Jalankan (daily)
└── uninstall.bat         # Hapus
```

### Install di komputer target

| Langkah | Keterangan |
|---------|-------------|
| **1** | Copy folder `dist` ke komputer tujuan (via flashdisk) |
| **2** | **Jalankan `setup.bat`** — 1x saja. Init database, migrasi, seed data contoh |
| **3** | **Jalankan `start.bat`** — setiap mau pakai. Bisa dari shortcut desktop |

### Setup.bat (1x jalan)

- Inisialisasi MariaDB data directory
- Buat database `pos_db`
- Jalankan migrasi (tabel users, products, orders, dll)
- Generate `.env` dengan `AUTH_SECRET` random
- Opsional: isi data contoh (admin, produk, pelanggan)
- Set PowerShell Execution Policy (untuk printer)
- Buat shortcut desktop

### Start.bat (daily)

- Kill proses sebelumnya (mariadbd, node)
- Start MariaDB (port 3307, skip-grant-tables)
- Start Print Server (port 8090)
- Start Next.js App (port 3000)
- Buka browser ke `http://localhost:3000`

### Login default

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@pos.com | password |
| Kasir | cashier@pos.com | password |

### Cetak struk (thermal printer)

1. Pasang printer thermal via USB & install driver dari vendor
2. Jalankan `start.bat` (print-server otomatis jalan di port 8090)
3. Buka Settings → Printer, pilih nama printer dari daftar
4. Klik Test Print untuk verifikasi

**Troubleshooting printer:**
- Pastikan printer terdeteksi di Settings → Bluetooth & devices → Printers
- Jalankan PowerShell sebagai Admin: `Set-ExecutionPolicy RemoteSigned`
- Cek port 8090 tidak dipakai aplikasi lain
- Beberapa printer thermal butuh driver khusus dari vendor (Epson, Xprinter, dll)

### Ingin install sendiri (developer)?

Atau jalankan langsung dengan Node.js + MySQL diinstal manual. Lihat [Setup (manual)](#setup).

## Tech stack

- **Framework:** Next.js 16 (App Router)
- **Auth:** NextAuth v5 (credentials, JWT)
- **Database:** MySQL + Drizzle ORM
- **UI:** shadcn/ui (base-nova), Tailwind CSS v4
- **State:** TanStack React Query + React Context (cart)
- **Icons:** lucide-react
