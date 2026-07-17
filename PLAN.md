# Plan: Replace PowerShell GDI+ Printing with ESC/POS via node-thermal-printer

## Problem

Saat ini cetak struk menggunakan arsitektur yang rumit dan rapuh:

```
Client → Next.js API (/api/print-receipt) → PowerShell (dotnet-print2.ps1) → GDI+ (System.Drawing.Printing)
  └→ Fallback: Client → Proxy (print-server, port 8090) → PowerShell → GDI+
```

Masalah:
1. **Plaintext via GDI+** — Menggunakan font `Courier New` yang dirender Windows, bukan ESC/POS native. Tidak bisa cetak barcode/QR code.
2. **PowerShell dependency** — Rawan masalah permission, execution policy, path issues.
3. **Print proxy terpisah** — Perlu menjalankan `print-server/start.bat` secara terpisah.
4. **Performa buruk** — Multi-hop architecture lambat dan tidak stabil.

## Solution

Ganti dengan **`node-thermal-parinter`** library yang mengirim ESC/POS commands langsung ke printer via winspool (Windows native printing).

```
Client → Next.js API (/api/print-receipt) → node-thermal-printer → winspool → printer
```

## Changes

### 1. Install dependency
- Tambah `node-thermal-printer` di root `package.json`
- Tambah `serverExternalPackages` di `next.config.ts`

### 2. Rewrite `src/app/api/print-receipt/route.ts`
- Hapus PowerShell call, `buildReceipt`, `execSync`
- Gunakan `node-thermal-printer` untuk:
  - Alignment, bold, font size
  - Text tabel items
  - Paper cut (auto-cut dari settings)
  - Cash drawer kick
- Dukungan 58mm (32 chars) dan 80mm (42 chars)

### 3. New: `src/app/api/print-receipt/detect/route.ts`
- Deteksi printer Windows via PowerShell `Get-Printer`
- Return daftar nama printer

### 4. New: `src/app/api/print-receipt/test/route.ts`
- Cetak struk test menggunakan `node-thermal-printer`
- Data dummy untuk verifikasi printer

### 5. Update `src/lib/print.ts`
- `sendToThermalPrinter` — tetap sama, payload tidak berubah
- `detectPrinters` — change dari `http://localhost:8090/detect` ke `/api/print-receipt/detect`
- `testPrint` — change dari `http://localhost:8090/test` ke `/api/print-receipt/test`
- Hapus `checkProxyStatus` (tidak diperlukan lagi)

### 6. Update `src/app/(dashboard)/settings/page.tsx`
- Hapus proxy status check (`proxyOnline`, `proxyChecking`)
- `handleDetectPrinters` → panggil `/api/print-receipt/detect`
- `handleTestPrint` → panggil `/api/print-receipt/test`
- Hapus UI indikator proxy online/offline

## Files Affected

| File | Action |
|------|--------|
| `package.json` | Tambah dependency |
| `next.config.ts` | Tambah serverExternalPackages |
| `src/app/api/print-receipt/route.ts` | Rewrite |
| `src/app/api/print-receipt/detect/route.ts` | Create |
| `src/app/api/print-receipt/test/route.ts` | Create |
| `src/lib/print.ts` | Update |
| `src/app/(dashboard)/settings/page.tsx` | Update |

## Rollback Plan

Jika terjadi masalah:
1. `git checkout -- src/app/api/print-receipt/route.ts src/lib/print.ts` — revert code changes
2. `git checkout -- src/app/(dashboard)/settings/page.tsx` — revert settings
3. `npm uninstall node-thermal-printer` — remove package
4. Kembali menggunakan print-server proxy seperti sebelumnya
