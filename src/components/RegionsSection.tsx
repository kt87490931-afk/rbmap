import Link from "next/link";

const REGIONS = [
  {
    slug: "gangnam",
    name: "강남",
    short: "GN",
    thumbClass: "gangnam",
    tags: ["가라오케", "하이퍼블릭", "쩜오"],
    venues: 82,
    reviews: 641,
    badge: "HOT" as const,
  },
  {
    slug: "suwon",
    name: "수원",
    short: "SW",
    thumbClass: "suwon",
    tags: ["인계동", "셔츠룸", "퍼블릭"],
    venues: 61,
    reviews: 512,
    badge: null,
  },
  {
    slug: "dongtan",
    name: "동탄",
    short: "DT",
    thumbClass: "dongtan",
    tags: ["가라오케", "퍼블릭"],
    venues: 34,
    reviews: 218,
    badge: "NEW" as const,
  },
  {
    slug: "jeju",
    name: "제주",
    short: "JJ",
    thumbClass: "jeju",
    tags: ["가라오케", "바"],
    venues: 28,
    reviews: 173,
    badge: null,
  },
  {
    slug: "incheon",
    name: "인천",
    short: "IC",
    thumbClass: "incheon",
    tags: ["준비중"],
    venues: 0,
    reviews: 0,
    badge: null,
    coming: true,
  },
  {
    slug: "busan",
    name: "부산",
    short: "BS",
    thumbClass: "busan",
    tags: ["준비중"],
    venues: 0,
    reviews: 0,
    badge: null,
    coming: true,
  },
];

export default function RegionsSection() {
  return (
    <section className="section" id="regions">
      <div className="sec-header">
        <div>
          <p className="sec-label">REGIONS</p>
          <h2 className="sec-title">
            지역을 <span>선택</span>하세요
          </h2>
        </div>
        <Link href="/regions" className="see-all">
          전체 지역 →
        </Link>
      </div>
      <div className="region-grid">
        {REGIONS.map((r) => (
          <Link
            key={r.slug}
            href={`/${r.slug}`}
            className={`region-card ${r.coming ? "coming" : ""}`}
          >
            <div className={`rc-thumb ${r.thumbClass}`}>
              <div className="rc-bg-text">{r.short}</div>
              <div className="rc-glow" />
              {r.badge === "HOT" && <span className="rc-badge-hot">HOT</span>}
              {r.badge === "NEW" && <span className="rc-badge-new">NEW</span>}
              <span className="rc-name">{r.name}</span>
            </div>
            <div className="rc-body">
              <div className="rc-tags">
                {r.tags.map((tag) => (
                  <span key={tag} className="rc-tag">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="rc-meta">
                <span>
                  <strong>{r.venues || "—"}</strong> 업소
                </span>
                {!r.coming && (
                  <span>
                    <strong>{r.reviews}</strong> 리뷰
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
