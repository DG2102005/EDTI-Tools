# 部署 customer-view.html 到飞书妙搭
# 用法: .\deploy-to-miaoda.ps1

param(
  [string]$AppId = "app_4k9rzuf8zt0yt",
  [string]$HtmlFile = "..\customer-view.html"
)

if (!(Test-Path $HtmlFile)) {
  Write-Host "❌ 找不到文件: $HtmlFile" -ForegroundColor Red
  exit 1
}

Write-Host "🚀 部署到飞书妙搭..." -ForegroundColor Cyan
Write-Host "  App ID: $AppId"
Write-Host "  文件: $HtmlFile"

# 部署 HTML 到妙搭
lark-cli apps +deploy --app-id $AppId --source (Resolve-Path $HtmlFile)

# 设置公开访问
lark-cli apps +access-scope-set --app-id $AppId --scope public --require-login=false

Write-Host "✅ 部署完成！" -ForegroundColor Green
Write-Host "   访问地址: https://flb03yzu7a.aiforce.cloud/app/$AppId"
