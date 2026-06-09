# EDTI Project Schedule - Miaoda Update
# Updates existing app with new index.html
$ErrorActionPreference = "Stop"
$APP_ID = "app_4k98n70nksnt6"

Write-Host "=== EDTI Project Schedule - Miaoda Update ===" -ForegroundColor Cyan
Write-Host "App: $APP_ID" -ForegroundColor Yellow

Write-Host "[Step] Publishing index.html..." -ForegroundColor Yellow
$output = lark-cli apps +html-publish --as user --app-id $APP_ID --path .\index.html
Write-Host "  $output" -ForegroundColor Green

Write-Host ""
Write-Host "=== DONE ===" -ForegroundColor Green
