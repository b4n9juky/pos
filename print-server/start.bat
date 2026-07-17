@echo off
title POS Print Proxy
cd /d "%~dp0"
echo Installing dependencies...
call npm install --no-audit --no-fund
echo Starting print proxy on port 8090...
node server.js
pause
