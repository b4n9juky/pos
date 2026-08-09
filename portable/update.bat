@echo off
setlocal enabledelayedexpansion
title POS Rahmat - Update
cd /d "%~dp0"

echo ============================================
echo       POS Rahmat - Update
echo ============================================
echo.
echo Script ini akan:
echo   1. Backup data ke folder backup/
echo   2. Replace app dengan versi baru
echo   3. Jalankan migrasi database
echo   4. Restart aplikasi
echo.

:: --- Check if installed ---
if not exist ".installed" (
  echo [ERROR] POS Rahmat belum diinstall.
  echo Jalankan setup.bat terlebih dahulu.
  pause
  exit /b 1
)

:: --- Check if update files exist ---
if not exist "update\app" (
  echo [ERROR] Folder update\app tidak ditemukan!
  echo.
  echo Cara update:
  echo   1. Download versi baru
  echo   2. Extract ke folder "update\" di sini
  echo   3. Jalankan update.bat
  echo.
  echo Struktur yang diharapkan:
  echo   update\
  echo     app\          ^(Next.js build baru^)
  echo     print-server\ ^(print agent baru^)
  echo     sql\          ^(migrasi baru^)
  echo     setup.bat     ^(opsional^)
  echo     start.bat     ^(opsional^)
  echo     update.bat    ^(opsional^)
  echo.
  pause
  exit /b 1
)

:: --- Stop services ---
echo [1/6] Menghentikan semua service...
echo.

:: Kill Next.js
taskkill /f /im node.exe >nul 2>&1
:: Kill print agent
wmic process where "commandline like '%%agent.ps1%%'" call terminate >nul 2>&1
:: Kill MariaDB
taskkill /f /im mariadbd.exe >nul 2>&1
taskkill /f /im mysqld.exe >nul 2>&1
timeout /t 3 /nobreak >nul
echo   [OK] Semua service dihentikan

:: --- Create backup ---
echo.
echo [2/6] Membuat backup...

:: Generate timestamp
for /f "tokens=1-3 delims=/ " %%a in ('date /t') do set "DATE_STAMP=%%a%%b%%c"
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set "TIME_STAMP=%%a%%b"
:: Clean timestamp (remove leading spaces)
set "DATE_STAMP=!DATE_STAMP: =0!"
set "TIME_STAMP=!TIME_STAMP: =0!"
set "BACKUP_DIR=backup\pos-backup-!DATE_STAMP!-!TIME_STAMP!"

if not exist "backup" mkdir backup
mkdir "!BACKUP_DIR!" 2>nul

:: Backup database
echo   Backing up data\mysql...
if exist "data\mysql" (
  xcopy /s /e /i /q /y "data\mysql" "!BACKUP_DIR!\data\mysql" >nul
  echo   [OK] Database di-backup
) else (
  echo   [SKIP] Tidak ada data database
)

:: Backup config files
echo   Backing up konfigurasi...
if exist ".env" copy /y ".env" "!BACKUP_DIR!\.env" >nul
if exist ".installed" copy /y ".installed" "!BACKUP_DIR!\.installed" >nul
if exist "version.json" copy /y "version.json" "!BACKUP_DIR!\version.json" >nul
echo   [OK] Konfigurasi di-backup

:: Backup current app (for rollback)
echo   Backing up app versi lama...
if exist "app" (
  xcopy /s /e /i /q /y "app" "!BACKUP_DIR!\app" >nul
  echo   [OK] App lama di-backup
) else (
  echo   [SKIP] Tidak ada app lama
)

:: Backup batch files
for %%f in (setup.bat start.bat uninstall.bat db-upgrade.bat cashier.bat kiosk-setup.bat fix-auth-url.bat seed-db.bat) do (
  if exist "%%f" copy /y "%%f" "!BACKUP_DIR!\%%f" >nul
)
echo   [OK] Batch files di-backup

:: Save backup info
(
  echo POS Rahmat Backup
  echo Date: %DATE% %TIME%
  echo Machine: %COMPUTERNAME%
  echo User: %USERNAME%
) > "!BACKUP_DIR!\backup-info.txt"

echo.
echo   ============================================
echo   Backup tersimpan di: !BACKUP_DIR!
echo   ============================================

:: --- Replace app ---
echo.
echo [3/6] Replace app dengan versi baru...

:: Remove old app
if exist "app" (
  rmdir /s /q "app" 2>nul
  if exist "app" (
    echo [ERROR] Gagal menghapus app lama!
    echo Pastikan aplikasi sudah ditutup.
    pause
    exit /b 1
  )
)

:: Copy new app
xcopy /s /e /i /q /y "update\app" "app\" >nul
if !errorlevel! neq 0 (
  echo [ERROR] Gagal menyalin app baru!
  echo Backup tersimpan di: !BACKUP_DIR!
  pause
  exit /b 1
)
echo   [OK] App baru terinstall

