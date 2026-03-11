import Link from "next/link";
import type { Partner } from "@/lib/data/partners";

const FALLBACK_PARTNERS: Partner[] = [
  { id: "1", href: "/suwon/venue/aura", icon: "🎤", region: "수원 인계동", type: "하이퍼블릭", type_class: "p-suwon", type_style: { background: "rgba(58,123,213,.2)", border: "1px solid rgba(58,123,213,.3)", color: "#3a7bd5" }, name: "아우라 가라오케", stars: "★★★★★", contact: "📞 031-000-0000", tags: ["예약 가능", "주차 가능"], location: "경기도 수원시 팔달구 인계동 000-00, 아우라빌딩 3F", desc: "수원 인계동 유흥 1번지에서 10년 이상 운영해온 아우라 가라오케입니다.", char_count: "소개글 약 220자", sort_order: 0 },
  { id: "2", href: "/gangnam/venue/dalto", icon: "🎤", region: "강남", type: "가라오케", type_class: "p-gangnam", type_style: { background: "rgba(230,57,70,.2)", border: "1px solid rgba(230,57,70,.3)", color: "#e63946" }, name: "달토 가라오케", stars: "★★★★★", contact: "📞 02-000-0000", tags: ["예약 권장", "발렛 가능"], location: "서울특별시 강남구 역삼동 000-00", desc: "강남 최상급 가라오케로 손꼽히는 달토입니다.", char_count: "소개글 약 230자", sort_order: 1 },
  { id: "3", href: "/dongtan/venue/venus", icon: "👔", region: "동탄", type: "셔츠룸", type_class: "p-dongtan", type_style: { background: "rgba(46,204,113,.2)", border: "1px solid rgba(46,204,113,.3)", color: "#2ecc71" }, name: "비너스 셔츠룸", stars: "★★★★★", contact: "📞 031-000-0001", tags: ["발렛 서비스", "넓은 주차장"], location: "경기도 화성시 동탄면 동탄대로 000", desc: "동탄 신도시 대표 셔츠룸 비너스입니다.", char_count: "소개글 약 230자", sort_order: 2 },
  { id: "4", href: "/jeju/venue/zenith", icon: "🏝", region: "제주", type: "가라오케", type_class: "p-jeju", type_style: { background: "rgba(155,89,182,.2)", border: "1px solid rgba(155,89,182,.3)", color: "#9b59b6" }, name: "제니스 클럽", stars: "★★★★★", contact: "📞 064-000-0000", tags: ["관광객 환영", "픽업 서비스"], location: "제주특별자치도 제주시 연동 000-0", desc: "제주 최고급 가라오케 제니스 클럽입니다.", char_count: "소개글 약 230자", sort_order: 3 },
];

interface PartnerSectionProps {
  partners?: Partner[];
}

export default function PartnerSection({ partners }: PartnerSectionProps) {
  const list = (partners?.length ? partners : FALLBACK_PARTNERS);

  return (
    <section className="partner-section section" aria-label="제휴 업체">
      <div className="page-wrap">
        <div className="sec-header">
          <div>
            <div className="partner-ad-badge">✦ AD PARTNER</div>
            <p className="sec-label" style={{ marginTop: 6 }}>FEATURED VENUES</p>
            <h2 className="sec-title">룸빵여지도 <span>제휴 업체</span></h2>
          </div>
          <Link href="/partners" className="see-all">전체 제휴 업체 →</Link>
        </div>

        <div className="partner-grid">
          {list.map((p) => (
            <Link key={p.id} href={p.href} className="pv-card">
              <div className="pv-photo">
                <div className="pv-photo-placeholder">{p.icon}</div>
                <div className="pv-photo-overlay" />
                <div className="pv-photo-badges">
                  <span className="pv-ad-label">AD</span>
                  <span className="pv-region-label">{p.region}</span>
                  <span className="pv-type-label" style={p.type_style}>{p.type}</span>
                </div>
                <div className="pv-photo-bottom">
                  <span className="pv-name-big">{p.name}</span>
                  <span className="pv-stars-photo">{p.stars}</span>
                </div>
              </div>
              <div className="pv-body">
                <div className="pv-meta-row">
                  <span className="pv-contact">{p.contact}</span>
                  {p.tags.map((tag) => (
                    <span key={tag} className="pv-tag">{tag}</span>
                  ))}
                </div>
                <div className="pv-location">
                  <span className="pv-location-icon">📍</span>
                  {p.location}
                </div>
                <div style={{ height: 10 }} />
                <p className="pv-desc">{p.desc}</p>
                <div className="pv-map-wrap">
                  <div className="pv-map-placeholder">
                    <span>🗺</span>
                    구글맵 연동 예정<br />
                    <span style={{ fontSize: 10, marginTop: 2 }}>Google Maps embed URL을 입력하세요</span>
                  </div>
                </div>
                <div className="pv-footer">
                  <div className="pv-footer-left">
                    <span className="pv-char-count">{p.char_count}</span>
                  </div>
                  <span className="pv-cta">업소 상세 페이지 →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
