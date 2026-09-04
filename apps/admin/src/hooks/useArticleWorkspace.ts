import { useMemo, useState } from "react";

import { initialArticles } from "../data/articles";
import { createDraftArticle, type Article, type ArticlePatch } from "../types/article";

type ToastState = { message: string; visible: boolean };

export function useArticleWorkspace() {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [selectedId, setSelectedId] = useState(initialArticles[0]?.id ?? 0);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({ message: "", visible: false });

  const selected = useMemo(
    () => articles.find((article) => article.id === selectedId) ?? articles[0] ?? null,
    [articles, selectedId],
  );
  const filtered = useMemo(
    () => articles.filter((article) => `${article.title}${article.category}`.toLowerCase().includes(query.toLowerCase())),
    [articles, query],
  );

  const flash = (message: string) => {
    setToast({ message, visible: true });
    window.setTimeout(() => setToast({ message: "", visible: false }), 2200);
  };

  const updateSelected = (patch: ArticlePatch) => {
    if (!selected) {
      return;
    }
    setArticles((items) => items.map((item) => (item.id === selected.id ? { ...item, ...patch } : item)));
  };

  const createArticle = () => {
    const next = createDraftArticle(Date.now());
    setArticles((items) => [next, ...items]);
    setSelectedId(next.id);
    setMenuOpen(false);
    flash("草稿已创建");
  };

  const saveDraft = () => {
    flash("草稿已保存");
  };

  const publishSelected = () => {
    if (!selected) {
      return;
    }
    updateSelected({ status: "已发布", updated: "刚刚" });
    flash("文章已发布，正在构建公开站点");
  };

  const counts = useMemo(
    () => ({
      total: articles.length,
      published: articles.filter((article) => article.status === "已发布").length,
      draft: articles.filter((article) => article.status === "草稿").length,
    }),
    [articles],
  );

  return {
    articles,
    counts,
    createArticle,
    filtered,
    menuOpen,
    publishSelected,
    query,
    selected,
    selectedId,
    saveDraft,
    setMenuOpen,
    setQuery,
    setSelectedId,
    toast,
    updateSelected,
  };
}
