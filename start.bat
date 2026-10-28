@echo off
setlocal
cd /d "%~dp0"
title KinTime - Digital Caregiver Time-Bank

cls
echo =====================================================================
echo                 KinTime: Digital Caregiver Time-Bank
echo             Mutual Care Exchange with SQLite Double-Entry Ledger
echo =====================================================================
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your PATH.
    echo Please install Node.js from https://nodejs.org/ to run this project.
    echo.
    pause
    exit /b 1
)

:: Check dependencies
if not exist "node_modules\" (
    echo [INFO] Installing required dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
)

echo [1/3] Starting SQLite Backend API Server on Port 3001...
start "KinTime Backend API (Port 3001)" cmd /k "cd /d \"%~dp0\" && node server/index.js"

echo [2/3] Waiting for API Server initialization...
timeout /t 2 /nobreak >nul

echo [3/3] Opening KinTime Authentication Gateway in your default web browser...
start http://localhost:5173/auth.html

echo.
echo =====================================================================
echo  Vite Development Server is starting below.
echo  - Frontend URL:  http://localhost:5173
echo  - Backend API:   http://localhost:3001/api/status
echo  - SQLite DB:     database\kintime.db
echo.
echo  Press Ctrl+C in this window anytime to stop the frontend server.
echo =====================================================================
echo.

call npm run dev

pause
