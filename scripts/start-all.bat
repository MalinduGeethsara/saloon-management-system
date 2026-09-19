@echo off
rem Starts the site on this Windows PC: app (npm start, port 3000) + Cloudflare tunnel. Safe to run twice.
rem Prerequisite: WAMP must already be running (MySQL on port 3306).
rem Usage: double-click, or `npm run site:start`.

set "APP_DIR=%~dp0.."
set "CLOUDFLARED=C:\Program Files (x86)\cloudflared\cloudflared.exe"

netstat -ano | findstr ":3306 " | findstr LISTENING >nul
if errorlevel 1 (
  echo [!] MySQL is not running on port 3306. Start WAMP first, then run this again.
  if not "%~1"=="nopause" pause
  exit /b 1
)

if not exist "%APP_DIR%\.next\BUILD_ID" (
  echo No production build found - building first, this takes about a minute...
  pushd "%APP_DIR%"
  call npm run build
  if errorlevel 1 (
    echo [!] Build FAILED. Fix the errors above, then run this again.
    popd
    if not "%~1"=="nopause" pause
    exit /b 1
  )
  popd
)

netstat -ano | findstr ":3000 " | findstr LISTENING >nul
if not errorlevel 1 echo App already running on port 3000 - skipping.
if errorlevel 1 echo Starting app on port 3000...
if errorlevel 1 start "MR POLAA app" cmd /k "cd /d "%APP_DIR%" && npm start"

tasklist /FI "IMAGENAME eq cloudflared.exe" | findstr /I "cloudflared.exe" >nul
if not errorlevel 1 echo Tunnel already running - skipping.
if errorlevel 1 echo Starting Cloudflare tunnel...
if errorlevel 1 start "MR POLAA tunnel" cmd /k ""%CLOUDFLARED%" tunnel run mr-polaa"

echo.
echo Done. Give it about 10 seconds, then open https://mr-polaa.com
echo Keep the two new windows open - closing them stops the site.
if not "%~1"=="nopause" pause
