$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverDir = Join-Path $root "server"
$clientDir = Join-Path $root "client"

Write-Host "=== 黑神话·悟空 山西取景地旅游规划 ===" -ForegroundColor Cyan
Write-Host "" 

# Start server
Push-Location $serverDir
$serverJob = Start-Job -ScriptBlock { 
  Set-Location $using:serverDir
  npx tsx src/index.ts
}
Write-Host "[后端] 启动中 (端口 3721)..." -ForegroundColor Green

# Start client
Push-Location $clientDir
$clientJob = Start-Job -ScriptBlock {
  Set-Location $using:clientDir
  npx vite --host
}
Write-Host "[前端] 启动中 (端口 5173)..." -ForegroundColor Green

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  前端地址: http://localhost:5173" -ForegroundColor Yellow
Write-Host "  后端地址: http://localhost:3721" -ForegroundColor Yellow
Write-Host "  管理账号: admin / admin123" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "按 Ctrl+C 停止所有服务" -ForegroundColor Gray

try {
  while ($true) { Start-Sleep -Seconds 1 }
} finally {
  Stop-Job $serverJob -ErrorAction SilentlyContinue
  Stop-Job $clientJob -ErrorAction SilentlyContinue
  Remove-Job $serverJob -ErrorAction SilentlyContinue
  Remove-Job $clientJob -ErrorAction SilentlyContinue
}
