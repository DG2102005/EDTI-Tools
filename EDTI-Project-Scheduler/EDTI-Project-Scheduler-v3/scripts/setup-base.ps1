# EDTI Project Schedule System - Base Setup Script
# Usage: pwsh .\scripts\setup-base.ps1
# Prerequisites: lark-cli installed, auth login done: lark-cli auth login --domain base

$ErrorActionPreference = "Stop"

Write-Host "=== EDTI Project Schedule - Base Creation ===" -ForegroundColor Cyan

# Step 1: Create Base
Write-Host "[Step 1/6] Creating Base..." -ForegroundColor Yellow
$baseOutput = lark-cli base +base-create --as user --name "EDTI Project Schedule System" --jq ".data.base.base_token"
$BASE_TOKEN = $baseOutput | Select-Object -First 1
Write-Host "  => Base Token: $BASE_TOKEN" -ForegroundColor Green

# Helper: create a field on a table
function Add-Field {
  param($tableId, $json)
  $cmd = "lark-cli base +field-create --as user --base-token $BASE_TOKEN --table-id $tableId --json '$json'"
  Write-Host "  field: $json"
  Invoke-Expression $cmd
  Start-Sleep -Milliseconds 600
}

# Step 2: Delete default empty table
Write-Host "[Step 2/6] Deleting default empty table..." -ForegroundColor Yellow
lark-cli base +table-delete --as user --base-token $BASE_TOKEN --table-id "tblRjtufVu2kYsWw" --yes 2>$null

# Step 3: Create Project Master table with fields + views
Write-Host "[Step 3/6] Creating Project Master table..." -ForegroundColor Yellow
$tableOutput = lark-cli base +table-create --as user --base-token $BASE_TOKEN --name "Project Master" --jq ".data.table.id"
$TABLE_PROJECT = $tableOutput | Select-Object -First 1
Write-Host "  => Table ID: $TABLE_PROJECT" -ForegroundColor Green

Write-Host "  Creating fields..." -ForegroundColor Yellow

Add-Field $TABLE_PROJECT '{"name":"Project Name","type":"text"}'
Add-Field $TABLE_PROJECT '{"name":"Project ID","type":"auto_number"}'
Add-Field $TABLE_PROJECT '{"name":"Client Name CN","type":"text"}'
Add-Field $TABLE_PROJECT '{"name":"Client Name EN","type":"text"}'
Add-Field $TABLE_PROJECT '{"name":"Product Model","type":"text"}'
Add-Field $TABLE_PROJECT '{"name":"Cert Standard","type":"select","multiple":true,"options":[{"name":"R10"},{"name":"R22"},{"name":"R46"},{"name":"R100"},{"name":"R122"},{"name":"R136"},{"name":"R148"},{"name":"R149"},{"name":"R158"},{"name":"R165"},{"name":"CE"},{"name":"CB"},{"name":"DOT"}]}'
Add-Field $TABLE_PROJECT '{"name":"Cert Body","type":"select","multiple":false,"options":[{"name":"E57"},{"name":"E49"},{"name":"E24"},{"name":"E11"},{"name":"E5"},{"name":"Other E-mark"},{"name":"CE/NB"},{"name":"DOT/NHTSA"}]}'
Add-Field $TABLE_PROJECT '{"name":"Project Owner","type":"user","multiple":false}'
Add-Field $TABLE_PROJECT '{"name":"Start Date","type":"datetime","style":{"format":"yyyy-MM-dd"}}'
Add-Field $TABLE_PROJECT '{"name":"Target End Date","type":"datetime","style":{"format":"yyyy-MM-dd"}}'
Add-Field $TABLE_PROJECT '{"name":"Project Status","type":"select","multiple":false,"options":[{"name":"Pending"},{"name":"In Progress"},{"name":"Delayed"},{"name":"Completed"}]}'
Add-Field $TABLE_PROJECT '{"name":"Overall Progress","type":"number","style":{"type":"progress","percentage":true,"color":"Blue"}}'
Add-Field $TABLE_PROJECT '{"name":"Visible to Client","type":"checkbox"}'
Add-Field $TABLE_PROJECT '{"name":"Share Token","type":"text"}'
Add-Field $TABLE_PROJECT '{"name":"Notes","type":"text"}'

Write-Host "  => Project Master fields done" -ForegroundColor Green