:: --- Replace print-server ---
echo.
echo [4/6] Replace print-server...
if exist "update\print-server" (
  if exist "print-server" rmdir /s /q "print-server" 2>nul
  xcopy /s /e /i /q /y "update\print-server" "print-server\" >nul
  echo   [OK] Print-server diperbarui
) else (
  echo   [SKIP] Tidak ada update print-server
)

:: --- Replace batch files ---
echo.
echo [5/6] Update batch files...
for %%f in (setup.bat start.bat uninstall.bat update.bat restore.bat db-upgrade.bat cashier.bat kiosk-setup.bat fix-auth-url.bat seed-db.bat) do (
  if exist "update\%%f" (
    copy /y "update\%%f" "%%f" >nul
    echo   [OK] %%f diperbarui
  )
)

:: Copy new sql files
if exist "update\sql" (
  if not exist "sql" mkdir sql
  xcopy /s /e /i /q /y "update\sql\*" "sql\" >nul
  echo   [OK] SQL files diperbarui
)

:: --- Run migration ---
echo.
echo [6/6] Jalankan migrasi database...

:: Find MariaDB
set "MARIA_DIR=mariadb"
if not exist "!MARIA_DIR!\bin\mariadbd.exe" (
  if not exist "!MARIA_DIR!\bin\mysqld.exe" (
    for /d %%d in ("!MARIA_DIR!\mariadb-*-winx64") do (
      if exist "%%d\bin\mariadbd.exe" set "MARIA_DIR=%%d"
      if exist "%%d\bin\mysqld.exe" set "MARIA_DIR=%%d"
    )
  )
)
set "MYSQLD=mariadbd.exe"
if not exist "!MARIA_DIR!\bin\!MYSQLD!" set "MYSQLD=mysqld.exe"
set "MYSQL_CLIENT=mariadb.exe"
if not exist "!MARIA_DIR!\bin\!MYSQL_CLIENT!" set "MYSQL_CLIENT=mysql.exe"

if exist "sql\upgrade.sql" (
  :: Start MariaDB
  start /B "" "!MARIA_DIR!\bin\!MYSQLD!" --datadir="%~dp0data\mysql" --port=3307 --skip-grant-tables

  :: Wait for MariaDB (up to 30 seconds)
  set "DB_OK="
  for /l %%i in (1,1,30) do (
    "!MARIA_DIR!\bin\!MYSQL_CLIENT!" -u root --port=3307 --host=127.0.0.1 --protocol=tcp -e "SELECT 1" >nul 2>&1
    if !errorlevel! equ 0 (
      set "DB_OK=1"
      goto :db_ready
    )
    ping -n 2 127.0.0.1 >nul
  )

  echo   [ERROR] MariaDB gagal start untuk migrasi!
  echo   Backup tersimpan di: !BACKUP_DIR!
  pause
  exit /b 1

  :db_ready
  echo   [OK] MariaDB siap

  :: Run upgrade
  "!MARIA_DIR!\bin\!MYSQL_CLIENT!" -u root --port=3307 --host=127.0.0.1 --protocol=tcp pos_db < "sql\upgrade.sql"
  if !errorlevel! neq 0 (
    echo   [ERROR] Migrasi database gagal!
    echo   Backup tersimpan di: !BACKUP_DIR!
    echo.
    echo   Untuk restore: jalankan restore.bat
    "!MARIA_DIR!\bin\!MYSQL_CLIENT!" -u root --port=3307 --host=127.0.0.1 --protocol=tcp -e "SHUTDOWN"
    ping -n 3 127.0.0.1 >nul
    pause
    exit /b 1
  )
  echo   [OK] Migrasi database selesai

  :: Stop MariaDB
  "!MARIA_DIR!\bin\!MYSQL_CLIENT!" -u root --port=3307 --host=127.0.0.1 --protocol=tcp -e "SHUTDOWN"
  ping -n 3 127.0.0.1 >nul
) else (
  echo   [SKIP] Tidak ada migrasi database
)

:: --- Copy .env to app ---
if exist ".env" copy /y ".env" "app\.env" >nul

:: --- Update version.json ---
if exist "update\version.json" copy /y "update\version.json" "version.json" >nul

:: --- Cleanup update folder ---
echo.
echo Membersihkan folder update...
rmdir /s /q "update" 2>nul
echo   [OK] Folder update dibersihkan

:: --- Done ---
echo.
echo ============================================
echo   UPDATE SELESAI!
echo ============================================
echo.
echo Backup tersimpan di: !BACKUP_DIR!
echo.
echo Jalankan start.bat untuk menjalankan aplikasi baru.
echo Jika ada masalah, jalankan restore.bat untuk kembali ke versi lama.
echo.
pause

goto :eof
