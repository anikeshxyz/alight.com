@echo off
title Alight Marketplace - Docker Stop
set "PATH=%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin;%ProgramFiles%\Docker\Docker\resources\bin;%PATH%"
echo Stopping Alight International containers...
docker compose down
echo All containers stopped.
pause
