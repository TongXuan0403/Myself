export type HomeHighlight = {
  number: string;
  type: string;
  title: string;
  description: string;
};

export const homeHighlights: HomeHighlight[] = [
  { number: "01", type: "BUILD LOG", title: "从零实现个人博客", description: "记录架构、界面和自动发布流程。" },
  { number: "02", type: "FIELD NOTE", title: "把问题写成可复用的东西", description: "保留背景、过程、失败和最终结论。" },
  { number: "03", type: "PROJECT", title: "个人知识档案馆", description: "正在构建中的第一代内容站点。" },
];

export const homeMeta = {
  title: "TX / Field Notes",
  description: "记录代码、项目和持续构建中的想法。",
  heroKicker: "PERSONAL TECHNICAL ARCHIVE · 001",
  heroTitleLeading: "把想法写成",
  heroTitleEmphasis: "可以复用的东西。",
  heroDescription: "记录后端开发、前端实践、AI 工具实验，以及在真实项目里解决过的问题。",
};
