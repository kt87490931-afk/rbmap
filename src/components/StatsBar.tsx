const STATS = [
  { num: "14", label: "서비스 지역" },
  { num: "380+", label: "등록 업소" },
  { num: "3,200+", label: "누적 리뷰" },
  { num: "6H", label: "자동 업데이트" },
];

export default function StatsBar() {
  return (
    <section className="section-sm">
      <p className="sec-label" style={{ marginBottom: 12 }}>STATS</p>
      <div className="stats-bar">
        {STATS.map((s) => (
          <div key={s.label} className="sb-item">
            <div className="sb-num">{s.num}</div>
            <div className="sb-label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
