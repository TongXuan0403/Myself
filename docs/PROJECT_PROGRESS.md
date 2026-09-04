# 项目进度

## 1. 文档信息

- 项目名称：Myself 个人技术博客
- 记录日期：2026-09-04
- 当前版本：第一代工程骨架
- 当前阶段：应用拆分与发布基础建设

## 2. 总体状态

项目已经从产品设计阶段进入工程实现阶段。目前完成了公开站点、文章发布后台和后台 API 的基础拆分，能够继续围绕真实内容发布流程开发。

| 模块 | 状态 | 当前说明 |
| --- | --- | --- |
| 产品与视觉需求 | 已完成 | 已形成完整需求、页面、视觉、响应式和验收标准 |
| 版本路线图 | 已完成 | 已记录第一代边界及后续版本能力 |
| 静态视觉 Demo | 已完成 | 保留首页、文章、专题、项目、记录等页面效果参考 |
| 公开博客站点 | 骨架完成 | 已建立 Astro 应用，首页已拆成 layout、组件和数据层 |
| 发布后台 | 骨架完成 | 已建立 React + Vite 界面，已拆成页面壳、组件、数据、hooks 和类型层 |
| 发布 API | 已增强 | FastAPI + SQLite 已拆成配置、路由、模型和存储层 |
| 后台真实联调 | 未开始 | 当前后台尚未连接 API |
| 单作者登录 | 未开始 | 尚未建立会话和权限校验 |
| Markdown 内容文件管理 | 未开始 | 当前 API 内容保存在 SQLite，尚未同步到站点内容目录 |
| Git commit 自动发布 | 未开始 | 尚未实现发布后的自动提交和推送 |
| 自动构建与部署 | 未开始 | 尚未配置 GitHub Actions 和生产部署 |
| 搜索、RSS、SEO | 规划中 | 已写入需求，尚未接入正式站点 |

## 3. 已完成内容

### 3.1 需求与方案

- 明确个人技术博客的产品定位和核心用户目标。
- 完成首页、文章、专题、项目、记录、关于我等信息架构。
- 完成内容模型、Markdown Front Matter、发布流程和首版验收标准。
- 确定“公开博客站点 + 独立发布后台 + API 服务”的第一代架构。
- 建立版本路线图，保留评论、订阅、数据分析、多作者和 AI 辅助等后续能力。

### 3.2 视觉 Demo

- 使用原生 HTML、CSS 和 JavaScript 完成独立静态 Demo。
- 覆盖首页、文章、专题、项目、记录、搜索、主题切换和移动端导航。
- 增加首屏视差、滚动进度、数字增长、滚动文字带和卡片悬停反馈。

### 3.3 工程骨架

- `apps/site`：Astro 公开站点应用。
- `apps/admin`：React + Vite 独立发布后台。
- `services/api`：FastAPI 文章发布接口。
- `services/api/app`：后端模型、存储和路由分层实现。
- 根目录 workspace：统一管理前端应用依赖、开发和构建命令。
- `.gitignore`：忽略依赖、构建产物、Astro 缓存、Python 缓存、环境变量和本地数据库。

## 4. 当前目录结构

```text
Myself/
├── apps/
│   ├── site/                 # Astro 公开博客站点
│   │   ├── src/pages/       # 页面入口
│   │   ├── astro.config.mjs
│   │   └── package.json
│   └── admin/                # React + Vite 发布后台
│       ├── src/              # 后台界面和样式
│       ├── vite.config.ts
│       └── package.json
├── services/
│   └── api/                  # FastAPI + SQLite 发布接口
│       ├── app/              # API 应用代码
│       └── requirements.txt
├── demo/                     # 独立静态视觉 Demo，仅用于参考
├── docs/                     # 项目设计、路线图和进度文档
│   ├── BLOG_DESIGN_REQUIREMENTS.md
│   ├── PROJECT_ROADMAP.md
│   └── PROJECT_PROGRESS.md
├── AGENTS.md                 # 项目协作与交付规则
├── package.json              # 根 workspace 和统一脚本
├── package-lock.json         # 前端依赖锁定文件
├── .gitignore                # 本地生成文件和敏感配置忽略规则
└── README.md                 # 项目入口说明
```

以下目录属于本地生成内容，不纳入 Git：

```text
node_modules/                 # Node.js 依赖
apps/*/dist/                  # 前端构建产物
apps/site/.astro/             # Astro 缓存
services/api/.data/           # 本地 SQLite 数据
services/api/__pycache__/     # Python 缓存
```

## 5. 下一步实施顺序

1. 将后台 UI 接入 FastAPI，完成文章列表、创建、编辑、删除和状态更新。
2. 增加单作者登录、会话校验和基础错误反馈。
3. 将已发布文章同步为公开站点可构建的 Markdown 内容。
4. 实现发布流程：校验内容、创建 Git commit、推送 GitHub。
5. 配置 GitHub Actions，完成构建、部署和失败反馈。
6. 接入搜索、RSS、sitemap、Open Graph 和基础 SEO。
7. 使用真实文章完成桌面端、移动端和发布流程验收。

## 6. 当前风险与约束

- 当前后台是演示界面，不能作为正式生产发布工具使用。
- API 尚未提供身份认证，不能直接暴露到公网。
- SQLite 适合第一代单作者场景，后续需根据内容量和访问量评估迁移方案。
- 自动发布涉及 GitHub Token、构建权限和部署凭据，必须只保存在服务端或 CI 环境。
- 公开站点与后台尚未形成完整端到端链路，暂不能宣称“点击发布即可上线”。

## 7. 相关文档

- [博客设计需求](BLOG_DESIGN_REQUIREMENTS.md)
- [项目版本路线图](PROJECT_ROADMAP.md)
- [项目 README](../README.md)
