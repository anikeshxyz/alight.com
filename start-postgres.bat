@echo off
title Alight - PostgreSQL Daemon
echo Starting PostgreSQL Database Server (Port 5432)...

"C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" start -D "%~dp0backend\pgdata" -l "%~dp0backend\pgdata\postgres.log"

echo.
echo PostgreSQL is running in the background on port 5432.
timeout /t 2 >nul
