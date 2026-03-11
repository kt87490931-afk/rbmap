import Header from "@/components/Header";
import Ticker from "@/components/Ticker";
import Hero from "@/components/Hero";
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

export default function Home() {
  return (
    <>
      <Header />
      <Ticker />
      <Hero />
      <div className="divider" />

      <div className="page-wrap">
        <RegionsSection />
      </div>

      <PartnerSection />

      <LiveFeedSection />

      <div className="page-wrap">
        <WidgetRowA />
        <RegionPreview />
        <ReviewGrid />
        <WidgetRowB />
        <StatsBar />
        <CTAStrip />
      </div>

      <FullReviewSection />

      <Footer />
    </>
  );
}
