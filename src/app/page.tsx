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
import RegionsSection from "@/components/RegionsSection";
import RegionPreview from "@/components/RegionPreview";
import ReviewGrid from "@/components/ReviewGrid";
import WidgetRowB from "@/components/WidgetRowB";
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
import { getRegions } from "@/lib/data/regions";
import { getPartnerCountsByRegion } from "@/lib/data/partners";
import { getSiteSection } from "@/lib/data/site";
import { TYPE_TO_SLUG, REGION_SLUG_TO_NAME } from "@/lib/data/venues";
import { getDisplayVisitorCount } from "@/lib/visit-count";
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

  const [partnersConfig, feedConfig, reviewConfig, hero, ticker, header, about, regionGuide, categoryGuide, widgetsA, widgetsB, cta, footer, regionPreview, visitorDisplay, regions, partnerCounts] = await Promise.all([
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
    getSiteSection<Record<string, unknown>>("widgets_b"),
    getSiteSection<Parameters<typeof CTAStrip>[0]["data"]>("cta"),
    getSiteSection<Parameters<typeof Footer>[0]["data"]>("footer"),
    getSiteSection<Parameters<typeof RegionPreview>[0]["data"]>("region_preview"),
    getDisplayVisitorCount().then((r) => r.display).catch(() => 0),
    getRegions(),
    getPartnerCountsByRegion(),
  ]);

  const pLimit = partnersConfig?.display_limit ?? 0;
  const feedLimit = feedConfig?.display_limit ?? 10;
  const gridLimit = reviewConfig?.grid_limit ?? 6;
  const fullLimit = reviewConfig?.full_limit ?? 10;

  const [partners, partnersForWidgets, reviewPosts, reviews] = await Promise.all([
    getPartners(pLimit === 0 ? undefined : pLimit),
    getPartners(50),
    getReviewPostsList({ limit: feedLimit }),
    getReviews(),
  ]);

  const partnerList = pLimit > 0 ? partners.slice(0, pLimit) : partners;

  const venueRanks = partnersForWidgets.slice(0, 7).map((p, i) => {
    const href = p.href?.startsWith("/") ? p.href : `/${(p.href ?? "").split("/")[1] ?? "gangnam"}/${TYPE_TO_SLUG[p.type] || "karaoke"}/${p.id}`;
    const regionName = REGION_SLUG_TO_NAME[(href?.split("/")[1] ?? "")] ?? p.region ?? "";
    return {
      href,
      rank: i + 1,
      top: i < 3,
      name: p.name,
      sub: `${regionName} · ${p.type}`,
      score: p.stars?.replace(/[^0-9.]/g, "") || "—",
    };
  });

  const typeCounts: Record<string, number> = {};
  for (const p of partnersForWidgets) {
    const slug = TYPE_TO_SLUG[p.type] || "karaoke";
    typeCounts[slug] = (typeCounts[slug] ?? 0) + 1;
  }
  const categoryConfig = [
    { slug: "karaoke", icon: "🎤", label: "가라오케" },
    { slug: "highpublic", icon: "💎", label: "하이퍼블릭" },
    { slug: "shirtroom", icon: "👔", label: "셔츠룸" },
    { slug: "public", icon: "🥂", label: "퍼블릭" },
    { slug: "jjomoh", icon: "⭐", label: "쩜오" },
    { slug: "room-salon", icon: "🎭", label: "룸싸롱" },
    { slug: "bar", icon: "🍸", label: "바" },
  ];
  const categories = categoryConfig.map((c) => ({
    href: `/category/${c.slug}`,
    icon: c.icon,
    label: c.label,
    count: `${typeCounts[c.slug] ?? 0}개`,
  }));

  const REGION_NAME_TO_SLUG: Record<string, string> = { 강남: "gangnam", 수원: "suwon", "수원 인계동": "suwon", 동탄: "dongtan", 제주: "jeju" };
  const partnersByRegion: Record<string, typeof partnersForWidgets> = {};
  for (const p of partnersForWidgets) {
    let slug = p.href?.replace(/^\//, "").split("/")[0] ?? "";
    if (!slug && p.region) slug = REGION_NAME_TO_SLUG[p.region] ?? REGION_NAME_TO_SLUG[p.region.replace(/\s+인계동$/, "")] ?? "";
    if (!slug) continue;
    if (!partnersByRegion[slug]) partnersByRegion[slug] = [];
    partnersByRegion[slug].push(p);
  }
  const regionPreviewRegions = regions.slice(0, 6).map((r) => {
    const regionPartners = (partnersByRegion[r.slug] ?? []).slice(0, 2);
    const venues = regionPartners.map((p) => ({
      vname: p.name,
      type: p.type,
      star: p.stars || "★—",
    }));
    return {
      href: `/${r.slug}`,
      region: r.name,
      count: `${partnerCounts[r.slug]?.venues ?? r.venues ?? 0}개 업소 등록`,
      venues,
    };
  });

  const timelineItems = reviewPosts.slice(0, 5).map((p, i) => {
    const dt = p.published_at || p.created_at;
    const timeStr = dt ? new Date(dt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }) : "—";
    return {
      time: timeStr,
      dot: i === 0 ? "on" : "",
      title: `${p.venue} 리뷰 등록`,
      desc: `Gemini AI 자동 생성 · ${getTypeName(p.type)}`,
    };
  });

  const mapCells = [
    ...regions.slice(0, 5).map((r, i) => ({
      href: `/${r.slug}`,
      name: r.name,
      sub: r.coming ? "준비중" : r.short ?? "",
      on: i === 0,
      coming: r.coming ?? false,
    })),
    { href: "/regions", name: "전체", sub: "모든지역", on: false, coming: false },
  ];

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
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="region_guide">
        <RegionGuideSection data={regionGuide} />
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
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="partners_config" sectionLabel="4. 제휴업체 (노출개수)" adminLink="/admin/partners">
        <PartnerSection partners={partnerList} />
      </SectionWithSettings>
      <div className="gold-divider" />
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="feed_config" sectionLabel="5. 실시간 최신 업데이트" adminLink="/admin/live-feed">
        <LiveFeedSection items={feedItems} />
      </SectionWithSettings>
      <div className="gold-divider" />
      <div className="page-wrap">
        <SectionWithSettings isAdmin={!!isAdmin} sectionKey="widgets_a">
          <WidgetRowA data={{ venue_ranks: venueRanks, categories }} />
        </SectionWithSettings>
        <SectionWithSettings isAdmin={!!isAdmin} sectionKey="region_preview">
          <RegionPreview data={{ regions: regionPreviewRegions }} />
        </SectionWithSettings>
        <SectionWithSettings isAdmin={!!isAdmin} sectionKey="review_config" sectionLabel="8. 6시간마다 최신리뷰" adminLink="/admin/reviews">
          <ReviewGrid reviews={reviews} displayLimit={gridLimit} />
        </SectionWithSettings>
        <SectionWithSettings isAdmin={!!isAdmin} sectionKey="widgets_b">
          <WidgetRowB data={{ timeline: timelineItems, map_cells: mapCells, faq: (widgetsB as { faq?: { q?: string; a?: string }[] })?.faq }} />
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
