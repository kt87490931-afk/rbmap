import Link from "next/link";

const REGION_VENUES = [
  {
    href: "/gangnam",
    region: "강남",
    count: "82개 업소 등록",
    rows: [
      { vname: "달토 가라오케", type: "가라오케", star: "★4.9" },
      { vname: "퍼펙트 가라오케", type: "가라오케", star: "★4.8" },
      { vname: "인트로 하이퍼블릭", type: "하이퍼블릭", star: "★4.7" },
      { vname: "구구단 쩜오", type: "쩜오", star: "★4.7" },
    ],
  },
  {
    href: "/suwon",
    region: "수원 인계동",
    count: "61개 업소 등록",
    rows: [
      { vname: "아우라 가라오케", type: "하이퍼블릭", star: "★4.9" },
      { vname: "마징가 가라오케", type: "퍼블릭", star: "★4.6" },
      { vname: "메칸더 셔츠룸", type: "셔츠룸", star: "★4.5" },
      { vname: "인스타 퍼블릭", type: "퍼블릭", star: "★4.4" },
    ],
  },
  {
    href: "/dongtan",
    region: "동탄",
    count: "34개 업소 등록",
    rows: [
      { vname: "비너스 셔츠룸", type: "셔츠룸", star: "★4.8" },
      { vname: "오로라 가라오케", type: "가라오케", star: "★4.6" },
      { vname: "스타 퍼블릭", type: "퍼블릭", star: "★4.5" },
      { vname: "루나 하이퍼블릭", type: "하이퍼블릭", star: "★4.4" },
    ],
  },
  {
    href: "/jeju",
    region: "제주",
    count: "28개 업소 등록",
    rows: [
      { vname: "제니스 클럽", type: "가라오케", star: "★4.8" },
      { vname: "오션뷰 가라오케", type: "가라오케", star: "★4.6" },
      { vname: "한라 퍼블릭", type: "퍼블릭", star: "★4.5" },
      { vname: "블루오션 바", type: "바", star: "★4.3" },
    ],
  },
];

export default function RegionPreview() {
  return (
    <section className="section-sm">
      <div className="sec-header">
        <div>
          <p className="sec-label">VENUE PREVIEW</p>
          <h2 className="sec-title">지역별 <span>주요 업소</span></h2>
        </div>
      </div>
      <div className="rp-grid">
        {REGION_VENUES.map((r) => (
          <Link key={r.href} href={r.href} className="rp-card">
            <div className="rp-head">
              <span className="rp-region">{r.region}</span>
              <span className="rp-count">{r.count}</span>
            </div>
            {r.rows.map((row, i) => (
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
