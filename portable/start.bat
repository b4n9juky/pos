@echo off
setlocal enabledelayedexpansion
title POS Rahmat
cd /d "%~dp0"

if not exist ".installed" (
  echo.
  echo ============================================
  echo   Silakan jalankan setup.bat terlebih dahulu!
  echo ============================================
  echo.
  pause
  exit /b 1
)

echo ============================================
echo         POS Rahmat - Starting...
echo ============================================
echo.

:: --- Kill any existing instances ---
echo [1/4] Membersihkan proses sebelumnya...
taskkill /f /im mariadbd.exe >nul 2>&1
taskkill /f /im mysqld.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: --- Find MariaDB (allow nested folder) ---
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

:: --- Start MariaDB ---
echo [2/4] Menjalankan MariaDB (port 3307)...
start /B "" "!MARIA_DIR!\bin\!MYSQLD!" --datadir="%~dp0data\mysql" --port=3307 --skip-grant-tables

:: Wait for MariaDB (up to 60 seconds)
echo   Menunggu MariaDB siap...
set "DB_OK="
for /l %%i in (1,1,60) do (
  "!MARIA_DIR!\bin\!MYSQL_CLIENT!" -u root --port=3307 --host=127.0.0.1 --protocol=tcp -e "SELECT 1" >nul 2>&1
  if !errorlevel! equ 0 (
    set "DB_OK=1"
    goto :db_ok
  )
  timeout /t 1 /nobreak >nul
)

:: MariaDB failed to start - show error log + port check
echo   [ERROR] MariaDB gagal start dalam 60 detik.
echo.
echo   Cek error log:
for /r "data\mysql" %%f in (*.err) do (
  echo   --- %%f ---
  powershell -NoProfile -Command "Get-Content '%%f' -Tail 10" 2>nul
  goto :db_log_shown
)
:db_log_shown
echo.
echo   Cek apakah port 3307 sudah dipakai:
powershell -NoProfile -Command "netstat -ano | findstr ':3307 '" 2>nul
echo.
echo   Penyebab umum:
echo   - Port 3307 sudah dipakai aplikasi lain
echo   - Antivirus memblokir !MYSQLD!
echo   - Data directory rusak (jalankan setup.bat ulang)
:: Continue anyway - app might still start

:db_ok

:: --- Find Node.js (allow nested folder) ---
set "NODE_DIR=node"
if not exist "!NODE_DIR!\node.exe" (
  for /d %%d in ("!NODE_DIR!\node-v*-win-x64") do (
    if exist "%%d\node.exe" set "NODE_DIR=%%d"
  )
)
if not exist "!NODE_DIR!\node.exe" (
  echo   [ERROR] Node.exe tidak ditemukan di folder node/!
  echo   Pastikan Node.js portable sudah diextract ke folder node/
  pause
  exit /b 1
)

:: --- Copy .env to app folder ---
if not exist ".env" (
  echo   [ERROR] File .env tidak ditemukan!
  echo   Jalankan setup.bat terlebih dahulu untuk membuat konfigurasi.
  pause
  exit /b 1
)
copy /y ".env" "app\.env" >nul

:: --- Start Print Server ---
echo [3/4] Menjalankan Print Server...
if exist "%TEMP%\pos-start-print.bat" del "%TEMP%\pos-start-print.bat" >nul 2>&1
>"%TEMP%\pos-start-print.bat" (
  echo @echo off
  echo cd /d "%~dp0print-server"
  echo "%~dp0!NODE_DIR!\node.exe" server.js
)
start "POS Print Proxy" /MIN "%TEMP%\pos-start-print.bat"
echo   Print Server: http://localhost:8090

:: --- Start Next.js App ---
echo [4/4] Menjalankan POS Rahmat...
:: Use temp batch file to avoid cmd /c quoting issues
if exist "%TEMP%\pos-start-app.bat" del "%TEMP%\pos-start-app.bat" >nul 2>&1
>"%TEMP%\pos-start-app.bat" (
  echo @echo off
  echo cd /d "%~dp0app"
  echo "%~dp0!NODE_DIR!\node.exe" server.js ^> "%~dp0app\server.log" 2^>^&1
)
start "POS Rahmat App" /MIN "%TEMP%\pos-start-app.bat"

:: Wait for server to start (up to 30 seconds)
echo   Menunggu server siap...
set "SERVER_READY="
for /l %%i in (1,1,30) do (
  timeout /t 1 /nobreak >nul
  powershell -NoProfile -Command "try { $r = curl.exe -s -o nul -w \"%%{http_code}\" http://localhost:3000 2>$null; if ($r -ne '') { exit 0 } } catch {}; exit 1" >nul 2>&1
  if !errorlevel! equ 0 (
    set "SERVER_READY=1"
    goto :server_ready
  )
)
echo   [WARNING] Server belum merespon setelah 30 detik.

:: Show last lines from server log
echo.
if exist "app\server.log" (
  echo   --- 10 baris terakhir app\server.log ---
  powershell -NoProfile -Command "Get-Content 'app\server.log' -Tail 10" 2>nul
  echo   ----------------------------------------
)

:server_ready
echo.
echo ============================================
echo   App:       http://localhost:3000
echo   Print:     http://localhost:8090
echo ============================================
echo.
if defined SERVER_READY (
  echo Browser akan dibuka...
  start http://localhost:3000
) else (
  echo Coba buka manual: http://localhost:3000
  echo Jika error, lihat file: app\server.log
)
echo.
echo Untuk menutup, tutup saja jendela ini.
echo Atau tekan tombol X.
echo.

:: Keep window open
echo Tekan CTRL+C untuk menghentikan semua service...
echo.

:: Trap Ctrl+C / window close to clean up
:watch
timeout /t 5 /nobreak >nul
goto :watch
