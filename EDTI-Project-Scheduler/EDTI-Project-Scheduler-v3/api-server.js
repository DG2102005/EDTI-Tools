/**
 * EDTI Project Schedule — API Server v3
 * Uses Feishu OpenAPI directly (via user token from lark-cli)
 *
 * Usage:
 *   $env:BASE_TOKEN="BdZCbO3Dpai7zUsffmPc9oJSn5e"
 *   $env:TABLE_PROJECT="tbl0eEtQAYoRyOpT"
 *   $env:TABLE_MILESTONE="tblPj6f9JLGtVLaH"
 *   node api-server.js
 */

const http = require('http');
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const BASE_TOKEN = process.env.BASE_TOKEN || 'BdZCbO3Dpai7zUsffmPc9oJSn5e';
const TABLE_PROJECT = process.env.TABLE_PROJECT || 'tbl0eEtQAYoRyOpT';
const TABLE_MILESTONE = process.env.TABLE_MILESTONE || 'tblPj6f9JLGtVLaH';

// ─── lark-cli helper ───────────────────────────────────────────────
function lark(cmd) {
  const r = spawnSync(cmd, [], { encoding: 'utf-8', timeout: 30000, shell: true });
  if (r.error) throw new Error(`lark: ${r.error.message}`);
  let out = (r.stdout || '').trim();
  // Find first JSON object
  const j = out.indexOf('{');
  if (j >= 0) out = out.slice(j);
  if (!out) throw new Error(`lark empty output for: ${cmd.slice(0, 100)}`);
  try {
    const d = JSON.parse(out);
    if (!d.ok) throw new Error(d.error?.message || 'lark error');
    return d.data;
  } catch (e) {
    throw new Error(`lark parse: ${e.message}`);
  }
}

// ─── Parse table output from +record-list ──────────────────────────
function parseTable(stdout) {
  const lines = stdout.split('\n').filter(l => l.trim().startsWith('|'));
  if (lines.length < 2) return [];
  const parseRow = line => line.split('|').map(c => c.trim());
  const headers = parseRow(lines[0]).slice(1, -1);
  // Find separator line index (contains ---)
  let sepIdx = 1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].includes('---')) { sepIdx = i; break; }
  }
  const results = [];
  for (let i = sepIdx + 1; i < lines.length; i++) {
    const cells = parseRow(lines[i]).slice(1, -1);
    if (cells.length === 0 || cells.every(c => !c)) continue;
    const row = { fields: {}, record_id: '' };
    headers.forEach((h, idx) => {
      const val = idx < cells.length ? cells[idx] : '';
      if (h === '_record_id') row.record_id = val;
      else row.fields[h] = val;
    });
    results.push(row);
  }
  return results;
}

// ─── Record operations ─────────────────────────────────────────────
function recordList(baseToken, tableId) {
  const cmd = `lark-cli base +record-list --format markdown --as user --base-token ${baseToken} --table-id ${tableId} --limit 200`;
  const r = spawnSync(cmd, [], { encoding: 'utf-8', timeout: 30000, shell: true });
  if (r.error) throw new Error(`list spawn: ${r.error.message}`);
  const stdout = (r.stdout || '').trim();
  const stderr = (r.stderr || '').trim();
  if (!stdout) throw new Error(`list empty stdout (stderr: ${stderr.slice(0,200) || 'none'})`);
  const tableStart = stdout.indexOf('|');
  if (tableStart < 0) throw new Error(`list no table in output: ${stdout.slice(0,200)}`);
  return parseTable(stdout.slice(tableStart));
}

function recordGet(baseToken, tableId, recordId) {
  const cmd = `lark-cli base +record-get --format json --as user --base-token ${baseToken} --table-id ${tableId} --record-id ${recordId}`;
  const r = spawnSync(cmd, [], { encoding: 'utf-8', timeout: 30000, shell: true });
  if (r.error) throw new Error(`get: ${r.error.message}`);
  let out = (r.stdout || '').trim();
  const j = out.indexOf('{');
  if (j >= 0) out = out.slice(j);
  const k = out.lastIndexOf('}');
  if (k >= 0) out = out.slice(0, k + 1);
  try {
    const d = JSON.parse(out);
    if (!d.ok) throw new Error(d.error?.message || 'get error');
    // Format: { data: { data: [[val1,val2,...]], fields: ["F1","F2",...], record_id_list: ["rec_xxx"] } }
    const raw = d.data;
    const cellValues = raw.data && raw.data[0];
    const fieldNames = raw.fields || [];
    const rid = (raw.record_id_list && raw.record_id_list[0]) || '';
    if (!cellValues) throw new Error('no data returned');
    const fields = {};
    fieldNames.forEach((name, i) => { fields[name] = i < cellValues.length ? cellValues[i] : ''; });
    return { record_id: rid, fields };
  } catch (e) {
    throw new Error(`parse: ${e.message} | out: ${out.slice(0,150)}`);
  }
}

