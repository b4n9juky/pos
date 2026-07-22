@echo off
setlocal enabledelayedexpansion
title POS Rahmat - Setup

cd /d "%~dp0"

call :color Cyan "============================================"
call :color Cyan "      POS Rahmat - Installer"
call :color Cyan "============================================"
echo.

:: --- Check if already installed ---
if exist ".installed" (
  call :color Yellow "Setup sudah pernah dijalankan sebelumnya."
  set /p REINSTALL="Jalankan ulang setup? (y/n): "
  if /i "!REINSTALL!" neq "y" (
    call :color Green "Setup dibatalkan."
    pause
    exit /b
  )
)

:: --- Check Admin rights (needed for execution policy) ---
call :color White "Memeriksa hak administrator..."
net session >nul 2>&1
if %errorlevel% neq 0 (
  call :color Red "PERINGATAN: Tidak dijalankan sebagai Administrator."
  call :color Yellow "PowerShell Execution Policy tidak bisa diubah otomatis."
  call :color Yellow "Lanjutkan? (nanti bisa manual: Set-ExecutionPolicy RemoteSigned)"
  pause
)

:: --- Check prerequisites ---
echo.
call :color White "Memeriksa prasyarat..."
echo.

:: Find Node.js (allow nested folder from zip extraction)
set "NODE_DIR=node"
if not exist "!NODE_DIR!\node.exe" (
  for /d %%d in ("!NODE_DIR!\node-v*-win-x64") do (
    if exist "%%d\node.exe" set "NODE_DIR=%%d"
  )
)
if not exist "!NODE_DIR!\node.exe" (
  call :color Red "Node.js tidak ditemukan di folder node/."
  echo.
  call :color Yellow "Silakan download Node.js portable:"
  echo   https://nodejs.org/dist/v22.14.0/node-v22.14.0-win-x64.zip
  call :color Yellow "Extract ke folder: %~dp0node\ (isi zip, bukan folder dalam zip)"
  echo.
  pause
  exit /b 1
)
call :color Green "  [OK] Node.js ditemukan"

:: Find MariaDB binaries (allow nested folder from zip extraction)
set "MARIA_DIR=mariadb"
if not exist "!MARIA_DIR!\bin\mariadbd.exe" (
  if not exist "!MARIA_DIR!\bin\mysqld.exe" (
    for /d %%d in ("!MARIA_DIR!\mariadb-*-winx64") do (
      if exist "%%d\bin\mariadbd.exe" set "MARIA_DIR=%%d"
      if exist "%%d\bin\mysqld.exe" set "MARIA_DIR=%%d"
    )
  )
)
if not exist "!MARIA_DIR!\bin\mariadbd.exe" (
  if not exist "!MARIA_DIR!\bin\mysqld.exe" (
    call :color Red "MariaDB tidak ditemukan."
    echo.
    call :color Yellow "Silakan download MariaDB portable:"
    echo   https://archive.mariadb.org/mariadb-11.7.2/winx64-packages/mariadb-11.7.2-winx64.zip
    call :color Yellow "Extract ke folder: %~dp0mariadb\ (isi zip, bukan folder dalam zip)"
    echo.
    pause
    exit /b 1
  )
)
call :color Green "  [OK] MariaDB ditemukan (!MARIA_DIR!)"

:: Determine MySQL binary name
set "MYSQLD=mariadbd.exe"
set "MYSQL_INSTALL=mariadb-install-db.exe"
set "MYSQL_CLIENT=mariadb.exe"
if not exist "!MARIA_DIR!\bin\!MYSQLD!" (
  set "MYSQLD=mysqld.exe"
  set "MYSQL_INSTALL=mysql_install_db.exe"
  set "MYSQL_CLIENT=mysql.exe"
)

:: --- Kill any existing MariaDB/MySQL processes ---
taskkill /f /im mariadbd.exe >nul 2>&1
taskkill /f /im mysqld.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: --- Setup MariaDB ---
echo.
call :color White "Menyiapkan database..."
echo.

:: Clean data directory if reinstalling
if exist "data\mysql" (
  call :color Yellow "  Membersihkan data directory lama..."
  rmdir /s /q "data\mysql" >nul 2>&1
  if exist "data\mysql" (
    call :color Red "  Gagal membersihkan data directory."
    call :color Yellow "  Hapus manual folder 'data' lalu coba lagi."
    pause
    exit /b 1
  )
  call :color Green "  [OK] Data directory dibersihkan"
)

call :color White "  Menginisialisasi data directory..."
if not exist "data" mkdir data

