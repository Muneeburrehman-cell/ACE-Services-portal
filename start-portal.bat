@echo off
title ACE Services Estimation Portal - Local Launcher
color 0E

echo =========================================================================
echo                   ACE SERVICES ESTIMATION PORTAL
echo                     Local Host Launcher (v1.0)
echo =========================================================================
echo.

:: 1. Clean lingering ports
echo [1/3] Checking and clearing ports 3000 and 4000...
powershell -ExecutionPolicy Bypass -File "%~dp0kill-ports.ps1" >nul 2>&1

:: 2. Launch API Backend in new window
echo [2/3] Launching NestJS Backend API (Port 4000)...
start "ACE Portal - API Server [Port 4000]" cmd /k "cd /d %~dp0apps\api && title API Server (Port 4000) && color 0B && npm run dev"

:: 3. Launch Web Frontend in new window
echo [3/3] Launching Next.js Web Portal (Port 3000)...
start "ACE Portal - Web Frontend [Port 3000]" cmd /k "cd /d %~dp0apps\web && title Web Portal (Port 3000) && color 0A && npm run dev"

echo.
echo =========================================================================
echo  [SUCCESS] Portal servers are initializing!
echo.
echo  - Frontend Web UI:  http://localhost:3000
echo  - Backend API:      http://localhost:4000
echo.
echo  Default Admin Login:
echo    Email:    admin@portal.com
echo    Password: Admin@123456
echo =========================================================================
echo.
ping 127.0.0.1 -n 4 >nul
start http://localhost:3000/login
exit
