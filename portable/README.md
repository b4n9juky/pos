# POS Rahmat — Portable

Aplikasi kasir portable untuk Windows 10/11.

## Cara Install

### 1. Siapkan folder

Pastikan folder ini berisi:

```
📁 POS Rahmat/
├── 📁 app/              # Aplikasi (jangan dihapus)
├── 📁 print-server/     # Print proxy
├── 📁 node/             # Node.js portable
├── 📁 mariadb/          # MariaDB portable
├── 📁 sql/              # File migrasi
├── 📄 setup.bat         ← Klik ini untuk install
├── 📄 start.bat         ← Klik ini setiap mau pakai
└── 📄 uninstall.bat     ← Hapus
```

### 2. Install (cukup sekali)

1. **Klik kanan `setup.bat` → Run as Administrator** (disarankan)
2. Ikuti petunjuk di layar
3. Kalau ditanya "Ingin mengisi data contoh?" — pilih `y` untuk login langsung

Proses ini akan:
- Membuat database
- Menyiapkan tabel
- Membuat shortcut di desktop
- Mengatur printer (PowerShell)

### 3. Jalankan

- **Double-click `start.bat`** atau shortcut **"POS Rahmat"** di desktop
- Tunggu beberapa detik, browser akan terbuka otomatis
- Login:

| Akun | Email | Password |
|------|-------|----------|
| Admin | admin@pos.com | password |
| Kasir | cashier@pos.com | password |

## Yang Perlu Diketahui

### Port yang dipakai

| Port | Digunakan untuk |
|------|-----------------|
| 3000 | Aplikasi POS (buka di browser) |
| 3307 | Database (hanya lokal) |
| 8090 | Print server (hanya lokal) |

### Printer Thermal

1. Install driver printer thermal dari vendor (Epson, Xprinter, dll)
2. Pastikan nama printer muncul di Settings → Printers
3. Jalankan aplikasi, buka **Settings → Printer**
4. Pilih nama printer, klik **Test Print**

### Aplikasi tidak bisa jalan?

| Masalah | Solusi |
|---------|--------|
| Port 3000 sudah dipakai | Tutup aplikasi lain yang pakai port 3000 |
| "MariaDB gagal" | Jalankan `setup.bat` ulang sebagai Administrator |
| "Node.js tidak ditemukan" | Download node-v22.14.0-win-x64.zip, extract ke folder `node/` |
| "MariaDB tidak ditemukan" | Download mariadb-11.7.2-winx64.zip, extract ke folder `mariadb/` |
| "Printer tidak terdeteksi" | Jalankan PowerShell sebagai Admin: `Set-ExecutionPolicy RemoteSigned` |
| Shortcut tidak muncul | Jalankan `setup.bat` sebagai Administrator |

### Menghapus

Jalankan `uninstall.bat` untuk:
- Menghentikan semua proses
- Menghapus shortcut desktop
- Menghapus database & semua data transaksi

Folder tetap ada — hapus manual jika sudah yakin.

### Backup data

Database ada di folder `data/mysql/`. Untuk backup:
1. Stop aplikasi (tutup semua jendela)
2. Copy folder `data/` ke tempat aman
3. Untuk restore, copy folder `data/` kembali
