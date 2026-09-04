import { useMemo, useState } from "react";
import { Archive, ArrowUpRight, BookOpen, Check, FileText, LayoutDashboard, Menu, Plus, Search, Send, Settings, Sparkles, X } from "lucide-react";
import "./styles.css";

type Article = { id: number; title: string; category: string; status: "已发布" | "草稿"; updated: string; excerpt: string; content: string; };
const initialArticles: Article[] = [
  { id: 1, title: "从零实现一个兼顾自动发布与视觉表达的个人博客", category: "项目实战", status: "已发布", updated: "今天 09:42", excerpt: "记录架构、界面和自动发布流程。", content: "一次线上故障之后，真正值得留下来的不只是修复结果，还有定位路径、判断依据和可以复用的工程经验。" },
  { id: 2, title: "用 CSS 网格做一个不无聊的文章列表", category: "前端开发", status: "草稿", updated: "昨天 18:20", excerpt: "关于信息密度、留白和视觉节奏的一次小实验。", content: "好的界面应该帮助读者建立节奏。动效、留白和层级都需要围绕内容本身工作。" },
  { id: 3, title: "技术分享不只是把答案贴出来", category: "思考记录", status: "已发布", updated: "2026-08-26", excerpt: "把背景、过程和失败也写进去。", content: "还没有答案的问题也值得记录。它们会成为下一次学习和验证的入口。" }
];

function App() {
  const [articles, setArticles] = useState(initialArticles);
  const [selectedId, setSelectedId] = useState(1);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const selected = articles.find((article) => article.id === selectedId) ?? articles[0];
  const filtered = useMemo(() => articles.filter((article) => `${article.title}${article.category}`.toLowerCase().includes(query.toLowerCase())), [articles, query]);

  const updateSelected = (patch: Partial<Article>) => setArticles((items) => items.map((item) => item.id === selected.id ? { ...item, ...patch } : item));
  const createArticle = () => { const next = { id: Date.now(), title: "未命名文章", category: "未分类", status: "草稿" as const, updated: "刚刚", excerpt: "写下这篇文章的摘要。", content: "" }; setArticles((items) => [next, ...items]); setSelectedId(next.id); };
  const publish = () => { updateSelected({ status: "已发布", updated: "刚刚" }); setSaved(true); window.setTimeout(() => setSaved(false), 2200); };

  return <div className="admin-app">
    <aside className={menuOpen ? "sidebar is-open" : "sidebar"}>
      <div className="admin-brand"><span>TX</span><div><strong>MYSELF</strong><small>CONTENT STUDIO</small></div></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav><a className="active" href="#dashboard"><LayoutDashboard size={16} />概览</a><a href="#articles"><FileText size={16} />文章 <b>{articles.length}</b></a><a href="#collections"><BookOpen size={16} />专题</a><a href="#media"><Archive size={16} />素材库</a></nav>
      <div className="sidebar-bottom"><a href="#settings"><Settings size={16} />设置</a><div className="profile"><span>TX</span><div><strong>Tong Xuan</strong><small>作者</small></div><ArrowUpRight size={14} /></div></div>
    </aside>
    {menuOpen && <button className="backdrop" aria-label="关闭菜单" onClick={() => setMenuOpen(false)} />}
    <main className="admin-main">
      <header className="topbar"><button className="mobile-menu" aria-label="打开菜单" onClick={() => setMenuOpen(true)}><Menu size={19} /></button><div><p className="overline">MYSELF / CONTENT STUDIO</p><h1>早上好，Tong Xuan。</h1></div><div className="top-actions"><span className="sync-status"><span />已同步</span><button className="settings-button" aria-label="设置"><Settings size={18} /></button><button className="avatar">TX</button></div></header>
      <section className="stats"><div><span>全部文章</span><strong>{articles.length.toString().padStart(2, "0")}</strong><small>+2 本月</small></div><div><span>已发布</span><strong>{articles.filter((a) => a.status === "已发布").length.toString().padStart(2, "0")}</strong><small>保持更新</small></div><div><span>草稿</span><strong>{articles.filter((a) => a.status === "草稿").length.toString().padStart(2, "0")}</strong><small>等待完善</small></div><div className="stats-note"><Sparkles size={18} /><span>今天也写一点<br /><em>让想法留下来。</em></span></div></section>
      <section className="workspace" id="articles"><div className="article-list"><div className="section-title"><div><p className="overline">YOUR ARCHIVE / 01</p><h2>文章</h2></div><button className="primary" onClick={createArticle}><Plus size={16} />新建文章</button></div><div className="list-tools"><label><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索文章..." /></label><button className="filter"><span />全部状态</button></div><div className="article-items">{filtered.map((article) => <button className={article.id === selected.id ? "article-item selected" : "article-item"} key={article.id} onClick={() => setSelectedId(article.id)}><span className="item-type">{article.category}</span><strong>{article.title}</strong><small>{article.updated}</small><span className={article.status === "已发布" ? "status published" : "status draft"}>{article.status}</span></button>)}</div></div>
        <div className="editor-panel"><div className="editor-head"><div><p className="overline">EDITING ARTICLE</p><span className={selected.status === "已发布" ? "status published" : "status draft"}>{selected.status}</span></div><button aria-label="关闭编辑器"><X size={17} /></button></div><input className="title-input" value={selected.title} onChange={(event) => updateSelected({ title: event.target.value })} /><div className="meta-row"><label>分类 <input value={selected.category} onChange={(event) => updateSelected({ category: event.target.value })} /></label><label>更新于 <span>{selected.updated}</span></label></div><div className="editor-tabs"><button className="active">编辑</button><button>预览</button><button className="autosave"><Check size={14} />自动保存</button></div><textarea className="markdown-editor" value={selected.content} onChange={(event) => updateSelected({ content: event.target.value })} aria-label="文章正文" /><div className="editor-footer"><span>Markdown · 约 8 分钟阅读</span><div><button className="secondary" onClick={() => setSaved(true)}><Check size={15} />保存草稿</button><button className="primary" onClick={publish}><Send size={15} />发布文章</button></div></div></div></section>
      </main>{saved && <div className="toast"><Check size={16} />{selected.status === "已发布" ? "文章已发布，正在构建公开站点" : "草稿已保存"}</div>}
  </div>;
}

export default App;
