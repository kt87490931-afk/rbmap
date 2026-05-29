import Link from "next/link";
import type { Review } from "@/lib/data/reviews";

const FALLBACK_REVIEWS: Review[] = [
  { id: "1", href: "/gangnam/review/dalto-20250311", region: "강남", date: "03.11", is_new: true, title: "강남 달토 가라오케 솔직 후기 — 3월 신규 라인업 완전 분석", excerpt: "강남 최상급 업소 달토의 3월 라인업을 직접 확인했습니다.", stars: "★★★★★", venue: "달토 가라오케", sort_order: 0 },
  { id: "2", href: "/suwon/review/aura-20250311", region: "수원", date: "03.11", is_new: true, title: "수원 아우라 하이퍼블릭 — 강남과 비교 불가? 실제 이용 후기", excerpt: "수원 인계동 아우라가라오케의 하이퍼블릭 라인.", stars: "★★★★☆", venue: "아우라 가라오케", sort_order: 1 },
  { id: "3", href: "/dongtan/review/guide-20250310", region: "동탄", date: "03.10", is_new: false, title: "동탄 가라오케 2025 완전 가이드 — 신도시 유흥의 모든 것", excerpt: "빠르게 성장 중인 동탄 유흥 씬.", stars: "★★★★☆", venue: "동탄 종합", sort_order: 2 },
  { id: "4", href: "/jeju/review/top5-20250310", region: "제주", date: "03.10", is_new: false, title: "제주 가라오케 현지인 추천 TOP5 — 관광객도 안심하는 곳", excerpt: "여행 중 방문하기 좋은 제주 검증 업소 5곳.", stars: "★★★★★", venue: "제주 종합", sort_order: 3 },
  { id: "5", href: "/gangnam/review/price-20250309", region: "강남", date: "03.09", is_new: false, title: "강남 가라오케 가격 완전 비교 2025", excerpt: "강남 주요 10곳의 1인 실제 비용 직접 조사.", stars: "★★★★☆", venue: "강남 종합", sort_order: 4 },
];

interface ReviewMagazineSectionProps {
  reviews?: Review[];
  displayLimit?: number;
}

export default function ReviewMagazineSection({ reviews, displayLimit = 6 }: ReviewMagazineSectionProps) {
  const raw = reviews?.length ? reviews : FALLBACK_REVIEWS;
  const list = raw.slice(0, displayLimit);

  return (
    <section className="w-full bg-gradient-to-b from-purple-50/30 via-white to-pink-50/20 py-10 md:py-14" id="popular" aria-label="인기 리뷰">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-50 to-purple-50 text-lg">
              💬
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 md:text-xl">6시간마다 업데이트 인기 리뷰</h2>
              <p className="mt-0.5 text-xs text-gray-500 md:text-sm">가장 많은 관심을 받은 인기 리뷰</p>
            </div>
          </div>
          <Link href="/reviews" className="text-sm font-semibold text-insta-pink hover:text-insta-purple">
            전체 보기 →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-5">
          {list.map((r) => (
            <Link
              key={r.id}
              href={r.href}
              className="group rounded-xl border border-gray-100 bg-white p-4 transition-all duration-300 hover:border-purple-100 hover:shadow-md hover:shadow-purple-50/50 md:p-5"
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-purple-100 text-sm">
                  👤
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-gray-900">{r.venue}</div>
                  <div className="text-xs text-gray-400">{r.date}</div>
                </div>
                <span className="text-xs font-medium text-amber-500">{r.stars}</span>
              </div>
              <div className="mb-2 flex flex-wrap items-center gap-1">
                <span className="inline-flex items-center rounded-full bg-pink-50 px-2 py-0.5 text-xs font-medium text-pink-600">
                  {r.region}
                </span>
                {r.is_new && (
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-600">NEW</span>
                )}
              </div>
              <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-insta-pink">{r.title}</h3>
              {r.excerpt && (
                <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-gray-500">{r.excerpt}</p>
              )}
              <div className="border-t border-gray-50 pt-3 text-xs font-semibold text-insta-pink">리뷰 상세 보기 →</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
