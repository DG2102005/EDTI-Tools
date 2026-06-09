// Alibaba Cloud Function Compute — EDTI Customer API
// 创建方式: 事件函数, Node.js 20, 本地上传ZIP
// 创建后用 HTTP 触发器, 方法选 GET + OPTIONS, 认证选 无需认证
// 部署指南: ../阿里云FC部署指南.md

'use strict';

exports.handler = async (event, context) => {
  const rawType = typeof event;
  const isBuf = Buffer.isBuffer(event);
  if (isBuf) {
    try { event = JSON.parse(event.toString()); } catch(e) {}
  } else if (typeof event === 'string') {
    try { event = JSON.parse(event); } catch(e) {}
  }
  const path = event.rawPath || event.path || '/';
  const method = (event.requestContext && event.requestContext.http && event.requestContext.http.method) || event.httpMethod || 'GET';

  const res = (body, status = 200) => ({
    statusCode: status,
    isBase64Encoded: false,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  });

  if (method === 'OPTIONS') {
    return {
      statusCode: 204,
      isBase64Encoded: false,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    };
  }

  try {
    if (path === '/api/health') return res({ ok: true, t: Date.now() });

    const m = path.match(/^\/api\/customer\/(.+)$/);
    if (m) {
      const st = decodeURIComponent(m[1]);
      if (!st) return res({ error: 'missing token' }, 400);
      const data = await getData(st);
      if (!data) return res({ error: 'not found' }, 404);
      return res(data);
    }

    return res({ error: 'not found' }, 404);
  } catch (e) {
    return res({ error: e.message }, 500);
  }
};

async function getToken() {
  const r = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: process.env.FEISHU_APP_ID, app_secret: process.env.FEISHU_APP_SECRET }),
  });
  const d = await r.json();
  if (d.code !== 0) throw new Error('auth err: ' + d.msg);
  return d.tenant_access_token;
}

async function listRecs(token, base, table) {
  let all = [], page = null;
  do {
    let u = `https://open.feishu.cn/open-apis/bitable/v1/apps/${base}/tables/${table}/records?page_size=500`;
    if (page) u += '&page_token=' + page;
    const r = await fetch(u, { headers: { Authorization: 'Bearer ' + token } });
    const d = await r.json();
    if (d.code !== 0) throw new Error('api err: ' + d.msg);
    if (d.data?.items) all = all.concat(d.data.items);
    page = d.data?.page_token || null;
  } while (page);
  return all;
}

function pct(v) { const n = Number(v); return n > 1 ? n : Math.round(n * 100); }

function stat(v) {
  const m = { Pending: 'pending', 'In Progress': 'in-progress', Delayed: 'delayed', Completed: 'completed' };
  return m[v] || 'pending';
}

function dt(v) {
  if (!v && v !== 0) return '';
  if (typeof v === 'number') {
    const d = new Date(v);
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
  }
  return String(v).slice(0, 10);
}

async function getData(shareToken) {
  const tok = await getToken();
  const [pr, mr] = await Promise.all([
    listRecs(tok, process.env.BASE_TOKEN, process.env.TABLE_PROJECT),
    listRecs(tok, process.env.BASE_TOKEN, process.env.TABLE_MILESTONE),
  ]);

  for (const r of pr) {
    const f = r.fields || {};
    if (f['Share Token'] === shareToken) {
      if (f['Visible to Client'] === false) return null;
      const std = Array.isArray(f['Cert Standard']) ? f['Cert Standard'].join(', ') : f['Cert Standard'] || '';
      const project = {
        id: r.record_id, projectName: f['Project Name'] || '',
        clientCN: f['Client Name CN'] || '', clientEN: f['Client Name EN'] || '',
        productModel: f['Product Model'] || '', standard: std, certBody: f['Cert Body'] || '',
        startDate: dt(f['Start Date']), targetEndDate: dt(f['Target End Date']),
        progress: pct(f['Overall Progress']), status: stat(f['Project Status']),
        shareToken: f['Share Token'] || '', notes: f['Notes'] || '',
      };

      const milestones = mr
        .filter(x => {
          const l = x.fields?.['Linked Project'];
          if (!l) return false;
          if (Array.isArray(l)) {
            const first = l[0];
            if (typeof first === 'object') return (first.record_id || first.id || '') === r.record_id;
            return String(first || '') === r.record_id;
          }
          return String(l) === r.record_id;
        })
        .map(x => {
          const ff = x.fields || {};
          return {
            id: x.record_id, phaseNum: ff['Phase Number'] || 0,
            nameCN: ff['Phase Name CN'] || '', nameEN: ff['Phase Name EN'] || '',
            plannedStart: dt(ff['Planned Start']), plannedEnd: dt(ff['Planned End']), actualEnd: dt(ff['Actual End']),
            progress: pct(ff['Progress']), status: stat(ff['Status']), note: ff['Note'] || '',
          };
        })
        .sort((a, b) => a.phaseNum - b.phaseNum);

      return { project, milestones };
    }
  }
  return null;
}
