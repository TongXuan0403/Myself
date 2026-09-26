import { useEffect, useMemo, useState } from "react";
import {
  Activity, Archive, ArrowLeft, ArrowUpRight, BookOpen, Check, ChevronRight,
  CircleAlert, Clock3, FileText, FolderKanban, LayoutDashboard, LogOut,
  Menu, MoreHorizontal, Pencil, Plus, Search, Send, Settings, Sparkles,
  Tags, Trash2, X,
} from "lucide-react";

import type { Article, ArticlePatch, ArticleStatus } from "./types/article";
import { createDraftArticle } from "./types/article";
import { initialArticles } from "./data/articles";
import {
  createRemoteArticle,
  createRemoteCollection,
  createRemoteNote,
  createRemoteProject,
  deleteRemoteArticle,
  deleteRemoteCollection,
  deleteRemoteNote,
  deleteRemoteProject,
  fetchArticles,
  fetchWorkspaceContent,
  loginRemote,
  updateRemoteArticle,
  updateRemoteCollection,
  updateRemoteNote,
  updateRemoteProject,
} from "./data/api";
import { CollectionForm, NoteForm, ProjectForm } from "./components/ContentForms";
import type { Collection, Note, Project } from "./types/content";

type Route = "dashboard" | "articles" | "collections" | "projects" | "notes" | "settings";
type ToastState = { message: string; tone?: "success" | "error"; visible: boolean };
const collections: Collection[] = [
  { id: 1, slug: "personal-blog", title: "个人博客从零实现", description: "从信息架构到自动部署，完整记录一个内容站点的构建过程。", audience: "适合想做个人内容站点的开发者", stages: ["技术选型", "页面设计", "Markdown 渲染", "自动部署", "性能优化"], count: 5, done: 3, color: "coral", updated: "更新于今天" },
  { id: 2, slug: "frontend-lab", title: "前端界面实验室", description: "网格、动效和可访问性相关的小型实践。", audience: "适合关注体验细节的前端开发者", stages: ["布局", "层级", "状态", "动效", "可访问性"], count: 8, done: 5, color: "sage", updated: "更新于 3 天前" },
  { id: 3, slug: "ai-workflow", title: "AI 工具工作流", description: "把 AI 放进真实开发流程的记录和复盘。", audience: "适合希望提高开发效率的实践者", stages: ["需求拆解", "提示词设计", "代码协作", "效果复盘"], count: 4, done: 1, color: "ink", updated: "更新于 8 月 26 日" },
];
const projects: Project[] = [
  { id: 1, slug: "myself-field-notes", name: "Myself / Field Notes", summary: "兼顾自动发布和视觉表达的个人技术博客。", status: "开发中", stack: ["Astro", "React", "FastAPI"], result: "公开站点和发布后台已经跑通 Mock 流程。", updated: "最近提交 2 小时前", link: "github.com/TongXuan0403/Myself" },
  { id: 2, slug: "release-desk", name: "Release Desk", summary: "一个为单作者设计的 Markdown 发布工作台。", status: "已上线", stack: ["TypeScript", "Vite", "SQLite"], result: "支持草稿、预览、校验和发布状态反馈。", updated: "最近提交昨天", link: "github.com/TongXuan0403/release-desk" },
  { id: 3, slug: "prompt-atlas", name: "Prompt Atlas", summary: "整理可复用的 AI 工具提示词与评测样例。", status: "构思中", stack: ["Next.js", "OpenAI"], result: "正在整理第一批真实开发任务样例。", updated: "最近更新 8 月 18 日", link: "github.com/TongXuan0403/prompt-atlas" },
];
const notes: Note[] = [
  { id: 1, date: "2026-09-04", type: "项目进展", title: "开始搭建发布后台", summary: "先把登录、路由、文章编辑和发布反馈做成一条可以跑通的 Mock 流程。", tags: ["博客", "前端"] },
  { id: 2, date: "2026-09-02", type: "学习笔记", title: "Astro Islands 的边界", summary: "把交互留给需要它的组件，其余页面保持静态输出。", tags: ["Astro", "性能"] },
  { id: 3, date: "2026-08-29", type: "问题解决", title: "为 Markdown 文章补齐空状态", summary: "空状态不是错误，它应该告诉用户下一步能做什么。", tags: ["UX", "内容"] },
  { id: 4, date: "2026-08-26", type: "工具尝试", title: "用 Playwright 记录关键交互", summary: "把加载、表单校验和移动端菜单列入每次发布前的快速检查。", tags: ["测试", "自动化"] },
];
const navItems: Array<{ id: Route; label: string; icon: typeof LayoutDashboard; count?: number }> = [
  { id: "dashboard", label: "概览", icon: LayoutDashboard },
  { id: "articles", label: "文章", icon: FileText, count: initialArticles.length },
  { id: "collections", label: "专题", icon: BookOpen, count: collections.length },
  { id: "projects", label: "项目", icon: FolderKanban, count: projects.length },
  { id: "notes", label: "记录", icon: Archive },
];

