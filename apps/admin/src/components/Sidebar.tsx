import { ArrowUpRight, Archive, BookOpen, FileText, LayoutDashboard, Settings } from "lucide-react";

type SidebarProps = {
  articleCount: number;
  open: boolean;
  onCreateArticle: () => void;
  onClose: () => void;
};

export function Sidebar({ articleCount, open, onCreateArticle, onClose }: SidebarProps) {
  return (
    <>
      <aside className={open ? "sidebar is-open" : "sidebar"}>
        <div className="admin-brand">
          <span>TX</span>
          <div>
            <strong>MYSELF</strong>
            <small>CONTENT STUDIO</small>
          </div>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav>
          <a className="active" href="#dashboard">
            <LayoutDashboard size={16} />
            概览
          </a>
          <a href="#articles">
            <FileText size={16} />
            文章 <b>{articleCount}</b>
          </a>
          <a href="#collections">
            <BookOpen size={16} />
            专题
          </a>
          <a href="#media">
            <Archive size={16} />
            素材库
          </a>
          <button className="sidebar-action" onClick={onCreateArticle}>
            <FileText size={16} />
            新建文章
          </button>
        </nav>
        <div className="sidebar-bottom">
          <a href="#settings">
            <Settings size={16} />
            设置
          </a>
          <div className="profile">
            <span>TX</span>
            <div>
              <strong>Tong Xuan</strong>
              <small>作者</small>
            </div>
            <ArrowUpRight size={14} />
          </div>
        </div>
      </aside>
      {open && <button className="backdrop" aria-label="关闭菜单" onClick={onClose} />}
    </>
  );
}