function recordUpsert(baseToken, tableId, fields, recordId) {
  const tmpFile = `_tmp_${Date.now()}_${Math.random().toString(36).slice(2,6)}.json`;
  fs.writeFileSync(path.join(__dirname, tmpFile), JSON.stringify(fields), 'utf-8');
  try {
    let cmd = `lark-cli base +record-upsert --as user --base-token ${baseToken} --table-id ${tableId} --json @./${tmpFile}`;
    if (recordId) cmd += ` --record-id ${recordId}`;
    const r = spawnSync(cmd, [], { encoding: 'utf-8', timeout: 30000, shell: true });
    if (r.error) throw new Error(`upsert: ${r.error.message}`);
    let out = (r.stdout || '').trim();
    const j = out.indexOf('{');
    if (j >= 0) out = out.slice(j);
    const k = out.lastIndexOf('}');
    if (k >= 0) out = out.slice(0, k + 1);
    const d = JSON.parse(out);
    if (!d.ok) throw new Error(d.error?.message || 'upsert error');
    const rid = d.data?.record?.record_id || d.data?.record_id || d.data?.id || '';
    if (!rid) console.error('upsert: no record_id in', JSON.stringify(d.data).slice(0,200));
    return rid;
  } finally {
    try { fs.unlinkSync(path.join(__dirname, tmpFile)); } catch {}
  }
}

function recordBatchGet(baseToken, tableId, recordIds) {
  if (!recordIds.length) return [];
  const list = JSON.stringify({ record_id_list: recordIds });
  const tmpFile = `_tmp_bg_${Date.now()}_${Math.random().toString(36).slice(2,6)}.json`;
  fs.writeFileSync(path.join(__dirname, tmpFile), list, 'utf-8');
  try {
    const cmd = `lark-cli base +record-get --format json --as user --base-token ${baseToken} --table-id ${tableId} --json @./${tmpFile}`;
    const r = spawnSync(cmd, [], { encoding: 'utf-8', timeout: 30000, shell: true });
    if (r.error) throw new Error(`batch: ${r.error.message}`);
    let out = (r.stdout || '').trim();
    const j = out.indexOf('{');
    if (j >= 0) out = out.slice(j);
    const k = out.lastIndexOf('}');
    if (k >= 0) out = out.slice(0, k + 1);
    if (!out) throw new Error(`batch: no JSON`);
    const d = JSON.parse(out);
    if (!d.ok) throw new Error(d.error?.message || 'batch error');
    // Format: { data: { data: [[...],...], fields: [...], record_id_list: [...] } }
    const raw = d.data;
    const fieldNames = raw.fields || [];
    const rids = raw.record_id_list || [];
    const rows = raw.data || [];
    // Handle both array format and items/records format
    if (rows.length && fieldNames.length) {
      return rows.map((vals, idx) => {
        const fields = {};
        fieldNames.forEach((name, i) => { fields[name] = i < vals.length ? vals[i] : ''; });
        return { record_id: rids[idx] || '', fields };
      });
    }
    return d.data?.records || d.data?.items || [];
  } finally {
    try { fs.unlinkSync(path.join(__dirname, tmpFile)); } catch {}
  }
}

function recordDelete(baseToken, tableId, recordId) {
  const cmd = `lark-cli base +record-delete --as user --base-token ${baseToken} --table-id ${tableId} --record-id ${recordId} --yes 2>&1`;
  console.log('recordDelete:', recordId);
  const r = require('child_process').execSync(cmd, { encoding: 'utf-8', timeout: 30000, shell: true });
  console.log('recordDelete out:', r.trim().slice(0, 300));
  let out = (r || '').trim();
  const j = out.indexOf('{');
  if (j >= 0) out = out.slice(j);
  const k = out.lastIndexOf('}');
  if (k >= 0) out = out.slice(0, k + 1);
  if (!out) throw new Error('delete: no JSON output');
  const d = JSON.parse(out);
  if (!d.ok) throw new Error(d.error?.message || 'delete error');
}