function routeFromHash(): Route | "login" {
  const value = window.location.hash.replace(/^#\/?/, "");
  if (value === "login") return "login";
  return navItems.some((item) => item.id === value) || value === "settings" ? (value as Route) : "dashboard";
}
function useRoute() {
  const [route, setRoute] = useState<Route | "login">(() => routeFromHash());
  useEffect(() => { const onHash = () => setRoute(routeFromHash()); window.addEventListener("hashchange", onHash); if (!window.location.hash) window.location.hash = "#/dashboard"; return () => window.removeEventListener("hashchange", onHash); }, []);
  return route;
}
function navigate(route: Route | "login") { window.location.hash = `#/${route}`; }

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setError(""); if (!email.trim() || !password.trim()) { setError("请输入邮箱和密码。"); return; } setLoading(true); try { await loginRemote(email, password); localStorage.setItem("myself-admin-session", "active"); onSuccess(); navigate("dashboard"); } catch (caught) { setError(caught instanceof Error ? caught.message : "账号或密码不正确"); } finally { setLoading(false); } };
  return <div className="login-screen"><div className="login-aside"><div className="admin-brand large"><span>TX</span><div><strong>MYSELF</strong><small>CONTENT STUDIO</small></div></div><div className="login-quote"><p>记录代码、项目和持续构建中的想法。</p><span>一个给自己的内容工作台。</span></div><div className="login-aside-foot"><span>PRIVATE WORKSPACE</span><span>V 1.0 / 2026</span></div></div><main className="login-card"><div className="login-card-head"><p className="overline">WELCOME BACK</p><h1>登录工作台</h1><p>继续编辑你的下一篇文章。</p></div><form onSubmit={submit} className="login-form" noValidate><label>邮箱<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" /></label><label>密码<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="请输入密码" /></label>{error && <div className="form-error"><CircleAlert size={15} />{error}</div>}<button className="primary wide" disabled={loading}>{loading ? <><Activity size={15} className="spin" />正在验证...</> : <>进入工作台 <ArrowUpRight size={15} /></>}</button></form></main></div>;
}

function Sidebar({ route, open, counts, onClose, onLogout }: { route: Route; open: boolean; counts: Partial<Record<Route, number>>; onClose: () => void; onLogout: () => void }) {
  return <><aside className={`sidebar ${open ? "is-open" : ""}`}><div className="admin-brand"><span>TX</span><div><strong>MYSELF</strong><small>CONTENT STUDIO</small></div></div><div className="workspace-label">WORKSPACE</div><nav>{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={route === id ? "active" : ""} onClick={() => { navigate(id); onClose(); }}><Icon size={16} /><span>{label}</span>{counts[id] !== undefined ? <b>{counts[id]}</b> : null}</button>)}<button className="sidebar-action" onClick={() => { navigate("articles"); onClose(); }}><Plus size={16} />新建文章</button></nav><div className="sidebar-bottom"><button className={route === "settings" ? "active" : ""} onClick={() => { navigate("settings"); onClose(); }}><Settings size={16} />设置</button><div className="profile"><span>TX</span><div><strong>Tong Xuan</strong><small>作者 · 已登录</small></div><button aria-label="退出登录" onClick={onLogout}><LogOut size={14} /></button></div></div></aside>{open && <button className="backdrop" aria-label="关闭菜单" onClick={onClose} />}</>;
}
function Topbar({ route, apiConnected, onOpenMenu, onToast }: { route: Route; apiConnected: boolean; onOpenMenu: () => void; onToast: (message: string) => void }) {
  const title = route === "dashboard" ? "早上好，Tong Xuan。" : navItems.find((item) => item.id === route)?.label ?? "设置";
  return <header className="topbar"><button className="mobile-menu" aria-label="打开菜单" onClick={onOpenMenu}><Menu size={19} /></button><div><p className="overline">MYSELF / CONTENT STUDIO</p><h1>{title}</h1></div><div className="top-actions"><button className="top-search" onClick={() => onToast("全局搜索将在下一版本开放")}><Search size={16} /><span>搜索</span><kbd>⌘ K</kbd></button><span className={`sync-status ${apiConnected ? "" : "offline"}`}><span />{apiConnected ? "API 已连接" : "Mock 模式"}</span><button className="settings-button" aria-label="打开设置" onClick={() => navigate("settings")}><Settings size={18} /></button><button className="avatar" aria-label="当前用户">TX</button></div></header>;
}
function StatsBar({ articles }: { articles: Article[] }) { const published = articles.filter((item) => item.status === "已发布").length; const draft = articles.length - published; return <section className="stats"><div><span>全部文章</span><strong>{String(articles.length).padStart(2, "0")}</strong><small>+2 本月</small></div><div><span>已发布</span><strong>{String(published).padStart(2, "0")}</strong><small>保持更新</small></div><div><span>草稿</span><strong>{String(draft).padStart(2, "0")}</strong><small>等待完善</small></div><div className="stats-note"><Sparkles size={18} /><span>今天也写一点<br /><em>让想法留下来。</em></span></div></section>; }
function SectionHeading({ overline, title, action }: { overline: string; title: string; action?: React.ReactNode }) { return <div className="section-title"><div><p className="overline">{overline}</p><h2>{title}</h2></div>{action}</div>; }

