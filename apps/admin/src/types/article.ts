export type ArticleStatus = "已发布" | "草稿";

export interface Article {
  id: number;
  title: string;
  category: string;
  status: ArticleStatus;
  updated: string;
  excerpt: string;
  content: string;
}

export type ArticlePatch = Partial<Omit<Article, "id">>;

export function createDraftArticle(id: number): Article {
  return {
    id,
    title: "未命名文章",
    category: "未分类",
    status: "草稿",
    updated: "刚刚",
    excerpt: "写下这篇文章的摘要。",
    content: "",
  };
}
