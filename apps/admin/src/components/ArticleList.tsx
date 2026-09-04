import { Plus, Search } from "lucide-react";

import type { Article } from "../types/article";

type ArticleListProps = {
  articles: Article[];
  filteredArticles: Article[];
  query: string;
  selectedId: number;
  onQueryChange: (query: string) => void;
  onSelect: (id: number) => void;
  onCreate: () => void;
};

export function ArticleList({
  articles,
  filteredArticles,
  query,
  selectedId,
  onQueryChange,
  onSelect,
  onCreate,
}: ArticleListProps) {
  return (
    <div className="article-list">
      <div className="section-title">
        <div>
          <p className="overline">YOUR ARCHIVE / 01</p>
          <h2>文章</h2>
        </div>
        <button className="primary" onClick={onCreate}>
          <Plus size={16} />
          新建文章
        </button>
      </div>
      <div className="list-tools">
        <label>
          <Search size={15} />
          <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="搜索文章..." />
        </label>
        <button className="filter">
          <span />
          全部状态
        </button>
      </div>
      <div className="article-items">
        {filteredArticles.map((article) => (
          <button
            className={article.id === selectedId ? "article-item selected" : "article-item"}
            key={article.id}
            onClick={() => onSelect(article.id)}
          >
            <span className="item-type">{article.category}</span>
            <strong>{article.title}</strong>
            <small>{article.updated}</small>
            <span className={article.status === "已发布" ? "status published" : "status draft"}>{article.status}</span>
          </button>
        ))}
        {filteredArticles.length === 0 && (
          <div className="empty-state">
            <strong>暂无匹配文章</strong>
            <p>清空搜索词后再看看。</p>
          </div>
        )}
      </div>
      <p className="list-hint">共 {articles.length} 篇文章</p>
    </div>
  );
}
