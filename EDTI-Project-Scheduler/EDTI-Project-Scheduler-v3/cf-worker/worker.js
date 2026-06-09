// Cloudflare Worker — EDTI Customer API
// Feishu Base → Customer-facing project schedule data

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' },
      });
    }

    const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

    try {
      if (path === '/api/health') {
        return new Response(JSON.stringify({ ok: true, t: Date.now() }), { headers: cors });
      }

      const m = path.match(/^\/api\/customer\/(.+)$/);
      if (m) {
        const st = decodeURIComponent(m[1]);
        if (!st) return new Response(JSON.stringify({ error: 'missing token' }), { status: 400, headers: cors });
        const data = await getData(env, st);
        if (!data) return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers: cors });
        return new Response(JSON.stringify(data), { headers: cors });
      }

      return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers: cors });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
    }
  },
};

async function getToken(env) {
  const r = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: env.FEISHU_APP_ID, app_secret: env.FEISHU_APP_SECRET }),
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

async function getData(env, shareToken) {
  const tok = await getToken(env);
  const [pr, mr] = await Promise.all([
    listRecs(tok, env.BASE_TOKEN, env.TABLE_PROJECT),
    listRecs(tok, env.BASE_TOKEN, env.TABLE_MILESTONE),
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
          return (Array.isArray(l) ? l[0]?.record_id || '' : '') === r.record_id;
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
