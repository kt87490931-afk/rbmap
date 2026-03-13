import { unstable_noStore } from "next/cache";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RegionsSection from "@/components/RegionsSection";
import { getRegions } from "@/lib/data/regions";
import { getPartnerCountsByRegion } from "@/lib/data/partners";
import { getSiteSection } from "@/lib/data/site";

export const metadata = {
  title: "전체 지역 | 강남·수원·동탄·제주 가라오케·유흥 정보 | 룸빵여지도",
  description: "강남, 수원, 동탄, 제주 등 전국 지역별 가라오케·룸싸롱·하이퍼블릭 정보. 어드민에 등록된 지역을 한눈에 확인하세요.",
};

export default async function RegionsPage() {
  unstable_noStore();

  const [regions, partnerCounts, header, footer] = await Promise.all([
    getRegions(),
    getPartnerCountsByRegion(),
    getSiteSection<{ logo_icon?: string; logo_text?: string; nav?: { label: string; href: string }[] }>("header"),
    getSiteSection<{ desc?: string; copyright?: string; links?: { label: string; href: string }[] }>("footer"),
  ]);

  const regionsWithCounts = regions.map((r) => ({
    ...r,
    venues: partnerCounts[r.slug]?.venues ?? r.venues ?? 0,
  }));

  return (
    <>
      <Header data={header} />
      <div className="breadcrumb">
        <div className="breadcrumb-inner">
          <Link href="/">룸빵여지도</Link>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-current">전체 지역</span>
        </div>
      </div>

      <div className="page-wrap" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <RegionsSection regions={regionsWithCounts} />
      </div>

      <Footer data={footer} />
    </>
  );
}
