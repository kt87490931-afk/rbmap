import Header from "@/components/Header";
import Ticker from "@/components/Ticker";
import Hero from "@/components/Hero";
import RegionsSection from "@/components/RegionsSection";

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
    </>
  );
}
