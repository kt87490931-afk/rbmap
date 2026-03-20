import { Suspense } from "react";
import LiveFeedSection from "@/components/LiveFeedSection";
import LiveFeedSectionSkeleton from "@/components/skeletons/LiveFeedSectionSkeleton";
import SectionWithSettings from "@/components/SectionWithSettings";
import {
  getReviewPostsList,
  buildReviewUrl,
  getRegionName,
  getTypeName,
  formatStars,
} from "@/lib/data/review-posts";
import { getRegions } from "@/lib/data/regions";
import { getSiteSection } from "@/lib/data/site";
import type { FeedItem } from "@/lib/data/feed";

type FeedConfig = { display_limit?: number };

interface LiveFeedSectionAsyncProps {
  isAdmin: boolean;
}

async function LiveFeedContent({ isAdmin }: LiveFeedSectionAsyncProps) {
  const feedConfig = await getSiteSection<FeedConfig>("feed_config");
  const feedLimit = feedConfig?.display_limit ?? 10;
  const [regions, reviewPosts] = await Promise.all([
    getRegions(),
    getReviewPostsList({ limit: feedLimit }),
  ]);

  const regionDisplayNames = Object.fromEntries(regions.map((r) => [r.slug, r.name]));

  const feedItems: FeedItem[] = reviewPosts.map((p) => {
    const dt = p.published_at || p.created_at;
    const timeStr = dt
      ? new Date(dt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
      : "";
    const regionName = getRegionName(p.region, regionDisplayNames);
    const typeName = getTypeName(p.type);
    return {
      id: p.id,
      href: buildReviewUrl(p.region, p.type, p.venue_slug, p.slug),
      pill: regionName,
      pill_class: `p-${p.region}`,
      title: p.title,
      sub: `${p.venue} · ${typeName} · 새 리뷰 등록`,
      stars: formatStars(p.star),
      time: timeStr,
      sort_order: 0,
    };
  });

  return (
    <SectionWithSettings isAdmin={isAdmin} sectionKey="feed_config" sectionLabel="실시간 최신 업데이트" adminLink="/admin/live-feed">
      <LiveFeedSection items={feedItems} />
    </SectionWithSettings>
  );
}

export default function LiveFeedSectionAsync(props: LiveFeedSectionAsyncProps) {
  return (
    <Suspense fallback={<SectionWithSettings isAdmin={props.isAdmin} sectionKey="feed_config"><LiveFeedSectionSkeleton /></SectionWithSettings>}>
      <LiveFeedContent {...props} />
    </Suspense>
  );
}
