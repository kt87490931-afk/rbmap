import { getServerSession } from "next-auth";
import Header from "@/components/Header";
import Ticker from "@/components/Ticker";
import Hero from "@/components/Hero";
import SeoSection from "@/components/SeoSection";
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
import { getFeedItems } from "@/lib/data/feed";
import { getReviews } from "@/lib/data/reviews";
import { getSiteSection } from "@/lib/data/site";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  let isAdmin = false;
  try {
    const session = await getServerSession(authOptions);
    isAdmin = session?.user?.role === "admin";
  } catch {
    // NEXTAUTH_SECRET 미설정 등 NextAuth 초기화 실패 시 톱니바퀴 비표시
  }
  const [
    partners,
    feedItems,
    reviews,
    hero,
    ticker,
    header,
    seo,
    widgetsA,
    widgetsB,
    stats,
    cta,
    footer,
    regionPreview,
  ] = await Promise.all([
    getPartners(),
    getFeedItems(),
    getReviews(),
    getSiteSection<Parameters<typeof Hero>[0]["data"]>('hero'),
    getSiteSection<Parameters<typeof Ticker>[0]["data"]>('ticker'),
    getSiteSection<Parameters<typeof Header>[0]["data"]>('header'),
    getSiteSection<Parameters<typeof SeoSection>[0]["data"]>('seo'),
    getSiteSection<Parameters<typeof WidgetRowA>[0]["data"]>('widgets_a'),
    getSiteSection<Parameters<typeof WidgetRowB>[0]["data"]>('widgets_b'),
    getSiteSection<Parameters<typeof StatsBar>[0]["data"]>('stats'),
    getSiteSection<Parameters<typeof CTAStrip>[0]["data"]>('cta'),
    getSiteSection<Parameters<typeof Footer>[0]["data"]>('footer'),
    getSiteSection<Parameters<typeof RegionPreview>[0]["data"]>('region_preview'),
  ]);

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
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="seo">
        <SeoSection data={seo} />
      </SectionWithSettings>
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="partners" adminLink="/admin/partners">
        <PartnerSection partners={partners} />
      </SectionWithSettings>
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="feed" adminLink="/admin/live-feed">
        <LiveFeedSection items={feedItems} />
      </SectionWithSettings>
      <div className="page-wrap">
        <SectionWithSettings isAdmin={!!isAdmin} sectionKey="widgets_a">
          <WidgetRowA data={widgetsA} />
        </SectionWithSettings>
        <SectionWithSettings isAdmin={!!isAdmin} sectionKey="region_preview">
          <RegionPreview data={regionPreview} />
        </SectionWithSettings>
        <SectionWithSettings isAdmin={!!isAdmin} sectionKey="reviews" adminLink="/admin/reviews">
          <ReviewGrid reviews={reviews} />
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
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="reviews" adminLink="/admin/reviews">
        <FullReviewSection reviews={reviews} />
      </SectionWithSettings>
      <SectionWithSettings isAdmin={!!isAdmin} sectionKey="footer">
        <Footer data={footer} />
      </SectionWithSettings>
    </>
  );
}
