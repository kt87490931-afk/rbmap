import Link from "next/link";
import { ContactTapToCall } from "@/components/venue/ContactTapToCall";

export interface VenueCard {
  href: string;
  region: string;
  name: string;
  star: string;
  type: string;
  /** 업소 연락처 — 업소명 밑, 업체유형 위에 표시 */
  contact?: string;
  price?: string;
  desc?: string;
}

interface FeaturedVenuesSectionProps {
  venues?: VenueCard[];
}

const DEFAULT_VENUES: VenueCard[] = [
  { href: "/gangnam/karaoke/dalto", region: "강남", name: "달토 가라오케", star: "★4.9", type: "가라오케", contact: undefined, price: "1인 약 25만원~", desc: "강남 최상급 라인업. 3월 신규 멤버 입점." },
  { href: "/suwon/highpublic/aura", region: "수원 인계동", name: "아우라 하이퍼블릭", star: "★4.9", type: "하이퍼블릭", contact: undefined, price: "1인 약 22만원~", desc: "수원 인계동 대표 프리미엄 하이퍼블릭." },
  { href: "/dongtan/shirtroom/venus", region: "동탄", name: "비너스 셔츠룸", star: "★4.8", type: "셔츠룸", contact: undefined, price: "1인 약 20만원~", desc: "동탄 신도시 대표 셔츠룸 업소." },
  { href: "/jeju/karaoke/zenith", region: "제주", name: "제니스 클럽", star: "★4.8", type: "가라오케", contact: undefined, price: "1인 약 28만원~", desc: "제주 관광객도 안심하는 검증 업소." },
];

export default function FeaturedVenuesSection({ venues }: FeaturedVenuesSectionProps) {
  const list = venues?.length ? venues : DEFAULT_VENUES;
  return (
    <section className="section bg-deep" aria-label="추천 업소">
      <div className="section-inner">
        <div className="section-head-row">
          <div>
            <span className="section-label">FEATURED VENUES</span>
            <h2 className="section-h2">지역별 <em>주요 업소</em></h2>
          </div>
          <Link href="/regions" className="see-all">전체 업소 보기 →</Link>
        </div>
        <div className="venue-grid venue-grid-featured">
          {list.map((v, i) => (
            <Link key={v.href ?? i} href={v.href} className="venue-card">
              <div className="vc-region-line">{v.region}</div>
              <div className="vc-top">
                <span className="vc-name">{v.name}</span>
                <span className="vc-star">{v.star}</span>
              </div>
              {v.contact && <ContactTapToCall contact={v.contact} className="vc-contact" />}
              <div className="vc-type">{v.type}</div>
              {v.price && <div className="vc-price">{v.price}</div>}
              {v.desc && <p className="vc-desc">{v.desc}</p>}
              <div className="vc-footer">업소 상세 보기 →</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
