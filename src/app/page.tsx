import { unstable_noStore } from "next/cache";
import { getServerSession } from "next-auth";
import Header from "@/components/Header";
import Ticker from "@/components/Ticker";
import Hero from "@/components/Hero";
import AboutSection from "@/components/AboutSection";
import RegionGuideSection from "@/components/RegionGuideSection";
import CategoryGuideSection from "@/components/CategoryGuideSection";
import PartnerSection from "@/components/PartnerSection";
import SectionWithSettings from "@/components/SectionWithSettings";
import LiveFeedSection from "@/components/LiveFeedSection";
import WidgetRowA from "@/components/WidgetRowA";
import RegionPreview from "@/components/RegionPreview";
import ReviewGrid from "@/components/ReviewGrid";
import WidgetRowB from "@/components/WidgetRowB";
import StatsBar from "@/components/StatsBar";
import CTAStrip from "@/components/CTAStrip";
import FullReviewSection from "@/components/FullReviewSection";
import Footer from "@/components/Footer";
import { getPartners } from "@/lib/data/partners";
import type { FeedItem } from "@/lib/data/feed";
import { getReviews } from "@/lib/data/reviews";
import {
  getReviewPostsList,
  buildReviewUrl,
  getRegionName,
  getTypeName,
  formatStars,
} from "@/lib/data/review-posts";
import { getSiteSection } from "@/lib/data/site";
import { authOptions } from "@/lib/auth";
import { hasDevAdminCookie } from "@/lib/admin-auth";
import { verifyOtpSession } from "@/lib/otp";

type PartnersConfig = { display_limit?: number };
type FeedConfig = { display_limit?: number };
type ReviewConfig = { grid_limit?: number; full_limit?: number };

export default async function Home() {
  unstable_noStore();
  let isAdmin = await hasDevAdminCookie();
  if (!isAdmin) {
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.role === "admin" && session?.user?.id) {
        isAdmin = await verifyOtpSession(session.user.id);
      }
    } catch {
      // NEXTAUTH_SECRET 미설정 등
    }
  }

  const [partnersConfig, feedConfig, reviewConfig, hero, ticker, header, about, regionGuide, categoryGuide, widgetsA, widgetsB, stats, cta, footer, regionPreview] = await Promise.all([
    getSiteSection<PartnersConfig>("partners_config"),
    getSiteSection<FeedConfig>("feed_config"),
    getSiteSection<ReviewConfig>("review_config"),
    getSiteSection<Parameters<typeof Hero>[0]["data"]>("hero"),
    getSiteSection<Parameters<typeof Ticker>[0]["data"]>("ticker"),
    getSiteSection<Parameters<typeof Header>[0]["data"]>("header"),
    getSiteSection<Parameters<typeof AboutSection>[0]["data"]>("about"),
    getSiteSection<Parameters<typeof RegionGuideSection>[0]["data"]>("region_guide"),
    getSiteSection<Parameters<typeof CategoryGuideSection>[0]["data"]>("category_guide"),
    getSiteSection<Parameters<typeof WidgetRowA>[0]["data"]>("widgets_a"),
    getSiteSection<Parameters<typeof WidgetRowB>[0]["data"]>("widgets_b"),
    getSiteSection<Parameters<typeof StatsBar>[0]["data"]>("stats"),
    getSiteSection<Parameters<typeof CTAStrip>[0]["data"]>("cta"),
    getSiteSection<Parameters<typeof Footer>[0]["data"]>("footer"),
    getSiteSection<Parameters<typeof RegionPreview>[0]["data"]>("region_preview"),
  ]);

  const pLimit = partnersConfig?.display_limit ?? 0;
  const feedLimit = feedConfig?.display_limit ?? 10;
  const gridLimit = reviewConfig?.grid_limit ?? 6;
  const fullLimit = reviewConfig?.full_limit ?? 10;

  const [partners, reviewPosts, reviews] = await Promise.all([
    getPartners(pLimit === 0 ? undefined : pLimit),
    getReviewPostsList({ limit: feedLimit }),
    getReviews(),
  ]);

  const partnerList = pLimit > 0 ? partners.slice(0, pLimit) : partners;

  const feedItems: FeedItem[] = reviewPosts.map((p, i) => {
    const dt = p.published_at || p.created_at;
    const timeStr = dt
      ? new Date(dt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
      : "";
    const regionName = getRegionName(p.region);
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
      sort_order: i,
    };
  });

  return (
    <>
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="header">
        <Header data={header} />
      </SectionWithSettings>
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="ticker">
        <Ticker data={ticker} />
      </SectionWithSettings>
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="hero">
        <Hero data={hero} />
      </SectionWithSettings>
      <div className="divider" />
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="about">
        <AboutSection data={about} />
      </SectionWithSettings>
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="region_guide">
        <RegionGuideSection data={regionGuide} />
      </SectionWithSettings>
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="category_guide">
        <CategoryGuideSection data={categoryGuide} />
      </SectionWithSettings>
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="partners_config" sectionLabel="4. 제휴업체 (노출개수)" adminLink="/admin/partners">
        <PartnerSection partners={partnerList} />
      </SectionWithSettings>
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="feed_config" sectionLabel="5. 실시간 최신 업데이트" adminLink="/admin/live-feed">
        <LiveFeedSection items={feedItems} />
      </SectionWithSettings>
      <div className="page-wrap">
        <SectionWithSettings isAdmin={!!isAdmin} sectionKey="widgets_a">
          <WidgetRowA data={widgetsA} />
        </SectionWithSettings>
        <SectionWithSettings isAdmin={!!isAdmin} sectionKey="region_preview">
          <RegionPreview data={regionPreview} />
        </SectionWithSettings>
        <SectionWithSettings isAdmin={!!isAdmin} sectionKey="review_config" sectionLabel="8. 6시간마다 최신리뷰" adminLink="/admin/reviews">
          <ReviewGrid reviews={reviews} displayLimit={gridLimit} />
        </SectionWithSettings>
        <SectionWithSettings isAdmin={!!isAdmin} sectionKey="widgets_b">
          <WidgetRowB data={widgetsB} />
        </SectionWithSettings>
        <SectionWithSettings isAdmin={!!isAdmin} sectionKey="stats">
          <StatsBar data={stats} />
        </SectionWithSettings>
        <SectionWithSettings isAdmin={!!isAdmin} sectionKey="cta">
          <CTAStrip data={cta} />
        </SectionWithSettings>
      </div>
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="review_config" sectionLabel="최신 리뷰 전문" adminLink="/admin/reviews">
        <FullReviewSection reviews={reviews} displayLimit={fullLimit} />
      </SectionWithSettings>
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="footer">
        <Footer data={footer} />
      </SectionWithSettings>
    </>
  );
}
