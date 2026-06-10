# EDTI 工具仓库 - 用户操作手册

> 最后更新：2026-06-10

---

## 一、目录结构说明

```
D:\检测认证知识库\
├── 📦 原始资料库/          ← 原始资料（只读）
├── 📖 知识编译库/          ← 知识库文档
│   └── 💼工作/
│       └── 🛠️ 工具项目/   ← Obsidian 工具索引页
├── 💼工作/                ← 日常工作文件
├── 🛠️工具/               ← 工具项目仓库（Git 管理）
│   ├── EDTI-Project-Scheduler/  ← 排期表系统
│   └── EDTI-Quote-Assistant/    ← 报价助手
└── CLAUDE.md              ← AI 助手配置文件
```

---

## 二、工具更新工作流

### 2.1 什么时候会同步到 GitHub？

**是的，每次更新工具后都需要手动同步到 GitHub。**

流程是：
```
修改工具代码 → Git 提交 → Git 推送到 GitHub
```

### 2.2 完整更新流程

#### 第一步：告诉 AI 助手你要更新什么

直接说：
```
更新报价助手
```
或者
```
更新排期表系统
```

AI 助手会自动：
1. 读取 CLAUDE.md 了解工具位置
2. 进入对应工具目录
3. 执行修改
4. 自动提交并推送到 GitHub

#### 第二步：如果没有用 AI 助手，手动更新

```powershell
# 1. 进入工具目录
cd "D:\检测认证知识库\工具\EDTI-Quote-Assistant"

# 2. 进行修改（用编辑器或命令行）

# 3. 查看修改了什么
git status

# 4. 添加修改
git add .

# 5. 提交（写清楚改了什么）
git commit -m "修复了报价单生成的bug"

# 6. 推送到 GitHub
git push
```

---

## 三、常见操作速查表

### 3.1 查看工具状态

```powershell
cd "D:\检测认证知识库\工具"
git status
```

### 3.2 查看修改历史

```powershell
cd "D:\检测认证知识库\工具"
git log --oneline -10
```

### 3.3 撤销未提交的修改

```powershell
cd "D:\检测认证知识库\工具"
git checkout -- 文件名
```

### 3.4 回退到某个版本

```powershell
cd "D:\检测认证知识库\工具"
git log --oneline          # 先查看要回退到哪个版本
git reset --hard <版本号>   # 回退
git push --force           # 强制推送（慎用）
```

---

## 四、新增工具流程

### 4.1 准备工作

1. 在 `D:\检测认证知识库\工具\` 下创建新目录
2. 确保目录里有：
   - `README.md`（使用说明）
   - `.gitignore`（排除不需要的文件）
   - 项目代码

### 4.2 上传到 GitHub

```powershell
cd "D:\检测认证知识库\工具"
git add 新工具目录/
git commit -m "新增工具：XXX"
git push
```

### 4.3 更新 Obsidian 索引

在 `D:\检测认证知识库\📖 知识编译库\💼工作\🛠️ 工具项目\_index.md` 中添加新工具信息。

---

## 五、Claude Code 使用指南

### 5.1 启动时指定工具目录

```
我在工具目录工作，更新报价助手
```

### 5.2 直接说更新

```
更新报价助手
```

Claude Code 会自动读取 CLAUDE.md，知道工具在哪里。

### 5.3 开发新工具

```
在工具目录创建一个新工具，叫 XXX
```

---

## 六、GitHub 仓库信息

| 项目 | 信息 |
|------|------|
| 仓库地址 | https://github.com/DG2102005/EDTI-Tools |
| 分支 | master |
| 协议 | MIT |

---

## 七、常见问题

### Q1: 更新后怎么同步到 GitHub？

A: 在工具目录执行：
```powershell
git add .
git commit -m "描述改了什么"
git push
```

### Q2: 怎么看有没有同步成功？

A: 执行 `git status`，如果显示 `nothing to commit, working tree clean` 就是同步完了。

### Q3: 不小心提交了敏感信息怎么办？

A: 立即修改文件，然后重新提交推送。如果已经推送到 GitHub，需要用 `git filter-branch` 或 BFG 工具清理。

### Q4: 两个 AI 工具（OpenCode 和 Claude Code）会冲突吗？

A: 不会，它们操作的是同一个目录。但建议一次只用一个工具修改，避免冲突。

### Q5: 怎么在 Obsidian 里查看工具信息？

A: 打开 Obsidian，进入 `知识编译库 → 💼工作 → 🛠️ 工具项目`，可以看到所有工具的索引和文档。

---

## 八、Git 常用命令速查

| 操作 | 命令 |
|------|------|
| 查看状态 | `git status` |
| 查看历史 | `git log --oneline` |
| 添加文件 | `git add 文件名` |
| 添加所有 | `git add .` |
| 提交 | `git commit -m "说明"` |
| 推送 | `git push` |
| 拉取 | `git pull` |
| 查看差异 | `git diff` |
| 撤销修改 | `git checkout -- 文件名` |

---

## 九、注意事项

1. **提交前检查**：用 `git status` 确认只提交了该提交的文件
2. **写清楚提交信息**：说明改了什么，方便以后查看
3. **不要提交敏感信息**：密码、密钥等不要提交到 GitHub
4. **定期拉取**：如果多人协作，定期执行 `git pull` 获取最新代码
