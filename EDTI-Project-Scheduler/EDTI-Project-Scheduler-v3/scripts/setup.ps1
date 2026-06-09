# EDTI Project Schedule - Base Setup v7
# Uses --json @./edti_*.json (relative path) to avoid path restrictions

$ErrorActionPreference = "Stop"

Write-Host "=== EDTI Project Schedule - Base Setup ===" -ForegroundColor Cyan

# Helper: write JSON to current directory and return relative path
function Write-JsonFile {
    param($Json)
    $name = "edti_$(Get-Random).json"
    Set-Content -LiteralPath $name -Value $Json -Encoding ASCII
    return ".\$name"
}

# 1. Create Base
Write-Host "[1] Creating Base..." -ForegroundColor Yellow
$BASE = lark-cli base +base-create --as user --name "EDTI Project Schedule System" --jq ".data.base.base_token"
$BASE = "$BASE".Trim()
Write-Host "  Token: $BASE" -ForegroundColor Green

# 2. Create Project Master table
Write-Host "[2] Creating Project Master..." -ForegroundColor Yellow
$TBL_PM = lark-cli base +table-create --as user --base-token $BASE --name "Project Master" --jq ".data.table.id"
$TBL_PM = "$TBL_PM".Trim()
Write-Host "  Table ID: $TBL_PM" -ForegroundColor Green

Write-Host "  Fields..." -ForegroundColor Yellow

$f = Write-JsonFile '{"name":"Project Name","type":"text"}'
lark-cli base +field-create --as user --base-token $BASE --table-id $TBL_PM --json "@$f"
Remove-Item -LiteralPath $f -Force; Start-Sleep -Milliseconds 300

$f = Write-JsonFile '{"name":"Project ID","type":"auto_number"}'
lark-cli base +field-create --as user --base-token $BASE --table-id $TBL_PM --json "@$f"
Remove-Item -LiteralPath $f -Force; Start-Sleep -Milliseconds 300

$f = Write-JsonFile '{"name":"Client Name CN","type":"text"}'
lark-cli base +field-create --as user --base-token $BASE --table-id $TBL_PM --json "@$f"
Remove-Item -LiteralPath $f -Force; Start-Sleep -Milliseconds 300

$f = Write-JsonFile '{"name":"Client Name EN","type":"text"}'
lark-cli base +field-create --as user --base-token $BASE --table-id $TBL_PM --json "@$f"
Remove-Item -LiteralPath $f -Force; Start-Sleep -Milliseconds 300

$f = Write-JsonFile '{"name":"Product Model","type":"text"}'
lark-cli base +field-create --as user --base-token $BASE --table-id $TBL_PM --json "@$f"
Remove-Item -LiteralPath $f -Force; Start-Sleep -Milliseconds 300

$f = Write-JsonFile '{"name":"Cert Standard","type":"select","multiple":true,"options":[{"name":"R10"},{"name":"R22"},{"name":"R46"},{"name":"R100"},{"name":"R122"},{"name":"R136"},{"name":"R148"},{"name":"R149"},{"name":"R158"},{"name":"R165"},{"name":"CE"},{"name":"CB"},{"name":"DOT"}]}'
lark-cli base +field-create --as user --base-token $BASE --table-id $TBL_PM --json "@$f"
Remove-Item -LiteralPath $f -Force; Start-Sleep -Milliseconds 300

$f = Write-JsonFile '{"name":"Cert Body","type":"select","multiple":false,"options":[{"name":"E57"},{"name":"E49"},{"name":"E24"},{"name":"E11"},{"name":"E5"},{"name":"Other E-mark"},{"name":"CE/NB"},{"name":"DOT/NHTSA"}]}'
lark-cli base +field-create --as user --base-token $BASE --table-id $TBL_PM --json "@$f"
Remove-Item -LiteralPath $f -Force; Start-Sleep -Milliseconds 300

$f = Write-JsonFile '{"name":"Project Owner","type":"user","multiple":false}'
lark-cli base +field-create --as user --base-token $BASE --table-id $TBL_PM --json "@$f"
Remove-Item -LiteralPath $f -Force; Start-Sleep -Milliseconds 300

