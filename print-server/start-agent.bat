@echo off
title POS Print Agent

echo Starting POS Print Agent (PowerShell)...
echo.
echo No Node.js required -- runs on built-in Windows PowerShell.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0agent.ps1" -Port 8090
if errorlevel 1 (
  echo.
  echo Failed to start print agent.
  echo Port 8090 may already be in use.
  pause
)
