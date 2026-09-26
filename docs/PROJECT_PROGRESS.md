# 项目进度

## 1. 文档信息

- 项目名称：Myself 个人技术博客
- 记录日期：2026-09-26
- 当前版本：后台全内容 CRUD 与公开内容同步
- 当前阶段：四类内容编辑闭环完成，准备进入受控 Git 发布

## 2. 总体状态

项目已经从产品设计阶段进入工程实现阶段。目前完成了公开站点、文章发布后台和后台 API 的基础拆分，能够继续围绕真实内容发布流程开发。

| 模块 | 状态 | 当前说明 |
| --- | --- | --- |
| 产品与视觉需求 | 已完成 | 已形成完整需求、页面、视觉、响应式和验收标准 |
| 版本路线图 | 已完成 | 已记录第一代边界及后续版本能力 |
| 静态视觉 Demo | 已完成 | 保留首页、文章、专题、项目、记录等页面效果参考 |
| 公开博客站点 | 内容构建已接入 | 已发布 Markdown 经 Astro Content Collections 渲染，首页、文章、专题、项目、记录和搜索读取统一快照 |
| 发布后台 | 四类内容 CRUD 完成 | 文章、专题、项目和记录均支持新建、编辑和删除；API 不可用时回退 Mock |
| 发布 API | 已增强 | FastAPI + SQLite 已拆成配置、路由、模型和存储层，已覆盖文章、专题、项目和记录 |
| 后台真实联调 | 四类内容写入已完成 | 后台启动时优先读取 FastAPI；文章、专题、项目、记录的 CRUD 均已接入 API，不可用时回退 Mock |
| 单作者登录 | Mock 完成 | 演示账号登录、错误校验、localStorage 会话和退出登录已完成 |
| Markdown 内容文件管理 | 已完成本地同步 | API 导出已发布文章和四类公开数据，草稿不进入构建；上线仍需重新构建与部署 |
| Git commit 自动发布 | 未开始 | 尚未实现发布后的自动提交和推送 |
| 自动构建与部署 | 未开始 | 尚未配置 GitHub Actions 和生产部署 |
| 公开站点服务器 | 已部署 | Astro 静态站点运行于 `http://47.109.193.62/`，Ubuntu + Nginx；当前 HTTP，尚未绑定域名/TLS |
| Docker 一键发布 | 已完成首版 | Compose 编排 API、自动构建器、后台和 Nginx；管理员登录使用 Bearer 会话，发布后自动重建站点 |
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
- `apps/admin/src/data/api.ts`：后台 API 客户端和 API/Mock 数据映射。
- API CORS 同时允许 `localhost` 和 `127.0.0.1` 的站点与后台开发地址，避免本地联调因访问地址不同而失败。
- API 新增专题、项目和记录模型，SQLite 启动时幂等建表并写入首批种子数据，支持列表、详情、新建、更新和删除。
- 后台 API 客户端将 API 状态映射为现有中文界面状态，专题阶段和项目技术栈直接使用服务端数据。
- 专题、项目和记录新增独立编辑表单，支持客户端必填校验、列表字段拆分、slug 规范化、保存状态和二次确认删除。
- 后台入口显式加载全局样式，桌面端和移动端编辑抽屉均恢复设计稿布局。
- 发布写入时同步带 Front Matter 的 Markdown 与版本化公开快照；构建只引用已发布文章，孤立文件、草稿和撤回内容不公开。专题、项目和记录也从同一快照生成页面。
- 发布页面改为一次 API 更新，提示已同步但尚待构建部署；API 同步失败回滚数据库修改，启动或手动命令可以重建快照。
- 新增后端发布测试及站点内容构建测试，覆盖空快照、缺失引用、恶意 Markdown、slug 冲突、并发和故障注入。
- 根目录 workspace：统一管理前端应用依赖、开发和构建命令。
- `.gitignore`：忽略依赖、构建产物、Astro 缓存、Python 缓存、环境变量和本地数据库。

## 4. 当前目录结构

