@echo off
setlocal enabledelayedexpansion
title POS Rahmat - Fix Auth URL
cd /d "%~dp0"

echo ============================================
echo     POS Rahmat - Fix Login via LAN IP
echo ============================================
echo.
echo This will remove AUTH_URL from your .env files
echo so login works from any IP address.
echo.

:: Fix root .env
if exist ".env" (
  echo [1/3] Memperbaiki .env (root)...
  powershell -NoProfile -Command "(Get-Content '.env') -notmatch '^AUTH_URL=' | Set-Content '.env'"
  echo   [OK]
) else (
  echo   [SKIP] .env tidak ditemukan
)

:: Fix app\.env
if exist "app\.env" (
  echo [2/3] Memperbaiki app\.env...
  powershell -NoProfile -Command "(Get-Content 'app\.env') -notmatch '^AUTH_URL=' | Set-Content 'app\.env'"
  echo   [OK]
) else (
  echo   [SKIP] app\.env tidak ditemukan
)

echo [3/3] Restart aplikasi sekarang? (y/n)
set /p RESTART=""
if /i "!RESTART!"=="y" (
  echo.
  echo Menutup proses lama...
  taskkill /f /im node.exe >nul 2>&1
  taskkill /f /im mariadbd.exe >nul 2>&1
  taskkill /f /im mysqld.exe >nul 2>&1
  echo Membuka start.bat...
  start "" "%~dp0start.bat"
)

echo.
echo ============================================
echo   SELESAI!
echo.
echo   Coba akses sekarang via LAN IP:
echo   http://192.168.x.x:3000
echo.
echo   Jika masih error, hapus manual app\.env
echo   lalu restart start.bat
echo ============================================
pause
