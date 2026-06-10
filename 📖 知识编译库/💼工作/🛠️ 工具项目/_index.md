---
type: guide
domain: 工作
tags: [工具, 项目管理, 自动化]
created: 2026-06-10
updated: 2026-06-10
---

## 工具项目总览

> 跨领域工具项目仓库，统一管理所有开发的工具。

| 工具 | 技术栈 | 状态 | 用途 | GitHub |
|------|--------|------|------|--------|
| EDTI 排期表系统 | Node.js | ✅ 已部署 | 项目排期可视化、客户共享 | [链接](https://github.com/DG2102005/EDTI-Tools/tree/master/EDTI-Project-Scheduler) |
| EDTI 报价助手 | Python/Flask | ✅ 运行中 | 智能报价、文档解析 | [链接](https://github.com/DG2102005/EDTI-Tools/tree/master/EDTI-Quote-Assistant) |

## 快速开始

### 排期表系统
```powershell
cd D:\检测认证知识库\工具\EDTI-Project-Scheduler
npm install
npm start
# 访问 http://localhost:3000
```

### 报价助手
```powershell
cd D:\检测认证知识库\工具\EDTI-Quote-Assistant
pip install -r requirements.txt
python backend/app.py
# 访问 http://localhost:5000
```

## 相关文档

- [[EDTI排期表系统]] - 详细使用指南
- [[EDTI报价助手]] - 详细使用指南
- [用户操作手册](https://github.com/DG2102005/EDTI-Tools/blob/master/USER_GUIDE.md) - 完整操作指南

## 工具开发规范

1. **目录结构**：所有工具统一存放在 `D:\检测认证知识库\工具\`
2. **版本控制**：使用 Git 进行版本管理
3. **文档要求**：每个工具必须有 README.md 和 AGENTS.md
4. **更新流程**：更新后同步更新 GitHub 和 Obsidian 文档