"!MARIA_DIR!\bin\!MYSQL_INSTALL!" --datadir="%~dp0data\mysql" --port=3307
if !errorlevel! neq 0 (
  call :color Red "  Gagal menginisialisasi database."
  call :color Red "  Perintah: !MARIA_DIR!\bin\!MYSQL_INSTALL! --datadir=%~dp0data\mysql --port=3307"
  call :color Yellow "  Penyebab umum:"
  call :color Yellow "    - Tidak dijalankan sebagai Administrator"
  call :color Yellow "    - Antivirus memblokir !MYSQL_INSTALL!"
  call :color Yellow "    - Visual C++ Redistributable belum terinstall"
  call :color Yellow "    - Path mengandung karakter khusus"
  call :color Yellow "  Coba jalankan setup sebagai Administrator, atau matikan antivirus sementara."
  pause
  exit /b 1
)
call :color Green "  [OK] Data directory siap"

:: Start MariaDB
call :color White "  Menjalankan MariaDB..."
set "MYSQL_PIDFILE=%~dp0data\mysql.pid"
start /B "" "!MARIA_DIR!\bin\!MYSQLD!" --datadir="%~dp0data\mysql" --port=3307 --skip-grant-tables --pid-file="!MYSQL_PIDFILE!"

:: Wait for MariaDB to be ready (up to 60 seconds)
call :color White "  Menunggu MariaDB siap..."
set "DB_OK="
for /l %%i in (1,1,30) do (
  "!MARIA_DIR!\bin\!MYSQL_CLIENT!" -u root --port=3307 --host=127.0.0.1 --protocol=tcp -e "SELECT 1" >nul 2>&1
  if !errorlevel! equ 0 (
    set "DB_OK=1"
    call :color Green "  [OK] MariaDB siap"
    goto :db_ready
  )
  ping -n 2 127.0.0.1 >nul
)

echo.
call :color Red "  [ERROR] MariaDB gagal start dalam 60 detik."
echo.
call :color Yellow "  Cek file error log di folder data/mysql/:"
echo    %~dp0data\mysql\*.err
echo.
:: Show last 10 lines from error log if exists
for /r "data\mysql" %%f in (*.err) do (
  call :color Cyan "  --- Error log: %%f ---"
  powershell -NoProfile -Command "Get-Content '%%f' -Tail 10" 2>nul
  goto :log_shown
)
:log_shown
echo.
call :color Yellow "  Penyebab umum:"
call :color Yellow "    - Port 3307 sudah dipakai (oleh MariaDB/MySQL lain)"
call :color Yellow "    - Antivirus memblokir !MYSQLD!"
call :color Yellow "    - Visual C++ Redistributable belum terinstall"
call :color Yellow "    - Data directory corrupt"
call :color Yellow "  Solusi:"
call :color Yellow "    - Jalankan setup sebagai Administrator"
call :color Yellow "    - Matikan antivirus sementara"
call :color Yellow "    - Cek apakah port 3307 dipakai: netstat -ano | findstr :3307"
pause
exit /b 1

:db_ready

:: Create database
call :color White "  Membuat database..."
"!MARIA_DIR!\bin\!MYSQL_CLIENT!" -u root --port=3307 --host=127.0.0.1 --protocol=tcp -e "CREATE DATABASE IF NOT EXISTS pos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
if !errorlevel! neq 0 (
  call :color Red "  Gagal membuat database pos_db"
  pause
  exit /b 1
)
call :color Green "  [OK] Database pos_db siap"

:: Run SQL migrations
call :color White "  Menjalankan migrasi database..."
if exist "sql\schema.sql" (
  "!MARIA_DIR!\bin\!MYSQL_CLIENT!" -u root --port=3307 --host=127.0.0.1 --protocol=tcp pos_db < "sql\schema.sql"
  if !errorlevel! neq 0 (
    call :color Red "  Gagal menjalankan migrasi. Cek syntax di sql\schema.sql"
    pause
    exit /b 1
  )
  call :color Green "  [OK] Migrasi selesai"
) else (
  call :color Yellow "  [SKIP] File schema.sql tidak ditemukan"
)

:: --- Generate .env ---
echo.
call :color White "Membuat konfigurasi (.env)..."

:: Detect LAN IP
call :color White "  Mendeteksi IP lokal..."
set "LAN_IP="
for /f "usebackq delims=" %%a in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch '^(169\.254|127\.)' -and $_.PrefixOrigin -ne 'LinkLocal' } | Select-Object -First 1 -ExpandProperty IPAddress)" 2^>nul`) do set "LAN_IP=%%a"
if defined LAN_IP (
  call :color Green "  [OK] LAN IP: !LAN_IP!"
  set "BASE_URL=http://!LAN_IP!:3000"
) else (
  call :color Yellow "  [INFO] Tidak terdeteksi, pakai localhost"
  set "BASE_URL=http://localhost:3000"
)

:: Generate random AUTH_SECRET using PowerShell
for /f "usebackq delims=" %%a in (`powershell -NoProfile -Command "$bytes = [byte[]]::new(48); $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create(); $rng.GetBytes($bytes); Write-Output ([Convert]::ToBase64String($bytes))"`) do set "AUTH_SECRET=%%a"
if "!AUTH_SECRET!"=="" set "AUTH_SECRET=CHANGE_ME_TO_A_RANDOM_STRING"

