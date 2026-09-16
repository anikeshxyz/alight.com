@echo off
title Alight Marketplace - Docker Launcher
echo ========================================================
echo   Starting Alight International via Docker Compose
echo ========================================================

set "PATH=%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin;%ProgramFiles%\Docker\Docker\resources\bin;%PATH%"

docker compose up --build -d

echo.
echo ========================================================
echo   Services are starting in background containers:
echo   - Frontend: http://localhost:3000
echo   - Backend:  http://localhost:8080
echo   - Postgres: localhost:5432
echo ========================================================
echo To view logs:  docker compose logs -f
echo To stop:       docker compose down
echo.
pause
