@echo off
setlocal enabledelayedexpansion
title POS Rahmat - Cashier

cd /d "%~dp0"

set "INI_FILE=%~dp0cashier.ini"
set "SERVER_IP="
set "SHORTCUT_NAME=POS Rahmat (Cashier)"

:: --- Read saved config if exists ---
if exist "%INI_FILE%" (
  for /f "usebackq tokens=1,* delims==" %%a in ("%INI_FILE%") do (
    if /i "%%a"=="SERVER_IP" set "SERVER_IP=%%b"
  )
)

:: --- Prompt for IP if not configured ---
if not defined SERVER_IP (
  cls
  echo ============================================
  echo     POS Rahmat - Cashier PC Setup
  echo ============================================
  echo.
  echo Masukkan IP address komputer SERVER POS.
  echo.
  echo Contoh: 192.168.1.100
  echo.
  set /p "SERVER_IP=IP Server: "
  if not defined SERVER_IP (
    echo.
    echo IP tidak boleh kosong.
    pause
    exit /b 1
  )
  :: Validate IP format (simple check)
  echo !SERVER_IP!|findstr /r "^[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*$" >nul
  if errorlevel 1 (
    echo.
    echo Format IP tidak valid. Gunakan format: xxx.xxx.xxx.xxx
    pause
    exit /b 1
  )
  :: Save config
  >"%INI_FILE%" echo SERVER_IP=!SERVER_IP!
  echo.
  echo Konfigurasi tersimpan. Next time akan langsung terhubung.
  echo.
)

:: --- Create desktop shortcut on first run ---
if not exist "%USERPROFILE%\Desktop\!SHORTCUT_NAME!.lnk" (
  powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\!SHORTCUT_NAME!.lnk'); $sc.TargetPath = '%~dp0cashier.bat'; $sc.WorkingDirectory = '%~dp0'; $sc.Description = 'POS Rahmat - Cashier PC'; $sc.Save()" >nul 2>&1
)

:: --- Launch browser ---
set "URL=http://%SERVER_IP%:3000"

echo ============================================
echo     POS Rahmat - Cashier PC
echo ============================================
echo.
echo   Server: %URL%
echo.

:: --- Test connectivity ---
echo Mengecek koneksi ke server %SERVER_IP%:3000...
set "REACHABLE="
powershell -NoProfile -Command "try { $r = curl.exe -s -o nul -w \"%%{http_code}\" 'http://%SERVER_IP%:3000' -TimeoutSec 5 2>$null; if ($r -ne '' -and $r -ne '000') { exit 0 } } catch {}; exit 1"
if !errorlevel! equ 0 set "REACHABLE=1"

if not defined REACHABLE goto :error_menu
goto :open_browser

:reconnect
echo Mengecek ulang koneksi ke server %SERVER_IP%:3000...
set "REACHABLE="
powershell -NoProfile -Command "try { $r = curl.exe -s -o nul -w \"%%{http_code}\" 'http://%SERVER_IP%:3000' -TimeoutSec 5 2>$null; if ($r -ne '' -and $r -ne '000') { exit 0 } } catch {}; exit 1"
if !errorlevel! equ 0 set "REACHABLE=1"
if defined REACHABLE (
  echo   [OK] Server dapat dijangkau.
  goto :open_browser
)
echo   [ERROR] Masih gagal terhubung ke %URL%
echo.

:error_menu
echo   [ERROR] Tidak dapat terhubung ke %URL%
echo.
echo   Kemungkinan penyebab:
echo   - Server POS belum menyala atau masih loading
echo   - IP server salah (simpanan: %SERVER_IP%)
echo   - Firewall di server memblokir port 3000
echo   - Kabel jaringan/WiFi terputus
echo   - Server pakai IP berbeda
echo.
echo   Pilihan:
echo     1) Coba lagi
echo     2) Masukkan IP server baru
echo     3) Tetap buka browser (untuk cek manual)
echo     4) Keluar
echo.
set /p "CHOICE=Pilih [1-4]: "
if "!CHOICE!"=="1" (
  echo.
  goto :reconnect
)
if "!CHOICE!"=="2" (
  del "%INI_FILE%" >nul 2>&1
  echo.
  echo Silakan jalankan cashier.bat lagi untuk memasukkan IP baru.
  pause
  exit /b
)
if "!CHOICE!"=="3" (
  goto :open_browser
)
echo.
echo Ditutup.
pause
exit /b

:open_browser
echo   Membuka browser...
start "" "%URL%"

echo.
echo   Shortcut cashier.bat sudah ada di desktop
echo   untuk akses cepat.
echo.
echo   Jika tidak bisa login, coba akses manual:
echo   %URL%
echo.
echo   Tips: Pastikan server sudah mulai (lihat jendela server).
echo   Jika masih gagal, firewall server mungkin blokir port 3000.
echo.
pause
