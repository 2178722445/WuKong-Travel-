# WuKong Travel - 启动脚本 (Windows PowerShell)
# 启动方式: .\start.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  WuKong Travel - 黑神话山西取景地" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

# 1. 启动 PostgreSQL + PostGIS (Docker)
Write-Host "`n[1/3] 启动 PostgreSQL/PostGIS 数据库..." -ForegroundColor Green
docker-compose up -d postgres 2>$null

# 2. 初始化数据库并启动 Flask 后端
Write-Host "`n[2/3] 启动 Flask 后端 (port 3721)..." -ForegroundColor Green
$serverJob = Start-Job -Name "wukong-server" -ScriptBlock {
    Set-Location $using:PWD
    cd server
    python -m flask db upgrade 2>$null
    python seed.py
    python app.py
}

# 3. 启动 Vue 前端
Write-Host "`n[3/3] 启动 Vue 前端 (port 5173)..." -ForegroundColor Green
$clientJob = Start-Job -Name "wukong-client" -ScriptBlock {
    Set-Location $using:PWD
    cd client
    npm run dev
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  启动完成!" -ForegroundColor Yellow
Write-Host "  前端: http://localhost:5173" -ForegroundColor White
Write-Host "  后端: http://localhost:3721" -ForegroundColor White
Write-Host "  API文档: http://localhost:3721/api/health" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`n按任意键停止服务..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Stop-Job -Name "wukong-server"
Stop-Job -Name "wukong-client"
Remove-Job -Name "wukong-server","wukong-client" -Force 2>$null
Write-Host "服务已停止" -ForegroundColor Red
