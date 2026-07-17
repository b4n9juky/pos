@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ============================================
echo   POS Rahmat - Seed Database
echo ============================================
echo.

:: Step 1: Find MariaDB (support nested folder)
set "MARIA_DIR=mariadb"
if not exist "!MARIA_DIR!\bin\mariadb.exe" (
  if not exist "!MARIA_DIR!\bin\mysql.exe" (
    for /d %%d in ("!MARIA_DIR!\mariadb-*-winx64") do (
      if exist "%%d\bin\mariadb.exe" set "MARIA_DIR=%%d"
      if exist "%%d\bin\mysql.exe" set "MARIA_DIR=%%d"
    )
  )
)
set "MYSQL_CLIENT=mariadb.exe"
if not exist "!MARIA_DIR!\bin\!MYSQL_CLIENT!" set "MYSQL_CLIENT=mysql.exe"
if not exist "!MARIA_DIR!\bin\!MYSQL_CLIENT!" (
  echo [ERROR] MariaDB tidak ditemukan.
  echo Pastikan MariaDB portable sudah diextract ke folder mariadb/
  pause
  exit /b 1
)
echo [OK] MariaDB ditemukan

:: Step 2: Check seed.sql
if not exist "sql\seed.sql" (
  echo [ERROR] File sql\seed.sql tidak ditemukan!
  pause
  exit /b 1
)
echo [OK] Seed file ditemukan

:: Step 3: Run seed
echo.
echo Mengisi data contoh...
"!MARIA_DIR!\bin\!MYSQL_CLIENT!" -u root --port=3307 --host=127.0.0.1 --protocol=tcp pos_db < "sql\seed.sql"
if !errorlevel! neq 0 (
  echo [ERROR] Seed gagal. Pastikan MariaDB berjalan di port 3307.
  pause
  exit /b 1
)

echo.
echo ============================================
echo   [SUCCESS] Database berhasil diisi!
echo ============================================
echo.
echo   Login:
echo     Admin:  admin@pos.com / password
echo     Kasir:  cashier@pos.com / password
echo.
pause
