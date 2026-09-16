@echo off
title Alight Marketplace - Cloudflare Phone Tunnel
echo ========================================================
echo   Starting Cloudflare Tunnel for Phone Testing
echo ========================================================
echo.
echo Make sure Alight Marketplace is already running on port 3000.
echo.
"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:3000
pause
