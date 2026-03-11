interface StatsData {
  items?: { num?: string; label?: string }[];
}

const DEFAULT: StatsData = {
  items: [
    { num: "14", label: "서비스 지역" },
    { num: "380+", label: "등록 업소" },
    { num: "3,200+", label: "누적 리뷰" },
    { num: "6H", label: "자동 업데이트" },
  ],
};

export default function StatsBar({ data }: { data?: StatsData | null }) {
  const items = data?.items ?? DEFAULT.items ?? [];
  return (
    <section className="section-sm">
      <p className="sec-label" style={{ marginBottom: 12 }}>STATS</p>
      <div className="stats-bar">
        {items.map((s, i) => (
          <div key={s.label ?? i} className="sb-item">
            <div className="sb-num">{s.num}</div>
            <div className="sb-label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
