@echo off
setlocal enabledelayedexpansion
title POS Rahmat - Database Upgrade
cd /d "%~dp0"

echo ============================================
echo     POS Rahmat - Database Upgrade
echo ============================================
echo.
echo Script ini akan menambahkan tabel baru yang
echo diperlukan tanpa menghapus data yang sudah ada.
echo.

if not exist ".installed" (
  echo [ERROR] POS Rahmat belum diinstall.
  echo Jalankan setup.bat terlebih dahulu.
  pause
  exit /b 1
)

:: --- Find MariaDB ---
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

echo [1/3] Menyalakan MariaDB...

:: Kill previous instances
taskkill /f /im mariadbd.exe >nul 2>&1
taskkill /f /im mysqld.exe >nul 2>&1
timeout /t 2 /nobreak >nul

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

if not defined DB_OK (
  echo [ERROR] Gagal menyalakan MariaDB.
  pause
  exit /b 1
)

:db_ready
echo   [OK] MariaDB siap

echo [2/3] Menjalankan upgrade database...
if exist "sql\upgrade.sql" (
  "!MARIA_DIR!\bin\!MYSQL_CLIENT!" -u root --port=3307 --host=127.0.0.1 --protocol=tcp pos_db < "sql\upgrade.sql"
  if !errorlevel! neq 0 (
    echo [ERROR] Gagal menjalankan upgrade.
    echo Cek syntax di sql\upgrade.sql
    pause
    exit /b 1
  )
  echo   [OK] Upgrade selesai
) else (
  echo [ERROR] File sql\upgrade.sql tidak ditemukan!
  pause
  exit /b 1
)

echo [3/3] Mematikan MariaDB...
"!MARIA_DIR!\bin\!MYSQL_CLIENT!" -u root --port=3307 --host=127.0.0.1 --protocol=tcp -e "SHUTDOWN"
ping -n 3 127.0.0.1 >nul

echo.
echo ============================================
echo   UPGRADE SELESAI!
echo ============================================
echo.
echo Tabel baru telah ditambahkan.
echo Data yang sudah ada tidak berubah.
echo.
echo Jalankan start.bat seperti biasa.
echo.
pause
