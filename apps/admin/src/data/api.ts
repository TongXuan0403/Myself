import type { Article, ArticlePatch } from "../types/article";

type ApiStatus = "draft" | "published";

type ApiArticle = {
  id: number;
  title: string;
  slug: string;
  category: string;
  status: ApiStatus;
  excerpt: string;
  content: string;
  updated_at: string;
};

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");

function formatUpdated(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}

function toArticle(article: ApiArticle): Article {
  return {
    id: article.id,
    title: article.title,
    category: article.category,
    status: article.status === "published" ? "已发布" : "草稿",
    updated: formatUpdated(article.updated_at),
    excerpt: article.excerpt,
    content: article.content,
    slug: article.slug,
  };
}

function slugify(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/[\u4e00-\u9fff]/g, "")
    .replace(/^-+|-+$/g, "");
  return slug || `article-${Date.now()}`;
}

function toPayload(article: Article, includeStatus = true) {
  return {
    title: article.title,
    slug: article.slug || slugify(article.title),
    category: article.category,
    excerpt: article.excerpt,
    content: article.content,
    ...(includeStatus ? { status: article.status === "已发布" ? "published" : "draft" } : {}),
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `API request failed: ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function fetchArticles(): Promise<Article[]> {
  const articles = await request<ApiArticle[]>("/api/articles");
  return articles.map(toArticle);
}

export async function createRemoteArticle(article: Article): Promise<Article> {
  const created = await request<ApiArticle>("/api/articles", { method: "POST", body: JSON.stringify(toPayload(article)) });
  return toArticle(created);
}

export async function updateRemoteArticle(article: Article, patch: ArticlePatch): Promise<Article> {
  const updated = await request<ApiArticle>(`/api/articles/${article.id}`, {
    method: "PUT",
    body: JSON.stringify({ ...toPayload({ ...article, ...patch }), ...(patch.status ? { status: patch.status === "已发布" ? "published" : "draft" } : {}) }),
  });
  return toArticle(updated);
}

export async function publishRemoteArticle(article: Article): Promise<Article> {
  const published = await request<ApiArticle>(`/api/articles/${article.id}/publish`, { method: "POST" });
  return toArticle(published);
}

export async function deleteRemoteArticle(article: Article): Promise<void> {
  await request<void>(`/api/articles/${article.id}`, { method: "DELETE" });
}
