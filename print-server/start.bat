@echo off
title POS Print Proxy
cd /d "%~dp0"

:: ─── Cari portable Node.js di 6 lokasi ───
echo.
echo [1/4] Locating Node.js...

set "NODE_DIR="
set "NODE_CMD="

:: 1. Se-folder dengan start.bat
if exist "%~dp0node\node.exe" (
  set "NODE_DIR=%~dp0node"
  set "NODE_CMD=%~dp0node\node.exe"
)
if not defined NODE_DIR for /d %%d in ("%~dp0node\node-v*-win-x64") do if exist "%%d\node.exe" (
  set "NODE_DIR=%%d"
  set "NODE_CMD=%%d\node.exe"
)

:: 2. Satu level di atas (..\node\)
if not defined NODE_DIR if exist "%~dp0..\node\node.exe" (
  set "NODE_DIR=%~dp0..\node"
  set "NODE_CMD=%~dp0..\node\node.exe"
)
if not defined NODE_DIR for /d %%d in ("%~dp0..\node\node-v*-win-x64") do if exist "%%d\node.exe" (
  set "NODE_DIR=%%d"
  set "NODE_CMD=%%d\node.exe"
)

:: 3. Folder portable (..\portable\node\)
if not defined NODE_DIR if exist "%~dp0..\portable\node\node.exe" (
  set "NODE_DIR=%~dp0..\portable\node"
  set "NODE_CMD=%~dp0..\portable\node\node.exe"
)
if not defined NODE_DIR for /d %%d in ("%~dp0..\portable\node\node-v*-win-x64") do if exist "%%d\node.exe" (
  set "NODE_DIR=%%d"
  set "NODE_CMD=%%d\node.exe"
)

:: Fallback ke system PATH
if not defined NODE_CMD (
  echo   [!] Portable Node.js not found, trying system PATH...
  set "NODE_CMD=node"
)

:: Validasi
"%NODE_CMD%" -e "console.log('ok')" >nul 2>&1
if errorlevel 1 (
  echo.
  echo   [ERROR] Node.js tidak ditemukan!
  echo   Letakkan Node.js portable di salah satu folder ini:
  echo     %~dp0node\
  echo     %~dp0..\node\
  echo     %~dp0..\portable\node\
  echo.
  echo   Download: https://nodejs.org/dist/v22.14.0/node-v22.14.0-win-x64.zip
  pause
  exit /b 1
)
echo   [OK] Node.js ready

:: ─── Cek server.js ───
if not exist "%~dp0server.js" (
  echo.
  echo   [ERROR] server.js tidak ditemukan!
  echo   Pastikan start.bat dijalankan dari folder print-server/
  echo.
  pause
  exit /b 1
)

:: ─── Install dependencies ───
echo.
echo [2/4] Installing dependencies...
if not exist "%~dp0node_modules" (
  if defined NODE_DIR (
    "%NODE_DIR%\npx.cmd" --yes npm install --no-audit --no-fund
  ) else (
    call npm install --no-audit --no-fund
  )
  if errorlevel 1 (
    echo   [ERROR] Gagal menginstall dependencies!
    pause
    exit /b 1
  )
  echo   [OK] Dependencies installed
) else (
  echo   [OK] Dependencies already installed
)

:: ─── Start server ───
echo.
echo [3/4] Starting print proxy on port 8090...
echo.
echo   Server akan berjalan di sini.
echo   Tekan Ctrl+C untuk berhenti.
echo   JANGAN TUTUP jendela ini selama printer digunakan.
echo.
echo [4/4] Running...
echo.

"%NODE_CMD%" server.js

echo.
echo   Server stopped.
pause
