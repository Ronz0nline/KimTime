@echo off
setlocal
cd /d "%~dp0"
title KinTime - SQLite Database Inspector

cls
echo =====================================================================
echo                 KinTime: SQLite 3 Database Inspector
echo          Database File: database\kintime.db
echo =====================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your PATH.
    echo Please install Node.js to inspect the database.
    echo.
    pause
    exit /b 1
)

node server/view_db.js

echo.
echo =====================================================================
echo  Database inspection complete.
echo  Press any key to close this window.
echo =====================================================================
pause >nul
