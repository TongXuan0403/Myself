# Myself

个人技术博客项目，目标是构建一个兼顾内容分享效率、项目实践记录和页面视觉表达的个人技术档案馆。

## 当前进展

- 已建立项目协作规则：见 [AGENTS.md](AGENTS.md)
- 已完成产品与视觉设计需求：见 [BLOG_DESIGN_REQUIREMENTS.md](docs/BLOG_DESIGN_REQUIREMENTS.md)
- 已完成静态 UI Demo：见 [demo/index.html](demo/index.html)、[demo/styles.css](demo/styles.css) 和 [demo/script.js](demo/script.js)
- 已加入首页动态效果：首屏视差、滚动进度、数字增长、滚动文字带和卡片悬停反馈
- 当前阶段：文章、专题、项目和记录已接入 FastAPI + SQLite；后台四类内容均可新建、编辑和删除，公开数据从同一快照构建
- 公开站点已部署至 `http://47.109.193.62/`，后台入口为 `http://47.109.193.62/admin/`；当前提供 HTTP 访问，HTTPS 需绑定域名并配置 TLS
- 已加入 Docker Compose 生产编排：API、后台静态资源、自动构建器和 Nginx 可由一条命令启动
- 详细进度：见 [PROJECT_PROGRESS.md](docs/PROJECT_PROGRESS.md)

## 设计方向

项目综合参考以下网站：

