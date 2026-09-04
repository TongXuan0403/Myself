import { Article } from "../types/article";

export const initialArticles: Article[] = [
  {
    id: 1,
    title: "从零实现一个兼顾自动发布与视觉表达的个人博客",
    category: "项目实战",
    status: "已发布",
    updated: "今天 09:42",
    excerpt: "记录架构、界面和自动发布流程。",
    content:
      "一次线上故障之后，真正值得留下来的不只是修复结果，还有定位路径、判断依据和可以复用的工程经验。",
  },
  {
    id: 2,
    title: "用 CSS 网格做一个不无聊的文章列表",
    category: "前端开发",
    status: "草稿",
    updated: "昨天 18:20",
    excerpt: "关于信息密度、留白和视觉节奏的一次小实验。",
    content: "好的界面应该帮助读者建立节奏。动效、留白和层级都需要围绕内容本身工作。",
  },
  {
    id: 3,
    title: "技术分享不只是把答案贴出来",
    category: "思考记录",
    status: "已发布",
    updated: "2026-08-26",
    excerpt: "把背景、过程和失败也写进去。",
    content: "还没有答案的问题也值得记录。它们会成为下一次学习和验证的入口。",
  },
];
