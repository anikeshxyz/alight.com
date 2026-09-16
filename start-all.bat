@echo off
title Alight Marketplace - 1-Click Launcher

echo ========================================================
echo   ALIGHT INTERNATIONAL MARKETPLACE - 1-CLICK LAUNCHER
echo ========================================================
echo.

:: 1. Start PostgreSQL if not already running on port 5432
netstat -ano | findstr /R ":5432 .*LISTENING" >nul 2>&1
if errorlevel 1 (
    echo [*] Starting PostgreSQL Database on port 5432...
    start "Alight - PostgreSQL" /min "C:\Program Files\PostgreSQL\18\bin\postgres.exe" -D "%~dp0backend\pgdata"
    ping -n 3 127.0.0.1 >nul
) else (
    echo [OK] PostgreSQL is already running on port 5432.
)

:: 2. Start Backend in separate window
echo [*] Starting Spring Boot Backend (port 8080)...
start "Alight - Backend (Port 8080)" /D "%~dp0backend" cmd /k "mvn spring-boot:run"

:: 3. Start Frontend in separate window
echo [*] Starting Next.js Frontend (port 3000)...
start "Alight - Frontend (Port 3000)" /D "%~dp0frontend" cmd /k "npm run dev"

echo.
echo ========================================================
echo   Services are booting up!
echo   - Frontend:  http://localhost:3000
echo   - Backend:   http://localhost:8080
echo   - Swagger:   http://localhost:8080/swagger-ui.html
echo ========================================================
echo Opening browser in 6 seconds...
ping -n 6 127.0.0.1 >nul
start http://localhost:3000
