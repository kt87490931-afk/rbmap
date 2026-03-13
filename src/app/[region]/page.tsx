import { notFound } from "next/navigation";
import { unstable_noStore } from "next/cache";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getRegionBySlug } from "@/lib/data/regions";
import { getPartnersByRegion, getPartnerCountsByRegion } from "@/lib/data/partners";
import { buildVenueUrl, TYPE_TO_SLUG } from "@/lib/data/venues";
import { getRegions } from "@/lib/data/regions";
import { getFeedItems } from "@/lib/data/feed";
import { getReviews } from "@/lib/data/reviews";
import { getSiteSection } from "@/lib/data/site";
import type { Region } from "@/lib/data/regions";
import type { Partner } from "@/lib/data/partners";

const REGION_SLUGS = ["gangnam", "suwon", "dongtan", "jeju"];
const SLUG_TO_REGION_NAME: Record<string, string> = {
  gangnam: "강남",
  suwon: "수원",
  dongtan: "동탄",
  jeju: "제주",
};

const REGION_CFG: Record<
  string,
  { eyebrow: string; sub: string; desc: string; avgPrice: string; priceRows: { type: string; val: string; chg: string }[]; filterCounts: Record<string, number>; tips: { title: string; text: string; color: string }[] }
> = {
  gangnam: {
    eyebrow: "GANGNAM · 서울 강남구",
    sub: "가라오케·하이퍼블릭·쩜오",
    desc: "가라오케·하이퍼블릭·쩜오·퍼블릭까지 — 강남 전 업종을 한눈에.\n달토·퍼펙트·인트로 등 검증된 82개 업소의 최신 정보.",
    avgPrice: "55만~",
    priceRows: [
      { type: "가라오케", val: "55만", chg: "fl" },
      { type: "하이퍼블릭", val: "80만", chg: "up" },
      { type: "쩜오", val: "48만", chg: "fl" },
      { type: "퍼블릭", val: "38만", chg: "dn" },
    ],
    filterCounts: { 전체: 82, 가라오케: 34, 하이퍼블릭: 22, 쩜오: 14, 퍼블릭: 12, 리뷰: 641 },
    tips: [
      { title: "예약 필수", text: "금·토 저녁 8시 이후는 반드시 예약 후 방문하세요.", color: "var(--gold)" },
      { title: "최적 시간대", text: "평일 오후 9시~자정이 라인업 가장 풍부합니다.", color: "var(--blue)" },
      { title: "가격 확인", text: "방문 전 반드시 주대 구성 확인, 정찰제 여부 체크.", color: "var(--green)" },
    ],
  },
  suwon: {
    eyebrow: "SUWON · 경기 수원 인계동",
    sub: "셔츠룸·퍼블릭·하이퍼블릭",
    desc: "셔츠룸·퍼블릭·하이퍼블릭 — 수원 인계동 전 업종을 한눈에.\n아우라·마징가·메칸더 등 검증된 업소의 최신 정보.",
    avgPrice: "35만~",
    priceRows: [
      { type: "가라오케", val: "33만", chg: "fl" },
      { type: "하이퍼블릭", val: "45만", chg: "up" },
      { type: "셔츠룸", val: "38만", chg: "dn" },
      { type: "퍼블릭", val: "30만", chg: "fl" },
    ],
    filterCounts: { 전체: 61, 가라오케: 18, 하이퍼블릭: 12, 셔츠룸: 15, 퍼블릭: 16, 리뷰: 512 },
    tips: [
      { title: "인계동 접근", text: "수원역에서 택시 10분. KTX 연계로 서울 당일 방문 가능.", color: "var(--gold)" },
      { title: "셔츠룸 특화", text: "인계동은 셔츠룸이 강세. 환복 이벤트 확인 후 방문.", color: "var(--blue)" },
      { title: "가격", text: "강남 대비 30~40% 저렴. 정찰제 업소 많음.", color: "var(--green)" },
    ],
  },
  dongtan: {
    eyebrow: "DONGTAN · 경기 화성 동탄",
    sub: "가라오케·퍼블릭·셔츠룸",
    desc: "가라오케·퍼블릭·셔츠룸 — 동탄 신도시 전 업종을 한눈에.\n비너스·오로라 등 검증된 업소의 최신 정보.",
    avgPrice: "30만~",
    priceRows: [
      { type: "가라오케", val: "30만", chg: "up" },
      { type: "셔츠룸", val: "38만", chg: "fl" },
      { type: "퍼블릭", val: "28만", chg: "dn" },
    ],
    filterCounts: { 전체: 34, 가라오케: 12, 셔츠룸: 8, 퍼블릭: 14, 리뷰: 218 },
    tips: [
      { title: "자차 권장", text: "대중교통 제한적. 주차장 넓은 업소 많음.", color: "var(--gold)" },
      { title: "가성비", text: "강남 대비 절반 수준. 신도시 특성상 경쟁 치열.", color: "var(--blue)" },
      { title: "비너스 1위", text: "동탄 셔츠룸 압도적 1위. 예약 권장.", color: "var(--green)" },
    ],
  },
  jeju: {
    eyebrow: "JEJU · 제주",
    sub: "가라오케·바",
    desc: "가라오케·바 — 제주 전 업종을 한눈에.\n제니스·오션뷰 등 검증된 업소의 최신 정보.",
    avgPrice: "28만~",
    priceRows: [
      { type: "가라오케", val: "28만", chg: "fl" },
      { type: "바", val: "25만", chg: "fl" },
    ],
    filterCounts: { 전체: 28, 가라오케: 15, 바: 8, 리뷰: 173 },
    tips: [
      { title: "관광객 친화", text: "렌터카 없이 택시로 이동 가능한 업소 많음.", color: "var(--gold)" },
      { title: "비성수기 추천", text: "7~8월·연휴엔 가격 상승. 비성수기가 유리.", color: "var(--blue)" },
      { title: "픽업 서비스", text: "일부 업소 공항 픽업 제공. 사전 예약 시.", color: "var(--green)" },
    ],
  },
};

