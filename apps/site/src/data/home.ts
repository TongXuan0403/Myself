import { articles } from "./content";

export type HomeHighlight = {
  number: string;
  type: string;
  title: string;
  description: string;
  href: string;
};

export const homeHighlights: HomeHighlight[] = [...articles]
  .sort((a, b) => Number(b.featured) - Number(a.featured))
  .slice(0, 3)
  .map((article, index) => ({
    number: String(index + 1).padStart(2, "0"),
    type: article.category,
    title: article.title,
    description: article.description,
    href: `/articles/${article.slug}/`,
  }));

export const homeMeta = {
  title: "TX / Field Notes",
  description: "记录代码、项目和持续构建中的想法。",
  heroKicker: "PERSONAL TECHNICAL ARCHIVE · 001",
  heroTitleLeading: "把想法写成",
  heroTitleEmphasis: "可以复用的东西。",
  heroDescription: "记录后端开发、前端实践、AI 工具实验，以及在真实项目里解决过的问题。",
};
