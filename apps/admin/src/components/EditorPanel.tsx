import { Check, Send, X } from "lucide-react";

import type { Article, ArticlePatch } from "../types/article";

type EditorPanelProps = {
  article: Article | null;
  onClose: () => void;
  onPublish: () => void;
  onSave: () => void;
  onUpdate: (patch: ArticlePatch) => void;
};

export function EditorPanel({ article, onClose, onPublish, onSave, onUpdate }: EditorPanelProps) {
  if (!article) {
    return (
      <div className="editor-panel">
        <div className="editor-empty">
          <strong>还没有可编辑的文章</strong>
          <p>先创建一篇草稿。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-panel">
      <div className="editor-head">
        <div>
          <p className="overline">EDITING ARTICLE</p>
          <span className={article.status === "已发布" ? "status published" : "status draft"}>{article.status}</span>
        </div>
        <button aria-label="关闭编辑器" onClick={onClose}>
          <X size={17} />
        </button>
      </div>
      <input className="title-input" value={article.title} onChange={(event) => onUpdate({ title: event.target.value })} />
      <div className="meta-row">
        <label>
          分类 <input value={article.category} onChange={(event) => onUpdate({ category: event.target.value })} />
        </label>
        <label>
          更新于 <span>{article.updated}</span>
        </label>
      </div>
      <div className="editor-tabs">
        <button className="active">编辑</button>
        <button>预览</button>
        <button className="autosave">
          <Check size={14} />
          自动保存
        </button>
      </div>
      <textarea className="markdown-editor" value={article.content} onChange={(event) => onUpdate({ content: event.target.value })} aria-label="文章正文" />
      <div className="editor-footer">
        <span>Markdown · 约 8 分钟阅读</span>
        <div>
          <button className="secondary" onClick={onSave}>
            <Check size={15} />
            保存草稿
          </button>
          <button className="primary" onClick={onPublish}>
            <Send size={15} />
            发布文章
          </button>
        </div>
      </div>
    </div>
  );
}