function DashboardPage({ articles, workspaceCollections, workspaceProjects, onCreate, onOpenArticle }: { articles: Article[]; workspaceCollections: Collection[]; workspaceProjects: Project[]; onCreate: () => void; onOpenArticle: (id: number) => void }) {
  const published = articles.filter((item) => item.status === "已发布").length;
  return <div className="page dashboard-page"><StatsBar articles={articles} /><section className="dashboard-grid"><div className="dashboard-main"><SectionHeading overline="OVERVIEW / 01" title="内容概览" action={<button className="primary" onClick={onCreate}><Plus size={15} />新建文章</button>} /><div className="release-banner"><div><span className="eyebrow-dot" />PUBLICATION PIPELINE<h3>公开站点运行正常</h3><p>最近一次构建在 2 小时前完成，{published} 篇文章正在展示。</p></div><button className="ghost-button" onClick={() => navigate("settings")}>查看发布设置 <ArrowUpRight size={14} /></button></div><div className="dashboard-section"><div className="subhead"><h3>最近编辑</h3><button className="text-button" onClick={() => navigate("articles")}>查看全部 <ChevronRight size={14} /></button></div><div className="recent-list">{articles.slice(0, 3).map((article) => <button className="recent-row" key={article.id} onClick={() => onOpenArticle(article.id)}><span className="recent-index">{String(article.id).padStart(2, "0")}</span><div><small>{article.category}</small><strong>{article.title}</strong></div><span className={`status ${article.status === "已发布" ? "published" : "draft"}`}>{article.status}</span><ArrowUpRight size={15} /></button>)}</div></div></div><aside className="dashboard-aside"><div className="aside-block"><div className="subhead"><h3>快速入口</h3><MoreHorizontal size={17} /></div><button className="quick-link" onClick={onCreate}><span className="quick-icon coral"><Plus size={16} /></span><span><strong>写一篇新文章</strong><small>从空白草稿开始</small></span><ChevronRight size={15} /></button><button className="quick-link" onClick={() => navigate("collections")}><span className="quick-icon sage"><BookOpen size={16} /></span><span><strong>整理专题路线</strong><small>{workspaceCollections.length} 个专题进行中</small></span><ChevronRight size={15} /></button><button className="quick-link" onClick={() => navigate("projects")}><span className="quick-icon ink"><FolderKanban size={16} /></span><span><strong>更新项目进度</strong><small>{workspaceProjects.filter((item) => item.status === "开发中").length} 个项目开发中</small></span><ChevronRight size={15} /></button></div><div className="aside-block build-block"><div className="subhead"><h3>发布记录</h3><span className="live-label"><span />LIVE</span></div><div className="build-item"><span className="build-marker success"><Check size={12} /></span><div><strong>公开站点构建成功</strong><small>今天 09:42 · main</small></div></div><div className="build-item"><span className="build-marker success"><Check size={12} /></span><div><strong>文章内容已同步</strong><small>昨天 18:20 · 3 files</small></div></div><div className="build-item"><span className="build-marker pending"><Clock3 size={12} /></span><div><strong>下一次自动检查</strong><small>每次 push 后触发</small></div></div></div></aside></section></div>;
}