(
  echo DATABASE_URL=mysql://root:@localhost:3307/pos_db
  echo AUTH_SECRET=!AUTH_SECRET!
  echo NEXT_PUBLIC_APP_URL=!BASE_URL!
) > ".env"
call :color Green "  [OK] .env dibuat"

:: Copy .env to app folder
copy /y ".env" "app\.env" >nul
call :color Green "  [OK] .env disalin ke app"

:: --- Seed database (opsional) ---
echo.
set /p SEED="Ingin mengisi data contoh? (admin + produk demo) (y/n) [y]: "
if /i "!SEED!" neq "n" (
  call :color White "Mengisi data contoh..."

  if exist "sql\seed.sql" (
    "!MARIA_DIR!\bin\!MYSQL_CLIENT!" -u root --port=3307 --host=127.0.0.1 --protocol=tcp pos_db < "sql\seed.sql"
    if !errorlevel! neq 0 (
      call :color Red "  Gagal mengisi data contoh"
    ) else (
      call :color Green "  [OK] Data contoh siap"
    )
  ) else (
    call :color Yellow "  [SKIP] File seed.sql tidak ditemukan"
  )
)

:: --- Stop MariaDB ---
call :color White "Menghentikan MariaDB..."
"!MARIA_DIR!\bin\!MYSQL_CLIENT!" -u root --port=3307 --host=127.0.0.1 --protocol=tcp -e "SHUTDOWN"
ping -n 3 127.0.0.1 >nul
call :color Green "  [OK] MariaDB berhenti"

:: --- Allow ports through Windows Firewall ---
call :color White "Mengizinkan port 3000 dan 8090 untuk akses LAN..."
netsh advfirewall firewall delete rule name="POS Rahmat (TCP 3000)" >nul 2>&1
netsh advfirewall firewall add rule name="POS Rahmat (TCP 3000)" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1
if %errorlevel% equ 0 (
  call :color Green "  [OK] Firewall rule port 3000 ditambahkan"
) else (
  call :color Yellow "  [INFO] Gagal menambah firewall rule port 3000 (butuh Admin)"
)
netsh advfirewall firewall delete rule name="POS Rahmat (TCP 8090)" >nul 2>&1
netsh advfirewall firewall add rule name="POS Rahmat (TCP 8090)" dir=in action=allow protocol=TCP localport=8090 >nul 2>&1
if %errorlevel% equ 0 (
  call :color Green "  [OK] Firewall rule port 8090 ditambahkan"
) else (
  call :color Yellow "  [INFO] Gagal menambah firewall rule port 8090 (butuh Admin)"
)

:: --- Set PowerShell execution policy ---
echo.
call :color White "Mengatur PowerShell Execution Policy (untuk printer)..."
powershell -NoProfile -Command "Set-ExecutionPolicy -Scope CurrentUser RemoteSigned -Force" >nul 2>&1
if %errorlevel% equ 0 (
  call :color Green "  [OK] Execution Policy diatur"
) else (
  call :color Yellow "  [INFO] Gagal mengatur otomatis. Manual: Set-ExecutionPolicy RemoteSigned"
)

:: --- Create shortcut ---
echo.
call :color White "Membuat shortcut desktop..."
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\POS Rahmat.lnk'); $sc.TargetPath = '%~dp0start.bat'; $sc.WorkingDirectory = '%~dp0'; $sc.Description = 'POS Rahmat - Aplikasi Kasir'; $sc.Save()" >nul 2>&1
if %errorlevel% equ 0 (
  call :color Green "  [OK] Shortcut desktop dibuat"
) else (
  call :color Yellow "  [INFO] Gagal membuat shortcut (non-admin). Buat manual nanti."
)

:: --- Done ---
echo.
echo. > ".installed"
call :color Cyan "============================================"
call :color Green "  SETUP SELESAI!"
call :color Cyan "============================================"
echo.
call :color White "Cara menjalankan:"
call :color White "  1. Double-click shortcut 'POS Rahmat' di desktop"
call :color White "     atau start.bat di folder ini"
echo.
if defined LAN_IP (
  call :color White "  Akses dari perangkat LAN lain:"
  call :color Cyan "    http://!LAN_IP!:3000"
  echo.
  call :color White "  Untuk komputer kasir lain:"
  call :color White "    Copy cashier.bat ke USB, jalankan, masukkan IP di atas."
  echo.
)
call :color White "  Login:"
call :color White "    Admin:  admin@pos.com / password"
call :color White "    Kasir:  cashier@pos.com / password"
echo.
call :color White "  Printer: Atur di menu Settings > Printer"
echo.
pause

goto :eof

:color
  powershell -NoProfile -Command "Write-Host '%~2' -ForegroundColor %~1" >nul
  echo %~2
  goto :eof
