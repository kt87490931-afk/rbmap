import Link from "next/link";

const FULL_REVIEWS = [
  { href: "/gangnam/review/dalto-20250311-0600", num: "01", regionClass: "p-gangnam", region: "강남", type: "가라오케", venue: "달토 가라오케", date: "2025.03.11 06:00", title: "강남 달토 가라오케 3월 라인업 완전 분석 — 솔직 후기", stars: "★★★★★", starsNum: "5.0 / 5.0", body: ["강남 최상급 가라오케로 손꼽히는 달토를 3월 첫 주에 직접 방문했습니다. 예약은 전화로 진행했으며 담당 실장의 응대가 매우 친절하고 빠른 편이었습니다. 입장 후 룸 상태는 최근 리모델링을 거친 듯 인테리어가 깔끔하고 조명도 적절해 분위기가 좋았습니다.", "3월 신규 라인업은 기존보다 확연히 개선된 느낌이었습니다. 파트너 선택 폭이 넓고 수준도 높았으며, 초이스 후 교체 요청에도 부담 없이 응해줬습니다. 주대는 1인 기준 55만 원대로 강남 평균 수준이며 추가 요금 없이 진행되었습니다. 전반적으로 강남 가라오케 중 가성비와 서비스 모두 상위권입니다."], charCount: "약 340자" },
  { href: "/suwon/review/aura-highpublic-20250311-0000", num: "02", regionClass: "p-suwon", region: "수원", type: "하이퍼블릭", venue: "아우라 가라오케", date: "2025.03.11 00:00", title: "수원 아우라 하이퍼블릭 심야 이용 후기 — 평일 라인업 점검", stars: "★★★★☆", starsNum: "4.0 / 5.0", body: ["평일 자정 무렵 아우라 하이퍼블릭을 방문했습니다. 주말 대비 출근 인원이 적을 것으로 예상했지만 30명 이상이 근무 중이어서 선택 폭은 충분했습니다. 룸 크기는 2인 기준에 딱 맞는 아늑한 사이즈였고, 음향 장비 상태도 양호했습니다.", "하이퍼블릭 특유의 스킨십 서비스는 파트너 개인 성향에 따라 차이가 있었으며 전반적으로 무난한 수준이었습니다. 1인 기준 45만 원대로 강남 하이퍼블릭 대비 합리적입니다. 수원권 최고 수준임은 분명하며 재방문 의향이 충분합니다."], charCount: "약 320자" },
  { href: "/gangnam/review/perfect-20250310-1800", num: "03", regionClass: "p-gangnam", region: "강남", type: "가라오케", venue: "퍼펙트 가라오케", date: "2025.03.10 18:00", title: "강남 퍼펙트 가라오케 — 시스템과 라인업 모두 상위권", stars: "★★★★★", starsNum: "4.8 / 5.0", body: ["강남 퍼펙트는 이름처럼 전반적인 완성도가 높습니다. 입장부터 퇴장까지 담당 실장이 밀착 관리해주는 시스템이 인상적이었습니다. 예약 없이 방문했음에도 10분 내로 룸에 안내받을 수 있었고, 대기 중 간단한 음료를 제공해주는 세심함도 있었습니다.", "파트너 라인업은 주말 기준 50명 이상이 출근해 있었으며 외모 수준이 고르게 높은 편입니다. 주대 구성은 양주 세트 기준 1인 52만 원으로 달토 대비 소폭 저렴합니다. 서비스 마인드와 청결 상태 모두 만족스럽습니다."], charCount: "약 330자" },
  { href: "/dongtan/review/venus-20250310-1200", num: "04", regionClass: "p-dongtan", region: "동탄", type: "셔츠룸", venue: "비너스 셔츠룸", date: "2025.03.10 12:00", title: "동탄 비너스 셔츠룸 — 신도시 최고 수준의 셔츠룸 경험", stars: "★★★★★", starsNum: "4.9 / 5.0", body: ["동탄 신도시에서 셔츠룸을 찾는다면 비너스를 가장 먼저 추천합니다. 넓고 깔끔한 룸 환경과 탄탄한 라인업이 동탄 내 경쟁 업소를 압도합니다. 셔츠 환복 이벤트는 초이스 직후 5~10분 내로 진행되며 파트너마다 다양한 컨셉을 준비해왔습니다.", "1인 기준 38만 원대로 수원이나 강남보다 경제적이며, 서비스 수준은 전혀 밀리지 않습니다. 주차 공간이 넓고 발렛 서비스도 운영 중입니다. 동탄 거주자나 근무자라면 반드시 한 번은 방문해볼 만합니다."], charCount: "약 310자" },
  { href: "/jeju/review/zenith-20250310-0600", num: "05", regionClass: "p-jeju", region: "제주", type: "가라오케", venue: "제니스 클럽", date: "2025.03.10 06:00", title: "제주 제니스 클럽 — 관광지 특성을 살린 프리미엄 가라오케", stars: "★★★★★", starsNum: "4.8 / 5.0", body: ["제주 여행 중 현지인의 추천으로 방문하게 된 제니스 클럽입니다. 제주 중심부에 위치해 렌터카 없이도 택시로 쉽게 이동 가능하며, 외관은 고급 호텔 바를 연상시키는 세련된 인테리어가 인상적이었습니다.", "파트너 라인업은 제주 로컬 특성상 서울보다 수가 많지 않지만 서비스 마인드와 친근함은 오히려 더 좋았습니다. 주대는 1인 기준 30만 원대로 육지 대비 저렴하며, 여행자 전용 픽업 서비스도 운영 중입니다. 제주 방문 시 꼭 들러볼 만한 장소입니다."], charCount: "약 340자" },
  { href: "/suwon/review/mazinga-20250309-1800", num: "06", regionClass: "p-suwon", region: "수원", type: "퍼블릭", venue: "마징가 가라오케", date: "2025.03.09 18:00", title: "수원 마징가 가라오케 — 인계동 중심 퍼블릭의 탄탄한 완성도", stars: "★★★★☆", starsNum: "4.3 / 5.0", body: ["인계동 구도심에 위치한 마징가는 오랜 영업 기간만큼 안정적인 운영이 강점입니다. 처음 방문하는 손님도 실장 안내가 상세해 어렵지 않게 이용할 수 있으며, 정찰제 요금으로 불필요한 분쟁이 없습니다.", "파트너 수는 아우라보다 적지만 단골 고객 비율이 높아 서비스 질이 안정적으로 유지됩니다. 1인 기준 33만 원으로 인계동 내 가장 합리적인 가격대입니다. 처음 수원 유흥을 접하는 분들에게 진입 장벽이 낮아 추천할 만합니다."], charCount: "약 300자" },
  { href: "/gangnam/review/intro-20250309-1200", num: "07", regionClass: "p-gangnam", region: "강남", type: "하이퍼블릭", venue: "인트로 하이퍼블릭", date: "2025.03.09 12:00", title: "강남 인트로 하이퍼블릭 — 강남 하이퍼블릭의 새 기준", stars: "★★★★☆", starsNum: "4.5 / 5.0", body: ["강남 하이퍼블릭 시장에서 최근 빠르게 성장 중인 인트로를 방문했습니다. 오픈한 지 1년이 채 되지 않았지만 이미 강남 내 고정 단골층이 형성될 만큼 서비스 완성도가 높습니다. 실장 응대와 룸 청결도 모두 높은 기준을 유지하고 있었습니다.", "파트너 선택 폭이 넓고 하이퍼블릭 특유의 밀착 서비스도 체계적으로 운영됩니다. 주대는 1인 78만 원대로 강남 하이퍼블릭 평균 수준이며 추가 요금 없이 안내받은 금액 그대로 결제했습니다. 강남 하이퍼블릭을 처음 이용한다면 인트로가 좋은 선택입니다."], charCount: "약 330자" },
  { href: "/dongtan/review/aurora-20250309-0600", num: "08", regionClass: "p-dongtan", region: "동탄", type: "가라오케", venue: "오로라 가라오케", date: "2025.03.09 06:00", title: "동탄 오로라 가라오케 — 가성비 최고, 신도시 가라오케의 정석", stars: "★★★★☆", starsNum: "4.2 / 5.0", body: ["동탄에서 부담 없이 이용할 수 있는 가라오케를 찾는다면 오로라를 추천합니다. 룸 인테리어가 깔끔하고 음향 시스템도 최신 장비를 갖추고 있어 노래 자체를 즐기기에도 좋은 환경입니다. 초이스 시스템은 표준적인 퍼블릭 방식으로 처음 방문자도 쉽게 적응할 수 있었습니다.", "파트너 수는 평일 20명, 주말 35명 내외로 동탄 규모에서는 충분한 편입니다. 1인 기준 28만 원으로 경기도 권역 내 최저가 수준입니다. 부담 없이 가볍게 즐기고 싶은 날 선택하기에 좋습니다."], charCount: "약 310자" },
  { href: "/suwon/review/shirtroom-guide-20250308-1800", num: "09", regionClass: "p-suwon", region: "수원", type: "셔츠룸", venue: "메칸더 셔츠룸", date: "2025.03.08 18:00", title: "수원 메칸더 셔츠룸 — 인계동 셔츠룸 입문자를 위한 추천", stars: "★★★★☆", starsNum: "4.4 / 5.0", body: ["셔츠룸이 처음인 분들에게 메칸더를 가장 먼저 추천하는 이유는 담당 실장의 친절한 시스템 안내 덕분입니다. 입장 전에 셔츠룸 절차와 규칙을 상세히 설명해줘 처음 방문자도 어색함 없이 서비스를 즐길 수 있었습니다.", "환복 이벤트는 파트너 개인 스타일에 맞게 다양하게 진행되었으며 전체적인 분위기도 가볍고 유쾌했습니다. 1인 기준 36만 원대로 수원 셔츠룸 중 합리적인 편이며, 추가 비용 없이 안내받은 금액 그대로 결제했습니다. 수원 셔츠룸 첫 방문이라면 메칸더를 추천합니다."], charCount: "약 330자" },
  { href: "/jeju/review/ocean-20250308-1200", num: "10", regionClass: "p-jeju", region: "제주", type: "가라오케", venue: "오션뷰 가라오케", date: "2025.03.08 12:00", title: "제주 오션뷰 가라오케 — 뷰 맛집이자 서비스도 상위권", stars: "★★★★☆", starsNum: "4.6 / 5.0", body: ["이름 그대로 제주 바다를 조망할 수 있는 위치에 자리한 오션뷰 가라오케입니다. 야간에는 창밖으로 제주 야경이 펼쳐져 분위기 자체가 여타 업소와 차별됩니다. 인테리어도 제주 감성에 맞게 밝고 개방적인 느낌으로 꾸며져 있습니다.", "파트너 라인업은 제주 업소 중 가장 많은 편이었으며 서비스 마인드도 좋았습니다. 1인 기준 32만 원으로 제주 내 중상위 가격대이지만 뷰와 분위기를 고려하면 납득 가능한 수준입니다. 제주 여행 중 특별한 저녁을 원한다면 오션뷰를 추천합니다."], charCount: "약 330자" },
];

