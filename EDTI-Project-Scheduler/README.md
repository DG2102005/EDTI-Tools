---
type: tool
domain: 工作
tags: [项目管理, 排期, 可视化, Node.js]
status: 已部署
created: 2026-05-01
updated: 2026-06-10
github: https://github.com/你的用户名/EDTI-Tools/tree/main/EDTI-Project-Scheduler
---

## EDTI 排期表系统

> 项目排期可视化工具，支持客户共享和多视图展示。

## 功能特性

- 📊 项目卡片视图
- 📅 甘特图时间线
- 📆 日历视图
- 🎨 主题切换（浅色/深色）
- 📤 导出到飞书多维表格
- 🔗 客户共享链接

## 技术栈

- **后端**: Node.js + Express
- **前端**: HTML + CSS + JavaScript
- **数据源**: 飞书多维表格（通过 lark-cli）

## 快速开始

```powershell
cd D:\检测认证知识库\工具\EDTI-Project-Scheduler
npm install
npm start
# 访问 http://localhost:3000
```

## API 接口

| 接口 | 方法 | 功能 |
|------|------|------|
| `/api/projects` | GET | 获取所有项目 |
| `/api/projects/:id` | GET | 获取单个项目 |
| `/api/milestones` | GET | 获取所有里程碑 |
| `/api/export/feishu` | POST | 导出到飞书 |
| `/api/customer/:id` | GET | 客户共享数据 |

## 部署

### 阿里云函数计算

参见 `阿里云FC部署指南.md`

### 火山引擎

参见 `火山引擎部署指南.md`

## 更新日志

| 日期 | 版本 | 更新内容 |
|------|------|---------|
| 2026-06-10 | v3.0 | 统一管理，迁移到工具仓库 |
| 2026-05-01 | v3.0 | 初始版本 |
