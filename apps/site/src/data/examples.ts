export const series = [
  { slug: "personal-blog", title: "个人博客从零实现", description: "从信息架构到自动部署，完整记录一个内容站点的构建过程。", audience: "适合想做个人内容站点的开发者", count: 5, done: 3, stages: ["技术选型", "页面设计", "Markdown 渲染", "自动部署", "性能优化"] },
  { slug: "frontend-lab", title: "前端界面实验室", description: "网格、动效和可访问性相关的小型实践。", audience: "适合关注体验细节的前端开发者", count: 8, done: 5, stages: ["布局", "层级", "状态", "动效", "可访问性"] },
];

export const projects = [
  { slug: "myself-field-notes", name: "Myself / Field Notes", summary: "兼顾自动发布和视觉表达的个人技术博客。", status: "开发中", stack: ["Astro", "React", "FastAPI"], result: "公开站点和发布后台已经跑通 Mock 流程。" },
  { slug: "release-desk", name: "Release Desk", summary: "一个为单作者设计的 Markdown 发布工作台。", status: "已上线", stack: ["TypeScript", "Vite", "SQLite"], result: "支持草稿、预览、校验和发布状态反馈。" },
  { slug: "prompt-atlas", name: "Prompt Atlas", summary: "整理可复用的 AI 工具提示词与评测样例。", status: "构思中", stack: ["Next.js", "OpenAI"], result: "正在整理第一批真实开发任务样例。" },
];

export const notes = [
  { date: "2026-09-04", type: "项目进展", title: "开始搭建发布后台", summary: "先把登录、路由、文章编辑和发布反馈做成一条可以跑通的 Mock 流程。", tags: ["博客", "前端"] },
  { date: "2026-09-02", type: "学习笔记", title: "Astro Islands 的边界", summary: "把交互留给需要它的组件，其余页面保持静态输出。", tags: ["Astro", "性能"] },
  { date: "2026-08-29", type: "问题解决", title: "为 Markdown 文章补齐空状态", summary: "空状态不是错误，它应该告诉用户下一步能做什么。", tags: ["UX", "内容"] },
  { date: "2026-08-26", type: "工具尝试", title: "用 Playwright 记录关键交互", summary: "把加载、表单校验和移动端菜单列入每次发布前的快速检查。", tags: ["测试", "自动化"] },
];