export default function FullReviewSection() {
  return (
    <section className="full-review-section section" aria-label="최신 리뷰 전문">
      <div className="page-wrap">
        <div className="sec-header">
          <div>
            <p className="sec-label">FULL REVIEWS</p>
            <h2 className="sec-title">최신 리뷰 전문 <span>10선</span></h2>
          </div>
          <Link href="/reviews" className="see-all">전체 리뷰 →</Link>
        </div>
        <div className="fr-grid">
          {FULL_REVIEWS.map((r) => (
            <Link key={r.href} href={r.href} className="fr-card">
              <div className="fr-head">
                <div className="fr-head-left">
                  <span className="fr-num">{r.num}</span>
                  <span className={`fr-region-pill ${r.regionClass}`}>{r.region}</span>
                  <span className="fr-type">{r.type}</span>
                  <span className="fr-venue-tag">{r.venue}</span>
                </div>
                <span className="fr-date">{r.date}</span>
              </div>
              <div className="fr-title">{r.title}</div>
              <div className="fr-stars">
                <span className="fr-stars-val">{r.stars}</span>
                <span className="fr-stars-num">{r.starsNum}</span>
              </div>
              <div className="fr-body">
                {r.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <div className="fr-footer">
                <span className="fr-char-count">{r.charCount}</span>
                <span className="fr-read-more">전문 보기 →</span>
              </div>
            </Link>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 28 }}>
          <Link href="/reviews" className="btn-ghost">전체 리뷰 목록 보기 →</Link>
        </div>
      </div>
    </section>
  );
}
