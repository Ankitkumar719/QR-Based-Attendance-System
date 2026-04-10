Set-Location $PSScriptRoot\backend
Write-Host "Starting Smart Attendance Server..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""
node server.js
