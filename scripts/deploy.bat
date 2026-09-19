@echo off
rem After changing code: stops the app, rebuilds, restarts it. The tunnel is left running.
rem Usage: double-click, or `npm run site:deploy`.

set "APP_DIR=%~dp0.."

echo Stopping app on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 " ^| findstr LISTENING') do taskkill /F /T /PID %%a >nul 2>&1

echo Building (about a minute)...
pushd "%APP_DIR%"
call npm run build
if errorlevel 1 (
  echo.
  echo [!] Build FAILED - the site is DOWN until this is fixed. Fix the errors above, then run deploy again.
  popd
  if not "%~1"=="nopause" pause
  exit /b 1
)
popd

echo Starting app on port 3000...
start "MR POLAA app" cmd /k "cd /d "%APP_DIR%" && npm start"

echo.
echo Deployed. Give it about 10 seconds, then refresh https://mr-polaa.com
if not "%~1"=="nopause" pause
