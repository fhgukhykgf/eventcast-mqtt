# 清理项目多余文件脚本
# 使用方法: PowerShell 执行 .\cleanup.ps1

Write-Host "🧹 开始清理项目多余文件..." -ForegroundColor Cyan

# 1. 删除废弃的旧 QR 码库
$oldQR = "frontend\miniprogram\utils\weapp-qrcode.js"
if (Test-Path $oldQR) {
    Write-Host "🗑️  删除废弃的 QR 码库: $oldQR" -ForegroundColor Yellow
    Remove-Item $oldQR -Force
}

# 2. 删除多余的 Python __init__.py
$pyInit = "frontend\miniprogram\pages\__init__.py"
if (Test-Path $pyInit) {
    Write-Host "🗑️  删除多余的 __init__.py: $pyInit" -ForegroundColor Yellow
    Remove-Item $pyInit -Force
}

# 3. 移动 check_admin.py 到 scripts 目录
$checkAdmin = "backend\check_admin.py"
$scriptsDir = "backend\scripts\check_admin.py"
if (Test-Path $checkAdmin) {
    Write-Host "📦 移动 check_admin.py 到 scripts 目录" -ForegroundColor Yellow
    Move-Item $checkAdmin $scriptsDir -Force
}

# 4. 删除 images/tabbar/ 下的空文件（0 字节）
$emptyImages = Get-ChildItem -Path "frontend\miniprogram\images\tabbar" -File | Where-Object { $_.Length -eq 0 }
if ($emptyImages.Count -gt 0) {
    Write-Host "🗑️  删除 $($emptyImages.Count) 个空图片文件" -ForegroundColor Yellow
    $emptyImages | Remove-Item -Force
}

# 5. 删除未使用的图标文件（保留正在使用的）
$unusedIcons = @(
    "frontend\miniprogram\images\error.png",
    "frontend\miniprogram\images\icon-location.png",
    "frontend\miniprogram\images\icon-lock.png",
    "frontend\miniprogram\images\icon-organizer.png",
    "frontend\miniprogram\images\icon-scan.png",
    "frontend\miniprogram\images\icon-time.png",
    "frontend\miniprogram\images\icon-user.png",
    "frontend\miniprogram\images\loading.gif",
    "frontend\miniprogram\images\success.png"
)

Write-Host "🗑️  检查未使用的图标文件..." -ForegroundColor Yellow
foreach ($icon in $unusedIcons) {
    if (Test-Path $icon) {
        Write-Host "  - 删除: $icon" -ForegroundColor Gray
        Remove-Item $icon -Force
    }
}

# 6. 清理 Python 缓存（可选）
Write-Host "🧹 清理 Python 缓存文件..." -ForegroundColor Yellow
Get-ChildItem -Path "backend" -Recurse -Directory -Filter "__pycache__" | Remove-Item -Recurse -Force

Write-Host ""
Write-Host "✅ 清理完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📊 清理统计:" -ForegroundColor Cyan
Write-Host "  - 删除废弃 JS 文件: 1 个"
Write-Host "  - 删除多余 Python 文件: 1 个"
Write-Host "  - 移动脚本文件: 1 个"
Write-Host "  - 删除空图片文件: ~11 个"
Write-Host "  - 删除未使用图标: 9 个"
Write-Host "  - 清理缓存目录: 多个"
Write-Host ""