```text
Myself/
├── apps/
│   ├── site/                 # Astro 公开博客站点
│   │   ├── src/pages/       # 页面入口
│   │   ├── src/content/     # 演示 Markdown 与本地生成的发布内容
│   │   └── tests/           # 内容构建回归测试
│   │   ├── astro.config.mjs
│   │   └── package.json
│   └── admin/                # React + Vite 发布后台
│       ├── src/              # 后台界面和样式
│       ├── vite.config.ts
│       └── package.json
├── services/
│   └── api/                  # FastAPI + SQLite 发布接口
│       ├── app/              # API 应用代码与导出器
│       ├── tests/            # 发布/同步测试
│       └── requirements.txt
├── demo/                     # 独立静态视觉 Demo，仅用于参考
├── docs/                     # 项目设计、路线图和进度文档
│   ├── BLOG_DESIGN_REQUIREMENTS.md
│   ├── PROJECT_ROADMAP.md
│   ├── CONTENT_PUBLISHING.md
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
apps/site/src/content/published/ # 本地生成的 Markdown 与快照
services/api/__pycache__/     # Python 缓存
```

## 5. 本阶段前端交付

- 后台路由使用 hash 方案，未登录访问业务路由会回到 `#/login`。
- 后台登录已改为 API 管理员会话；账号和密码只从运行环境 `.env.production` 读取。
- 文章页覆盖搜索、状态筛选、空状态、模拟 503 错误、编辑、预览、保存、校验、发布和删除。
- 概览页覆盖运行状态、最近编辑、快速入口和发布记录；专题、项目、记录、设置页均有选中态和反馈。
- 无快照时公开站点仍生成 16 个演示路由；存在快照时仅根据公开内容生成路由，文章搜索与分类筛选在浏览器端执行。
- 已完成 Astro 检查、React 类型检查、两端生产构建、12 项 API 发布测试和 5 项内容构建测试。
- 已使用 Playwright + Microsoft Edge 验证登录后专题、项目、记录的新建、编辑和删除闭环，检查 API 反馈、控制台健康以及 390×844 移动端记录编辑器。
- 已将当前 Astro 静态站点部署至 Ubuntu + Nginx；公网首页、文章详情和 favicon 返回 200，桌面筛选/文章阅读与移动导航通过 Playwright 检查。
- 部署采用带时间戳的 release 目录和 `current` 软链接，支持切回上一版本；首次部署保留了 Nginx 默认站点配置备份。
- 已加入 Docker Compose 生产编排、管理员 Bearer 登录和内容变化自动构建器；真实密码只通过服务器 `.env.production` 提供。

## 6. 下一步实施顺序

1. 将 Docker Compose 编排部署到服务器并验证持久化卷、登录和一键发布。
2. 为站点绑定域名并启用 HTTPS，按新域名更新 canonical 配置。
3. 配置 GitHub Actions，完成构建、部署和失败回滚；改用受限 SSH key/CI secret。
4. 接入搜索、RSS、sitemap、Open Graph 和基础 SEO。
5. 使用真实文章完成桌面端、移动端和发布流程验收。

## 7. 当前风险与约束

- API 已增加管理员 Bearer 会话保护；仍应通过 Nginx 同源代理，不要直接暴露 API 容器端口。
- SQLite 适合第一代单作者场景，后续需根据内容量和访问量评估迁移方案。
- 自动发布涉及 GitHub Token、构建权限和部署凭据，必须只保存在服务端或 CI 环境。
- 公开站点已经可从 API 生成的 Markdown 构建，但没有自动 Git 发布和 CI 部署；不能宣称“点击发布即可上线”。本地生成目录和数据库不纳入 Git，部署时须传递快照与其引用的 Markdown。
- 服务器目前通过裸 IP 提供 HTTP；浏览器到站点的流量尚无 TLS 加密。Docker Compose 编排尚未切换到服务器生产运行模式。

## 8. 相关文档

- [博客设计需求](BLOG_DESIGN_REQUIREMENTS.md)
- [项目版本路线图](PROJECT_ROADMAP.md)
- [内容发布与重同步](CONTENT_PUBLISHING.md)
- [服务器部署与回滚](DEPLOYMENT.md)
- [Docker 一键发布](DOCKER_PUBLISHING.md)
- [项目 README](../README.md)
