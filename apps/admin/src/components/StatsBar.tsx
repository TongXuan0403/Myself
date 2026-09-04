import { Sparkles } from "lucide-react";

type StatsBarProps = {
  total: number;
  published: number;
  draft: number;
};

export function StatsBar({ total, published, draft }: StatsBarProps) {
  return (
    <section className="stats">
      <div>
        <span>全部文章</span>
        <strong>{total.toString().padStart(2, "0")}</strong>
        <small>+2 本月</small>
      </div>
      <div>
        <span>已发布</span>
        <strong>{published.toString().padStart(2, "0")}</strong>
        <small>保持更新</small>
      </div>
      <div>
        <span>草稿</span>
        <strong>{draft.toString().padStart(2, "0")}</strong>
        <small>等待完善</small>
      </div>
      <div className="stats-note">
        <Sparkles size={18} />
        <span>
          今天也写一点
          <br />
          <em>让想法留下来。</em>
        </span>
      </div>
    </section>
  );
}
