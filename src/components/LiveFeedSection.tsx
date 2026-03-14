import Link from "next/link";
import type { FeedItem } from "@/lib/data/feed";

const FALLBACK_ITEMS: FeedItem[] = [
  { id: "1", href: "/gangnam/review/dalto-gangnam-20250311-0600", pill: "강남", pill_class: "p-gangnam", title: "강남 달토 가라오케 — 3월 신규 라인업 완전 분석 (2025.03.11)", sub: "가라오케 · 달토 · 새 리뷰 등록", stars: "★★★★★", time: "06:00", sort_order: 0 },
  { id: "2", href: "/suwon/review/aura-highpublic-20250311-0000", pill: "수원", pill_class: "p-suwon", title: "수원 아우라 하이퍼블릭 심야 이용 후기 — 평일 라인업은?", sub: "하이퍼블릭 · 아우라 · 새 리뷰 등록", stars: "★★★★☆", time: "00:00", sort_order: 1 },
  { id: "3", href: "/dongtan/review/dongtan-guide-20250310-1800", pill: "동탄", pill_class: "p-dongtan", title: "동탄 가라오케 2025 완전 가이드 — 신도시 유흥 완전 정복", sub: "가라오케 · 동탄 종합 · 새 리뷰 등록", stars: "★★★★☆", time: "18:00", sort_order: 2 },
  { id: "4", href: "/jeju/review/jeju-top5-20250310-1200", pill: "제주", pill_class: "p-jeju", title: "제주 가라오케 현지인 추천 TOP5 — 관광객도 안심하는 곳", sub: "가라오케 · 제주 종합 · 새 리뷰 등록", stars: "★★★★★", time: "12:00", sort_order: 3 },
  { id: "5", href: "/gangnam/review/price-2025-20250310-0600", pill: "강남", pill_class: "p-gangnam", title: "강남 가라오케 가격 완전 비교 2025 — 퍼블릭 vs 하이퍼블릭 vs 쩜오", sub: "가격정보 · 강남 종합 · 새 리뷰 등록", stars: "★★★★☆", time: "06:00", sort_order: 4 },
];

interface LiveFeedSectionProps {
  items?: FeedItem[];
}

export default function LiveFeedSection({ items }: LiveFeedSectionProps) {
  const list = (items?.length ? items : FALLBACK_ITEMS);

  const regionToTag = (pill: string) => {
    if (pill.includes("강남")) return "tag-gangnam";
    if (pill.includes("수원")) return "tag-suwon";
    if (pill.includes("동탄")) return "tag-dongtan";
    if (pill.includes("제주")) return "tag-jeju";
    return "tag-gangnam";
  };

  return (
    <section className="section">
      <div className="section-inner">
        <div className="section-head-row">
          <div>
            <div className="live-header">
              <span className="live-badge">
                <span className="live-dot" />LIVE
              </span>
              <h2 className="section-h2" style={{ marginBottom: 0 }}>실시간 최신 업데이트</h2>
            </div>
          </div>
          <Link href="/reviews" className="view-all">전체 피드 보기 →</Link>
        </div>
        <div className="feed-list" role="feed" aria-label="최신 리뷰 피드">
          {list.map((item) => (
            <Link key={item.id} href={item.href} className="feed-item">
              <span className={`feed-region ${regionToTag(item.pill)}`}>{item.pill}</span>
              <span className="feed-title">{item.title}</span>
              <span className="feed-meta">
                <span className="feed-stars">{item.stars}</span>
                <span className="feed-time">{item.time}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
