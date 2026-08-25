@echo off
title ACE Services Estimation Portal - Production Local Host
color 0E

echo =========================================================================
echo                   ACE SERVICES ESTIMATION PORTAL
echo                   Production Local Host Builder
echo =========================================================================
echo.

:: 1. Clean lingering ports
echo [1/4] Freeing ports 3000 and 4000...
powershell -Command "Get-NetTCPConnection -LocalPort 3000,4000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

:: 2. Build API
echo [2/4] Building Backend API...
cd /d %~dp0apps\api
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Backend build failed.
    pause
    exit /b %ERRORLEVEL%
)

:: 3. Build Web
echo [3/4] Building Web Frontend...
cd /d %~dp0apps\web
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend build failed.
    pause
    exit /b %ERRORLEVEL%
)

:: 4. Start Both in Production Mode
echo [4/4] Launching Production Servers...
start "ACE Portal - Production API [Port 4000]" cmd /k "cd /d %~dp0apps\api && title Production API && color 0B && npm run start:prod"
start "ACE Portal - Production Web [Port 3000]" cmd /k "cd /d %~dp0apps\web && title Production Web && color 0A && npm start"

echo.
echo =========================================================================
echo  [SUCCESS] Production servers are running!
echo.
echo  - Local URL:   http://localhost:3000
echo  - API Backend: http://localhost:4000
echo =========================================================================
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:3000/login
exit
