import Hero from "./components/Hero";
import RegionFilter from "./components/RegionFilter";
import RecentUpdates from "./components/RecentUpdates";
import FeaturedStores from "./components/FeaturedStores";
import PopularReviews from "./components/PopularReviews";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="font-pretendard min-h-screen bg-white">
      <Hero />
      <RegionFilter />
      <RecentUpdates />
      <FeaturedStores />
      <PopularReviews />
      <FAQ />
      <Footer />
    </div>
  );
}