$f = Write-JsonFile '{"name":"Start Date","type":"datetime","style":{"format":"yyyy-MM-dd"}}'
lark-cli base +field-create --as user --base-token $BASE --table-id $TBL_PM --json "@$f"
Remove-Item -LiteralPath $f -Force; Start-Sleep -Milliseconds 300

$f = Write-JsonFile '{"name":"Target End Date","type":"datetime","style":{"format":"yyyy-MM-dd"}}'
lark-cli base +field-create --as user --base-token $BASE --table-id $TBL_PM --json "@$f"
Remove-Item -LiteralPath $f -Force; Start-Sleep -Milliseconds 300

$f = Write-JsonFile '{"name":"Project Status","type":"select","multiple":false,"options":[{"name":"Pending"},{"name":"In Progress"},{"name":"Delayed"},{"name":"Completed"}]}'
lark-cli base +field-create --as user --base-token $BASE --table-id $TBL_PM --json "@$f"
Remove-Item -LiteralPath $f -Force; Start-Sleep -Milliseconds 300

$f = Write-JsonFile '{"name":"Overall Progress","type":"number","style":{"type":"progress","percentage":true,"color":"Blue"}}'
lark-cli base +field-create --as user --base-token $BASE --table-id $TBL_PM --json "@$f"
Remove-Item -LiteralPath $f -Force; Start-Sleep -Milliseconds 300

$f = Write-JsonFile '{"name":"Visible to Client","type":"checkbox"}'
lark-cli base +field-create --as user --base-token $BASE --table-id $TBL_PM --json "@$f"
Remove-Item -LiteralPath $f -Force; Start-Sleep -Milliseconds 300

$f = Write-JsonFile '{"name":"Share Token","type":"text"}'
lark-cli base +field-create --as user --base-token $BASE --table-id $TBL_PM --json "@$f"
Remove-Item -LiteralPath $f -Force; Start-Sleep -Milliseconds 300

$f = Write-JsonFile '{"name":"Notes","type":"text"}'
lark-cli base +field-create --as user --base-token $BASE --table-id $TBL_PM --json "@$f"
Remove-Item -LiteralPath $f -Force

Write-Host "  [OK] Project Master: 15 fields" -ForegroundColor Green

# 3. Create Milestones table
Write-Host "[3] Creating Milestones..." -ForegroundColor Yellow
$TBL_MS = lark-cli base +table-create --as user --base-token $BASE --name "Milestones" --jq ".data.table.id"
$TBL_MS = "$TBL_MS".Trim()
Write-Host "  Table ID: $TBL_MS" -ForegroundColor Green

Write-Host "  Fields..." -ForegroundColor Yellow

$f = Write-JsonFile '{"name":"Phase Number","type":"number","style":{"type":"plain","precision":0}}'
lark-cli base +field-create --as user --base-token $BASE --table-id $TBL_MS --json "@$f"
Remove-Item -LiteralPath $f -Force; Start-Sleep -Milliseconds 300

$f = Write-JsonFile '{"name":"Phase Name CN","type":"text"}'
lark-cli base +field-create --as user --base-token $BASE --table-id $TBL_MS --json "@$f"
Remove-Item -LiteralPath $f -Force; Start-Sleep -Milliseconds 300

$f = Write-JsonFile '{"name":"Phase Name EN","type":"text"}'
lark-cli base +field-create --as user --base-token $BASE --table-id $TBL_MS --json "@$f"
Remove-Item -LiteralPath $f -Force; Start-Sleep -Milliseconds 300

# Link field - needs variable interpolation
$linkBody = '{"name":"Linked Project","type":"link","link_table":"' + $TBL_PM + '"}'
$f = Write-JsonFile $linkBody
lark-cli base +field-create --as user --base-token $BASE --table-id $TBL_MS --json "@$f"
Remove-Item -LiteralPath $f -Force; Start-Sleep -Milliseconds 300

$f = Write-JsonFile '{"name":"Planned Start","type":"datetime","style":{"format":"yyyy-MM-dd"}}'
lark-cli base +field-create --as user --base-token $BASE --table-id $TBL_MS --json "@$f"
Remove-Item -LiteralPath $f -Force; Start-Sleep -Milliseconds 300

