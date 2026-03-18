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
import {
  getReviewPostsList,
  getReviewPostsListByClickCount,
  getReviewCountsByRegion,
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
import type { Metadata } from "next";

type FeedConfig = { display_limit?: number };
type ReviewConfig = { display_limit?: number };

const DEFAULT_TITLE = "룸빵여지도 | 전국 룸싸롱·가라오케·셔츠룸·쩜오·퍼블릭·노래방 유흥 정보";
const DEFAULT_DESC =
  "믿을 수 있는 업소를 한눈에! 룸빵여지도에서 전국 유흥 정보를 확인하세요. 검증된 업소와 실제 이용 후기가 당신의 선택을 돕습니다. 20분마다 자동으로 업데이트되는 최신 정보로 실패 없는 밤을 약속합니다.";
const DEFAULT_KEYWORDS =
  "룸빵여지도, 강남 가라오케, 수원 가라오케, 동탄 가라오케, 제주 가라오케, 룸싸롱, 하이퍼블릭, 셔츠룸, 쩜오, 퍼블릭";
const SITE_URL = "https://rbbmap.com";
const OG_IMAGE_VERSION = "v20260318";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await getSiteSection<{ title?: string; description?: string; keywords?: string; ogImage?: string; siteUrl?: string }>("seo");
    const title = seo?.title || DEFAULT_TITLE;
    const description = seo?.description || DEFAULT_DESC;
    const keywords = seo?.keywords || DEFAULT_KEYWORDS;
    const siteUrl = seo?.siteUrl || SITE_URL;
    const baseOg = (seo?.ogImage?.trim() || `${siteUrl}/og/og-home.png`).replace(/^\/+/, siteUrl + "/");
    const ogImageAbs = baseOg.includes("?") ? `${baseOg}&v=${OG_IMAGE_VERSION}` : `${baseOg}?v=${OG_IMAGE_VERSION}`;
    return {
      title,
      description,
      keywords,
      openGraph: {
        type: "website",
        locale: "ko_KR",
        url: siteUrl,
        siteName: "룸빵여지도",
        title,
        description,
        images: [{ url: ogImageAbs, width: 1200, height: 630, alt: "룸빵여지도 — 믿을 수 있는 업소를 한눈에" }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: "믿을 수 있는 업소를 한눈에!",
        images: [ogImageAbs],
      },
    };
  } catch {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESC,
      keywords: DEFAULT_KEYWORDS,
      openGraph: {
        type: "website",
        locale: "ko_KR",
        url: SITE_URL,
        siteName: "룸빵여지도",
        title: DEFAULT_TITLE,
        description: DEFAULT_DESC,
        images: [{ url: `${SITE_URL}/og/og-home.png?v=${OG_IMAGE_VERSION}`, width: 1200, height: 630, alt: "룸빵여지도 — 믿을 수 있는 업소를 한눈에" }],
      },
      twitter: {
        card: "summary_large_image",
        title: DEFAULT_TITLE,
        description: "믿을 수 있는 업소를 한눈에!",
        images: [`${SITE_URL}/og/og-home.png?v=${OG_IMAGE_VERSION}`],
      },
    };
  }
}

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

  const [feedConfig, reviewConfig, hero, ticker, header, about, categoryGuide, cta, footer, visitorDisplay, regions, partnerCounts, reviewCountsByRegion] = await Promise.all([
    getSiteSection<FeedConfig>("feed_config"),
    getSiteSection<ReviewConfig>("review_config"),
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
    getReviewCountsByRegion(),
  ]);

  const feedLimit = feedConfig?.display_limit ?? 10;
  const reviewDisplayLimitRaw = reviewConfig?.display_limit ?? 6;
  const REVIEW_DISPLAY_OPTIONS = [3, 6, 9, 12, 15, 30, 45, 60];
  const reviewDisplayLimit = REVIEW_DISPLAY_OPTIONS.includes(reviewDisplayLimitRaw) ? reviewDisplayLimitRaw : 6;
  const totalVenueCount = Object.values(partnerCounts).reduce((sum, c) => sum + (c?.venues ?? 0), 0);
  const regionCount = regions.filter((r) => !r.coming).length;
  const totalReviewCount = Object.values(reviewCountsByRegion).reduce((sum, n) => sum + (n ?? 0), 0);
  const partnerCountsWithReviews: Record<string, { venues: number; reviews: number }> = {};
  for (const [slug, c] of Object.entries(partnerCounts)) {
    partnerCountsWithReviews[slug] = {
      venues: c?.venues ?? 0,
      reviews: reviewCountsByRegion[slug] ?? 0,
    };
  }

  const [partnersForWidgets, reviewPosts, reviewPostsByClick] = await Promise.all([
    getPartners(),
    getReviewPostsList({ limit: feedLimit }),
    getReviewPostsListByClickCount(60),
  ]);

  const REGION_NAME_TO_SLUG: Record<string, string> = { 강남: "gangnam", 수원: "suwon", "수원 인계동": "suwon", 동탄: "dongtan", 오산: "osan", 가락: "garak", 제주: "jeju" };
  const venueCards = partnersForWidgets.map((p) => {
    const href = p.href?.startsWith("/") ? p.href : `/${(p.href ?? "").split("/")[1] ?? "gangnam"}/${TYPE_TO_SLUG[p.type] || "karaoke"}/${p.id}`;
    const regionName = REGION_SLUG_TO_NAME[(href?.split("/")[1] ?? "")] ?? p.region ?? "";
    const rawDesc = p.desc || "";
    const desc = rawDesc.length > 500 ? rawDesc.slice(0, 500) + "…" : rawDesc || undefined;
    return {
      href,
      region: regionName,
      name: p.name,
      star: p.stars || "★—",
      type: p.type,
      contact: (p.contact ?? "").trim() || undefined,
      price: undefined as string | undefined,
      desc: desc || undefined,
    };
  });

  const reviewMagazineItems = reviewPostsByClick.map((p, i) => {
    const dt = p.published_at || p.created_at;
    const dateStr = dt ? new Date(dt).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }).replace(/\. /g, ".").replace(/\.$/, "") : "";
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const isNew = dt ? new Date(dt) > weekAgo : false;
    return {
      id: p.id,
      href: buildReviewUrl(p.region, p.type, p.venue_slug, p.slug),
      region: getRegionName(p.region),
      date: dateStr,
      title: p.title,
      excerpt: (p.sec_overview || p.sec_summary || "").slice(0, 500) + ((p.sec_overview || p.sec_summary || "").length > 500 ? "…" : ""),
      stars: formatStars(p.star),
      venue: p.venue,
      is_new: isNew,
      sort_order: i,
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
          items={reviewPosts.slice(0, 6).map((p) => {
            const body = (p.sec_overview || p.sec_summary || p.title || "").trim();
            const text30 = body.length > 30 ? `${body.slice(0, 30)}…` : body;
            return {
              region: getRegionName(p.region),
              text: text30 || `${p.venue} 리뷰 등록`,
            };
          })}
        />
      </SectionWithSettings>
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="hero">
        <Hero
          data={hero}
          visitorCount={visitorDisplay}
          regions={regions}
          partnerCounts={partnerCountsWithReviews}
          totalVenueCount={totalVenueCount}
          regionCount={regionCount}
          totalReviewCount={totalReviewCount}
        />
      </SectionWithSettings>
      <div className="gold-divider" />
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="about">
        <AboutSection data={about} />
      </SectionWithSettings>
      <div className="gold-divider" />
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="regions">
        <RegionsSection
          regions={regions.map((r) => ({
            ...r,
            venues: partnerCountsWithReviews[r.slug]?.venues ?? r.venues ?? 0,
            reviews: partnerCountsWithReviews[r.slug]?.reviews ?? r.reviews ?? 0,
          }))}
        />
      </SectionWithSettings>
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
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="review_config" sectionLabel="6시간 마다 업데이트 인기 리뷰" adminLink="/admin/reviews">
        <ReviewMagazineSection reviews={reviewMagazineItems} displayLimit={reviewDisplayLimit} />
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
