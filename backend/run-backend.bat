@echo off
setlocal enabledelayedexpansion
title Alight Marketplace Backend

echo ========================================================
echo   Starting Alight International Backend (Port 8080)
echo ========================================================

:: Check and terminate any process lingering on port 8080
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080" ^| findstr "LISTENING" 2^>nul') do (
    echo [*] Port 8080 is held by PID %%a. Terminating lingering process...
    taskkill /F /PID %%a >nul 2>&1
)

:: Run Spring Boot
mvn spring-boot:run
