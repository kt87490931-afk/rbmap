import { unstable_noStore } from "next/cache";
import { getServerSession } from "next-auth";
import Header from "@/components/Header";
import Ticker from "@/components/Ticker";
import Hero from "@/components/Hero";
import AboutSection from "@/components/AboutSection";
import CategoryGuideSection from "@/components/CategoryGuideSection";
import SectionWithSettings from "@/components/SectionWithSettings";
import LiveFeedSection from "@/components/LiveFeedSection";
import RegionsSection from "@/components/RegionsSection";
import FeaturedVenuesSection from "@/components/FeaturedVenuesSection";
import ReviewMagazineSection from "@/components/ReviewMagazineSection";
import KeywordHubSection from "@/components/KeywordHubSection";
import FaqSection from "@/components/FaqSection";
import CTAStrip from "@/components/CTAStrip";
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
import { getRegions } from "@/lib/data/regions";
import { getPartnerCountsByRegion } from "@/lib/data/partners";
import { getSiteSection } from "@/lib/data/site";
import { TYPE_TO_SLUG, REGION_SLUG_TO_NAME } from "@/lib/data/venues";
import { getDisplayVisitorCount } from "@/lib/visit-count";
import { authOptions } from "@/lib/auth";
import { hasDevAdminCookie } from "@/lib/admin-auth";
import { verifyOtpSession } from "@/lib/otp";

type FeedConfig = { display_limit?: number };

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

  const [feedConfig, hero, ticker, header, about, categoryGuide, cta, footer, visitorDisplay, regions, partnerCounts] = await Promise.all([
    getSiteSection<FeedConfig>("feed_config"),
    getSiteSection<Parameters<typeof Hero>[0]["data"]>("hero"),
    getSiteSection<Parameters<typeof Ticker>[0]["data"]>("ticker"),
    getSiteSection<Parameters<typeof Header>[0]["data"]>("header"),
    getSiteSection<Parameters<typeof AboutSection>[0]["data"]>("about"),
    getSiteSection<Parameters<typeof CategoryGuideSection>[0]["data"]>("category_guide"),
    getSiteSection<Parameters<typeof CTAStrip>[0]["data"]>("cta"),
    getSiteSection<Parameters<typeof Footer>[0]["data"]>("footer"),
    getDisplayVisitorCount().then((r) => r.display).catch(() => 0),
    getRegions(),
    getPartnerCountsByRegion(),
  ]);

  const feedLimit = feedConfig?.display_limit ?? 10;

  const [partnersForWidgets, reviewPosts, reviews] = await Promise.all([
    getPartners(50),
    getReviewPostsList({ limit: feedLimit }),
    getReviews(),
  ]);

  const REGION_NAME_TO_SLUG: Record<string, string> = { 강남: "gangnam", 수원: "suwon", "수원 인계동": "suwon", 동탄: "dongtan", 제주: "jeju" };
  const venueCards = partnersForWidgets.slice(0, 4).map((p) => {
    const href = p.href?.startsWith("/") ? p.href : `/${(p.href ?? "").split("/")[1] ?? "gangnam"}/${TYPE_TO_SLUG[p.type] || "karaoke"}/${p.id}`;
    const regionName = REGION_SLUG_TO_NAME[(href?.split("/")[1] ?? "")] ?? p.region ?? "";
    return {
      href,
      region: regionName,
      name: p.name,
      star: p.stars || "★—",
      type: p.type,
      price: undefined as string | undefined,
      desc: p.desc ? (p.desc.length > 60 ? p.desc.slice(0, 60) + "…" : p.desc) : undefined,
    };
  });

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
        <Ticker
          data={ticker}
          items={reviewPosts.slice(0, 6).map((p) => ({
            region: getRegionName(p.region),
            text: `${p.venue} 리뷰 등록`,
          }))}
        />
      </SectionWithSettings>
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="hero">
        <Hero
          data={hero}
          visitorCount={visitorDisplay}
          regions={regions}
          partnerCounts={partnerCounts}
        />
      </SectionWithSettings>
      <div className="gold-divider" />
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="about">
        <AboutSection data={about} />
      </SectionWithSettings>
      <div className="gold-divider" />
      <div className="page-wrap">
        <SectionWithSettings isAdmin={!!isAdmin} sectionKey="regions">
          <RegionsSection
            regions={regions.map((r) => ({
              ...r,
              venues: partnerCounts[r.slug]?.venues ?? r.venues ?? 0,
            }))}
          />
        </SectionWithSettings>
      </div>
      <div className="gold-divider" />
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="category_guide">
        <CategoryGuideSection data={categoryGuide} />
      </SectionWithSettings>
      <div className="gold-divider" />
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="feed_config" sectionLabel="실시간 최신 업데이트" adminLink="/admin/live-feed">
        <LiveFeedSection items={feedItems} />
      </SectionWithSettings>
      <div className="gold-divider" />
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="region_preview">
        <FeaturedVenuesSection venues={venueCards.length > 0 ? venueCards : undefined} />
      </SectionWithSettings>
      <div className="gold-divider" />
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="review_config" sectionLabel="6시간마다 최신리뷰" adminLink="/admin/reviews">
        <ReviewMagazineSection reviews={reviews} displayLimit={5} />
      </SectionWithSettings>
      <div className="gold-divider" />
      <KeywordHubSection />
      <div className="gold-divider" />
      <FaqSection />
      <div className="gold-divider" />
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="cta">
        <CTAStrip data={cta} />
      </SectionWithSettings>
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="footer">
        <Footer data={footer} />
      </SectionWithSettings>
    </>
  );
}
