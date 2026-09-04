# Myself

个人技术博客项目，目标是构建一个兼顾内容分享效率、项目实践记录和页面视觉表达的个人技术档案馆。

## 当前进展

- 已建立项目协作规则：见 [AGENTS.md](AGENTS.md)
- 已完成产品与视觉设计需求：见 [BLOG_DESIGN_REQUIREMENTS.md](docs/BLOG_DESIGN_REQUIREMENTS.md)
- 已完成静态 UI Demo：见 [index.html](index.html)、[styles.css](styles.css) 和 [script.js](script.js)
- 当前阶段：静态 UI Demo，尚未接入真实数据和后端能力

## 设计方向

项目综合参考以下网站：

- [廖雪峰的官方网站](https://liaoxuefeng.com/)：清晰的教程分类和阅读路径
- [枫枫知道](https://www.fengfengzhidao.com/)：个人品牌、专题、学习路线和技术内容运营
- [Awwwards](https://www.awwwards.com/)：精选内容展示、视觉层次、网格布局和编辑感

博客将采用“编辑杂志感 + 技术文档感”的设计方向：首页强调个人特色和精选内容，文章页保证阅读效率，项目页展示真实成果，并通过 Markdown、Git 和自动部署实现持续发布。

## 实现过程

1. 完成产品定位、信息架构和页面需求设计。
2. 完成视觉规范、响应式要求和内容数据模型设计。
3. 完成自动发布、分享图片、RSS、SEO 和部署流程规划。
4. 后续按设计需求文档分阶段实现并持续更新本文档。

5. 使用原生 HTML、CSS 和 JavaScript 完成首版静态 UI Demo，覆盖首页、文章、专题、项目、记录、搜索、主题切换和移动端导航。

Demo 直接打开 [index.html](index.html) 即可查看，也可以在项目目录运行 `python -m http.server 4173`，然后访问 `http://localhost:4173/`。

详细方案请阅读 [BLOG_DESIGN_REQUIREMENTS.md](docs/BLOG_DESIGN_REQUIREMENTS.md)。