function ArticleEditor({ article, onClose, onUpdate, onSave, onPublish, onDelete }: { article: Article; onClose: () => void; onUpdate: (patch: ArticlePatch) => void; onSave: () => void; onPublish: () => void; onDelete: () => void }) {
  const [tab, setTab] = useState<"edit" | "preview">("edit"); const [validation, setValidation] = useState(""); const canPublish = article.title.trim().length > 0 && article.content.trim().length > 0;
  const publish = () => { if (!canPublish) { setValidation("标题和正文不能为空。"); return; } setValidation(""); onPublish(); };
  return <div className="editor-panel"><div className="editor-head"><div><p className="overline">EDITING ARTICLE</p><span className={`status ${article.status === "已发布" ? "published" : "draft"}`}>{article.status}</span></div><button aria-label="关闭编辑器" onClick={onClose}><X size={17} /></button></div><input className="title-input" value={article.title} onChange={(event) => onUpdate({ title: event.target.value })} placeholder="输入文章标题" /><div className="meta-row"><label>分类 <input value={article.category} onChange={(event) => onUpdate({ category: event.target.value })} /></label><label>更新时间 <span>{article.updated}</span></label></div><div className="editor-tabs"><button className={tab === "edit" ? "active" : ""} onClick={() => setTab("edit")}>编辑</button><button className={tab === "preview" ? "active" : ""} onClick={() => setTab("preview")}>预览</button><span className="autosave"><Check size={14} />自动保存已开启</span></div>{tab === "edit" ? <textarea className="markdown-editor" value={article.content} onChange={(event) => onUpdate({ content: event.target.value })} aria-label="文章正文" placeholder="从问题背景开始写..." /> : <div className="markdown-preview">{article.content ? article.content.split("\n").map((line, index) => <p key={index}>{line || "\u00a0"}</p>) : <p className="muted">暂无内容，切换到编辑开始写作。</p>}</div>}{validation && <div className="form-error editor-error"><CircleAlert size={15} />{validation}</div>}<div className="editor-footer"><span>Markdown · 约 8 分钟阅读</span><div><button className="icon-button danger" aria-label="删除草稿" onClick={onDelete}><Trash2 size={15} /></button><button className="secondary" onClick={onSave}><Check size={15} />保存草稿</button><button className="primary" onClick={publish} disabled={!canPublish}><Send size={15} />发布文章</button></div></div></div>;
}

function ArticlesPage({ articles, selectedId, onSelect, onCreate, onUpdate, onSave, onPublish, onDelete }: { articles: Article[]; selectedId: number | null; onSelect: (id: number | null) => void; onCreate: () => void; onUpdate: (patch: ArticlePatch) => void; onSave: () => void; onPublish: () => void; onDelete: () => void }) {
  const [query, setQuery] = useState(""); const [filter, setFilter] = useState<"全部" | ArticleStatus>("全部"); const [errorMode, setErrorMode] = useState(false); const filtered = useMemo(() => articles.filter((article) => (filter === "全部" || article.status === filter) && `${article.title}${article.category}`.toLowerCase().includes(query.toLowerCase())), [articles, filter, query]); const selected = articles.find((item) => item.id === selectedId) ?? null;
  return <div className="page articles-page"><div className="workspace"><div className="article-list"><SectionHeading overline="YOUR ARCHIVE / 01" title="文章" action={<button className="primary" onClick={onCreate}><Plus size={15} />新建文章</button>} /><div className="list-tools"><label><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索文章..." /></label><select value={filter} onChange={(event) => setFilter(event.target.value as "全部" | ArticleStatus)} aria-label="文章状态筛选"><option>全部</option><option>已发布</option><option>草稿</option></select><button className={`filter ${errorMode ? "is-error" : ""}`} onClick={() => setErrorMode((value) => !value)}><span />{errorMode ? "恢复接口" : "模拟错误"}</button></div>{errorMode ? <div className="empty-state error-state"><CircleAlert size={22} /><strong>暂时无法加载文章</strong><p>Mock API 返回 503，请稍后重试。</p><button className="secondary" onClick={() => setErrorMode(false)}>重试</button></div> : <><div className="article-items">{filtered.map((article) => <button className={article.id === selectedId ? "article-item selected" : "article-item"} key={article.id} onClick={() => onSelect(article.id)}><span className="item-type">{article.category}</span><strong>{article.title}</strong><small>{article.updated}</small><span className={`status ${article.status === "已发布" ? "published" : "draft"}`}>{article.status}</span></button>)}{filtered.length === 0 && <div className="empty-state"><Search size={22} /><strong>暂无匹配文章</strong><p>清空搜索词或筛选条件后再看看。</p><button className="text-button" onClick={() => { setQuery(""); setFilter("全部"); }}>清除筛选</button></div>}</div><p className="list-hint">共 {articles.length} 篇文章 · 已显示 {filtered.length} 篇</p></>}</div>{selected ? <ArticleEditor article={selected} onClose={() => onSelect(null)} onUpdate={onUpdate} onSave={onSave} onPublish={onPublish} onDelete={onDelete} /> : <div className="editor-panel"><div className="editor-empty"><Pencil size={22} /><strong>选择一篇文章开始编辑</strong><p>支持 Markdown 编辑、预览、保存草稿和发布。</p></div></div>}</div></div>;
}