# Step 4: Create Milestone table
Write-Host "[Step 4/6] Creating Milestone table..." -ForegroundColor Yellow
$tableOutput2 = lark-cli base +table-create --as user --base-token $BASE_TOKEN --name "Milestones" --jq ".data.table.id"
$TABLE_MILESTONE = $tableOutput2 | Select-Object -First 1
Write-Host "  => Table ID: $TABLE_MILESTONE" -ForegroundColor Green

Add-Field $TABLE_MILESTONE '{"name":"Phase Number","type":"number","style":{"type":"plain","precision":0}}'
Add-Field $TABLE_MILESTONE '{"name":"Phase Name CN","type":"text"}'
Add-Field $TABLE_MILESTONE '{"name":"Phase Name EN","type":"text"}'
Add-Field $TABLE_MILESTONE "`"name`":`"Linked Project`",`"type`":`"link`",`"link_table`":`"$TABLE_PROJECT`""
Add-Field $TABLE_MILESTONE '{"name":"Planned Start","type":"datetime","style":{"format":"yyyy-MM-dd"}}'
Add-Field $TABLE_MILESTONE '{"name":"Planned End","type":"datetime","style":{"format":"yyyy-MM-dd"}}'
Add-Field $TABLE_MILESTONE '{"name":"Actual End","type":"datetime","style":{"format":"yyyy-MM-dd"}}'
Add-Field $TABLE_MILESTONE '{"name":"Progress","type":"number","style":{"type":"progress","percentage":true,"color":"Blue"}}'
Add-Field $TABLE_MILESTONE '{"name":"Status","type":"select","multiple":false,"options":[{"name":"Pending"},{"name":"In Progress"},{"name":"Delayed"},{"name":"Completed"}]}'
Add-Field $TABLE_MILESTONE '{"name":"Owner","type":"user","multiple":false}'
Add-Field $TABLE_MILESTONE '{"name":"Note","type":"text"}'

Write-Host "  => Milestone fields done" -ForegroundColor Green

# Step 5: Configure views
Write-Host "[Step 5/6] Configuring views..." -ForegroundColor Yellow

lark-cli base +view-create --as user --base-token $BASE_TOKEN --table-id $TABLE_PROJECT --json '{"name":"Active Projects","type":"grid"}'
Start-Sleep -Milliseconds 600

lark-cli base +view-create --as user --base-token $BASE_TOKEN --table-id $TABLE_PROJECT --json '{"name":"Client View","type":"grid"}'
Start-Sleep -Milliseconds 600

lark-cli base +view-create --as user --base-token $BASE_TOKEN --table-id $TABLE_PROJECT --json '{"name":"Completed Projects","type":"grid"}'
Start-Sleep -Milliseconds 600

Write-Host "  => Views configured" -ForegroundColor Green

# Step 6: Insert sample project data
Write-Host "[Step 6/6] Inserting sample data..." -ForegroundColor Yellow

$sampleJson = '{"Project Name":"PTC Heater E-mark Certification","Client Name CN":"Guangdong Zhengyang Sensor Tech","Client Name EN":"Guangdong Zhengyang Sensor Tech","Product Model":"NPH50A","Cert Standard":["R122"],"Cert Body":"E57","Start Date":"2026-06-01","Target End Date":"2026-08-15","Project Status":"In Progress","Overall Progress":0.42,"Visible to Client":true,"Share Token":"EDTI-2026-001"}'

$recordResult = lark-cli base +record-upsert --as user --base-token $BASE_TOKEN --table-id $TABLE_PROJECT --json $sampleJson --jq ".data.record.record_id"
$RECORD_ID = $recordResult | Select-Object -First 1
Write-Host "  => Sample record ID: $RECORD_ID" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  [DONE] Base created successfully!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Base Token:       $BASE_TOKEN"
Write-Host "  Project Table:    $TABLE_PROJECT"
Write-Host "  Milestone Table:  $TABLE_MILESTONE"
Write-Host "  Sample Record:    $RECORD_ID"
Write-Host ""
Write-Host "  Next steps (in Feishu web):" -ForegroundColor Yellow
Write-Host "  1. Open the Base in Feishu"
Write-Host "  2. In 'Project Master':"
Write-Host "     - Add a Timeline view (use Start Date / Target End Date)"
Write-Host "     - Set up Client View filter: Visible to Client = true"
Write-Host "  3. In 'Milestones':"
Write-Host "     - Add a Timeline view (use Planned Start / Planned End)"
Write-Host "  4. Set sharing: public read-only link"
Write-Host "============================================" -ForegroundColor Cyan
