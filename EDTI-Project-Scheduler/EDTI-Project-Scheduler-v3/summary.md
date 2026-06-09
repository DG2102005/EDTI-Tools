## Goal
- EDTI Project Scheduler: themed admin UI + public customer progress page; customer API currently running locally (Plan B) while Aliyun FC is in debt

## Constraints & Preferences
- ExcelJS for styled Excel export (not SheetJS community edition)
- lark-cli must be invoked via `powershell -File` on Windows (`.ps1` script); `execSync` used in API server
- Feishu doc export command: `docs +create --api-version v2 --doc-format markdown --as user --content (Get-Content -Raw -Encoding UTF8 "<tmpfile>")`
- Temp files for Feishu export must use `os.tmpdir()` not `__dirname`
- Theme persisted via `localStorage` key `edti_theme`; layout via `edti_layout`
- Customer page URL param `?share=TOKEN&api=API_URL`
- User prefers ByteDance ecosystem but willing to use Alibaba Cloud when needed

## Progress
### Done
- **CSS Theme System**: 4 themes (商务专业 default blue, 科技风 dark/neon/glass, 时尚大片 B&W/gold/serif, 小清新 sage/pastel)
- **Beautiful Excel Export**: ExcelJS with branded header, progress bar, colored milestones, footer
- **Feishu Doc Export**: Backend `POST /api/export/feishu` via lark-cli; confirmed working
- **Project Deletion**: Real DELETE (milestones first) instead of soft-delete
- **Customer View Page**: Standalone read-only progress page deployed to Miaoda at `https://flb03yzu7a.aiforce.cloud/app/app_4k9rzuf8zt0yt` (public, no login)
- **Aliyun FC deployment**: Buffer parsing fixed; `/api/health` and `/api/customer/TOKEN` both returned correct data; account then went into debt
- **Milestone deletion bug fixed**: `recordDelete` changed from `spawnSync` to `execSync` with `2>&1`; handlers made async with try/catch
- **FC milestone linking logic fixed**: Handles array-of-objects, array-of-strings, and single-object `Linked Project` field formats
- **3 Layouts persisted**: Default, Compact, Focus via `📐` button in header; saved to localStorage
- **Default tab swapped**: Milestone table shown by default instead of Gantt chart
- **Focus layout**: Milestone table in right grid column (sidebar left)
- **Share link feature removed**: Button, share box, `copyShareUrl` method, i18n, CSS all deleted from admin UI
- **Date formatting fixed**: Times stripped; dates show `YYYY-MM-DD`
- **Milestone table simplified**: "实际完成" and "完成率" columns removed
- **Status option added**: "测试不合格" (failed) with red badge; server `normalizeStatus` supports it
- **Status filter added**: Dropdown in milestone table and project list
- **Drag-and-drop milestone reorder**: Edit mode rows draggable; saves phase order
- **Project list enhanced**: Search box, status filter, date range on cards
- **Calendar view**: Monthly grid; color-coded by status; prev/next/today; loads all milestones on first open; stronger borders and today highlight
- **EMC template replaced**: 7-phase EMC standard test (each 1-day) with `dur`/`gap` support
- **Gantt chart completely removed**: Library CDN, HTML, CSS, JS (`renderGantt`), tab button, focus/compact layout references all deleted
- **Vertical timeline view added**: Replaces Gantt; shows milestones as vertical timeline with dots, connecting lines, color-coded status cards; accessible via "时间线" tab

### In Progress
- *None*

### Blocked
- **Aliyun FC in debt**: `"Current user is in debt"`; Plan B (local API) active
- **WeChat sharing security warning**: `aiforce.cloud` not whitelisted; users must tap "继续访问"
- **EPERM restriction**: tool cannot spawn subprocesses, cannot create ZIPs or run local scripts

## Key Decisions
- **Plan B active**: Using local `api-server.js` at `http://localhost:3000` while Aliyun FC is in debt; user will recharge later
- **Gantt chart removed**: Replaced by vertical timeline view
- **Volcengine veFaaS on hold**: API Gateway has no free tier; prepaid balance reserved for future
- **Customer page stays on Miaoda**: `aiforce.cloud` accessible in China despite WeChat warning

## Next Steps
1. (When FC recharged) Re-deploy `deploy-zip/index.js` to Aliyun FC and update customer page API base URL
2. (Future) Use Volcengine prepaid balance for ByteDance-ecosystem projects
3. (Future) Address WeChat sharing warning via ICP备案 domain or Mini Program

## Critical Context
- **Active API**: `http://localhost:3000` (local api-server.js, needs to be running)
- **Aliyun FC URL**: `https://edti-cuomer-api-qnbjxghzqp.cn-hangzhou.fcapp.run` (in debt, not usable)
- **Cloudflare Worker URL** (`https://hidden-sea-6bb6.dark-gao.workers.dev`) is BLOCKED in China; replaced with FC URL in files
- **Feishu API env vars**: BASE_TOKEN=`BdZCbO3Dpai7zUsffmPc9oJSn5e`, TABLE_PROJECT=`tbl0eEtQAYoRyOpT`, TABLE_MILESTONE=`tblPj6f9JLGtVLaH`
- **Miaoda customer URL**: `https://flb03yzu7a.aiforce.cloud/app/app_4k9rzuf8zt0yt`
- **Share token for testing**: `EDTI-2026-001` (PTC Heater E-mark project)
- **FC handler format**: `exports.handler = async (event, context)` with HTTP trigger; event is a **Buffer** that must be parsed with `JSON.parse(event.toString())`
- **PTC Heater project**: Has 15 milestones in Feishu; local API returns them correctly

## Relevant Files
- `D:\检测认证知识库\EDTI-Project-Scheduler-v3\index.html`: Admin UI with calendar, timeline view, filters, layouts, drag-drop; `shareApiBase` points to FC URL
- `D:\检测认证知识库\EDTI-Project-Scheduler-v3\api-server.js`: Local Node.js API server (Plan B); `normalizeStatus` handles `failed`; `stripTime` strips time from dates
- `D:\检测认证知识库\EDTI-Project-Scheduler-v3\customer-view.html`: Customer progress page; `apiBase` updated to FC URL
- `D:\检测认证知识库\EDTI-Project-Scheduler-v3\customer\index.html`: Deployed customer page copy (Miaoda)
- `D:\检测认证知识库\EDTI-Project-Scheduler-v3\cf-worker\deploy-zip\index.js`: Active FC deploy ZIP with Buffer parsing fix
- `D:\检测认证知识库\EDTI-Project-Scheduler-v3\cf-worker\ali-fc-handler.js`: FC handler source (in sync with deploy-zip)
- `D:\检测认证知识库\EDTI-Project-Scheduler-v3\火山引擎部署指南_备用.md`: Volcengine guide preserved for future
