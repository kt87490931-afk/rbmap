import Link from "next/link";

const PARTNERS = [
  {
    href: "/suwon/venue/aura",
    icon: "🎤",
    region: "수원 인계동",
    type: "하이퍼블릭",
    typeClass: "p-suwon",
    typeStyle: { background: "rgba(58,123,213,.2)", border: "1px solid rgba(58,123,213,.3)", color: "#3a7bd5" },
    name: "아우라 가라오케",
    stars: "★★★★★",
    contact: "📞 031-000-0000",
    tags: ["예약 가능", "주차 가능"],
    location: "경기도 수원시 팔달구 인계동 000-00, 아우라빌딩 3F",
    desc: "수원 인계동 유흥 1번지에서 10년 이상 운영해온 아우라 가라오케입니다. 강남 하이퍼블릭 수준의 라인업과 서비스를 합리적인 가격에 제공합니다. 넓고 쾌적한 룸 환경, 최신 음향 시스템, 그리고 베테랑 실장진이 처음 방문하시는 분들도 편안하게 안내해드립니다. 1인 기준 45만 원대의 합리적인 주대 구성으로 수원 최고 수준의 하이퍼블릭 경험을 드립니다. 평일 상시 운영, 주말 예약 필수.",
    charCount: "소개글 약 220자",
  },
  {
    href: "/gangnam/venue/dalto",
    icon: "🎤",
    region: "강남",
    type: "가라오케",
    typeClass: "p-gangnam",
    typeStyle: { background: "rgba(230,57,70,.2)", border: "1px solid rgba(230,57,70,.3)", color: "#e63946" },
    name: "달토 가라오케",
    stars: "★★★★★",
    contact: "📞 02-000-0000",
    tags: ["예약 권장", "발렛 가능"],
    location: "서울특별시 강남구 역삼동 000-00, 달토빌딩 B1",
    desc: "강남 최상급 가라오케로 손꼽히는 달토입니다. 매달 신규 라인업을 구성하여 항상 신선한 만남을 제공합니다. 강남 3대 가라오케 중 하나로 20년 이상의 업력과 안정된 운영 시스템이 자랑입니다. 50명 이상의 풍부한 라인업과 1:1 전담 실장 서비스로 최고의 경험을 보장합니다. 주대 1인 기준 55만 원대, 예약 고객 우선 배정. 강남 방문 시 반드시 경험해야 할 프리미엄 가라오케입니다.",
    charCount: "소개글 약 230자",
  },
  {
    href: "/dongtan/venue/venus",
    icon: "👔",
    region: "동탄",
    type: "셔츠룸",
    typeClass: "p-dongtan",
    typeStyle: { background: "rgba(46,204,113,.2)", border: "1px solid rgba(46,204,113,.3)", color: "#2ecc71" },
    name: "비너스 셔츠룸",
    stars: "★★★★★",
    contact: "📞 031-000-0001",
    tags: ["발렛 서비스", "넓은 주차장"],
    location: "경기도 화성시 동탄면 동탄대로 000, 2F",
    desc: "동탄 신도시 대표 셔츠룸 비너스입니다. 넓고 모던한 룸 인테리어와 탄탄한 라인업으로 동탄 내 최고 수준의 셔츠룸 경험을 제공합니다. 환복 이벤트를 포함한 체계적인 서비스 시스템을 갖추고 있으며, 처음 방문하시는 분도 쉽게 이용하실 수 있도록 친절한 안내를 드립니다. 1인 기준 38만 원대, 넓은 전용 주차장 및 발렛 서비스 운영. 동탄·화성·수원에서 30분 내 접근 가능한 최적 입지입니다.",
    charCount: "소개글 약 230자",
  },
  {
    href: "/jeju/venue/zenith",
    icon: "🏝",
    region: "제주",
    type: "가라오케",
    typeClass: "p-jeju",
    typeStyle: { background: "rgba(155,89,182,.2)", border: "1px solid rgba(155,89,182,.3)", color: "#9b59b6" },
    name: "제니스 클럽",
    stars: "★★★★★",
    contact: "📞 064-000-0000",
    tags: ["관광객 환영", "픽업 서비스"],
    location: "제주특별자치도 제주시 연동 000-0, 제니스빌딩 4F",
    desc: "제주 최고급 가라오케 제니스 클럽입니다. 제주 중심부 연동에 위치해 렌터카 없이도 쉽게 이용 가능하며, 관광객을 위한 픽업 서비스도 운영합니다. 세련된 인테리어와 제주 특색을 살린 분위기 속에서 수준 높은 라인업과 친절한 서비스를 경험하세요. 1인 기준 30만 원대의 합리적인 가격으로 제주 방문 시 특별한 저녁을 만들어 드립니다. 제주 공항에서 15분 거리, 24시간 운영.",
    charCount: "소개글 약 230자",
  },
];

export default function PartnerSection() {
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
          {PARTNERS.map((p) => (
            <Link key={p.href} href={p.href} className="pv-card">
              <div className="pv-photo">
                <div className="pv-photo-placeholder">{p.icon}</div>
                <div className="pv-photo-overlay" />
                <div className="pv-photo-badges">
                  <span className="pv-ad-label">AD</span>
                  <span className="pv-region-label">{p.region}</span>
                  <span className="pv-type-label" style={p.typeStyle}>{p.type}</span>
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
                    <span className="pv-char-count">{p.charCount}</span>
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
