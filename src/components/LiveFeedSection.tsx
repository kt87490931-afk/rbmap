import Link from "next/link";

const FEED_ITEMS = [
  { href: "/gangnam/review/dalto-gangnam-20250311-0600", pill: "강남", pillClass: "p-gangnam", title: "강남 달토 가라오케 — 3월 신규 라인업 완전 분석 (2025.03.11)", sub: "가라오케 · 달토 · 새 리뷰 등록", stars: "★★★★★", time: "06:00" },
  { href: "/suwon/review/aura-highpublic-20250311-0000", pill: "수원", pillClass: "p-suwon", title: "수원 아우라 하이퍼블릭 심야 이용 후기 — 평일 라인업은?", sub: "하이퍼블릭 · 아우라 · 새 리뷰 등록", stars: "★★★★☆", time: "00:00" },
  { href: "/dongtan/review/dongtan-guide-20250310-1800", pill: "동탄", pillClass: "p-dongtan", title: "동탄 가라오케 2025 완전 가이드 — 신도시 유흥 완전 정복", sub: "가라오케 · 동탄 종합 · 새 리뷰 등록", stars: "★★★★☆", time: "18:00" },
  { href: "/jeju/review/jeju-top5-20250310-1200", pill: "제주", pillClass: "p-jeju", title: "제주 가라오케 현지인 추천 TOP5 — 관광객도 안심하는 곳", sub: "가라오케 · 제주 종합 · 새 리뷰 등록", stars: "★★★★★", time: "12:00" },
  { href: "/gangnam/review/price-2025-20250310-0600", pill: "강남", pillClass: "p-gangnam", title: "강남 가라오케 가격 완전 비교 2025 — 퍼블릭 vs 하이퍼블릭 vs 쩜오", sub: "가격정보 · 강남 종합 · 새 리뷰 등록", stars: "★★★★☆", time: "06:00" },
];

export default function LiveFeedSection() {
  return (
    <section className="live-section section-sm">
      <div className="page-wrap">
        <div className="live-header">
          <div className="live-badge">
            <div className="live-dot" />LIVE
          </div>
          <h2 className="sec-title" style={{ marginBottom: 0, fontSize: 17 }}>실시간 <span>최신 업데이트</span></h2>
        </div>
        <div className="feed-list">
          {FEED_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="feed-item">
              <span className={`feed-pill ${item.pillClass}`}>{item.pill}</span>
              <div className="feed-content">
                <div className="feed-title">{item.title}</div>
                <div className="feed-sub">{item.sub}</div>
              </div>
              <div className="feed-stars">{item.stars}</div>
              <div className="feed-time">{item.time}</div>
            </Link>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link href="/reviews" className="btn-ghost btn-sm">전체 피드 보기 →</Link>
        </div>
      </div>
    </section>
  );
}
