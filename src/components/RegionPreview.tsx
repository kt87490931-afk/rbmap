import Link from "next/link";

interface RegionPreviewData {
  regions?: { href?: string; region?: string; count?: string; venues?: { vname?: string; type?: string; star?: string }[] }[];
}

const DEFAULT_REGIONS: NonNullable<RegionPreviewData["regions"]> = [
  { href: "/gangnam", region: "강남", count: "82개 업소 등록", venues: [{ vname: "달토 가라오케", type: "가라오케", star: "★4.9" }, { vname: "퍼펙트 가라오케", type: "가라오케", star: "★4.8" }] },
  { href: "/suwon", region: "수원 인계동", count: "61개 업소 등록", venues: [{ vname: "아우라 가라오케", type: "하이퍼블릭", star: "★4.9" }] },
  { href: "/dongtan", region: "동탄", count: "34개 업소 등록", venues: [{ vname: "비너스 셔츠룸", type: "셔츠룸", star: "★4.8" }] },
  { href: "/jeju", region: "제주", count: "28개 업소 등록", venues: [{ vname: "제니스 클럽", type: "가라오케", star: "★4.8" }] },
];

export default function RegionPreview({ data }: { data?: RegionPreviewData | null }) {
  const regions = data?.regions?.length ? data.regions : DEFAULT_REGIONS;
  return (
    <section className="section-sm">
      <div className="sec-header">
        <div>
          <p className="sec-label">VENUE PREVIEW</p>
          <h2 className="sec-title">지역별 <span>주요 업소</span></h2>
        </div>
      </div>
      <div className="rp-grid">
        {regions.map((r, ri) => (
          <Link key={r.href ?? ri} href={r.href ?? "#"} className="rp-card">
            <div className="rp-head">
              <span className="rp-region">{r.region}</span>
              <span className="rp-count">{r.count}</span>
            </div>
            {(r.venues ?? []).map((row, i) => (
              <div key={i} className="rp-row">
                <span className="rp-num">{i + 1}</span>
                <span className="rp-vname">{row.vname}</span>
                <span className="rp-type">{row.type}</span>
                <span className="rp-star">{row.star}</span>
              </div>
            ))}
          </Link>
        ))}
      </div>
    </section>
  );
}
