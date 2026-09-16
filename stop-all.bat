@echo off
title Alight Marketplace - Stop All
echo Stopping Alight Marketplace services...

:: Free port 8080 (backend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080" ^| findstr "LISTENING" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)

:: Free port 3000 (frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo Port 8080 (Backend) and Port 3000 (Frontend) stopped.
pause