// ─── Transform helpers ─────────────────────────────────────────────
function stripTime(d) {
  if (!d) return d;
  const s = String(d);
  const i = s.indexOf(' ');
  return i > 0 ? s.slice(0, i) : s;
}
function pct(n) {
  if (n === null || n === undefined) return 0;
  const v = Number(n);
  return v > 1 ? Math.round(v) : Math.round(v * 100);
}

function rowFields(r) {
  // r.fields (bitable API) OR r (direct fields object)
  return r.fields || r;
}

function projectSummary(r) {
  const f = rowFields(r);
  return {
    id: r.record_id || '',
    name: f['Project Name'] || '',
    clientCN: f['Client Name CN'] || '',
    clientEN: f['Client Name EN'] || '',
    status: normalizeStatus(f['Project Status']),
    progress: pct(f['Overall Progress']),
    shareToken: f['Share Token'] || '',
    visible: !!f['Visible to Client']
  };
}

function projectFull(r) {
  const f = rowFields(r);
  return {
    id: r.record_id || '',
    projectName: f['Project Name'] || '',
    clientCN: f['Client Name CN'] || '',
    clientEN: f['Client Name EN'] || '',
    productModel: f['Product Model'] || '',
    standard: Array.isArray(f['Cert Standard']) ? f['Cert Standard'].join(', ') : (f['Cert Standard'] || ''),
    certBody: f['Cert Body'] || '',
    startDate: stripTime(f['Start Date']) || '',
    targetEndDate: stripTime(f['Target End Date']) || '',
    progress: pct(f['Overall Progress']),
    status: normalizeStatus(f['Project Status']),
    visible: !!f['Visible to Client'],
    shareToken: f['Share Token'] || '',
    notes: f['Notes'] || ''
  };
}

function milestoneFromRow(r) {
  const f = rowFields(r);
  let linkVal = '';
  if (Array.isArray(f['Linked Project'])) {
    linkVal = f['Linked Project'][0]?.record_id || f['Linked Project'][0]?.id || String(f['Linked Project'][0] || '');
  } else {
    linkVal = ('' + (f['Linked Project'] || ''));
  }
  return {
    id: r.record_id || '',
    phaseNum: f['Phase Number'] || null,
    nameCN: f['Phase Name CN'] || '',
    nameEN: f['Phase Name EN'] || '',
    plannedStart: stripTime(f['Planned Start']) || '',
    plannedEnd: stripTime(f['Planned End']) || '',
    actualEnd: stripTime(f['Actual End']) || null,
    progress: pct(f['Progress']),
    status: normalizeStatus(f['Status']),
    note: f['Note'] || '',
    linkedProject: linkVal
  };
}

function normalizeStatus(s) {
  if (!s) return 'pending';
  const v = ('' + s).toLowerCase();
  if (v === 'in progress' || v === 'in-progress') return 'in-progress';
  if (v === 'delayed') return 'delayed';
  if (v === 'completed') return 'completed';
  if (v === 'failed') return 'failed';
  return 'pending';
}

// ─── API Handlers ──────────────────────────────────────────────────
function handleListProjects() {
  const rows = recordList(BASE_TOKEN, TABLE_PROJECT);
  const items = rows.map(projectSummary);
  const seen = new Set();
  const deduped = items.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
  return { projects: deduped, total: deduped.length };
}

function handleGetProject(recordId) {
  let record;
  try { record = recordGet(BASE_TOKEN, TABLE_PROJECT, recordId); }
  catch (e) { console.error('recordGet failed for', recordId, e.message); return { project: null, milestones: [], error: 'Project not found' }; }
  const project = projectFull(record);

  // Get milestone IDs from list, then batch-get for full data (incl link field)
  const msRows = recordList(BASE_TOKEN, TABLE_MILESTONE);
  const msIds = msRows.map(r => r.record_id).filter(Boolean);
  let linkedMs = [];
  if (msIds.length > 0) {
    const msRecords = recordBatchGet(BASE_TOKEN, TABLE_MILESTONE, msIds);
    linkedMs = msRecords.filter(r => {
      const f = r.fields || {};
      const link = f['Linked Project'];
      const linkedId = Array.isArray(link) ? (link[0]?.record_id || link[0]?.id || String(link[0] || '')) : String(link || '');
      return linkedId === recordId;
    }).map(milestoneFromRow);
  }
  return { project, milestones: linkedMs };
}

