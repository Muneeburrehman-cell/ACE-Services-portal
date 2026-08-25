@echo off
title ACE Services - Server Laptop Quick Setup
color 0B

echo =========================================================================
echo                   ACE SERVICES ESTIMATION PORTAL
echo                   Server Laptop Initial Setup
echo =========================================================================
echo.

:: 1. Root dependencies
echo [1/4] Installing root dependencies...
cd /d %~dp0
call npm install

:: 2. API dependencies
echo.
echo [2/4] Installing Backend API dependencies...
cd /d %~dp0apps\api
call npm install
call npx prisma generate

:: 3. Web dependencies
echo.
echo [3/4] Installing Web Frontend dependencies...
cd /d %~dp0apps\web
call npm install

:: 4. Database check
echo.
echo [4/4] Setup complete!
echo.
echo =========================================================================
echo  Next Steps:
echo  1. Run restore_database.bat (if transferring existing data)
echo     OR run: cd apps\api && npx prisma migrate deploy && npm run prisma:seed
echo  2. Double-click start-portal.bat or host-production.bat
echo =========================================================================
echo.
pause
