@echo off
title Alight - PostgreSQL Stop
echo Stopping PostgreSQL Database Server...

"C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" stop -D "%~dp0backend\pgdata" -m fast

echo PostgreSQL stopped.
timeout /t 2 >nul
