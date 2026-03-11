import Link from "next/link";
import type { Review } from "@/lib/data/reviews";

const FALLBACK_REVIEWS: Review[] = [
  { id: "1", href: "/gangnam/review/dalto-20250311", region: "강남", date: "03.11", is_new: true, title: "강남 달토 가라오케 솔직 후기 — 3월 신규 라인업 완전 분석", excerpt: "강남 최상급 업소 달토의 3월 라인업을 직접 확인했습니다.", stars: "★★★★★", venue: "달토 가라오케", sort_order: 0 },
  { id: "2", href: "/suwon/review/aura-20250311", region: "수원", date: "03.11", is_new: true, title: "수원 아우라 하이퍼블릭 — 강남과 비교 불가? 실제 이용 후기", excerpt: "수원 인계동 아우라가라오케의 하이퍼블릭 라인.", stars: "★★★★☆", venue: "아우라 가라오케", sort_order: 1 },
  { id: "3", href: "/dongtan/review/guide-20250310", region: "동탄", date: "03.10", is_new: false, title: "동탄 가라오케 2025 완전 가이드 — 신도시 유흥의 모든 것", excerpt: "빠르게 성장 중인 동탄 유흥 씬.", stars: "★★★★☆", venue: "동탄 종합", sort_order: 2 },
  { id: "4", href: "/jeju/review/top5-20250310", region: "제주", date: "03.10", is_new: false, title: "제주 가라오케 현지인 추천 TOP5 — 관광객도 안심하는 곳", excerpt: "여행 중 방문하기 좋은 제주 검증 업소 5곳.", stars: "★★★★★", venue: "제주 종합", sort_order: 3 },
  { id: "5", href: "/gangnam/review/price-20250309", region: "강남", date: "03.09", is_new: false, title: "강남 가라오케 가격 완전 비교 2025 — 퍼블릭 vs 하이퍼블릭 vs 쩜오", excerpt: "강남 주요 10곳의 1인 실제 비용 직접 조사.", stars: "★★★★☆", venue: "강남 종합", sort_order: 4 },
  { id: "6", href: "/suwon/review/shirtroom-20250308", region: "수원", date: "03.08", is_new: false, title: "수원 셔츠룸 처음이라면 — 시스템·가격·이용 팁 완전 정리", excerpt: "셔츠룸 처음 방문자를 위한 완전 가이드.", stars: "★★★★★", venue: "수원 셔츠룸 종합", sort_order: 5 },
];

interface ReviewGridProps {
  reviews?: Review[];
}

export default function ReviewGrid({ reviews }: ReviewGridProps) {
  const list = (reviews?.length ? reviews : FALLBACK_REVIEWS);

  return (
    <section className="section">
      <div className="sec-header">
        <div>
          <p className="sec-label">LATEST REVIEWS</p>
          <h2 className="sec-title">6시간마다 업데이트 <span>최신 리뷰</span></h2>
        </div>
        <Link href="/reviews" className="see-all">전체 보기 →</Link>
      </div>
      <div className="review-grid">
        {list.map((r) => (
          <Link key={r.id} href={r.href} className="rv-card">
            <div className="rv-top">
              <span className="rv-region">{r.region}</span>
              <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                {r.is_new && <span className="rv-new">NEW</span>}
                <span className="rv-date">{r.date}</span>
              </div>
            </div>
            <h3 className="rv-title">{r.title}</h3>
            <p className="rv-excerpt">{r.excerpt}</p>
            <div className="rv-footer">
              <span className="rv-stars">{r.stars}</span>
              <span className="rv-venue">{r.venue}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
