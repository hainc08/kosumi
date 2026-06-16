# Build gộp FE + BE và làm mới thư mục deploy/ (bản chạy được trên server).
# Dùng: từ thư mục gốc repo chạy:  ./scripts/build-deploy.ps1
# Sau đó: git add deploy && git commit -m "build: deploy" && git push
#
# Lưu ý: KHÔNG dùng $ErrorActionPreference='Stop' vì npm/vite ghi cảnh báo ra stderr
# khiến PowerShell 5.1 hiểu nhầm là lỗi. Thay vào đó kiểm tra $LASTEXITCODE.
$root   = Split-Path $PSScriptRoot -Parent
$deploy = Join-Path $root 'deploy'

function Invoke-Step($name, $dir, $cmd) {
  Write-Host "==> $name" -ForegroundColor Cyan
  Push-Location $dir
  & cmd /c $cmd
  $code = $LASTEXITCODE
  Pop-Location
  if ($code -ne 0) { Write-Host "LỖI: '$cmd' thoát mã $code" -ForegroundColor Red; exit $code }
}

Invoke-Step '[1/4] Build frontend (production)' (Join-Path $root 'frontend') 'npm run build'
Invoke-Step '[2/4] Build backend'               (Join-Path $root 'backend')  'npm run build'

Write-Host '==> [3/4] Làm mới deploy/dist + deploy/client' -ForegroundColor Cyan
foreach ($d in @((Join-Path $deploy 'dist'), (Join-Path $deploy 'client'))) {
  if (Test-Path $d) { Remove-Item $d -Recurse -Force }
  New-Item -ItemType Directory -Path $d | Out-Null
}
Copy-Item (Join-Path $root 'backend/dist/*')  (Join-Path $deploy 'dist')   -Recurse -Force
Copy-Item (Join-Path $root 'frontend/dist/*') (Join-Path $deploy 'client') -Recurse -Force

Write-Host '==> [4/4] Cập nhật package.json + lock' -ForegroundColor Cyan
Copy-Item (Join-Path $root 'backend/package.json')      (Join-Path $deploy 'package.json')      -Force
Copy-Item (Join-Path $root 'backend/package-lock.json') (Join-Path $deploy 'package-lock.json') -Force

Write-Host ''
Write-Host 'XONG. Kiểm tra rồi commit:' -ForegroundColor Green
Write-Host '  git add deploy && git commit -m "build: cap nhat deploy" && git push'
