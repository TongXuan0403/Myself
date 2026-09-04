import { Menu, Settings } from "lucide-react";

type TopbarProps = {
  onOpenMenu: () => void;
};

export function Topbar({ onOpenMenu }: TopbarProps) {
  return (
    <header className="topbar">
      <button className="mobile-menu" aria-label="打开菜单" onClick={onOpenMenu}>
        <Menu size={19} />
      </button>
      <div>
        <p className="overline">MYSELF / CONTENT STUDIO</p>
        <h1>早上好，Tong Xuan。</h1>
      </div>
      <div className="top-actions">
        <span className="sync-status">
          <span />
          已同步
        </span>
        <button className="settings-button" aria-label="设置">
          <Settings size={18} />
        </button>
        <button className="avatar">TX</button>
      </div>
    </header>
  );
}