type ContentEditorState = { mode: "create" | "edit"; id: number | null } | null;

function CollectionsPage({ items, onSave, onDelete }: {
  items: Collection[];
  onSave: (item: Collection, mode: "create" | "edit") => Promise<Collection | null>;
  onDelete: (item: Collection) => Promise<boolean>;
}) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [editor, setEditor] = useState<ContentEditorState>(null);
  const active = items.find((item) => item.id === activeId) ?? null;
  const editingItem = items.find((item) => item.id === editor?.id) ?? null;
  const closeEditor = () => setEditor(null);

  return <div className="page"><SectionHeading overline="LEARNING PATHS / 02" title="专题" action={<button className="primary" onClick={() => setEditor({ mode: "create", id: null })}><Plus size={15} />新建专题</button>} /><div className="collection-layout"><div className="collection-list">{items.map((item) => <button className={`collection-row ${item.id === activeId ? "selected" : ""}`} key={item.id} onClick={() => { setActiveId(item.id); setEditor(null); }}><span className={`collection-mark ${item.color}`} /><div><strong>{item.title}</strong><p>{item.description}</p><small>{item.done}/{item.count} 篇完成 · {item.updated}</small></div><div className="progress"><span style={{ width: `${item.count ? (item.done / item.count) * 100 : 0}%` }} /></div><ChevronRight size={16} /></button>)}</div><div className="detail-panel">{editor ? <CollectionForm key={`collection-${editor.mode}-${editor.id ?? "new"}`} item={editingItem} mode={editor.mode} onCancel={closeEditor} onSave={onSave} onDelete={editingItem ? () => onDelete(editingItem) : undefined} /> : active ? <><button className="back-button" onClick={() => setActiveId(null)}><ArrowLeft size={14} />全部专题</button><div className="detail-heading"><div><p className="overline">SERIES DETAIL</p><h3>{active.title}</h3></div><button className="secondary" onClick={() => setEditor({ mode: "edit", id: active.id })}><Pencil size={14} />编辑专题</button></div><p className="detail-copy">{active.description}</p><p className="detail-audience">{active.audience}</p><div className="detail-stats"><span><strong>{active.count}</strong>个阶段</span><span><strong>{active.done}</strong>个完成</span><span><strong>{active.count ? Math.round(active.done / active.count * 100) : 0}%</strong>进度</span></div><div className="series-steps">{active.stages.map((stage, index) => <div className={index < active.done ? "series-step done" : "series-step"} key={`${stage}-${index}`}><span>{index < active.done ? <Check size={12} /> : index + 1}</span><div><strong>{stage}</strong><small>{index < active.done ? "已完成" : "待开始"}</small></div></div>)}</div></> : <div className="detail-empty"><BookOpen size={26} /><strong>选择一个专题</strong><p>查看学习路径、完成进度和文章顺序。</p></div>}</div></div></div>;
}

function ProjectsPage({ items, onSave, onDelete }: {
  items: Project[];
  onSave: (item: Project, mode: "create" | "edit") => Promise<Project | null>;
  onDelete: (item: Project) => Promise<boolean>;
}) {
  const [editor, setEditor] = useState<ContentEditorState>(null);
  const editingItem = items.find((item) => item.id === editor?.id) ?? null;
  const closeEditor = () => setEditor(null);

  return <div className="page"><SectionHeading overline="PROJECT LAB / 03" title="项目" action={<button className="primary" onClick={() => setEditor({ mode: "create", id: null })}><Plus size={15} />新建项目</button>} /><div className="project-table"><div className="table-head"><span>项目名称</span><span>状态</span><span>技术栈</span><span>最近更新</span><span /></div>{items.map((project) => <button className="project-row" key={project.id} onClick={() => setEditor({ mode: "edit", id: project.id })}><div><strong>{project.name}</strong><small>{project.summary}</small></div><span className={`project-status ${project.status === "已上线" ? "online" : project.status === "开发中" ? "building" : "idea"}`}>{project.status}</span><div className="stack-list">{project.stack.map((item) => <span key={item}>{item}</span>)}</div><small>{project.updated}</small><ChevronRight size={16} /></button>)}</div>{editor ? <><button className="backdrop" aria-label="关闭项目编辑器" onClick={closeEditor} /><ProjectForm key={`project-${editor.mode}-${editor.id ?? "new"}`} item={editingItem} mode={editor.mode} onCancel={closeEditor} onSave={onSave} onDelete={editingItem ? () => onDelete(editingItem) : undefined} /></> : null}</div>;
}