function handleCreateProject(body) {
  const fields = {};
  if (body.projectName) fields['Project Name'] = body.projectName;
  if (body.clientCN) fields['Client Name CN'] = body.clientCN;
  if (body.clientEN) fields['Client Name EN'] = body.clientEN;
  if (body.productModel) fields['Product Model'] = body.productModel;
  if (body.standard) fields['Cert Standard'] = body.standard;
  if (body.certBody) fields['Cert Body'] = body.certBody;
  if (body.startDate) fields['Start Date'] = body.startDate;
  if (body.targetEndDate) fields['Target End Date'] = body.targetEndDate;
  if (body.status) fields['Project Status'] = body.status;
  fields['Overall Progress'] = 0;
  fields['Visible to Client'] = true;
  if (body.shareToken) fields['Share Token'] = body.shareToken;

  recordUpsert(BASE_TOKEN, TABLE_PROJECT, fields);
  return { ok: true };
}

function handleUpdateProject(recordId, body) {
  const fields = {};
  if (body.projectName !== undefined) fields['Project Name'] = body.projectName;
  if (body.clientCN !== undefined) fields['Client Name CN'] = body.clientCN;
  if (body.clientEN !== undefined) fields['Client Name EN'] = body.clientEN;
  if (body.productModel !== undefined) fields['Product Model'] = body.productModel;
  if (body.standard !== undefined) fields['Cert Standard'] = body.standard;
  if (body.certBody !== undefined) fields['Cert Body'] = body.certBody;
  if (body.startDate !== undefined) fields['Start Date'] = body.startDate;
  if (body.targetEndDate !== undefined) fields['Target End Date'] = body.targetEndDate;
  if (body.status !== undefined) fields['Project Status'] = body.status;
  if (body.progress !== undefined) fields['Overall Progress'] = Number(body.progress) / 100;
  if (body.visible !== undefined) fields['Visible to Client'] = !!body.visible;
  if (body.shareToken !== undefined) fields['Share Token'] = body.shareToken;
  if (body.notes !== undefined) fields['Notes'] = body.notes;

  recordUpsert(BASE_TOKEN, TABLE_PROJECT, fields, recordId);
  return { ok: true };
}

function handleCreateMilestone(body) {
  const fields = {};
  if (body.phaseNum !== undefined) fields['Phase Number'] = Number(body.phaseNum);
  if (body.nameCN) fields['Phase Name CN'] = body.nameCN;
  if (body.nameEN) fields['Phase Name EN'] = body.nameEN;
  if (body.projectId) fields['Linked Project'] = body.projectId;
  if (body.plannedStart) fields['Planned Start'] = body.plannedStart;
  if (body.plannedEnd) fields['Planned End'] = body.plannedEnd;
  if (body.status) fields['Status'] = body.status;
  fields['Progress'] = (body.progress !== undefined ? Number(body.progress) : 0) / 100;

  recordUpsert(BASE_TOKEN, TABLE_MILESTONE, fields);
  return { ok: true };
}

function handleUpdateMilestone(recordId, body) {
  const fields = {};
  if (body.phaseNum !== undefined) fields['Phase Number'] = Number(body.phaseNum);
  if (body.nameCN !== undefined) fields['Phase Name CN'] = body.nameCN;
  if (body.nameEN !== undefined) fields['Phase Name EN'] = body.nameEN;
  if (body.plannedStart !== undefined) fields['Planned Start'] = body.plannedStart;
  if (body.plannedEnd !== undefined) fields['Planned End'] = body.plannedEnd;
  if (body.actualEnd !== undefined) fields['Actual End'] = body.actualEnd || '';
  if (body.status !== undefined) fields['Status'] = body.status;
  if (body.progress !== undefined) fields['Progress'] = Number(body.progress) / 100;
  if (body.note !== undefined) fields['Note'] = body.note;

  recordUpsert(BASE_TOKEN, TABLE_MILESTONE, fields, recordId);
  return { ok: true };
}

