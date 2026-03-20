import { getServerSession } from "next-auth";
import Header from "@/components/Header";
import TickerAsync from "@/components/home/TickerAsync";
import Hero from "@/components/Hero";
import AboutSection from "@/components/AboutSection";
import CategoryGuideSection from "@/components/CategoryGuideSection";
import SectionWithSettings from "@/components/SectionWithSettings";
import LiveFeedSectionAsync from "@/components/home/LiveFeedSectionAsync";
import RegionsSection from "@/components/RegionsSection";
import FeaturedVenuesSectionAsync from "@/components/home/FeaturedVenuesSectionAsync";
import ReviewMagazineSectionAsync from "@/components/home/ReviewMagazineSectionAsync";
import KeywordHubSection from "@/components/KeywordHubSection";
import FaqSection from "@/components/FaqSection";
import CTAStrip from "@/components/CTAStrip";
import Footer from "@/components/Footer";
import { getReviewCountsByRegion } from "@/lib/data/review-posts";
import { getRegions } from "@/lib/data/regions";
import { getPartnerCountsByRegion } from "@/lib/data/partners";
import { getSiteSection, getSiteSections } from "@/lib/data/site";
import { getDisplayVisitorCount } from "@/lib/visit-count";
import { authOptions } from "@/lib/auth";
import { hasDevAdminCookie } from "@/lib/admin-auth";
import { verifyOtpSession } from "@/lib/otp";
import type { Metadata } from "next";

/** ISR: 5분 캐시. 빠른 접속 + SEO 유리. (운영자 톱니바퀴는 최대 5분간 캐시된 화면) */
export const revalidate = 300;

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
    const canonicalUrl = (siteUrl || SITE_URL).replace(/\/+$/, "") || SITE_URL;
    return {
      title,
      description,
      keywords,
      alternates: { canonical: canonicalUrl },
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
      alternates: { canonical: SITE_URL },
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

  const SECTION_KEYS: import("@/lib/data/site").SiteSectionKey[] = [
    "feed_config",
    "review_config",
    "hero",
    "ticker",
    "header",
    "about",
    "category_guide",
    "cta",
    "footer",
    "faq",
  ];
  const [sections, visitorDisplay, regions, partnerCounts, reviewCountsByRegion] = await Promise.all([
    getSiteSections(SECTION_KEYS),
    getDisplayVisitorCount().then((r) => r.display).catch(() => 0),
    getRegions(),
    getPartnerCountsByRegion(),
    getReviewCountsByRegion(),
  ]);
  const hero = (sections.hero ?? {}) as Parameters<typeof Hero>[0]["data"];
  const ticker = (sections.ticker ?? null) as { items?: { region?: string; text?: string }[] } | null;
  const header = (sections.header ?? {}) as Parameters<typeof Header>[0]["data"];
  const about = (sections.about ?? {}) as Parameters<typeof AboutSection>[0]["data"];
  const categoryGuide = (sections.category_guide ?? {}) as Parameters<typeof CategoryGuideSection>[0]["data"];
  const cta = (sections.cta ?? {}) as Parameters<typeof CTAStrip>[0]["data"];
  const footer = (sections.footer ?? {}) as Parameters<typeof Footer>[0]["data"];
  const faqData = (sections.faq ?? {}) as { faq?: { q?: string; a?: string }[] };

  const totalVenueCount = Object.values(partnerCounts).reduce((sum, c) => sum + (c?.venues ?? 0), 0);
  const regionCount = regions.filter((r) => !r.coming).length;
  const totalReviewCount = Object.values(reviewCountsByRegion).reduce((sum, n) => sum + (n ?? 0), 0);
  const regionDisplayNames = Object.fromEntries(regions.map((r) => [r.slug, r.name]));
  const partnerCountsWithReviews: Record<string, { venues: number; reviews: number }> = {};
  for (const [slug, c] of Object.entries(partnerCounts)) {
    partnerCountsWithReviews[slug] = {
      venues: c?.venues ?? 0,
      reviews: reviewCountsByRegion[slug] ?? 0,
    };
  }

  return (
    <>
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="header">
        <Header data={header} />
      </SectionWithSettings>
      <TickerAsync ticker={ticker} isAdmin={!!isAdmin} />
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
      <LiveFeedSectionAsync isAdmin={!!isAdmin} />
      <div className="gold-divider" />
      <FeaturedVenuesSectionAsync isAdmin={!!isAdmin} />
      <div className="gold-divider" />
      <ReviewMagazineSectionAsync isAdmin={!!isAdmin} />
      <div className="gold-divider" />
      <KeywordHubSection />
      <div className="gold-divider" />
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="faq">
        <FaqSection
          items={(faqData?.faq ?? []).map((x) => ({ q: x.q ?? "", a: x.a ?? "" }))}
          isAdmin={!!isAdmin}
        />
      </SectionWithSettings>
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