function NotesPage({ items, onSave, onDelete }: {
  items: Note[];
  onSave: (item: Note, mode: "create" | "edit") => Promise<Note | null>;
  onDelete: (item: Note) => Promise<boolean>;
}) {
  const [type, setType] = useState("全部");
  const [editor, setEditor] = useState<ContentEditorState>(null);
  const visible = items.filter((note) => type === "全部" || note.type === type);
  const editingItem = items.find((item) => item.id === editor?.id) ?? null;
  const closeEditor = () => setEditor(null);

  return <div className="page"><SectionHeading overline="FIELD NOTES / 04" title="记录" action={<button className="primary" onClick={() => setEditor({ mode: "create", id: null })}><Plus size={15} />新建记录</button>} /><div className="notes-toolbar"><div className="segmented">{["全部", "学习笔记", "项目进展", "问题解决", "工具尝试"].map((item) => <button className={type === item ? "active" : ""} key={item} onClick={() => setType(item)}>{item}</button>)}</div><span>{visible.length} 条记录</span></div><div className="timeline">{visible.map((note) => <article className="timeline-item" key={note.id}><time>{note.date}</time><span className="timeline-dot" /><div><span className="note-type">{note.type}</span><div className="note-heading"><h3>{note.title}</h3><button className="text-button" onClick={() => setEditor({ mode: "edit", id: note.id })}><Pencil size={13} />编辑</button></div><p>{note.summary}</p><div className="tag-list">{note.tags.map((tag) => <span key={tag}><Tags size={11} />{tag}</span>)}</div></div></article>)}</div>{editor ? <><button className="backdrop" aria-label="关闭记录编辑器" onClick={closeEditor} /><NoteForm key={`note-${editor.mode}-${editor.id ?? "new"}`} item={editingItem} mode={editor.mode} onCancel={closeEditor} onSave={onSave} onDelete={editingItem ? () => onDelete(editingItem) : undefined} /></> : null}</div>;
}

function SettingsPage({ dark, onToggleDark, onToast }: { dark: boolean; onToggleDark: () => void; onToast: (message: string) => void }) { const [saved, setSaved] = useState(false); return <div className="page settings-page"><SectionHeading overline="WORKSPACE SETTINGS / 05" title="设置" /><div className="settings-layout"><div className="settings-nav"><button className="active">工作台</button><button>发布流程</button><button>个人资料</button><button>危险操作</button></div><div className="settings-content"><section className="settings-section"><div><h3>工作台偏好</h3><p>调整内容编辑和界面的默认行为。</p></div><div className="setting-row"><div><strong>深色界面</strong><small>适合夜间集中编辑，公开站点主题不受影响。</small></div><button className={`toggle ${dark ? "on" : ""}`} role="switch" aria-checked={dark} onClick={onToggleDark}><span /></button></div><div className="setting-row"><div><strong>自动保存草稿</strong><small>每次输入后在本地 Mock 存储中保留最新内容。</small></div><button className="toggle on" role="switch" aria-checked="true"><span /></button></div></section><section className="settings-section"><div><h3>发布流程</h3><p>Mock 环境会模拟校验、构建和同步状态。</p></div><div className="setting-row"><div><strong>发布前内容校验</strong><small>标题、正文为空时阻止发布。</small></div><span className="setting-value"><Check size={14} />已开启</span></div><div className="setting-row"><div><strong>发布通知</strong><small>发布完成后显示右下角反馈。</small></div><button className="text-button" onClick={() => onToast("通知偏好已更新")}>测试通知 <ArrowUpRight size={13} /></button></div></section><button className="primary" onClick={() => { setSaved(true); window.setTimeout(() => setSaved(false), 2000); }}>{saved ? <><Check size={15} />已保存</> : "保存设置"}</button></div></div></div>; }

function Toast({ message, visible, tone = "success" }: { message: string; visible: boolean; tone?: "success" | "error" }) { if (!visible) return null; return <div className={`toast ${tone}`}><span>{tone === "success" ? <Check size={16} /> : <CircleAlert size={16} />}</span>{message}</div>; }