- [廖雪峰的官方网站](https://liaoxuefeng.com/)：清晰的教程分类和阅读路径
- [枫枫知道](https://www.fengfengzhidao.com/)：个人品牌、专题、学习路线和技术内容运营
- [Awwwards](https://www.awwwards.com/)：精选内容展示、视觉层次、网格布局和编辑感
- [李勃老师](https://xn--ygr25xpohxwz.com/)：搜索入口、连续发布流、课程路线和长页面叙事

博客将采用“编辑杂志感 + 技术文档感 + 学习路线感”的设计方向：首页强调个人特色、最新发布和精选内容，文章页保证阅读效率，专题页呈现清晰路线，项目页展示真实成果，并通过 Markdown、Git 和自动部署实现持续发布。

## 实现过程

1. 完成产品定位、信息架构和页面需求设计。
2. 完成视觉规范、响应式要求和内容数据模型设计。
3. 完成自动发布、分享图片、RSS、SEO 和部署流程规划。
4. 后续按设计需求文档分阶段实现并持续更新本文档。

5. 使用原生 HTML、CSS 和 JavaScript 完成首版静态 UI Demo，覆盖首页、文章、专题、项目、记录、搜索、主题切换和移动端导航。
6. 增加滚动进度、首屏视差、统计数字增长、滚动文字带和文章卡片悬停反馈，增强首页视觉节奏。
7. 补充学习型内容主页参考，增加连续发布流、专题进度、突出搜索和长页面叙事的设计要求。
8. 确定第一代采用“公开博客站点 + 独立文章发布后台”的双应用结构。
9. 建立后续版本路线图，留存评论、订阅、数据分析、多作者、在线代码和 AI 辅助等延期能力。
10. 建立 `apps/site` Astro 公开站点、`apps/admin` 独立发布后台 UI 和 `services/api` FastAPI 接口；后台当前使用本地状态演示文章编辑、草稿和发布交互，API 已接入 SQLite CRUD，尚未接入登录和 GitHub 自动提交。
11. 将前端后台拆分为页面壳、组件、数据、hooks 和类型层，并把公开站点拆成 layout、组件和数据层。
12. 将后端 API 重构为模型层、存储层、配置层和路由层，补齐文章详情、按条件搜索、草稿/发布切换、发布动作和后台汇总接口。
13. 整理项目目录，将设计、路线图和进度文档统一放入 `docs`，并补充当前工程状态和下一步实施顺序。
14. 完成 React 发布后台全页面：登录会话、权限路由、动态侧边栏、概览、文章、专题、项目、记录和设置。
15. 在后台加入 Mock 加载态、文章筛选、Markdown 编辑/预览、表单校验、发布成功/失败提示、删除草稿、深色设置和移动端菜单。
16. 为公开 Astro 站点补齐文章列表/详情、专题列表/详情、项目列表/详情、记录、关于我和搜索页面，使用统一内容数据和响应式样式。
17. 使用 Playwright + Microsoft Edge fallback 验证登录、路由跳转、错误态、空状态、文章预览、站点搜索和移动导航，修复登录状态同步及 favicon 404。
18. 增加后台 API 客户端：启动时优先读取 FastAPI 文章数据，文章新建、保存、发布和删除调用 SQLite API；API 不可用时自动保留 Mock 数据体验，并修正 slug 详情路由顺序。
19. 修正发布动作：点击发布时先同步当前编辑内容，再切换 API 文章状态，避免未保存修改丢失。
20. 扩展 FastAPI 内容模型和 SQLite 持久化：新增专题、项目、记录三类表、种子数据及列表、详情、新建、更新、删除接口；后台登录后优先读取这些 API 数据，并在接口不可用时回退 Mock 数据。
21. 将发布内容同步到 `apps/site/src/content/published/`：文章生成带 Front Matter 的 Markdown，专题、项目和记录写入版本化 JSON 快照；Astro 内容集合渲染文章正文，首页、列表、搜索及详情共享公开数据。发布后由 Docker 自动构建站点。详见 [内容发布说明](docs/CONTENT_PUBLISHING.md)。
22. 将 Docker Compose 生产编排部署到 Ubuntu 服务器 `47.109.193.62`，Nginx 同时提供博客、后台和 API 代理；后台入口为 `http://47.109.193.62/admin/`。详见 [Docker 发布说明](docs/DOCKER_PUBLISHING.md)。
23. 增加 Docker Compose 生产编排和管理员登录：API 使用 Bearer 会话保护，后台登录调用真实 API；内容变化后构建器自动重建 Astro，Nginx 同时提供博客、后台和 API 代理。详见 [Docker 发布说明](docs/DOCKER_PUBLISHING.md)。
23. 补齐专题、项目和记录的后台编辑器：支持字段校验、新建、修改和二次确认删除，在线时调用 FastAPI CRUD 并刷新公开快照，离线时保留会话内 Mock 操作；同时修复后台入口遗漏样式文件导致的无样式渲染。

## 求职材料

已在 `resume` 生成面向 Agent / 大模型应用开发岗位的 ASu 同款可编辑简历与 PDF，并在 `docs/RESUME_ASU_REBUILD.md` 记录模板、内容策略、文件结构和 QA 结果。简历基于用户提供的原始 PDF 重组，重点突出 Dify 开源贡献、RAG 私有化部署、语音工具调用闭环和 AI Coding 工程实践。

Demo 直接打开 [demo/index.html](demo/index.html) 即可查看，也可以在项目目录运行 `python -m http.server 4173`，然后访问 `http://localhost:4173/demo/`。

详细方案请阅读 [BLOG_DESIGN_REQUIREMENTS.md](docs/BLOG_DESIGN_REQUIREMENTS.md)，后续技术路线请阅读 [PROJECT_ROADMAP.md](docs/PROJECT_ROADMAP.md)。

## 当前工程结构

```text
apps/site                 # Astro 公开博客站点
├── src/layouts/          # 页面外壳
├── src/components/       # 首页区块和公共组件
├── src/data/             # 首页文案和展示数据
├── src/content/          # 演示 Markdown 与本地生成的发布内容
└── src/pages/            # 首页、文章、专题、项目、记录、关于和搜索
apps/admin                # React + Vite 独立发布后台
├── src/App.tsx           # 路由、页面和 Mock 交互入口
├── src/components/       # 可复用旧版组件（保留供后续拆分）
├── src/data/             # 本地演示数据
├── src/hooks/            # 工作区状态
└── src/types/            # 文章类型定义
services/api              # FastAPI + SQLite 发布接口
└── app/                  # 配置、模型、路由和存储
demo                      # 独立静态视觉 Demo，仅用于参考
docs                      # 设计需求、路线图、结构和项目进度
AGENTS.md                 # 项目协作与交付规则
```

## 本地启动

```bash
npm install
npm run dev:site
npm run dev:admin
npm run dev:api
```

API 服务：

```bash
cd services/api
python -m venv .venv
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

后台可在 Docker 环境中通过真实管理员账号登录，编辑、预览、保存和发布；API 使用短期 Bearer 会话保护，写入 SQLite 后自动同步公开内容，构建器会重建站点。操作及故障恢复见 [内容发布说明](docs/CONTENT_PUBLISHING.md)，Docker 发布见 [Docker 发布说明](docs/DOCKER_PUBLISHING.md)，服务器环境与回滚见 [服务器部署说明](docs/DEPLOYMENT.md)，进度与下一步见 [PROJECT_PROGRESS.md](docs/PROJECT_PROGRESS.md)。