async function handleDeleteMilestone(recordId) {
  try {
    recordDelete(BASE_TOKEN, TABLE_MILESTONE, recordId);
    return { ok: true };
  } catch (e) {
    console.error('handleDeleteMilestone error:', e.message);
    return { ok: false, error: e.message };
  }
}

function handleBatchCreateMilestones(body) {
  const milestones = body.milestones || [];
  const projectId = body.projectId;
  if (!Array.isArray(milestones) || !milestones.length)
    return { created: 0, recordIds: [], error: 'No milestones provided' };
  const recordIds = [];
  for (let i = 0; i < milestones.length; i++) {
    const ms = milestones[i];
    const fields = {};
    fields['Phase Number'] = ms.phaseNum !== undefined ? Number(ms.phaseNum) : (recordIds.length + 1);
    if (ms.nameCN) fields['Phase Name CN'] = ms.nameCN;
    if (ms.nameEN) fields['Phase Name EN'] = ms.nameEN;
    if (projectId) fields['Linked Project'] = projectId;
    if (ms.plannedStart) fields['Planned Start'] = ms.plannedStart;
    if (ms.plannedEnd) fields['Planned End'] = ms.plannedEnd;
    if (ms.status) fields['Status'] = ms.status;
    fields['Progress'] = (ms.progress !== undefined ? Number(ms.progress) : 0) / 100;
    recordUpsert(BASE_TOKEN, TABLE_MILESTONE, fields);
    recordIds.push(i + 1);
  }
  return { created: recordIds.length, recordIds };
}

// ─── Delete Project (real delete) ────────────────────────────────────
async function handleDeleteProject(recordId) {
  try {
    // Delete linked milestones first
    try {
      const msRows = recordList(BASE_TOKEN, TABLE_MILESTONE);
      const linkedMs = msRows.filter(r => {
        if (!r.fields) return false;
        const link = r.fields['Linked Project'];
        const linkedId = Array.isArray(link) ? (link[0]?.record_id || link[0]?.id || String(link[0] || '')) : String(link || '');
        return linkedId === recordId;
      });
      linkedMs.forEach(ms => {
        try { recordDelete(BASE_TOKEN, TABLE_MILESTONE, ms.record_id); } catch (e) { console.error('delete milestone failed:', ms.record_id, e.message); }
      });
      if (linkedMs.length > 0) console.log('Deleted', linkedMs.length, 'linked milestones');
    } catch (e) {
      console.error('Error listing milestones for deletion:', e.message);
    }
    // Delete project
    try {
      recordDelete(BASE_TOKEN, TABLE_PROJECT, recordId);
    } catch (e) {
      console.error('Project delete failed (may already be deleted):', e.message);
      // Still return ok — user wants it gone, and milestones are already cleaned up
    }
    return { ok: true };
  } catch (e) {
    console.error('handleDeleteProject error:', e.message);
    return { ok: false, error: e.message };
  }
}

