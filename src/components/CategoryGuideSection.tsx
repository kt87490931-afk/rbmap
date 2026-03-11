"use client";

import Link from "next/link";

interface CategoryGuideData {
  type_cards?: { icon?: string; title?: string; desc?: string; href?: string }[];
  kw_links?: { href?: string; text?: string }[];
}

const DEFAULT_TYPE_CARDS = [
  { icon: "🎤", title: "가라오케", desc: "노래방 형태의 룸에서 파트너와 함께 즐기는 가장 보편적인 업종입니다.", href: "/category/karaoke" },
  { icon: "💎", title: "하이퍼블릭", desc: "퍼블릭보다 밀착 서비스가 강화된 프리미엄 형태입니다.", href: "/category/highpublic" },
  { icon: "👔", title: "셔츠룸", desc: "파트너의 환복 이벤트가 포함된 서비스입니다.", href: "/category/shirtroom" },
  { icon: "⭐", title: "쩜오 (0.5)", desc: "하이퍼블릭과 퍼블릭의 중간 단계 서비스입니다.", href: "/category/jjomoh" },
];

const DEFAULT_KW_LINKS = [
  { href: "/gangnam/category/karaoke", text: "강남 가라오케" },
  { href: "/suwon/category/highpublic", text: "수원 하이퍼블릭" },
  { href: "/dongtan/category/shirtroom", text: "동탄 셔츠룸" },
  { href: "/jeju/category/karaoke", text: "제주 가라오케" },
];

export default function CategoryGuideSection({ data }: { data?: CategoryGuideData | null }) {
  const typeCards = data?.type_cards?.length ? data.type_cards : DEFAULT_TYPE_CARDS;
  const kwLinks = data?.kw_links?.length ? data.kw_links : DEFAULT_KW_LINKS;

  return (
    <section className="seo-section section" aria-label="업종별 완전 이해">
      <div className="page-wrap">
        <div>
          <p className="sec-label" style={{ marginBottom: 6 }}>CATEGORY GUIDE</p>
          <h2 className="sec-title" style={{ marginBottom: 16 }}>업종별 <span>완전 이해</span></h2>
          <div className="seo-type-grid">
            {typeCards.map((tc, i) => (
              <div key={tc.title ?? i} className="seo-type-card">
                <h4>{tc.icon} {tc.title}</h4>
                <p>{tc.desc}</p>
                <Link href={tc.href ?? "#"}>{tc.title} 업소 보기 →</Link>
              </div>
            ))}
          </div>
        </div>
        <div className="seo-kw-block">
          <h3>관련 검색어 및 지역별 정보</h3>
          <div className="seo-kw-links">
            {kwLinks.map((k, i) => (
              <Link key={i} href={k.href ?? "#"} className="seo-kw-link">{k.text}</Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
