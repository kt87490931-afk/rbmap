import Link from "next/link";

interface WidgetsAData {
  venue_ranks?: { href?: string; rank?: number; top?: boolean; name?: string; sub?: string; score?: string }[];
  categories?: { href?: string; icon?: string; label?: string; count?: string }[];
}

const CATEGORY_CONFIG: { slug: string; icon: string; label: string }[] = [
  { slug: "karaoke", icon: "🎤", label: "가라오케" },
  { slug: "highpublic", icon: "💎", label: "하이퍼블릭" },
  { slug: "shirtroom", icon: "👔", label: "셔츠룸" },
  { slug: "public", icon: "🥂", label: "퍼블릭" },
  { slug: "jjomoh", icon: "⭐", label: "쩜오" },
  { slug: "room-salon", icon: "🎭", label: "룸싸롱" },
  { slug: "bar", icon: "🍸", label: "바" },
];

export default function WidgetRowA({ data }: { data?: WidgetsAData | null }) {
  const venueRanks = data?.venue_ranks ?? [];
  const categories = data?.categories ?? [];
  return (
    <div className="w-row w3" style={{ marginTop: 44 }}>
      <div className="widget">
        <div className="wt"><span className="wt-icon wi-r">🏆</span>이번 주 인기 업소 TOP 7</div>
        <div className="venue-list">
          {venueRanks.length > 0 ? (
            venueRanks.map((v, i) => (
              <Link key={v.href ?? i} href={v.href ?? "#"} className="venue-item">
                <span className={`v-rank ${v.top ? "top" : ""}`}>{v.rank ?? i + 1}</span>
                <div className="v-info">
                  <div className="v-name">{v.name}</div>
                  <div className="v-sub">{v.sub}</div>
                </div>
                <div className="v-score"><strong>{v.score}</strong><span>/10</span></div>
              </Link>
            ))
          ) : (
            <p style={{ fontSize: 13, color: "var(--muted)", padding: 16 }}>등록된 업소가 없습니다.</p>
          )}
        </div>
      </div>

      <div className="widget">
        <div className="wt"><span className="wt-icon wi-b">📂</span>업종별 탐색</div>
        <div className="cat-grid">
          {(categories.length > 0 ? categories : CATEGORY_CONFIG.map((c) => ({ href: `/category/${c.slug}`, icon: c.icon, label: c.label, count: "0개" }))).map((c, i) => (
            <Link key={(c.href ?? "") + i} href={c.href ?? "#"} className="cat-item">
              <span className="cat-icon">{c.icon}</span>
              <div>
                <div className="cat-label">{c.label}</div>
                <div className="cat-count">{c.count}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
