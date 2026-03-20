import { Suspense } from "react";
import ReviewMagazineSection from "@/components/ReviewMagazineSection";
import ReviewMagazineSectionSkeleton from "@/components/skeletons/ReviewMagazineSectionSkeleton";
import SectionWithSettings from "@/components/SectionWithSettings";
import {
  getReviewPostsListByClickCount,
  buildReviewUrl,
  getRegionName,
  formatStars,
} from "@/lib/data/review-posts";
import { getRegions } from "@/lib/data/regions";
import { getSiteSection } from "@/lib/data/site";

type ReviewConfig = { display_limit?: number };
const REVIEW_DISPLAY_OPTIONS = [3, 6, 9, 12, 15, 30, 45, 60];

interface ReviewMagazineSectionAsyncProps {
  isAdmin: boolean;
}

async function ReviewMagazineContent({ isAdmin }: ReviewMagazineSectionAsyncProps) {
  const reviewConfig = await getSiteSection<ReviewConfig>("review_config");
  const [regions, reviewPostsByClick] = await Promise.all([
    getRegions(),
    getReviewPostsListByClickCount(60),
  ]);

  const regionDisplayNames = Object.fromEntries(regions.map((r) => [r.slug, r.name]));
  const reviewDisplayLimitRaw = reviewConfig?.display_limit ?? 6;
  const reviewDisplayLimit = REVIEW_DISPLAY_OPTIONS.includes(reviewDisplayLimitRaw) ? reviewDisplayLimitRaw : 6;

  const reviewMagazineItems = reviewPostsByClick.map((p, i) => {
    const dt = p.published_at || p.created_at;
    const dateStr = dt ? new Date(dt).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }).replace(/\. /g, ".").replace(/\.$/, "") : "";
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const isNew = dt ? new Date(dt) > weekAgo : false;
    return {
      id: p.id,
      href: buildReviewUrl(p.region, p.type, p.venue_slug, p.slug),
      region: getRegionName(p.region, regionDisplayNames),
      date: dateStr,
      title: p.title,
      excerpt: (p.sec_overview || p.sec_summary || "").slice(0, 500) + ((p.sec_overview || p.sec_summary || "").length > 500 ? "…" : ""),
      stars: formatStars(p.star),
      venue: p.venue,
      is_new: isNew,
      sort_order: i,
    };
  });

  return (
    <SectionWithSettings isAdmin={isAdmin} sectionKey="review_config" sectionLabel="6시간 마다 업데이트 인기 리뷰" adminLink="/admin/reviews">
      <ReviewMagazineSection reviews={reviewMagazineItems} displayLimit={reviewDisplayLimit} />
    </SectionWithSettings>
  );
}

export default function ReviewMagazineSectionAsync(props: ReviewMagazineSectionAsyncProps) {
  return (
    <Suspense
      fallback={
        <SectionWithSettings isAdmin={props.isAdmin} sectionKey="review_config">
          <ReviewMagazineSectionSkeleton />
        </SectionWithSettings>
      }
    >
      <ReviewMagazineContent {...props} />
    </Suspense>
  );
}