const SEO_CONTENT: Record<string, { cols: { blocks: { type: "h3" | "p"; content: string }[] }[]; kwLinks: { href: string; text: string }[] }> = {
  gangnam: {
    cols: [
      {
        blocks: [
          { type: "h3", content: "강남 가라오케란? — <em>대한민국 유흥의 기준</em>" },
          { type: "p", content: "<strong>강남 가라오케</strong>는 서울 강남구 역삼동·논현동·청담동 일대에 밀집한 대한민국 최상급 유흥 업소를 통칭합니다. 전국에서 가장 높은 라인업 수준과 서비스 퀄리티를 자랑하며, 국내 유흥 문화의 기준점으로 불립니다." },
          { type: "p", content: "강남 가라오케의 평균 주대는 <strong>1인 기준 50만~70만 원대</strong>이며, 프리미엄 하이퍼블릭의 경우 80만 원 이상을 호가합니다. 비용이 부담스러운 경우 퍼블릭(38만 원~)이나 쩜오(48만 원~)를 선택하면 합리적으로 강남의 분위기를 즐길 수 있습니다." },
          { type: "h3", content: "업종별 차이 — <em>퍼블릭·쩜오·하이퍼블릭</em>" },
          { type: "p", content: "<strong>퍼블릭</strong>은 노래를 즐기며 파트너와 함께하는 일반적인 가라오케 형태입니다. <strong>하이퍼블릭</strong>은 퍼블릭보다 밀착 서비스가 강화된 프리미엄 형태로 강남에서 가장 수요가 높습니다. <strong>쩜오(0.5)</strong>는 하이퍼블릭과 퍼블릭의 중간 단계로 가성비를 추구하는 방문객에게 적합합니다." },
        ],
      },
      {
        blocks: [
          { type: "h3", content: "강남 이용 가이드 — <em>처음 방문자를 위한 팁</em>" },
          { type: "p", content: "강남 가라오케는 <strong>예약 없이 방문할 경우 대기</strong>가 발생할 수 있습니다. 특히 금요일·토요일 저녁 8시 이후는 예약 필수입니다. 담당 실장을 통해 예약하면 룸 배정과 초이스 진행이 훨씬 원활합니다." },
          { type: "p", content: "강남에서는 <strong>정찰제 운영 업소</strong>와 흥정 가능한 업소가 혼재합니다. 방문 전 주대 구성을 반드시 확인하고, 추가 비용 발생 여부를 사전에 체크하는 것이 중요합니다." },
          { type: "h3", content: "강남 추천 방문 시간대" },
          { type: "p", content: "<strong>평일 오후 9시~자정</strong>이 라인업이 가장 풍부하고 대기가 적습니다. 주말은 저녁 7시 이전 조기 방문을 추천합니다. 강남 달토·퍼펙트·인트로 하이퍼블릭이 룸빵여지도 이용자 기준 최고 평점을 기록 중입니다." },
        ],
      },
    ],
    kwLinks: [
      { href: "/gangnam/category/karaoke", text: "강남 가라오케" },
      { href: "/gangnam/category/highpublic", text: "강남 하이퍼블릭" },
      { href: "/gangnam/karaoke/dalto", text: "달토 가라오케" },
      { href: "/gangnam/reviews", text: "강남 가라오케 후기" },
      { href: "/gangnam/ranking", text: "강남 유흥 랭킹" },
      { href: "/guide", text: "강남 유흥 가이드" },
    ],
  },
  suwon: {
    cols: [
      { blocks: [{ type: "h3", content: "수원 인계동이란? — <em>경기도 최대 유흥가</em>" }, { type: "p", content: "<strong>수원 인계동</strong>은 경기도 수원시 팔달구에 위치한 경기도 최대 규모의 유흥 밀집 지역입니다. 강남 수준의 서비스를 30~40% 저렴한 비용으로 이용할 수 있습니다." }, { type: "p", content: "인계동 셔츠룸은 파트너가 환복 이벤트를 진행하는 서비스로 인계동의 특화 업종 중 하나입니다. 아우라·마징가·메칸더가 최고 평점 업소입니다." }] },
      { blocks: [{ type: "h3", content: "인계동 이용 가이드" }, { type: "p", content: "수원역에서 택시 10분, 버스 20분. KTX 수원역 연계로 서울 당일 방문 가능합니다." }, { type: "p", content: "정찰제 업소가 많아 추가 비용 부담이 적습니다. 처음 방문 시 실장 안내를 꼭 받으세요." }] },
    ],
    kwLinks: [
      { href: "/suwon/category/karaoke", text: "수원 가라오케" },
      { href: "/suwon/category/shirtroom", text: "수원 셔츠룸" },
      { href: "/suwon/highpublic/aura", text: "아우라 가라오케" },
      { href: "/suwon/reviews", text: "수원 가라오케 후기" },
    ],
  },
  dongtan: {
    cols: [
      { blocks: [{ type: "h3", content: "동탄 유흥가 특징" }, { type: "p", content: "<strong>동탄 신도시</strong>는 화성시 동탄면 일대에 조성된 대규모 신도시로, 유흥 씬이 빠르게 성장하고 있습니다. 신축 건물 위주로 시설이 깨끗하고 현대적입니다." }, { type: "p", content: "동탄 가라오케의 평균 주대는 1인 25만~35만 원으로 강남 대비 절반 수준입니다. 비너스 셔츠룸이 동탄 압도적 1위입니다." }] },
      { blocks: [{ type: "h3", content: "동탄 이용 팁" }, { type: "p", content: "자차 방문이 압도적으로 많습니다. 주차장 넓은 업소 많음." }, { type: "p", content: "대리운전 미리 준비 권장. 심야 대중교통 제한적입니다." }] },
    ],
    kwLinks: [
      { href: "/dongtan/category/shirtroom", text: "동탄 셔츠룸" },
      { href: "/dongtan/shirtroom/venus", text: "비너스 셔츠룸" },
      { href: "/dongtan/reviews", text: "동탄 가라오케 후기" },
    ],
  },
  jeju: {
    cols: [
      { blocks: [{ type: "h3", content: "제주 유흥의 특징" }, { type: "p", content: "<strong>제주 가라오케·룸싸롱</strong>은 관광지 특성상 육지와는 다른 분위기를 가집니다. 렌터카 없이도 이용 가능한 업소가 많습니다." }, { type: "p", content: "제주 가라오케의 평균 주대는 1인 25만~35만 원대로 서울 강남 대비 저렴합니다. 제니스 클럽이 제주 최고 평점 업소입니다." }] },
      { blocks: [{ type: "h3", content: "제주 방문 시 주의사항" }, { type: "p", content: "관광 성수기(7~8월, 연휴)에는 가격이 상승하는 경향이 있습니다. 비성수기 방문이 유리합니다." }, { type: "p", content: "일부 업소는 사전 예약 시 공항 픽업 서비스를 제공합니다." }] },
    ],
    kwLinks: [
      { href: "/jeju/category/karaoke", text: "제주 가라오케" },
      { href: "/jeju/karaoke/zenith", text: "제니스 클럽" },
      { href: "/jeju/reviews", text: "제주 룸싸롱 후기" },
    ],
  },
};

