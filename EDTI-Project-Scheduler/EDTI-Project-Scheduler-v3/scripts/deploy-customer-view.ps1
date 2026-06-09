# EDTI Customer View - Deploy to Miaoda
# Usage: .\scripts\deploy-customer-view.ps1
# Prerequisites: lark-cli installed, auth login done

$ErrorActionPreference = "Stop"

Write-Host "=== EDTI Customer View - Miaoda Deploy ===" -ForegroundColor Cyan

# Step 1: Create Miaoda app
Write-Host "[Step 1/2] Creating Miaoda app..." -ForegroundColor Yellow
$APP_ID = lark-cli apps +create --as user --name "EDTI 客户进度看板" --app-type HTML --description "Customer project schedule viewer" --jq ".data.app.app_id" 2>$null
Write-Host "  APP_ID: $APP_ID" -ForegroundColor Green

# Step 2: Publish customer-view.html
Write-Host "[Step 2/2] Publishing customer view..." -ForegroundColor Yellow
$URL = lark-cli apps +html-publish --as user --app-id $APP_ID --path ..\customer-view.html --jq ".data.url" 2>$null
Write-Host "  URL: $URL" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  [DONE] Customer view deployed!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  $URL"
Write-Host ""
Write-Host "--- Next Steps ---" -ForegroundColor Yellow
Write-Host "  1. Set public access:"
Write-Host "     lark-cli apps +access-scope-set --as user --app-id $APP_ID --scope public --require-login false"
Write-Host ""
Write-Host "  2. Update index.html config:"
Write-Host "     customerViewUrl: 'https://miaoda.feishu.cn/app/$APP_ID/'"
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
