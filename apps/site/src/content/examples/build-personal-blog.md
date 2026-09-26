---
{
  "slug": "build-personal-blog",
  "title": "从零实现一个兼顾自动发布与视觉表达的个人博客",
  "description": "记录架构、界面和自动发布流程，把持续构建中的判断留下来。",
  "date": "2026-09-04",
  "category": "项目实战",
  "tags": [
    "博客",
    "Astro",
    "部署"
  ],
  "readingTime": 8,
  "featured": true,
  "draft": false
}
---

一次线上故障之后，真正值得留下来的不只是修复结果，还有定位路径、判断依据和可以复用的工程经验。

这个项目从一个简单的静态页面开始，逐步拆成公开站点、发布后台和 API 三个边界清晰的应用。

## 先让发布流程跑通

后台使用 React + Vite，Mock 数据覆盖登录、草稿、预览、校验和发布反馈。公开站点则保持 Astro 的静态输出优势。

```ts
const published = article.status === "已发布";
```

下一步会把 Markdown 文件同步、Git commit 和自动构建接到真实服务端。
