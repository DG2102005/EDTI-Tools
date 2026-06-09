# EDTI Project Schedule System - Miaoda Deploy v2
# Usage: pwsh .\scripts\deploy-app.ps1
# Prerequisites: lark-cli installed, auth login done: lark-cli auth login --domain apps

$ErrorActionPreference = "Stop"

Write-Host "=== EDTI Project Schedule - Miaoda Deploy ===" -ForegroundColor Cyan

# Step 1: Create Miaoda app
Write-Host "[Step 1/2] Creating Miaoda app..." -ForegroundColor Yellow
$output = lark-cli apps +create --as user --name "EDTI Project Schedule" --app-type HTML --description "EDTI项目排期表 — Gantt chart, bilingual, Excel export"
$APP_ID = ($output | ConvertFrom-Json).data.app.app_id
Write-Host "  APP_ID: $APP_ID" -ForegroundColor Green

# Step 2: Publish index.html
Write-Host "[Step 2/2] Publishing frontend..." -ForegroundColor Yellow
$publishOutput = lark-cli apps +html-publish --as user --app-id $APP_ID --path .\index.html
$URL = ($publishOutput | ConvertFrom-Json).data.url
Write-Host "  URL: $URL" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  [DONE] App deployed!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  $URL"
Write-Host ""
Write-Host "--- Set access scope (optional) ---" -ForegroundColor Yellow
Write-Host "  Internet public (no login):"
Write-Host "    lark-cli apps +access-scope-set --as user --app-id $APP_ID --scope public --require-login false"
Write-Host "  Company only:"
Write-Host "    lark-cli apps +access-scope-set --as user --app-id $APP_ID --scope tenant"
Write-Host "============================================" -ForegroundColor Cyan
