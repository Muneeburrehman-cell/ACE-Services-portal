@echo off
title Restore PostgreSQL Database
color 0E

echo =========================================================================
echo                   ACE SERVICES ESTIMATION PORTAL
echo                     Database Restore Utility
echo =========================================================================
echo.

if not exist "%~dp0portal_db_backup.sql" (
    echo [ERROR] portal_db_backup.sql file not found in this folder.
    pause
    exit /b 1
)

echo [1/2] Ensuring database 'portal' exists...
psql -U postgres -h 127.0.0.1 -p 5432 -c "CREATE DATABASE portal;" >nul 2>&1

echo [2/2] Restoring data from portal_db_backup.sql...
psql -U postgres -h 127.0.0.1 -p 5432 -d portal -f "%~dp0portal_db_backup.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Database successfully restored!
) else (
    echo.
    echo [WARNING] Restoration finished with code %ERRORLEVEL%. Verify tables in psql.
)

echo.
pause
