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

export default function ReviewMagazineSection({ reviews, displayLimit = 5 }: ReviewMagazineSectionProps) {
  const raw = reviews?.length ? reviews : FALLBACK_REVIEWS;
  const list = raw.slice(0, displayLimit);
  const [feature, ...rest] = list;

  return (
    <section className="section" aria-label="최신 리뷰">
      <div className="section-inner">
        <div className="section-head-row">
          <div>
            <span className="section-label">LATEST REVIEWS</span>
            <h2 className="section-h2">6시간마다 업데이트 <em>최신 리뷰</em></h2>
          </div>
          <Link href="/reviews" className="see-all">전체 보기 →</Link>
        </div>
        <div className="review-magazine">
          {feature && (
            <Link href={feature.href} className="review-feature">
              <span className="rf-region">{feature.region}</span>
              <span className="rf-date">{feature.date}</span>
              <h3 className="rf-title">{feature.title}</h3>
              <p className="rf-excerpt">{feature.excerpt}</p>
              <div className="rf-footer">
                <span className="rf-stars">{feature.stars}</span>
                <span className="rf-venue">{feature.venue}</span>
              </div>
            </Link>
          )}
          {rest.length > 0 && (
            <div className="review-stack">
              {rest.map((r) => (
                <Link key={r.id} href={r.href} className="review-mini">
                  <span className="rm-region">{r.region}</span>
                  <span className="rm-date">{r.date}</span>
                  <span className="rm-title">{r.title}</span>
                  <span className="rm-stars">{r.stars}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
