# EDTI Project Schedule - Base Setup v2
# Usage: pwsh .\scripts\setup-base-v2.ps1
# This script uses an EXISTING Base token (don't create a new one each time)

param(
  [string]$BaseToken = ""
)

$ErrorActionPreference = "Stop"

# If no token provided, create one
if (-not $BaseToken) {
  Write-Host "[1] Creating new Base..." -ForegroundColor Yellow
  $out = lark-cli base +base-create --as user --name "EDTI Project Schedule System"
  $BaseToken = ($out | ConvertFrom-Json).data.base.base_token
  Write-Host "  => Base Token: $BaseToken" -ForegroundColor Green
} else {
  Write-Host "[1] Using existing Base: $BaseToken" -ForegroundColor Yellow
}

# Find and delete the default table
Write-Host "[2] Removing default empty table..." -ForegroundColor Yellow
$tablesOut = lark-cli base +table-list --as user --base-token $BaseToken
$tables = ($tablesOut | ConvertFrom-Json).data.tables
$defaultTable = $tables | Where-Object { $_.name -eq "数据表" } | Select-Object -First 1
if ($defaultTable) {
  lark-cli base +table-delete --as user --base-token $BaseToken --table-id $defaultTable.id --yes
  Write-Host "  => Deleted: $($defaultTable.id)" -ForegroundColor Green
} else {
  Write-Host "  => No default table found, skipping" -ForegroundColor Yellow
}

# Helper to create field with error handling
function Add-Field {
  param($tableId, $json)
  $result = lark-cli base +field-create --as user --base-token $BaseToken --table-id $tableId --json $json 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Host "  [WARN] Field may already exist: $json" -ForegroundColor Yellow
  } else {
    Write-Host "  [OK] $json" -ForegroundColor Gray
  }
  Start-Sleep -Milliseconds 500
}

# Create Project Master table
Write-Host "[3] Creating Project Master table..." -ForegroundColor Yellow
$pmOut = lark-cli base +table-create --as user --base-token $BaseToken --name "Project Master"
$TABLE_PM = ($pmOut | ConvertFrom-Json).data.table.id
Write-Host "  => ID: $TABLE_PM" -ForegroundColor Green

Add-Field $TABLE_PM '{"name":"Project Name","type":"text"}'
Add-Field $TABLE_PM '{"name":"Project ID","type":"auto_number"}'
Add-Field $TABLE_PM '{"name":"Client Name CN","type":"text"}'
Add-Field $TABLE_PM '{"name":"Client Name EN","type":"text"}'
Add-Field $TABLE_PM '{"name":"Product Model","type":"text"}'
Add-Field $TABLE_PM '{"name":"Cert Standard","type":"select","multiple":true,"options":[{"name":"R10"},{"name":"R22"},{"name":"R46"},{"name":"R100"},{"name":"R122"},{"name":"R136"},{"name":"R148"},{"name":"R149"},{"name":"R158"},{"name":"R165"},{"name":"CE"},{"name":"CB"},{"name":"DOT"}]}'
Add-Field $TABLE_PM '{"name":"Cert Body","type":"select","multiple":false,"options":[{"name":"E57"},{"name":"E49"},{"name":"E24"},{"name":"E11"},{"name":"E5"},{"name":"Other E-mark"},{"name":"CE/NB"},{"name":"DOT/NHTSA"}]}'
Add-Field $TABLE_PM '{"name":"Project Owner","type":"user","multiple":false}'
Add-Field $TABLE_PM '{"name":"Start Date","type":"datetime","style":{"format":"yyyy-MM-dd"}}'
Add-Field $TABLE_PM '{"name":"Target End Date","type":"datetime","style":{"format":"yyyy-MM-dd"}}'
Add-Field $TABLE_PM '{"name":"Project Status","type":"select","multiple":false,"options":[{"name":"Pending"},{"name":"In Progress"},{"name":"Delayed"},{"name":"Completed"}]}'
Add-Field $TABLE_PM '{"name":"Overall Progress","type":"number","style":{"type":"progress","percentage":true,"color":"Blue"}}'
Add-Field $TABLE_PM '{"name":"Visible to Client","type":"checkbox"}'
Add-Field $TABLE_PM '{"name":"Share Token","type":"text"}'
Add-Field $TABLE_PM '{"name":"Notes","type":"text"}'

