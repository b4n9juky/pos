@echo off
setlocal enabledelayedexpansion
title POS Rahmat - Restore Backup
cd /d "%~dp0"

echo ============================================
echo       POS Rahmat - Restore Backup
echo ============================================
echo.
echo Script ini akan mengembalikan data dari backup.
echo.

:: --- Stop services ---
echo [1/4] Menghentikan semua service...
taskkill /f /im node.exe >nul 2>&1
wmic process where "commandline like '%%agent.ps1%%'" call terminate >nul 2>&1
taskkill /f /im mariadbd.exe >nul 2>&1
taskkill /f /im mysqld.exe >nul 2>&1
timeout /t 3 /nobreak >nul
echo   [OK] Semua service dihentikan

:: --- List available backups ---
echo.
echo [2/4] Mencari backup yang tersedia...
echo.

set "BACKUP_COUNT=0"

for /d %%d in (backup\pos-backup-*) do (
  set /a BACKUP_COUNT+=1
  set "BACKUP_!BACKUP_COUNT!=%%d"
  :: Show backup info if available
  if exist "%%d\backup-info.txt" (
    echo   [!BACKUP_COUNT!] %%d
    powershell -NoProfile -Command "Get-Content '%%d\backup-info.txt'" 2>nul
  ) else (
    echo   [!BACKUP_COUNT!] %%d
  )
  echo.
)

if !BACKUP_COUNT! equ 0 (
  echo   [ERROR] Tidak ada backup ditemukan!
  echo   Folder backup kosong atau tidak ada.
  echo.
  pause
  exit /b 1
)

:: --- Select backup ---
echo   Pilih backup yang ingin direstore:
echo.
set /p "CHOICE=Pilih nomor [1-!BACKUP_COUNT!]: "

:: Validate choice
if not defined CHOICE (
  echo   [ERROR] Pilihan tidak valid!
  pause
  exit /b 1
)

if !CHOICE! lss 1 (
  echo   [ERROR] Pilihan tidak valid!
  pause
  exit /b 1
)

if !CHOICE! gtr !BACKUP_COUNT! (
  echo   [ERROR] Pilihan tidak valid!
  pause
  exit /b 1
)

:: Get selected backup path
call set "SELECTED_BACKUP=%%BACKUP_%CHOICE%%%"
echo.
echo   Backup dipilih: !SELECTED_BACKUP!

:: --- Confirm ---
echo.
echo   PERINGATAN: Ini akan mengembalikan:
echo     - Database (data\mysql\)
echo     - Konfigurasi (.env)
echo     - App versi lama
echo.
echo   Data transaksi SETELAH backup ini akan HILANG!
echo.
set /p "CONFIRM=" Lanjutkan restore? (y/n): "
if /i "!CONFIRM!" neq "y" (
  echo   Restore dibatalkan.
  pause
  exit /b 0
)

:: --- Restore database ---
echo.
echo [3/4] Restore data...

:: Backup current data first (in case restore fails)
set "TEMP_BACKUP=backup\pre-restore-%RANDOM%"
mkdir "%TEMP_BACKUP%" 2>nul
if exist "data\mysql" xcopy /s /e /i /q /y "data\mysql" "%TEMP_BACKUP%\data\mysql" >nul
if exist ".env" copy /y ".env" "%TEMP_BACKUP%\.env" >nul
echo   [OK] Current data di-backup sementara

:: Restore database
if exist "!SELECTED_BACKUP!\data\mysql" (
  if exist "data\mysql" rmdir /s /q "data\mysql" 2>nul
  xcopy /s /e /i /q /y "!SELECTED_BACKUP!\data\mysql" "data\mysql\" >nul
  echo   [OK] Database direstore
) else (
  echo   [SKIP] Tidak ada database di backup
)

:: Restore .env
if exist "!SELECTED_BACKUP!\.env" (
  copy /y "!SELECTED_BACKUP!\.env" ".env" >nul
  echo   [OK] Konfigurasi direstore
) else (
  echo   [SKIP] Tidak ada .env di backup
)

:: Restore app
if exist "!SELECTED_BACKUP!\app" (
  if exist "app" rmdir /s /q "app" 2>nul
  xcopy /s /e /i /q /y "!SELECTED_BACKUP!\app" "app\" >nul
  echo   [OK] App direstore
) else (
  echo   [SKIP] Tidak ada app di backup
)

:: Restore batch files
for %%f in (setup.bat start.bat uninstall.bat db-upgrade.bat cashier.bat kiosk-setup.bat fix-auth-url.bat seed-db.bat) do (
  if exist "!SELECTED_BACKUP!\%%f" copy /y "!SELECTED_BACKUP!\%%f" "%%f" >nul
)
echo   [OK] Batch files direstore

:: Copy .env to app
if exist ".env" copy /y ".env" "app\.env" >nul

:: --- Cleanup temp backup ---
rmdir /s /q "%TEMP_BACKUP%" 2>nul

:: --- Done ---
echo.
echo [4/4] Restore selesai!
echo.
echo ============================================
echo   RESTORE SELESAI!
echo ============================================
echo.
echo Data telah dikembalikan ke versi backup.
echo Jalankan start.bat untuk menjalankan aplikasi.
echo.
echo Backup masih tersimpan di: !SELECTED_BACKUP!
echo.
pause
