@echo off
cd /d "%~dp0"

title POS Rahmat - Uninstall

echo ============================================
echo       POS Rahmat - Uninstall
echo ============================================
echo.
echo Peringatan: Semua data transaksi akan dihapus!
echo.

:: Stop processes
echo [1/4] Menghentikan proses...
taskkill /f /im mariadbd.exe >nul 2>&1
taskkill /f /im mysqld.exe >nul 2>&1
taskkill /f /im node.exe /fi "WINDOWTITLE eq POS Print Proxy" >nul 2>&1
taskkill /f /im node.exe /fi "WINDOWTITLE eq POS Rahmat App" >nul 2>&1
echo   [OK] Proses dihentikan
timeout /t 2 /nobreak >nul

:: Remove shortcut
echo [2/4] Menghapus shortcut...
powershell -NoProfile -Command "Remove-Item ([Environment]::GetFolderPath('Desktop') + '\POS Rahmat.lnk') -Force -ErrorAction SilentlyContinue" >nul 2>&1
echo   [OK] Shortcut dihapus

:: Remove data
echo [3/4] Menghapus data database...
if exist "data" (
  rmdir /s /q "data" 2>nul
  echo   [OK] Data database dihapus
) else (
  echo   [SKIP] Tidak ada data database
)

:: Remove .env and installed marker
echo [4/4] Menghapus konfigurasi...
if exist ".env" del ".env" 2>nul
if exist ".installed" del ".installed" 2>nul
if exist "version.json" del "version.json" 2>nul
echo   [OK] Konfigurasi dihapus

echo.
echo ============================================
echo   Uninstall selesai!
echo ============================================
echo.
echo Folder ini masih ada jika ingin dipakai lagi.
echo Hapus manual folder ini jika sudah tidak diperlukan.
echo.
pause
