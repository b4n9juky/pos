# Update & Restore — Portable Deployment

Panduan update aplikasi POS Rahmat di PC kasir dengan aman (backup otomatis + rollback).

## Alur Update

```
Dev Machine                    PC Kasir
───────────                    ────────
npm run build            →    
dist/ folder ready       →    Extract ke update/
                             Jalankan update.bat
                             Selesai
```

## Cara Update

### 1. Build Versi Baru

Di dev machine:

```bat
npm run build
.\tools\build-portable.ps1
```

Folder `dist/` akan berisi file yang siap distribute.

### 2. Distribute ke PC Kasir

Copy folder `dist/` ke PC kasir (USB, network share, atau langsung copy).

### 3. Extract ke Folder `update/`

Di PC kasir, buat folder `update/` lalu extract file baru ke sana:

```
pos-rahmat/              ← instalasi yang sedang jalan
├── update\              ← extract versi baru di sini
│   ├── app\
│   ├── print-server\
│   ├── sql\
│   └── *.bat
├── app\                 ← versi lama (akan diganti)
├── data\mysql\          ← database (JANGAN DIHAPUS MANUAL)
├── .env
└── ...
```

### 4. Jalankan `update.bat`

```bat
update.bat
```

Script akan otomatis:
1. **Stop semua service** (Node.js, MariaDB, print agent)
2. **Backup** ke `backup/pos-backup-YYYYMMDD-HHMMSS/`:
   - `data/mysql/` (database)
   - `.env` (konfigurasi)
   - `app/` (versi lama)
   - Batch files
3. **Replace** app dengan versi baru dari `update/`
4. **Jalankan migrasi** database (`sql/upgrade.sql`) jika ada
5. **Cleanup** folder `update/`

### 5. Jalankan Aplikasi

```bat
start.bat
```

## Cara Restore (Rollback)

Jika update bermasalah (app crash, migration error, dll):

```bat
restore.bat
```

Script akan:
1. Stop semua service
2. Tampilkan list backup yang tersedia
3. User pilih nomor backup
4. **Backup current state** dulu (safety net)
5. Restore dari backup yang dipilih
6. User jalankan `start.bat`

### Contoh Output

```
POS Rahmat - Restore Backup

[1/4] Menghentikan semua service...
[2/4] Mencari backup yang tersedia...

  [1] backup\pos-backup-20260809-1031
      POS Rahmat Backup
      Date: Sun 08/09/2026 10:31:30
      Machine: KASIR-01
      User: admin

  [2] backup\pos-backup-20260808-1422
      POS Rahmat Backup
      Date: Sat 08/08/2026 14:22:15
      Machine: KASIR-01
      User: admin

  Pilih backup yang ingin direstore:
  Pilih nomor [1-2]: 1

  PERINGATAN: Ini akan mengembalikan:
    - Database (data\mysql\)
    - Konfigurasi (.env)
    - App versi lama

  Data transaksi SETELAH backup ini akan HILANG!
  Lanjutkan restore? (y/n): y
```

## Struktur Backup

```
backup/
├── pos-backup-20260809-1031/
│   ├── backup-info.txt    ← tanggal, mesin, user
│   ├── data/
│   │   └── mysql/         ← database snapshot
│   ├── app/               ← versi app saat backup
│   ├── .env
│   ├── .installed
│   ├── version.json
│   ├── setup.bat
│   ├── start.bat
│   └── ...
├── pos-backup-20260808-1422/
│   └── ...
└── ...
```

Backup tidak pernah dihapus otomatis. Hapus manual jika sudah yakin tidak perlu rollback.

## Troubleshooting

### Update gagal — app tidak bisa start

1. Jalankan `restore.bat`
2. Pilih backup sebelum update
3. Jalankan `start.bat`

### Migrasi database gagal

1. Script otomatis stop MariaDB
2. Jalankan `restore.bat` untuk rollback database
3. Atau fix `sql/upgrade.sql` manual, lalu jalankan `db-upgrade.bat`

### Backup tidak ditemukan

1. Cek folder `backup/`
2. Jika kosong, berarti belum pernah update (atau backup dihapus manual)
3. Untuk install ulang: jalankan `setup.bat` (WARNING: data akan hilang)

### Folder `update/` tidak ter-cleanup

Jalankan manual:

```bat
rmdir /s /q update
```

## Catatan Teknis

- **Timestamp backup** menggunakan format `YYYYMMDD-HHMMSS` (locale-independent)
- **Variable expansion** menggunakan `!VAR!` (delayed expansion) untuk runtime values
- **MariaDB port** default: 3307
- **Backup info** disimpan di `backup-info.txt` (tanggal, mesin, user)
- **Safety net**: restore.bat backup current state sebelum restore (jika restore gagal)
