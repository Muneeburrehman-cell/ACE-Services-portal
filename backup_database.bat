@echo off
title Backup PostgreSQL Database
color 0B

echo =========================================================================
echo                   ACE SERVICES ESTIMATION PORTAL
echo                     Database Export Utility
echo =========================================================================
echo.

echo Exporting PostgreSQL database 'portal' to portal_db_backup.sql...
pg_dump -U postgres -h 127.0.0.1 -p 5432 -d portal -f %~dp0portal_db_backup.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Database exported to portal_db_backup.sql!
    echo Copy this file to your server laptop.
) else (
    echo.
    echo [ERROR] pg_dump failed. Make sure PostgreSQL is running.
)

echo.
pause
