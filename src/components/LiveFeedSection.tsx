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
  const list = items?.length ? items : FALLBACK_ITEMS;

  return (
    <section className="w-full bg-gradient-to-b from-pink-50/50 via-white to-purple-50/30 py-10 md:py-14" id="updates">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-50 to-purple-50 text-lg">
              ⏱️
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-pink-600">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pink-500" />
                  Live
                </span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 md:text-xl">실시간 최신 업데이트</h2>
              <p className="mt-0.5 text-xs text-gray-500 md:text-sm">20분마다 자동 업데이트되는 최신 리뷰</p>
            </div>
          </div>
          <Link href="/reviews" className="text-sm font-semibold text-insta-pink hover:text-insta-purple">
            전체 피드 보기 →
          </Link>
        </div>

        <div className="space-y-3" role="feed" aria-label="최신 리뷰 피드">
          {list.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group block rounded-xl border border-gray-100 bg-white p-4 transition-all duration-300 hover:border-pink-100 hover:shadow-md hover:shadow-pink-50/50 md:p-5"
            >
              <div className="flex items-start gap-3 md:gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-purple-100 text-base md:h-12 md:w-12">
                  📝
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-pink-50 px-2 py-0.5 text-xs font-medium text-pink-600">
                      {item.pill}
                    </span>
                    <span className="text-xs text-gray-400">{item.time}</span>
                    <span className="text-xs text-amber-500">{item.stars}</span>
                  </div>
                  <h3 className="mb-1 truncate text-sm font-semibold text-gray-900 md:text-base group-hover:text-insta-pink">
                    {item.title}
                  </h3>
                  {item.sub && <p className="line-clamp-1 text-sm text-gray-500">{item.sub}</p>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
