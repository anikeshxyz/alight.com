# Auto-frees port 8080 if occupied, then runs Spring Boot
$ErrorActionPreference = "SilentlyContinue"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Starting Alight International Backend (Port 8080)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$conns = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if ($conns) {
    foreach ($c in $conns) {
        $pidToKill = $c.OwningProcess
        if ($pidToKill -gt 0) {
            Write-Host "[*] Port 8080 is held by PID $pidToKill. Releasing port..." -ForegroundColor Yellow
            Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Milliseconds 400
}

$backendDir = Join-Path $PSScriptRoot "backend"
if (Test-Path $backendDir) {
    Set-Location $backendDir
}

mvn spring-boot:run