function App() {
  const route = useRoute();
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem("myself-admin-session") === "active" && Boolean(localStorage.getItem("myself-admin-token")));
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [workspaceCollections, setWorkspaceCollections] = useState<Collection[]>(collections);
  const [workspaceProjects, setWorkspaceProjects] = useState<Project[]>(projects);
  const [workspaceNotes, setWorkspaceNotes] = useState<Note[]>(notes);
  const [selectedId, setSelectedId] = useState<number | null>(initialArticles[0]?.id ?? null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [toast, setToast] = useState<ToastState>({ message: "", visible: false });
  const flash = (message: string, tone: ToastState["tone"] = "success") => { setToast({ message, tone, visible: true }); window.setTimeout(() => setToast({ message: "", visible: false }), 2400); };
  useEffect(() => { if (!authenticated && route !== "login") navigate("login"); }, [authenticated, route]);
  useEffect(() => { setLoading(true); const timer = window.setTimeout(() => setLoading(false), 280); return () => window.clearTimeout(timer); }, [route]);
  useEffect(() => {
    if (!authenticated) return;
    let active = true;
    Promise.all([fetchArticles(), fetchWorkspaceContent()]).then(([remoteArticles, remoteContent]) => {
      if (!active) return;
      setArticles(remoteArticles);
      setSelectedId((current) => remoteArticles.some((article) => article.id === current) ? current : remoteArticles[0]?.id ?? null);
      setWorkspaceCollections(remoteContent.collections);
      setWorkspaceProjects(remoteContent.projects);
      setWorkspaceNotes(remoteContent.notes);
      setApiConnected(true);
    }).catch(() => { if (active) setApiConnected(false); });
    return () => { active = false; };
  }, [authenticated]);
  const selected = articles.find((item) => item.id === selectedId) ?? null;
  const updateSelected = (patch: ArticlePatch) => { if (selected) setArticles((items) => items.map((item) => item.id === selected.id ? { ...item, ...patch } : item)); };
  const createArticle = async () => {
    const draft = createDraftArticle(Date.now());
    if (apiConnected) {
      try { const remote = await createRemoteArticle(draft); setArticles((items) => [remote, ...items]); setSelectedId(remote.id); navigate("articles"); flash("草稿已创建并同步到 API"); return; }
      catch { flash("API 创建失败，已保留本地草稿", "error"); }
    }
    setArticles((items) => [draft, ...items]); setSelectedId(draft.id); navigate("articles"); flash("草稿已创建");
  };
  const saveDraft = async () => {
    if (!selected?.title.trim()) { flash("请先填写文章标题", "error"); return; }
    if (apiConnected) {
      try { const remote = await updateRemoteArticle(selected, { status: "草稿" }); setArticles((items) => items.map((item) => item.id === remote.id ? remote : item)); flash("草稿已保存到 API"); return; }
      catch { flash("API 保存失败，请检查接口后重试", "error"); return; }
    }
    flash("草稿已保存");
  };
  const publishSelected = async () => {
    if (!selected || !selected.title.trim() || !selected.content.trim()) { flash("标题和正文不能为空", "error"); return; }
    if (apiConnected) {
      try {
        const remote = await updateRemoteArticle(selected, { status: "已发布" });
        setArticles((items) => items.map((item) => item.id === remote.id ? remote : item));
        flash("Markdown 已同步，等待构建与部署");
        return;
      }
      catch { flash("API 发布失败，请检查接口后重试", "error"); return; }
    }
    setArticles((items) => items.map((item) => item.id === selected.id ? { ...item, status: "已发布", updated: "刚刚" } : item)); flash("仅更新 Mock 状态，未同步公开站点");
  };
  const deleteSelected = async () => {
    if (!selected) return;
    if (apiConnected) { try { await deleteRemoteArticle(selected); } catch { flash("API 删除失败，请检查接口后重试", "error"); return; } }
    setArticles((items) => items.filter((item) => item.id !== selected.id)); setSelectedId(null); flash(apiConnected ? "文章及公开内容已删除" : "Mock 文章已删除");
  };
  const saveCollection = async (item: Collection, mode: "create" | "edit"): Promise<Collection | null> => {
    if (apiConnected) {
      try {
        const remote = mode === "create" ? await createRemoteCollection(item) : await updateRemoteCollection(item);
        setWorkspaceCollections((items) => mode === "create" ? [...items, remote] : items.map((current) => current.id === remote.id ? remote : current));
        flash(mode === "create" ? "专题已创建并同步到 API" : "专题修改已同步到 API");
        return remote;
      } catch { flash("专题保存失败，请检查接口或 slug 是否重复", "error"); return null; }
    }
    const local = mode === "create" ? { ...item, id: Date.now(), updated: "刚刚" } : { ...item, updated: "刚刚" };
    setWorkspaceCollections((items) => mode === "create" ? [...items, local] : items.map((current) => current.id === local.id ? local : current));
    flash(mode === "create" ? "Mock 专题已创建" : "Mock 专题已更新");
    return local;
  };
  const removeCollection = async (item: Collection): Promise<boolean> => {
    if (apiConnected) {
      try { await deleteRemoteCollection(item); }
      catch { flash("专题删除失败，请检查接口后重试", "error"); return false; }
    }
    setWorkspaceCollections((items) => items.filter((current) => current.id !== item.id));
    flash(apiConnected ? "专题及公开快照已删除" : "Mock 专题已删除");
    return true;
  };
  const saveProject = async (item: Project, mode: "create" | "edit"): Promise<Project | null> => {
    if (apiConnected) {
      try {
        const remote = mode === "create" ? await createRemoteProject(item) : await updateRemoteProject(item);
        setWorkspaceProjects((items) => mode === "create" ? [...items, remote] : items.map((current) => current.id === remote.id ? remote : current));
        flash(mode === "create" ? "项目已创建并同步到 API" : "项目修改已同步到 API");
        return remote;
      } catch { flash("项目保存失败，请检查接口或 slug 是否重复", "error"); return null; }
    }
    const local = mode === "create" ? { ...item, id: Date.now(), updated: "刚刚" } : { ...item, updated: "刚刚" };
    setWorkspaceProjects((items) => mode === "create" ? [...items, local] : items.map((current) => current.id === local.id ? local : current));
    flash(mode === "create" ? "Mock 项目已创建" : "Mock 项目已更新");
    return local;
  };
  const removeProject = async (item: Project): Promise<boolean> => {
    if (apiConnected) {
      try { await deleteRemoteProject(item); }
      catch { flash("项目删除失败，请检查接口后重试", "error"); return false; }
    }
    setWorkspaceProjects((items) => items.filter((current) => current.id !== item.id));
    flash(apiConnected ? "项目及公开快照已删除" : "Mock 项目已删除");
    return true;
  };
  const saveNote = async (item: Note, mode: "create" | "edit"): Promise<Note | null> => {
    if (apiConnected) {
      try {
        const remote = mode === "create" ? await createRemoteNote(item) : await updateRemoteNote(item);
        setWorkspaceNotes((items) => mode === "create" ? [remote, ...items] : items.map((current) => current.id === remote.id ? remote : current));
        flash(mode === "create" ? "记录已创建并同步到 API" : "记录修改已同步到 API");
        return remote;
      } catch { flash("记录保存失败，请检查接口后重试", "error"); return null; }
    }
    const local = mode === "create" ? { ...item, id: Date.now() } : item;
    setWorkspaceNotes((items) => mode === "create" ? [local, ...items] : items.map((current) => current.id === local.id ? local : current));
    flash(mode === "create" ? "Mock 记录已创建" : "Mock 记录已更新");
    return local;
  };
  const removeNote = async (item: Note): Promise<boolean> => {
    if (apiConnected) {
      try { await deleteRemoteNote(item); }
      catch { flash("记录删除失败，请检查接口后重试", "error"); return false; }
    }
    setWorkspaceNotes((items) => items.filter((current) => current.id !== item.id));
    flash(apiConnected ? "记录及公开快照已删除" : "Mock 记录已删除");
    return true;
  };
  const logout = () => { localStorage.removeItem("myself-admin-session"); localStorage.removeItem("myself-admin-token"); setAuthenticated(false); navigate("login"); };
  if (!authenticated || route === "login") return <LoginScreen onSuccess={() => setAuthenticated(true)} />;
  const page = route === "dashboard" ? <DashboardPage articles={articles} workspaceCollections={workspaceCollections} workspaceProjects={workspaceProjects} onCreate={createArticle} onOpenArticle={(id) => { setSelectedId(id); navigate("articles"); }} /> : route === "articles" ? <ArticlesPage articles={articles} selectedId={selectedId} onSelect={setSelectedId} onCreate={createArticle} onUpdate={updateSelected} onSave={saveDraft} onPublish={publishSelected} onDelete={deleteSelected} /> : route === "collections" ? <CollectionsPage items={workspaceCollections} onSave={saveCollection} onDelete={removeCollection} /> : route === "projects" ? <ProjectsPage items={workspaceProjects} onSave={saveProject} onDelete={removeProject} /> : route === "notes" ? <NotesPage items={workspaceNotes} onSave={saveNote} onDelete={removeNote} /> : <SettingsPage dark={dark} onToggleDark={() => setDark((value) => !value)} onToast={flash} />;
  return <div className={`admin-app ${dark ? "is-dark" : ""}`}><Sidebar route={route} open={menuOpen} counts={{ articles: articles.length, collections: workspaceCollections.length, projects: workspaceProjects.length, notes: workspaceNotes.length }} onClose={() => setMenuOpen(false)} onLogout={logout} /><main className="admin-main"><Topbar route={route} apiConnected={apiConnected} onOpenMenu={() => setMenuOpen(true)} onToast={flash} />{loading ? <div className="page-loading"><Activity className="spin" size={20} /><span>{apiConnected ? "正在加载 API 数据..." : "正在加载 Mock 数据..."}</span></div> : page}</main><Toast message={toast.message} visible={toast.visible} tone={toast.tone} /></div>;
}

export default App;
