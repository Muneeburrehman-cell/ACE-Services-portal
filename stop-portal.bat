@echo off
title ACE Services Estimation Portal - Stop Servers
color 0C

echo =========================================================================
echo                   ACE SERVICES ESTIMATION PORTAL
echo                     Stopping Local Servers...
echo =========================================================================
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0kill-ports.ps1"

echo [OK] All Portal servers on Port 3000 and Port 4000 have been stopped.
echo.
pause