$f = Write-JsonFile '{"name":"Planned End","type":"datetime","style":{"format":"yyyy-MM-dd"}}'
lark-cli base +field-create --as user --base-token $BASE --table-id $TBL_MS --json "@$f"
Remove-Item -LiteralPath $f -Force; Start-Sleep -Milliseconds 300

$f = Write-JsonFile '{"name":"Actual End","type":"datetime","style":{"format":"yyyy-MM-dd"}}'
lark-cli base +field-create --as user --base-token $BASE --table-id $TBL_MS --json "@$f"
Remove-Item -LiteralPath $f -Force; Start-Sleep -Milliseconds 300

$f = Write-JsonFile '{"name":"Progress","type":"number","style":{"type":"progress","percentage":true,"color":"Blue"}}'
lark-cli base +field-create --as user --base-token $BASE --table-id $TBL_MS --json "@$f"
Remove-Item -LiteralPath $f -Force; Start-Sleep -Milliseconds 300

$f = Write-JsonFile '{"name":"Status","type":"select","multiple":false,"options":[{"name":"Pending"},{"name":"In Progress"},{"name":"Delayed"},{"name":"Completed"}]}'
lark-cli base +field-create --as user --base-token $BASE --table-id $TBL_MS --json "@$f"
Remove-Item -LiteralPath $f -Force; Start-Sleep -Milliseconds 300

$f = Write-JsonFile '{"name":"Owner","type":"user","multiple":false}'
lark-cli base +field-create --as user --base-token $BASE --table-id $TBL_MS --json "@$f"
Remove-Item -LiteralPath $f -Force; Start-Sleep -Milliseconds 300

$f = Write-JsonFile '{"name":"Note","type":"text"}'
lark-cli base +field-create --as user --base-token $BASE --table-id $TBL_MS --json "@$f"
Remove-Item -LiteralPath $f -Force

Write-Host "  [OK] Milestones: 12 fields" -ForegroundColor Green

# 4. Views
Write-Host "[4] Creating views..." -ForegroundColor Yellow
$f = Write-JsonFile '{"name":"Active Projects","type":"grid"}'
lark-cli base +view-create --as user --base-token $BASE --table-id $TBL_PM --json "@$f"
Remove-Item -LiteralPath $f -Force; Start-Sleep -Milliseconds 300
$f = Write-JsonFile '{"name":"Client View","type":"grid"}'
lark-cli base +view-create --as user --base-token $BASE --table-id $TBL_PM --json "@$f"
Remove-Item -LiteralPath $f -Force; Start-Sleep -Milliseconds 300
$f = Write-JsonFile '{"name":"Completed","type":"grid"}'
lark-cli base +view-create --as user --base-token $BASE --table-id $TBL_PM --json "@$f"
Remove-Item -LiteralPath $f -Force
Write-Host "  [OK] Views created" -ForegroundColor Green

# 5. Sample data
Write-Host "[5] Inserting sample data..." -ForegroundColor Yellow
$sampleJson = '{"Project Name":"PTC Heater E-mark Certification","Client Name CN":"Guangdong Zhengyang Sensor Tech","Client Name EN":"Guangdong Zhengyang Sensor Tech","Product Model":"NPH50A","Cert Standard":["R122"],"Cert Body":"E57","Start Date":"2026-06-01","Target End Date":"2026-08-15","Project Status":"In Progress","Overall Progress":0.42,"Visible to Client":true,"Share Token":"EDTI-2026-001"}'
$f = Write-JsonFile $sampleJson
$REC = lark-cli base +record-upsert --as user --base-token $BASE --table-id $TBL_PM --json "@$f" --jq ".data.record.record_id"
Remove-Item -LiteralPath $f -Force
$REC = "$REC".Trim()
Write-Host "  Sample Record: $REC" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SETUP COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Base Token:       $BASE"
Write-Host "  Project Master:   $TBL_PM"
Write-Host "  Milestones:       $TBL_MS"
Write-Host ""
Write-Host "  NEXT: Open in Feishu web to add Timeline view"
Write-Host "========================================" -ForegroundColor Cyan

# Cleanup leftover temp files
Remove-Item -Path .\edti_*.json -Force -ErrorAction SilentlyContinue
