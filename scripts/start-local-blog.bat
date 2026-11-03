@echo off
setlocal
cd /d "%~dp0.."

where node >nul 2>nul || (
  echo Node.js is required. Install Node.js 18 or newer, then run this file again.
  pause
  exit /b 1
)

if not exist .local\KuGouMusicApi\main.js (
  echo Downloading the KuGou API into the private local data folder...
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\setup-kugou.ps1
  if errorlevel 1 (
    echo Download failed. Check your network and run this file again.
    pause
    exit /b 1
  )
)

if not exist .local\KuGouMusicApi\node_modules (
  echo Installing KuGou API dependencies...
  pushd .local\KuGouMusicApi
  call npm install
  popd
  if errorlevel 1 (
    pause
    exit /b 1
  )
)

start "DayDReam local server" /min node scripts\local-music-server.js
timeout /t 2 /nobreak >nul
start "" http://127.0.0.1:4173/
