import { useState, type FormEvent, type ReactNode } from "react";
import { Check, CircleAlert, Trash2, X } from "lucide-react";

import type { Collection, Note, Project, ProjectStatus } from "../types/content";

type EditorMode = "create" | "edit";

type EditorShellProps = {
  eyebrow: string;
  title: string;
  mode: EditorMode;
  busy: boolean;
  error: string;
  children: ReactNode;
  onCancel: () => void;
  onDelete?: () => Promise<boolean>;
};

function EditorShell({ eyebrow, title, mode, busy, error, children, onCancel, onDelete }: EditorShellProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const remove = async () => {
    if (!onDelete) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    if (await onDelete()) onCancel();
    else setConfirmingDelete(false);
  };

  return (
    <div className="content-editor">
      <div className="content-editor-head">
        <div>
          <p className="overline">{eyebrow}</p>
          <h3>{title}</h3>
        </div>
        <button type="button" className="drawer-close" aria-label="关闭编辑器" onClick={onCancel}>
          <X size={17} />
        </button>
      </div>
      {children}
      {error ? <div className="form-error content-form-error"><CircleAlert size={15} />{error}</div> : null}
      <div className="content-form-actions">
        {mode === "edit" && onDelete ? (
          <button type="button" className={confirmingDelete ? "danger-button confirming" : "danger-button"} onClick={remove} disabled={busy}>
            <Trash2 size={14} />{confirmingDelete ? "确认删除" : "删除"}
          </button>
        ) : <span />}
        <div>
          <button type="button" className="secondary" onClick={onCancel} disabled={busy}>取消</button>
          <button type="submit" className="primary" disabled={busy}>
            <Check size={15} />{busy ? "正在保存..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}

function normalizeSlug(value: string, fallbackPrefix: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || `${fallbackPrefix}-${Date.now()}`;
}

function splitLines(value: string): string[] {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function splitCommaList(value: string): string[] {
  return value.split(/[,，]/).map((item) => item.trim()).filter(Boolean);
}

export function CollectionForm({ item, mode, onCancel, onSave, onDelete }: {
  item: Collection | null;
  mode: EditorMode;
  onCancel: () => void;
  onSave: (item: Collection, mode: EditorMode) => Promise<Collection | null>;
  onDelete?: () => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<Collection>(() => item ?? {
    id: 0,
    slug: "",
    title: "",
    description: "",
    audience: "",
    stages: [],
    count: 0,
    done: 0,
    color: "coral",
    updated: "刚刚",
  });
  const [stagesText, setStagesText] = useState(() => draft.stages.join("\n"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const stages = splitLines(stagesText);
    if (!draft.title.trim()) {
      setError("请填写专题名称。");
      return;
    }
    setBusy(true);
    setError("");
    const saved = await onSave({
      ...draft,
      title: draft.title.trim(),
      slug: normalizeSlug(draft.slug || draft.title, "collection"),
      description: draft.description.trim(),
      audience: draft.audience.trim(),
      stages,
      count: stages.length,
      done: Math.min(Math.max(0, draft.done), stages.length),
    }, mode);
    setBusy(false);
    if (saved) onCancel();
    else setError("保存失败，请检查字段或 API 状态后重试。");
  };

  return (
    <form className="content-form" onSubmit={submit}>
      <EditorShell eyebrow="SERIES EDITOR" title={mode === "create" ? "新建专题" : "编辑专题"} mode={mode} busy={busy} error={error} onCancel={onCancel} onDelete={onDelete}>
        <label>专题名称<input value={draft.title} onChange={(event) => setDraft((value) => ({ ...value, title: event.target.value }))} placeholder="例如：个人博客从零实现" autoFocus /></label>
        <label>URL Slug<input value={draft.slug} onChange={(event) => setDraft((value) => ({ ...value, slug: event.target.value }))} placeholder="留空后按标题自动生成" /></label>
        <label>专题简介<textarea value={draft.description} onChange={(event) => setDraft((value) => ({ ...value, description: event.target.value }))} rows={3} placeholder="说明专题解决什么问题" /></label>
        <label>适合读者<input value={draft.audience} onChange={(event) => setDraft((value) => ({ ...value, audience: event.target.value }))} placeholder="例如：想搭建个人站点的开发者" /></label>
        <label>阶段列表 <small>每行一个阶段</small><textarea value={stagesText} onChange={(event) => setStagesText(event.target.value)} rows={5} placeholder={'技术选型\n页面设计\n自动部署'} /></label>
        <label>已完成阶段数<input type="number" min="0" max={Math.max(splitLines(stagesText).length, 0)} value={draft.done} onChange={(event) => setDraft((value) => ({ ...value, done: Number(event.target.value) }))} /></label>
      </EditorShell>
    </form>
  );
}

export function ProjectForm({ item, mode, onCancel, onSave, onDelete }: {
  item: Project | null;
  mode: EditorMode;
  onCancel: () => void;
  onSave: (item: Project, mode: EditorMode) => Promise<Project | null>;
  onDelete?: () => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<Project>(() => item ?? {
    id: 0,
    slug: "",
    name: "",
    summary: "",
    status: "构思中",
    stack: [],
    result: "",
    updated: "刚刚",
    link: "",
  });
  const [stackText, setStackText] = useState(() => draft.stack.join(", "));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.name.trim()) {
      setError("请填写项目名称。");
      return;
    }
    setBusy(true);
    setError("");
    const saved = await onSave({
      ...draft,
      name: draft.name.trim(),
      slug: normalizeSlug(draft.slug || draft.name, "project"),
      summary: draft.summary.trim(),
      result: draft.result.trim(),
      link: draft.link.trim(),
      stack: splitCommaList(stackText),
    }, mode);
    setBusy(false);
    if (saved) onCancel();
    else setError("保存失败，请检查字段或 API 状态后重试。");
  };

  return (
    <form className="content-form drawer content-form-drawer" onSubmit={submit}>
      <EditorShell eyebrow="PROJECT EDITOR" title={mode === "create" ? "新建项目" : "编辑项目"} mode={mode} busy={busy} error={error} onCancel={onCancel} onDelete={onDelete}>
        <label>项目名称<input value={draft.name} onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))} placeholder="项目名称" autoFocus /></label>
        <label>URL Slug<input value={draft.slug} onChange={(event) => setDraft((value) => ({ ...value, slug: event.target.value }))} placeholder="留空后按名称自动生成" /></label>
        <label>状态<select value={draft.status} onChange={(event) => setDraft((value) => ({ ...value, status: event.target.value as ProjectStatus }))}><option>构思中</option><option>开发中</option><option>已上线</option></select></label>
        <label>项目简介<textarea value={draft.summary} onChange={(event) => setDraft((value) => ({ ...value, summary: event.target.value }))} rows={3} placeholder="一句话说明项目价值" /></label>
        <label>技术栈 <small>使用逗号分隔</small><input value={stackText} onChange={(event) => setStackText(event.target.value)} placeholder="Astro, React, FastAPI" /></label>
        <label>当前成果<textarea value={draft.result} onChange={(event) => setDraft((value) => ({ ...value, result: event.target.value }))} rows={3} placeholder="记录已经完成的成果" /></label>
        <label>项目链接<input value={draft.link} onChange={(event) => setDraft((value) => ({ ...value, link: event.target.value }))} placeholder="https://github.com/..." /></label>
      </EditorShell>
    </form>
  );
}

export function NoteForm({ item, mode, onCancel, onSave, onDelete }: {
  item: Note | null;
  mode: EditorMode;
  onCancel: () => void;
  onSave: (item: Note, mode: EditorMode) => Promise<Note | null>;
  onDelete?: () => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<Note>(() => item ?? {
    id: 0,
    date: new Date().toISOString().slice(0, 10),
    type: "学习笔记",
    title: "",
    summary: "",
    tags: [],
  });
  const [tagsText, setTagsText] = useState(() => draft.tags.join(", "));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.date || !draft.type.trim()) {
      setError("日期、类型和标题不能为空。");
      return;
    }
    setBusy(true);
    setError("");
    const saved = await onSave({
      ...draft,
      type: draft.type.trim(),
      title: draft.title.trim(),
      summary: draft.summary.trim(),
      tags: splitCommaList(tagsText),
    }, mode);
    setBusy(false);
    if (saved) onCancel();
    else setError("保存失败，请检查字段或 API 状态后重试。");
  };

  return (
    <form className="content-form drawer content-form-drawer" onSubmit={submit}>
      <EditorShell eyebrow="NOTE EDITOR" title={mode === "create" ? "新建记录" : "编辑记录"} mode={mode} busy={busy} error={error} onCancel={onCancel} onDelete={onDelete}>
        <label>日期<input type="date" value={draft.date} onChange={(event) => setDraft((value) => ({ ...value, date: event.target.value }))} /></label>
        <label>记录类型<select value={draft.type} onChange={(event) => setDraft((value) => ({ ...value, type: event.target.value }))}><option>学习笔记</option><option>项目进展</option><option>问题解决</option><option>工具尝试</option></select></label>
        <label>标题<input value={draft.title} onChange={(event) => setDraft((value) => ({ ...value, title: event.target.value }))} placeholder="这次记录了什么" autoFocus /></label>
        <label>内容摘要<textarea value={draft.summary} onChange={(event) => setDraft((value) => ({ ...value, summary: event.target.value }))} rows={5} placeholder="写下进展、结论或下一步" /></label>
        <label>标签 <small>使用逗号分隔</small><input value={tagsText} onChange={(event) => setTagsText(event.target.value)} placeholder="Astro, 测试, 自动化" /></label>
      </EditorShell>
    </form>
  );
}