// ─── Feishu Doc Export ──────────────────────────────────────────────
function handleExportFeishu(body) {
  const projectId = body.projectId;
  const theme = body.theme || 'default';
  const lang = body.lang || 'zh';
  if (!projectId) return { ok: false, error: 'Missing projectId' };

  // Fetch project + milestones
  const projectData = handleGetProject(projectId);
  const p = projectData.project;
  const ms = projectData.milestones || [];
  if (!p) return { ok: false, error: 'Project not found' };

  const isCN = lang === 'zh';
  const clientName = isCN ? (p.clientCN || p.clientEN || '') : (p.clientEN || p.clientCN || '');
  const sorted = [...ms].sort((a, b) => (a.phaseNum || 999) - (b.phaseNum || 999));
  const prog = p.progress || 0;

  // Build markdown content
  const emoji = theme === 'tech' ? '⚡' : theme === 'fashion' ? '✨' : theme === 'fresh' ? '🌸' : '📋';
  const title = `${emoji} ${p.projectName || 'Project'} — ${isCN ? '项目排期' : 'Schedule'}`;

  const statusLabel = (s) => {
    const map = {
      'completed': isCN ? '✅ 已完成' : '✅ Completed',
      'in-progress': isCN ? '🔄 进行中' : '🔄 In Progress',
      'delayed': isCN ? '🔴 已延期' : '🔴 Delayed',
      'pending': isCN ? '⚪ 待启动' : '⚪ Pending'
    };
    return map[s] || s;
  };

  const progBar = '█'.repeat(Math.floor(prog / 10)) + '░'.repeat(10 - Math.floor(prog / 10));

  let md = `# ${title}

---

## ${isCN ? '📌 项目信息' : '📌 Project Info'}

| ${isCN ? '项目' : 'Item'} | ${isCN ? '内容' : 'Details'} |
|------|------|
| ${isCN ? '客户名称' : 'Client'} | ${clientName} |
| ${isCN ? '产品型号' : 'Product'} | ${p.productModel || '—'} |
| ${isCN ? '项目编号' : 'Project ID'} | ${p.shareToken || p.id || '—'} |
| ${isCN ? '认证标准' : 'Standard'} | ${p.standard || '—'} |
| ${isCN ? '认证机构' : 'Cert Body'} | ${p.certBody || '—'} |
| ${isCN ? '项目周期' : 'Timeline'} | ${p.startDate || 'TBD'} → ${p.targetEndDate || 'TBD'} |
| ${isCN ? '整体进度' : 'Progress'} | ${progBar} **${prog}%** |

---

## ${isCN ? '📊 里程碑进度' : '📊 Milestones'}

| # | ${isCN ? '阶段' : 'Phase'} | ${isCN ? '计划开始' : 'Start'} | ${isCN ? '计划完成' : 'End'} | ${isCN ? '实际完成' : 'Actual'} | ${isCN ? '进度' : 'Prog.'} | ${isCN ? '状态' : 'Status'} |
|---|---|:---:|:---:|:---:|:---:|:---:|
`;

  sorted.forEach((m, i) => {
    md += `| ${i + 1} | ${isCN ? (m.nameCN || m.nameEN || '') : (m.nameEN || m.nameCN || '')} | ${m.plannedStart || '—'} | ${m.plannedEnd || '—'} | ${m.actualEnd || '—'} | ${m.progress || 0}% | ${statusLabel(m.status)} |\n`;
  });

  md += `
---

> ${isCN ? '📅 导出时间' : '📅 Export Time'}: ${new Date().toLocaleString()}
>
> ${isCN ? '🏢 生成机构' : '🏢 Generated By'}: EDTI · ${isCN ? '广州依顿检测技术服务有限公司' : 'Guangzhou Eadon Testing Technology Services Co., Ltd.'}
`;

  // Write content to temp file, then pass via --content
  // Use system temp dir (short ASCII path) to avoid Chinese-character path issues
  const osTmpDir = require('os').tmpdir();
  const tmpId = Date.now() + '_' + Math.random().toString(36).slice(2,6);
  const mdFile = path.join(osTmpDir, 'edti_' + tmpId + '.md');
  const ps1File = path.join(osTmpDir, 'edti_' + tmpId + '.ps1');
  fs.writeFileSync(mdFile, md, 'utf-8');
  // Write PowerShell script with Get-Content
  const psContent = 'lark-cli docs +create --api-version v2 --doc-format markdown --as user --content (Get-Content -Raw -Encoding UTF8 "' + mdFile + '")';
  fs.writeFileSync(ps1File, psContent, 'utf-8');
  try {
    const r = spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps1File], { encoding: 'utf-8', timeout: 60000, maxBuffer: 10 * 1024 * 1024 });
    if (r.error) throw new Error('lark spawn: ' + r.error.message);
    const stderr = (r.stderr || '').trim();
    let stdout = (r.stdout || '').trim();
    const jsonStart = stdout.indexOf('{');
    const jsonEnd = stdout.lastIndexOf('}');
    let parsed = null;
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      try { parsed = JSON.parse(stdout.slice(jsonStart, jsonEnd + 1)); } catch {}
    }
    if (!parsed) {
      const sj = stderr.indexOf('{');
      const se = stderr.lastIndexOf('}');
      if (sj >= 0 && se > sj) {
        try { parsed = JSON.parse(stderr.slice(sj, se + 1)); } catch {}
      }
    }
    if (!parsed || !parsed.ok) {
      const errMsg = parsed?.error?.message || stderr.slice(0, 300) || 'lark-cli response not ok';
      console.error('feishu create failed:', stderr.slice(0, 500));
      return { ok: false, error: errMsg };
    }
    const docUrl = parsed.data?.document?.url;
    const docId = parsed.data?.document?.document_id;
    if (!docUrl && !docId) {
      console.error('feishu create: no url in response', JSON.stringify(parsed).slice(0, 500));
      return { ok: false, error: 'Created document but no URL returned' };
    }
    return { ok: true, token: docId || docUrl, url: docUrl };
  } catch (e) {
    console.error('Feishu export error:', e.message);
    return { ok: false, error: e.message };
  } finally {
    try { fs.unlinkSync(mdFile); } catch {}
    try { fs.unlinkSync(ps1File); } catch {}
  }
}

