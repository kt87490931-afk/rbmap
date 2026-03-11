import Header from "@/components/Header";
import Ticker from "@/components/Ticker";
import Hero from "@/components/Hero";
import SeoSection from "@/components/SeoSection";
import RegionsSection from "@/components/RegionsSection";
import PartnerSection from "@/components/PartnerSection";
import LiveFeedSection from "@/components/LiveFeedSection";
import WidgetRowA from "@/components/WidgetRowA";
import RegionPreview from "@/components/RegionPreview";
import ReviewGrid from "@/components/ReviewGrid";
import WidgetRowB from "@/components/WidgetRowB";
import StatsBar from "@/components/StatsBar";
import CTAStrip from "@/components/CTAStrip";
import FullReviewSection from "@/components/FullReviewSection";
import Footer from "@/components/Footer";
import { getRegions } from "@/lib/data/regions";
import { getPartners } from "@/lib/data/partners";
import { getFeedItems } from "@/lib/data/feed";
import { getReviews } from "@/lib/data/reviews";
import { getSiteSection } from "@/lib/data/site";

export default async function Home() {
  const [
    regions,
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
    getRegions(),
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
      <Header data={header} />
      <Ticker data={ticker} />
      <Hero data={hero} />
      <div className="divider" />

      <SeoSection data={seo} />

      <div className="page-wrap">
        <RegionsSection regions={regions} />
      </div>

      <PartnerSection partners={partners} />

      <LiveFeedSection items={feedItems} />

      <div className="page-wrap">
        <WidgetRowA data={widgetsA} />
        <RegionPreview data={regionPreview} />
        <ReviewGrid reviews={reviews} />
        <WidgetRowB data={widgetsB} />
        <StatsBar data={stats} />
        <CTAStrip data={cta} />
      </div>

      <FullReviewSection reviews={reviews} />

      <Footer data={footer} />
    </>
  );
}
