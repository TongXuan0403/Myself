export type PublicArticle = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  readingTime: number;
  featured?: boolean;
  content: string[];
};

export const articles: PublicArticle[] = [
  { slug: "build-personal-blog", title: "从零实现一个兼顾自动发布与视觉表达的个人博客", description: "记录架构、界面和自动发布流程，把持续构建中的判断留下来。", date: "2026-09-04", category: "项目实战", tags: ["博客", "Astro", "部署"], readingTime: 8, featured: true, content: ["一次线上故障之后，真正值得留下来的不只是修复结果，还有定位路径、判断依据和可以复用的工程经验。", "这个项目从一个简单的静态页面开始，逐步拆成公开站点、发布后台和 API 三个边界清晰的应用。", "## 先让发布流程跑通", "后台使用 React + Vite，Mock 数据覆盖登录、草稿、预览、校验和发布反馈。公开站点则保持 Astro 的静态输出优势。", "```ts\nconst published = article.status === \"已发布\";\n```", "下一步会把 Markdown 文件同步、Git commit 和自动构建接到真实服务端。"] },
  { slug: "css-grid-editorial-list", title: "用 CSS 网格做一个不无聊的文章列表", description: "关于信息密度、留白和视觉节奏的一次小实验。", date: "2026-09-02", category: "前端开发", tags: ["CSS", "设计系统"], readingTime: 6, content: ["好的界面应该帮助读者建立节奏。动效、留白和层级都需要围绕内容本身工作。", "网格不是为了让所有东西对齐，而是为了让不同内容拥有合适的空间。", "## 从内容顺序开始", "先确定哪些信息需要快速扫描，再决定列宽、分隔线和强调色。"] },
  { slug: "write-reusable-answers", title: "技术分享不只是把答案贴出来", description: "把背景、过程、失败也写进去，让经验可以被复用。", date: "2026-08-26", category: "思考记录", tags: ["写作", "复盘"], readingTime: 5, content: ["还没有答案的问题也值得记录。它们会成为下一次学习和验证的入口。", "一篇好的技术文章应该让读者看见判断是如何发生的，而不只是最终结论。"] },
  { slug: "playwright-release-check", title: "用 Playwright 记录每次发布前的关键检查", description: "把加载、表单校验和移动端菜单列入发布前的快速检查。", date: "2026-08-20", category: "工具实验", tags: ["测试", "自动化"], readingTime: 7, content: ["自动化测试不需要覆盖所有像素，但应该守住用户真正依赖的路径。", "这次先覆盖登录、创建草稿、预览、发布和响应式菜单。"] },
];

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
