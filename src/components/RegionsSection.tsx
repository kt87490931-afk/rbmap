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
        {list.map((r) => (
          <Link
            key={r.slug}
            href={`/${r.slug}`}
            className={`region-card ${r.coming ? "coming" : ""}`}
          >
            <div className={`rc-thumb ${r.thumb_class}`}>
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