Write-Host "  => Project Master done" -ForegroundColor Green

# Create Milestones table
Write-Host "[4] Creating Milestones table..." -ForegroundColor Yellow
$msOut = lark-cli base +table-create --as user --base-token $BaseToken --name "Milestones"
$TABLE_MS = ($msOut | ConvertFrom-Json).data.table.id
Write-Host "  => ID: $TABLE_MS" -ForegroundColor Green

Add-Field $TABLE_MS '{"name":"Phase Number","type":"number","style":{"type":"plain","precision":0}}'
Add-Field $TABLE_MS '{"name":"Phase Name CN","type":"text"}'
Add-Field $TABLE_MS '{"name":"Phase Name EN","type":"text"}'
Add-Field $TABLE_MS "{`"name`":`"Linked Project`",`"type`":`"link`",`"link_table`":`"$TABLE_PM`"}"
Add-Field $TABLE_MS '{"name":"Planned Start","type":"datetime","style":{"format":"yyyy-MM-dd"}}'
Add-Field $TABLE_MS '{"name":"Planned End","type":"datetime","style":{"format":"yyyy-MM-dd"}}'
Add-Field $TABLE_MS '{"name":"Actual End","type":"datetime","style":{"format":"yyyy-MM-dd"}}'
Add-Field $TABLE_MS '{"name":"Progress","type":"number","style":{"type":"progress","percentage":true,"color":"Blue"}}'
Add-Field $TABLE_MS '{"name":"Status","type":"select","multiple":false,"options":[{"name":"Pending"},{"name":"In Progress"},{"name":"Delayed"},{"name":"Completed"}]}'
Add-Field $TABLE_MS '{"name":"Owner","type":"user","multiple":false}'
Add-Field $TABLE_MS '{"name":"Note","type":"text"}'

Write-Host "  => Milestones done" -ForegroundColor Green

# Create views
Write-Host "[5] Creating views..." -ForegroundColor Yellow
lark-cli base +view-create --as user --base-token $BaseToken --table-id $TABLE_PM --json '{"name":"Active Projects","type":"grid"}' 2>$null
Start-Sleep -Milliseconds 500
lark-cli base +view-create --as user --base-token $BaseToken --table-id $TABLE_PM --json '{"name":"Client View","type":"grid"}' 2>$null
Start-Sleep -Milliseconds 500
lark-cli base +view-create --as user --base-token $BaseToken --table-id $TABLE_PM --json '{"name":"Completed","type":"grid"}' 2>$null
Start-Sleep -Milliseconds 500

Write-Host "  => Views created" -ForegroundColor Green

# Insert sample data
Write-Host "[6] Inserting sample data..." -ForegroundColor Yellow
$sample = '{' +
  '"Project Name":"PTC Heater E-mark Certification",' +
  '"Client Name CN":"Guangdong Zhengyang Sensor Tech",' +
  '"Client Name EN":"Guangdong Zhengyang Sensor Tech",' +
  '"Product Model":"NPH50A",' +
  '"Cert Standard":["R122"],' +
  '"Cert Body":"E57",' +
  '"Start Date":"2026-06-01",' +
  '"Target End Date":"2026-08-15",' +
  '"Project Status":"In Progress",' +
  '"Overall Progress":0.42,' +
  '"Visible to Client":true,' +
  '"Share Token":"EDTI-2026-001"' +
'}'

$recOut = lark-cli base +record-upsert --as user --base-token $BaseToken --table-id $TABLE_PM --json $sample
$REC_ID = ($recOut | ConvertFrom-Json).data.record.record_id
Write-Host "  => Sample record: $REC_ID" -ForegroundColor Green

Write-Host ""
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "  ALL DONE!" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "  Base Token:       $BaseToken"
Write-Host "  Project Master:   $TABLE_PM"
Write-Host "  Milestones:       $TABLE_MS"
Write-Host "  Sample Record:    $REC_ID"
Write-Host ""
Write-Host "  Next -> Open in Feishu web:" -ForegroundColor Yellow
Write-Host "  1. Create 'Timeline' tab in Project Master (Start Date / Target End Date)"
Write-Host "  2. Create 'Timeline' tab in Milestones (Planned Start / Planned End)"
Write-Host "  3. Filter Client View: Visible to Client = true"
Write-Host "  4. Share button -> public read-only link"
Write-Host "==============================" -ForegroundColor Cyan
