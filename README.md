# Myself

个人技术博客项目，目标是构建一个兼顾内容分享效率、项目实践记录和页面视觉表达的个人技术档案馆。

## 当前进展

- 已建立项目协作规则：见 [AGENTS.md](AGENTS.md)
- 已完成产品与视觉设计需求：见 [BLOG_DESIGN_REQUIREMENTS.md](docs/BLOG_DESIGN_REQUIREMENTS.md)
- 已完成静态 UI Demo：见 [demo/index.html](demo/index.html)、[demo/styles.css](demo/styles.css) 和 [demo/script.js](demo/script.js)
- 已加入首页动态效果：首屏视差、滚动进度、数字增长、滚动文字带和卡片悬停反馈
- 当前阶段：前后端骨架已按职责拆分，API 已补齐文章详情、搜索、草稿/发布切换和后台汇总能力，正在推进前后台联调
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

Demo 直接打开 [demo/index.html](demo/index.html) 即可查看，也可以在项目目录运行 `python -m http.server 4173`，然后访问 `http://localhost:4173/demo/`。

详细方案请阅读 [BLOG_DESIGN_REQUIREMENTS.md](docs/BLOG_DESIGN_REQUIREMENTS.md)，后续技术路线请阅读 [PROJECT_ROADMAP.md](docs/PROJECT_ROADMAP.md)。

## 当前工程结构

```text
apps/site                 # Astro 公开博客站点
├── src/layouts/          # 页面外壳
├── src/components/       # 首页区块和公共组件
├── src/data/             # 首页文案和展示数据
├── src/content/          # 内容目录占位
└── src/pages/            # 页面入口
apps/admin                # React + Vite 独立发布后台
├── src/App.tsx           # 页面组合入口
├── src/components/       # 侧边栏、顶部栏、列表、编辑器和提示
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

当前发布后台和 API 是第一代的可运行基础，正式使用前需要补齐单作者登录、后台与 API 的真实联调、Markdown 文件管理、内容审核状态和 GitHub Actions 自动提交。完整状态、风险和实施顺序见 [PROJECT_PROGRESS.md](docs/PROJECT_PROGRESS.md)。
