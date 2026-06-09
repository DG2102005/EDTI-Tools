# EDTI 项目排期系统

> 广州依顿检测技术服务有限公司 · 项目进度可视化工具

---

## 🚀 怎么用

### 第一步：启动 API

打开 **PowerShell**（Win键 → 输入 powershell → 回车），粘贴这 2 条命令：

```powershell
cd D:\检测认证知识库\EDTI-Project-Scheduler-v3
node api-server.js
```

终端会显示 `API server running on http://localhost:3000`。**不要关掉这个窗口**，否则数据加载不了。

### 第二步：打开管理后台

打开 **浏览器**（Edge / Chrome），地址栏打开：

```
http://localhost:3000/
```

（不要双击 `index.html` 文件，那样 API 请求发不出去，数据加载不了）

### 第三步：看数据

网页打开后，你会看到项目列表卡片。点击任意卡片进入详情，就能看到里程碑表格了。

---

## 📎 快速参考

| 做什么 | 哪里 |
|-------|------|
| 启动 API | `node api-server.js`（保持窗口开着） |
| 管理后台 | `D:\...\index.html`（浏览器打开） |
| 给客户看的页面 | `https://flb03yzu7a.aiforce.cloud/app/app_4k9rzuf8zt0yt` |
| 备用 API（当前欠费） | `https://edti-cuomer-api-qnbjxghzqp.cn-hangzhou.fcapp.run` |

---

## 🧭 界面导航

进入详情页后：

- **进度表格**（默认）— 里程碑明细表，编辑模式下可拖拽行排序
- **时间线** — 垂直时间线视图（点击顶栏切换）
- **📅 日历** — 左上角按钮，月历显示所有项目里程碑
- **🎨 换主题** — 右上角，4 套配色
- **📐 换布局** — 右上角，Default / Compact / Focus

---

## 📦 项目结构

```
EDTI-Project-Scheduler-v3/
├── index.html                ← 管理后台（双击打开）
├── api-server.js             ← API 服务（node 启动）
├── package.json
├── customer-view.html        ← 客户页源文件
├── customer/index.html       ← 已部署的客户页副本
└── cf-worker/                ← 阿里云 FC 部署文件
```

---

## 🔌 API 一览

所有接口由 `api-server.js` 提供（`http://localhost:3000`）：

| 方法 | 路径 | 干啥的 |
|------|------|--------|
| GET | `/api/projects` | 所有项目 |
| GET | `/api/project/:id` | 单个项目 |
| GET | `/api/project/:id/milestones` | 项目的里程碑 |
| POST | `/api/milestone` | 新增里程碑 |
| PUT | `/api/milestone/:id` | 修改里程碑 |
| DELETE | `/api/milestone/:id` | 删除里程碑 |
| PUT | `/api/milestone/reorder` | 调排序 |
| DELETE | `/api/project/:id` | 删除项目 |
| POST | `/api/export/feishu` | 导出到飞书文档 |
| GET | `/api/customer/:token` | 客户页数据 |

---

## 📊 数据来源

所有数据存在 **飞书多维表格** 里，`api-server.js` 通过 lark-cli 读取。你在飞书 Base 里改数据，刷新网页就能看到变化。

---

## 依赖项

| 依赖 | 用途 |
|------|------|
| html2canvas | HTML 截图（Excel 导出） |
| jsPDF | PDF 生成 |
| ExcelJS | Excel 导出（带样式） |
| lark-cli（可选） | 飞书 Base 读写 + 妙搭部署 |
