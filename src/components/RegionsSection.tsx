import Link from "next/link";
import type { Region } from "@/lib/data/regions";

const FALLBACK_REGIONS: Region[] = [
  { id: "1", slug: "gangnam", name: "강남", short: "GN", thumb_class: "gangnam", tags: ["가라오케", "하이퍼블릭", "쩜오"], venues: 82, reviews: 641, badge: "HOT", coming: false, sort_order: 0 },
  { id: "2", slug: "suwon", name: "수원", short: "SW", thumb_class: "suwon", tags: ["인계동", "셔츠룸", "퍼블릭"], venues: 61, reviews: 512, badge: null, coming: false, sort_order: 1 },
  { id: "3", slug: "dongtan", name: "동탄", short: "DT", thumb_class: "dongtan", tags: ["가라오케", "퍼블릭"], venues: 34, reviews: 218, badge: "NEW", coming: false, sort_order: 2 },
  { id: "4", slug: "jeju", name: "제주", short: "JJ", thumb_class: "jeju", tags: ["가라오케", "바"], venues: 28, reviews: 173, badge: null, coming: false, sort_order: 3 },
  { id: "5", slug: "incheon", name: "인천", short: "IC", thumb_class: "incheon", tags: ["준비중"], venues: 0, reviews: 0, badge: null, coming: true, sort_order: 4 },
  { id: "6", slug: "busan", name: "부산", short: "BS", thumb_class: "busan", tags: ["준비중"], venues: 0, reviews: 0, badge: null, coming: true, sort_order: 5 },
];

interface RegionsSectionProps {
  regions?: Region[];
}

export default function RegionsSection({ regions }: RegionsSectionProps) {
  const list = (regions?.length ? regions : FALLBACK_REGIONS);

  return (
    <section className="section" id="regions">
      <div className="section-inner">
        <div className="section-head-row">
          <div>
            <span className="section-label">REGIONS</span>
            <h2 className="section-h2">
              지역별 <em>정보</em>
            </h2>
          </div>
          <Link href="/regions" className="view-all">전체 지역 →</Link>
        </div>
        <nav className="regions-grid" aria-label="지역 선택">
          {list.map((r) => (
            <Link
              key={r.slug}
              href={`/${r.slug}`}
              className={`region-card rc-${r.thumb_class}`}
              style={r.coming ? { background: "var(--card)" } : undefined}
            >
              {!r.coming && <div className="rc-bg" />}
              <div className="rc-top">
                <span className="rc-code">{r.short}</span>
                {r.badge === "HOT" && <span className="rc-badge badge-hot">HOT</span>}
                {r.badge === "NEW" && <span className="rc-badge badge-new">NEW</span>}
                {r.coming && <span className="rc-badge badge-soon">준비중</span>}
              </div>
              <div className="rc-name">{r.name}</div>
              {!r.coming ? (
                <>
                  <div className="rc-tags">
                    {r.tags.slice(0, 3).join(" · ")}
                  </div>
                  <div className="rc-stat">
                    <strong>{r.venues || "—"}</strong> 업소{" "}
                    <strong style={{ marginLeft: 8 }}>{r.reviews}</strong> 리뷰
                  </div>
                </>
              ) : (
                <div className="rc-coming">서비스 준비 중</div>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
