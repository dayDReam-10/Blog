@echo off
setlocal
cd /d "%~dp0.."
start "DayDReam local server" /min node scripts\serve.js
timeout /t 2 /nobreak >nul
start "" http://127.0.0.1:4173/