// ─── HTTP Server ────────────────────────────────────────────────────
function send(res, code, data) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let buf = '';
    req.on('data', c => buf += c);
    req.on('end', () => {
      try { resolve(JSON.parse(buf)); }
      catch { resolve({}); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  console.log(`[${req.method}] ${req.url}`);
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const parts = url.pathname.split('/').filter(Boolean);

    // GET /api/projects
    if (req.method === 'GET' && url.pathname === '/api/projects') {
      return send(res, 200, handleListProjects());
    }

    // GET /api/project/:id
    if (req.method === 'GET' && parts[0] === 'api' && parts[1] === 'project' && parts[2]) {
      return send(res, 200, handleGetProject(parts[2]));
    }

    // POST /api/project
    if (req.method === 'POST' && url.pathname === '/api/project') {
      const body = await parseBody(req);
      return send(res, 200, handleCreateProject(body));
    }

    // PATCH /api/project/:id
    if (req.method === 'PATCH' && parts[0] === 'api' && parts[1] === 'project' && parts[2]) {
      const body = await parseBody(req);
      return send(res, 200, handleUpdateProject(parts[2], body));
    }

    // DELETE /api/project/:id (real delete + linked milestones)
    if (req.method === 'DELETE' && parts[0] === 'api' && parts[1] === 'project' && parts[2]) {
      return send(res, 200, await handleDeleteProject(parts[2]));
    }

    // POST /api/milestones/batch
    if (req.method === 'POST' && url.pathname === '/api/milestones/batch') {
      const body = await parseBody(req);
      return send(res, 200, handleBatchCreateMilestones(body));
    }

    // POST /api/milestone
    if (req.method === 'POST' && url.pathname === '/api/milestone') {
      const body = await parseBody(req);
      return send(res, 200, handleCreateMilestone(body));
    }

    // PATCH /api/milestone/:id
    if (req.method === 'PATCH' && parts[0] === 'api' && parts[1] === 'milestone' && parts[2]) {
      const body = await parseBody(req);
      return send(res, 200, handleUpdateMilestone(parts[2], body));
    }

    // DELETE /api/milestone/:id
    if (req.method === 'DELETE' && parts[0] === 'api' && parts[1] === 'milestone' && parts[2]) {
      return send(res, 200, await handleDeleteMilestone(parts[2]));
    }

    // POST /api/export/feishu
    if (req.method === 'POST' && url.pathname === '/api/export/feishu') {
      const body = await parseBody(req);
      return send(res, 200, handleExportFeishu(body));
    }

    // GET /api/health
    if (req.method === 'GET' && url.pathname === '/api/health') {
      return send(res, 200, {
        status: 'ok',
        baseToken: BASE_TOKEN?.slice(0, 8) + '...',
        tableProject: TABLE_PROJECT,
        tableMilestone: TABLE_MILESTONE
      });
    }

    // Serve static files
    const fp = path.join(__dirname, url.pathname === '/' ? 'index.html' : url.pathname);
    if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
      const ext = path.extname(fp);
      const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };
      res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
      return res.end(fs.readFileSync(fp));
    }

    send(res, 404, { error: 'Not found' });
  } catch (e) {
    console.error('Error:', e.message);
    console.error('Stack:', e.stack?.slice(0, 500));
    send(res, 500, { error: e.message });
  }
});

server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║    EDTI Project Schedule API Server v3  ║
  ╠══════════════════════════════════════════╣
  ║  Dashboard: http://localhost:${PORT}      ║
  ║  Health:    http://localhost:${PORT}/api/health ║
  ╚══════════════════════════════════════════╝
  `);
});