export async function generateMetadata({ params }: { params: Promise<{ region: string }> }) {
  const { region } = await params;
  const regionData = await getRegionBySlug(region);
  if (!regionData) return {};
  const cfg = REGION_CFG[region];
  const name = regionData?.name ?? region;
  const title = `${name} 가라오케·하이퍼블릭 추천 | 룸빵여지도`;
  const venues = regionData?.venues ?? 0;
  const reviews = regionData?.reviews ?? 0;
  return {
    title,
    description: `${name} 가라오케·하이퍼블릭·${cfg?.sub ?? ""} 정보. ${name} 인기 업소 ${venues}곳의 실제 이용 후기와 가격을 6시간마다 업데이트합니다.`,
    keywords: `${name}가라오케, ${name}하이퍼블릭, ${name}룸싸롱, ${name}유흥`,
    openGraph: { title: `${name} 가라오케·하이퍼블릭 추천 | 룸빵여지도`, description: `${name} 유흥 정보. ${venues}개 업소, ${reviews}개 리뷰, 6시간 업데이트.`, type: "website" },
  };
}

export default async function RegionPage({ params }: { params: Promise<{ region: string }> }) {
  unstable_noStore();
  const { region } = await params;

  const regionNameFallback = SLUG_TO_REGION_NAME[region] ?? region;
  const [regionData, partners, regions, partnerCounts, feedItems, reviews, header, footer] = await Promise.all([
    getRegionBySlug(region),
    getPartnersByRegion(regionNameFallback, region),
    getRegions(),
    getPartnerCountsByRegion(),
    getFeedItems(),
    getReviews(),
    getSiteSection<{ logo_icon?: string; logo_text?: string; nav?: { label: string; href: string }[] }>("header"),
    getSiteSection<{ desc?: string; copyright?: string; links?: { label: string; href: string }[] }>("footer"),
  ]);

  if (!regionData) notFound();

  const regionName = regionData.name ?? regionNameFallback;
  const r = regionData;
  const cfg = REGION_CFG[region] ?? REGION_CFG.gangnam;
  const regionPartners = partners.length > 0 ? partners : (r.name ? await getPartnersByRegion(r.name, region) : []);
  const regionFeed = feedItems.filter((f) => f.pill?.includes(r.name ?? "") || f.href?.includes(`/${region}/`)).slice(0, 5);
  const regionReviews = reviews.filter((rev) => rev.region?.includes(r.name ?? "") || rev.href?.includes(`/${region}/`)).slice(0, 3);
  const otherRegions = regions
    .filter((x) => x.slug !== region && !x.coming)
    .slice(0, 4)
    .map((o) => ({
      ...o,
      venues: partnerCounts[o.slug]?.venues ?? o.venues ?? 0,
      reviews: o.reviews ?? 0,
    }));
  const seo = SEO_CONTENT[region] ?? SEO_CONTENT.gangnam;

  const DISPLAY_PARTNERS_LIMIT = 6;
  const displayPartners: Partner[] = regionPartners.slice(0, DISPLAY_PARTNERS_LIMIT);

  const filterCounts: Record<string, number> = regionPartners.length > 0
    ? (() => {
        const counts: Record<string, number> = { 전체: regionPartners.length, 리뷰: r.reviews ?? cfg.filterCounts?.리뷰 ?? 0 };
        for (const p of regionPartners) {
          const t = p.type || "기타";
          counts[t] = (counts[t] ?? 0) + 1;
        }
        return counts;
      })()
    : (cfg.filterCounts ?? {});

  const venueCards = regionPartners.map((p, i) => {
    const href = p.href?.startsWith("/") ? p.href : `/${region}/${TYPE_TO_SLUG[p.type] || "karaoke"}/${p.id}`;
    return {
      href,
      rank: i + 1,
      top: i < 3,
      name: p.name,
      type: p.type,
      typeStyle: p.type_style && typeof p.type_style === "object" ? p.type_style : {},
      score: "—",
      meta: p.location ? [p.location] : [],
      price: "문의",
      tags: p.tags ?? [],
      reviewPreview: p.desc ?? "",
      stars: p.stars ?? "★★★★☆",
      reviewCount: "—",
      ad: false,
    };
  });

  return (
    <>
      <Header data={header} />
      <div className="breadcrumb">
        <div className="breadcrumb-inner">
          <Link href="/">룸빵여지도</Link>
          <span className="breadcrumb-sep">›</span>
          <Link href="/regions">지역</Link>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-current">{r.name}</span>
        </div>
      </div>

      <section className="region-hero">
        <div className="rh-grid" aria-hidden />
        <div className="rh-glow" aria-hidden />
        <div className="rh-inner">
          <div className="rh-top">
            <div className="rh-left">
              <div className="rh-eyebrow">
                <div className="rh-eyebrow-dot" />
                {cfg.eyebrow}
              </div>
              <h1 className="rh-title">
                {r.name} <em>유흥 정보</em>
                <br />
                완전 정복
              </h1>
              <p className="rh-desc">
                {cfg.desc.split("\n").map((line, i) => (
                  <span key={i}>{line}{i < cfg.desc.split("\n").length - 1 && <br />}</span>
                ))}
              </p>
              <div className="rh-kpi">
                <div className="rh-kpi-item">
                  <strong>{regionPartners.length > 0 ? regionPartners.length : (r.venues ?? cfg.filterCounts?.전체 ?? 0)}</strong>
                  <span>등록 업소</span>
                </div>
                <div className="rh-kpi-item">
                  <strong>{r.reviews ?? cfg.filterCounts?.리뷰 ?? 0}</strong>
                  <span>누적 리뷰</span>
                </div>
                <div className="rh-kpi-item">
                  <strong>{cfg.avgPrice}</strong>
                  <span>평균 주대</span>
                </div>
                <div className="rh-kpi-item">
                  <strong>6H</strong>
                  <span>업데이트</span>
                </div>
              </div>
            </div>
            <div className="rh-right">
              <p style={{ fontSize: 10, color: "var(--dim)", letterSpacing: ".08em", textAlign: "right" }}>다른 지역 바로가기</p>
              <div className="rh-other-regions">
                {otherRegions.map((o) => (
                  <Link key={o.slug} href={`/${o.slug}`} className="rh-other-btn">
                    {o.name}
                  </Link>
                ))}
                <Link href="/regions" className="rh-other-btn">전체 지역 →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="filter-bar">
        <div className="filter-inner">
          <Link href={`/${region}`} className="filter-tab active">전체<span className="filter-count">{filterCounts.전체 ?? r.venues ?? 0}</span></Link>
          <div className="filter-divider" />
          {Object.entries(filterCounts)
            .filter(([k]) => !["전체", "리뷰"].includes(k))
            .map(([label, count]) => (
              <Link key={label} href={`/${region}/category/${label === "가라오케" ? "karaoke" : label === "하이퍼블릭" ? "highpublic" : label === "쩜오" ? "jjomoh" : label === "퍼블릭" ? "public" : label === "셔츠룸" ? "shirtroom" : label === "바" ? "bar" : "karaoke"}`} className="filter-tab">
                {label}
                <span className="filter-count">{count}</span>
              </Link>
            ))}
          <div className="filter-divider" />
          <Link href={`/${region}/reviews`} className="filter-tab">리뷰<span className="filter-count">{filterCounts.리뷰 ?? r.reviews ?? 0}</span></Link>
          <Link href={`/${region}/ranking`} className="filter-tab">랭킹</Link>
        </div>
      </div>

      <div className="page-wrap">
        <section className="section" aria-label={`${r.name} 업체 소개`}>
          <div className="sec-header">
            <div>
              <p className="sec-label">FEATURED · {r.name} 업체 소개</p>
              <h2 className="sec-title">{r.name} <span>업체 소개</span></h2>
            </div>
            <Link href={`/${region}/partners`} className="see-all">전체 업체 →</Link>
          </div>
          <div className="partner-grid">
            {displayPartners.length === 0 ? (
              <div style={{ gridColumn: "1/-1", padding: 32, textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
                이 지역에 등록된 제휴업체가 없습니다.
              </div>
            ) : displayPartners.map((p) => {
              const categorySlug = TYPE_TO_SLUG[p.type] || "karaoke";
              const venueSlug = p.href?.split("/").filter(Boolean).pop() || p.id || "venue";
              const partnerHref = buildVenueUrl(region, categorySlug, venueSlug);
              return (
                <Link key={p.id} href={partnerHref} className="pv-card pv-card-text">
                  <div className="pv-body">
                    <div className="pv-card-header">
                      <span className="pv-name">{p.name}</span>
                      <span className="pv-type-label" style={p.type_style}>{p.type}</span>
                      <span className="pv-stars">{p.stars}</span>
                    </div>
                    <div className="pv-meta-row">
                      <span className="pv-contact">{p.contact}</span>
                      {(p.tags ?? []).slice(0, 2).map((tag) => (
                        <span key={tag} className="pv-tag">{tag}</span>
                      ))}
                    </div>
                    <div className="pv-location">📍 {p.location || "주소 입력 예정"}</div>
                    <p className="pv-desc">{p.desc}</p>
                    <div className="pv-map-wrap">
                      <div className="pv-map-placeholder"><span>🗺</span>구글맵 연동 예정<br /><span style={{ fontSize: 10 }}>Google Maps embed URL을 입력하세요</span></div>
                    </div>
                    <div className="pv-footer">
                      <span className="pv-cta">업소 상세 페이지 →</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      <section className="venue-section section-sm">
        <div className="page-wrap">
          <div className="content-with-sidebar">
            <div>
              <div className="sec-header" style={{ marginBottom: 16 }}>
                <div><p className="sec-label">ALL VENUES</p><h2 className="sec-title" style={{ marginBottom: 0 }}>{r.name} <span>전체 업소</span> 랭킹</h2></div>
                <Link href={`/${region}/ranking`} className="see-all">전체 순위 →</Link>
              </div>
              <div className="venue-grid">
                {venueCards.length === 0 ? (
                  <div style={{ gridColumn: "1/-1", padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
                    이 지역에 등록된 업소가 없습니다.
                  </div>
                ) : venueCards.map((v) => (
                  <Link key={v.href} href={v.href} className="vc-card">
                    <div className="vc-top">
                      <span className={`vc-rank ${v.top && v.rank <= 3 ? `top${v.rank}` : ""}`}>{v.rank}</span>
                      <div className="vc-badge-row">
                        <span className="vc-type" style={v.typeStyle}>{v.type}</span>
                        {v.ad && <span className="vc-ad-tag">AD</span>}
                      </div>
                      <div className="vc-score"><strong>{v.score}</strong><span>/10</span></div>
                    </div>
                    <div className="vc-name">{v.name}</div>
                    <div className="vc-meta">
                      {(v.meta ?? []).map((m, i) => (
                        <span key={i} className="vc-meta-item">{(m.includes("동") || m.includes("면") || m.includes("시") ? "📍 " : m.includes("명") ? "👥 " : "🕐 ")}{m}</span>
                      ))}
                    </div>
                    <div className="vc-price">{v.price}</div>
                    <div className="vc-tags">
                      {v.tags.map((t) => (
                        <span key={t} className="vc-tag">{t}</span>
                      ))}
                    </div>
                    <p className="vc-review-preview">{v.reviewPreview}</p>
                    <div className="vc-footer">
                      <span className="vc-stars">{v.stars}</span>
                      <span className="vc-review-count">{v.reviewCount}</span>
                      <span className="vc-arrow">상세 →</span>
                    </div>
                  </Link>
                ))}
              </div>
              <div style={{ textAlign: "center", marginTop: 20 }}>
                <Link href={`/${region}/venues`} className="btn-ghost btn-sm">{r.name} 전체 업소 {Math.max(r.venues ?? 0, venueCards.length)}개 보기 →</Link>
              </div>
            </div>
            <div className="sidebar">
              <div className="sidebar-widget">
                <div className="sw-title">💰 {r.name} 평균 가격 (1인)</div>
                <table className="ptable">
                  <thead><tr><th>업종</th><th style={{ textAlign: "right" }}>평균</th><th style={{ textAlign: "right" }}>변동</th></tr></thead>
                  <tbody>
                    {cfg.priceRows.map((row, i) => (
                      <tr key={i}>
                        <td><span className="p-type">{row.type}</span></td>
                        <td className="p-val">{row.val}</td>
                        <td className={`p-chg ${row.chg}`}>{row.chg === "up" ? "↑" : row.chg === "dn" ? "↓" : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ fontSize: 10, color: "var(--dim)", marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>※ 주 1회 업데이트 · 실제 가격은 업소마다 상이</p>
              </div>
              <div className="sidebar-widget">
                <div className="sw-title">🗺 인근 지역 바로가기</div>
                <div className="nearby-list">
                  {otherRegions.slice(0, 3).map((o, i) => (
                    <Link key={o.slug} href={`/${o.slug}`} className="nearby-item">
                      <span className="nearby-icon">{["🔵", "🟢", "🟣"][i] || "📍"}</span>
                      <div className="nearby-info">
                        <div className="nearby-name">{o.name}</div>
                        <div className="nearby-sub">{o.venues}개 업소 · {o.reviews}개 리뷰</div>
                      </div>
                      <span className="nearby-arrow">→</span>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="sidebar-widget">
                <div className="sw-title">💡 {r.name} 이용 팁</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {cfg.tips.map((tip, i) => (
                    <div key={i} style={{ fontSize: 12, color: "var(--muted)", padding: "9px 10px", background: "var(--deep)", borderRadius: 5, borderLeft: `2px solid ${tip.color}`, lineHeight: 1.7 }}>
                      <strong style={{ color: "var(--text)", display: "block", marginBottom: 3 }}>{tip.title}</strong>
                      {tip.text}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: "linear-gradient(135deg,#1a1206,#0e0c04)", border: "1px solid var(--gold-dim)", borderRadius: "var(--radius)", padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 18, marginBottom: 6 }}>✦</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)", marginBottom: 4 }}>{r.name} 업소 등록</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12, lineHeight: 1.6 }}>룸빵여지도에 업소를 등록하고<br />방문자에게 직접 노출하세요</div>
                <Link href="/contact" className="btn-primary btn-sm" style={{ display: "block", textAlign: "center" }}>광고 문의하기</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="live-section section-sm">
        <div className="page-wrap">
          <div className="live-header">
            <div className="live-badge"><div className="live-dot" />LIVE</div>
            <h2 className="sec-title" style={{ marginBottom: 0, fontSize: 17 }}>{r.name} <span>최신 업데이트</span></h2>
          </div>
          <div className="feed-list">
            {(regionFeed.length > 0 ? regionFeed : feedItems.slice(0, 5)).map((f) => (
              <Link key={f.id} href={f.href} className="feed-item">
                <span className="feed-pill">{f.pill || r.name}</span>
                <div className="feed-content">
                  <div className="feed-title">{f.title}</div>
                  <div className="feed-sub">{f.sub}</div>
                </div>
                <div className="feed-stars">{f.stars}</div>
                <div className="feed-time">{f.time}</div>
              </Link>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Link href={`/${region}/reviews`} className="btn-ghost btn-sm">{r.name} 리뷰 전체 보기 →</Link>
          </div>
        </div>
      </section>

      <div className="page-wrap">
        <section className="section">
          <div className="sec-header">
            <div><p className="sec-label">LATEST REVIEWS · {r.name}</p><h2 className="sec-title">{r.name} <span>최신 리뷰</span></h2></div>
            <Link href={`/${region}/reviews`} className="see-all">전체 보기 →</Link>
          </div>
          <div className="review-grid">
            {(regionReviews.length > 0 ? regionReviews : reviews.slice(0, 3)).map((rev) => (
              <Link key={rev.id} href={rev.href} className="rv-card">
                <div className="rv-top">
                  <span className="rv-venue-tag">{rev.venue}</span>
                  <div style={{ display: "flex", gap: 5 }}>
                    {rev.is_new && <span className="rv-new">NEW</span>}
                    <span className="rv-date">{rev.date?.slice(-5) || ""}</span>
                  </div>
                </div>
                <h3 className="rv-title">{rev.title}</h3>
                <p className="rv-excerpt">{rev.excerpt}</p>
                <div className="rv-footer">
                  <span className="rv-stars">{rev.stars}</span>
                  <span className="rv-type">{rev.venue || "리뷰"}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="seo-section section">
        <div className="page-wrap">
            <p className="sec-label" style={{ marginBottom: 6 }}>GUIDE · {r.name}</p>
            <h2 className="sec-title">{r.name} <span>가라오케·유흥 완전 가이드</span></h2>
            <div className="seo-cols">
              {seo.cols.map((col, i) => (
                <div key={i} className="seo-col">
                  {col.blocks.map((b, j) =>
                    b.type === "h3" ? (
                      <h3 key={j} style={j > 0 ? { marginTop: 20 } : undefined} dangerouslySetInnerHTML={{ __html: b.content }} />
                    ) : (
                      <p key={j} dangerouslySetInnerHTML={{ __html: b.content }} />
                    )
                  )}
                </div>
              ))}
            </div>
            <div className="seo-kw-block">
              <h4>{r.name} 관련 검색어</h4>
              <div className="seo-kw-links">
                {seo.kwLinks.map((k, i) => (
                  <Link key={i} href={k.href} className="seo-kw-link">{k.text}</Link>
                ))}
              </div>
            </div>
        </div>
      </section>

      <div className="page-wrap">
        <div className="cta-strip">
          <h2>{r.name} 업소를 룸빵여지도에 등록하세요</h2>
          <p>{r.name} 유흥 정보를 찾는 방문자에게 직접 노출됩니다</p>
          <Link href="/contact" className="btn-primary">광고 및 등록 문의하기</Link>
        </div>
      </div>

      <Footer data={{ ...footer, cols: [{ title: `${r.name} 업종`, items: seo.kwLinks.slice(0, 4).map((k) => ({ label: k.text, href: k.href })) }, { title: "다른 지역", items: otherRegions.map((o) => ({ label: o.name, href: `/${o.slug}` })).concat([{ label: "전체 지역", href: "/regions" }]) }, { title: "서비스", items: [{ label: `${r.name} 리뷰`, href: `/${region}/reviews` }, { label: `${r.name} 랭킹`, href: `/${region}/ranking` }, { label: "이용 가이드", href: "/guide" }, { label: "광고 문의", href: "/contact" }] }] }} />
    </>
  );
}
