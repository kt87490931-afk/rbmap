import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { VenueEditModals } from "@/components/venue/VenueEditModals";
import { VenueEditButton } from "@/components/venue/VenueEditButton";

export const dynamic = "force-dynamic";
import {
  getVenueDetail,
  REGION_SLUGS,
  SLUG_TO_TYPE,
  REGION_SLUG_TO_NAME,
} from "@/lib/data/venues";
import { getSiteSection } from "@/lib/data/site";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://roombang.co.kr";

type PageParams = { region: string; category: string; venue: string };

function isValidRegion(region: string): region is (typeof REGION_SLUGS)[number] {
  return (REGION_SLUGS as readonly string[]).includes(region);
}

function isValidCategory(category: string): boolean {
  return !!SLUG_TO_TYPE[category];
}

function stripEmoji(s: string): string {
  return s.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{2705}]|[\u{274C}]/gu, "").trim();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { region, category, venue } = await params;

  if (!isValidRegion(region) || !isValidCategory(category)) {
    return {};
  }

  const data = await getVenueDetail(region, category, venue);
  if (!data) return {};

  const regionName = REGION_SLUG_TO_NAME[region] ?? region;
  const typeName = SLUG_TO_TYPE[category] ?? category;
  const title = `${data.name} | ${regionName} ${typeName} - 룸빵여지도`;
  const description = `${data.name} 상세 정보. ${regionName} ${typeName} 평점 ${data.rating}, 리뷰 ${data.reviewCount}개. 주소 ${data.location}, 연락처 ${data.contact}. 방문 전 예약 권장.`;
  const keywords = [
    data.name,
    `${regionName} ${data.name}`,
    `${regionName} ${typeName}`,
    `${data.name} 가격`,
    `${data.name} 후기`,
    `${data.name} 위치`,
  ].join(", ");

  const canonicalUrl = `${SITE_URL}${data.url}`;

  return {
    title,
    description,
    keywords,
    metadataBase: new URL(SITE_URL),
    openGraph: {
      title,
      description,
      type: "website",
      url: data.url,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { region, category, venue } = await params;

  if (!isValidRegion(region) || !isValidCategory(category)) {
    notFound();
  }

  const [data, header, footer] = await Promise.all([
    getVenueDetail(region, category, venue),
    getSiteSection<{ logo_icon?: string; logo_text?: string; nav?: { label: string; href: string }[] }>("header"),
    getSiteSection<{ desc?: string; copyright?: string; links?: { label: string; href: string }[] }>("footer"),
  ]);

  if (!data) notFound();

  const regionName = REGION_SLUG_TO_NAME[region] ?? region;
  const typeName = SLUG_TO_TYPE[category] ?? category;

  const canonicalUrl = `${SITE_URL}${data.url}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: data.name,
    description: `${regionName} ${typeName}. 평점 ${data.rating}, 리뷰 ${data.reviewCount}개.`,
    url: canonicalUrl,
    telephone: data.contact,
    address: {
      "@type": "PostalAddress",
      streetAddress: data.locationDetail || data.location,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: data.rating,
      reviewCount: data.reviewCount,
      bestRating: "5",
    },
  };

  const infoCards = data.infoCards ?? [];
  const tagline = data.tagline ?? data.introTitle ?? `${regionName} ${typeName} — ${data.name}`;
  const phoneSub = `${data.hours} · 전화·카카오 예약 가능`;

  /** v2: headline em 처리 (— 뒷부분 골드 강조) */
  const introHeadlineRaw = data.introHeadline ?? data.introTitle ?? `${data.name} — ${regionName} 소개`;
  const introHeadlineParts = introHeadlineRaw.split("—");
  const introHeadlineHtml = introHeadlineParts.length > 1
    ? `${introHeadlineParts[0].trim()} — <em>${introHeadlineParts[1].trim()}</em>`
    : introHeadlineRaw;

  const introLabel = data.introLabel ?? "ABOUT · 업소 소개";
  const introLead = data.introLead ?? (data.introParagraphs ?? [])[0] ?? "";
  const introQuote = data.introQuote;
  const introBodyParagraphs = (data.introBodyParagraphs ?? []).length > 0
    ? data.introBodyParagraphs!
    : (data.introParagraphs ?? []).slice(1);

  return (
    <div data-region={region} className="venue-detail-v2">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header data={header} />

      {/* Breadcrumb v2 */}
      <div className="breadcrumb">
        <div className="bc">
          <Link href="/">룸빵여지도</Link>
          <span className="bc-sep">›</span>
          <Link href={`/${region}`}>{regionName}</Link>
          <span className="bc-sep">›</span>
          <Link href={`/${region}/category/${category}`}>{typeName}</Link>
          <span className="bc-sep">›</span>
          <span className="bc-cur">{data.name}</span>
        </div>
      </div>

      {/* Hero Banner v2 */}
      <section className="hero-banner" id="hero">
        <VenueEditButton section="hero" />
        <div className="hb-bg" aria-hidden />
        <div className="hb-wave" aria-hidden>
          <svg viewBox="0 0 1200 400" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="wg1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c8a84b" stopOpacity={0.18} />
                <stop offset="55%" stopColor="#c8a84b" stopOpacity={0.05} />
                <stop offset="100%" stopColor="#c8a84b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="wg2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e6c96e" stopOpacity={0.12} />
                <stop offset="40%" stopColor="#e6c96e" stopOpacity={0.03} />
                <stop offset="100%" stopColor="#e6c96e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <polygon points="0,0 520,0 680,400 0,400" fill="url(#wg1)" />
            <polygon points="60,0 480,0 560,400 20,400" fill="url(#wg2)" />
            <line x1="0" y1="0" x2="900" y2="400" stroke="#e6c96e" strokeWidth={1} strokeOpacity={0.12} />
            <line x1="40" y1="0" x2="820" y2="400" stroke="#c8a84b" strokeWidth={0.5} strokeOpacity={0.08} />
          </svg>
        </div>
        <div className="hb-noise" aria-hidden />
        <div className="hb-inner">
          <div className="hb-top">
            <div className="hb-badges">
              <span className="hb-badge hb-badge-region" id="d-region">{regionName}</span>
              <span className="hb-badge hb-badge-type" id="d-type">{data.type}</span>
            </div>
            <h1 className="hb-name" id="d-name">{data.name}</h1>
            <p className="hb-tagline" id="d-tagline">{tagline}</p>
            <div className="hb-rating">
              <span className="hb-stars" id="d-stars">{data.stars}</span>
              <span className="hb-rnum" id="d-rnum">{data.rating}</span>
              <span className="hb-rmax">/ 5.0</span>
              <span className="hb-rcnt" id="d-rcnt">리뷰 {data.reviewCount}개</span>
              <span className="hb-live">
                <span className="hb-dot" />
                {data.updateText}
              </span>
            </div>
          </div>
          <div className="hb-phone-banner">
            <div className="hb-phone-left">
              <div className="hb-phone-label">예약 · 문의 전화</div>
              <div className="hb-phone-num" id="d-phone">{data.contact}</div>
              <div className="hb-phone-sub" id="d-phone-sub">{phoneSub}</div>
            </div>
            <div className="hb-phone-right">
              <a href={`tel:${data.contact.replace(/\D/g, "")}`} className="btn-call-hero" id="d-phone-link">
                <span>📞</span> 전화 예약
              </a>
              <Link href="/contact" className="btn-kakao">
                💬 카카오 상담
              </Link>
            </div>
          </div>
          <div className="hb-info-strip">
            {infoCards.slice(0, 5).map((card, i) => {
              const editId = i === 0 ? "d-price" : i === 1 ? "d-lineup" : i === 2 ? "d-hours" : i === 3 ? "d-parking" : undefined;
              return (
                <div key={i} className="hb-info-item">
                  <span className="hb-info-label">{stripEmoji(card.label)}</span>
                  <span id={editId} className={`hb-info-val ${card.gold ? "gold" : ""} ${card.green ? "green" : ""}`}>{card.val}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="hb-line" aria-hidden />
      </section>

      {/* Tab Nav v2 */}
      <nav className="tab-nav">
        <div className="tab-nav-inner">
          <a href="#intro" className="tab-btn active" data-tab="intro">업소 소개</a>
          <a href="#price" className="tab-btn" data-tab="price">가격 정보</a>
          <a href="#map" className="tab-btn" data-tab="map">위치·지도</a>
          <a href="#reviews" className="tab-btn" data-tab="reviews">리뷰 <span style={{ fontSize: 10, opacity: 0.6 }}>({data.reviewCount})</span></a>
          <a href="#similar" className="tab-btn" data-tab="similar">유사 업소</a>
        </div>
      </nav>

      {/* Article Body — 단일 컬럼 */}
      <div className="article-wrap">
        {/* 섹션 1: 업소 소개 — v2 DOM id 매핑 */}
        <section className="art-section" id="intro">
          <VenueEditButton section="intro" />
          <span className="sec-label" id="intro-label">{introLabel}</span>
          <h2 className="art-h2" id="intro-headline" dangerouslySetInnerHTML={{ __html: introHeadlineHtml }} />
          {introLead && <p className="art-lead" id="intro-lead">{introLead}</p>}
          {infoCards.length > 0 && (
            <div className="art-info-grid">
              {infoCards.slice(0, 4).map((card, i) => (
                <div key={i} className="art-info-card">
                  <div className="aic-label">{stripEmoji(card.label)}</div>
                  <div className={`aic-val ${card.green ? "green" : ""}`} style={card.gold && !card.green ? { color: "var(--gold)" } : undefined}>{card.val}</div>
                  <div className="aic-sub">{card.sub}</div>
                </div>
              ))}
            </div>
          )}
          <div id="intro-body">
            {introQuote && (
              <div className="art-quote">
                <p>{introQuote}</p>
              </div>
            )}
            {introBodyParagraphs.map((p, i) => (
              <p key={i} className="art-p" dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>") }} />
            ))}
          </div>
        </section>

        {/* 섹션 2: 가격 정보 — v2 DOM id 매핑 */}
        <section className="art-section" id="price">
          <VenueEditButton section="price" />
          <span className="sec-label">PRICE · 가격 안내</span>
          <h2 className="art-h2">가격 <em>안내</em></h2>
          {data.priceLead ? <p className="art-lead" id="price-lead">{data.priceLead}</p> : <p className="art-lead" id="price-lead" style={{ display: "none" }} />}
          <div id="price-table-wrap">
            <table className="price-table">
              <thead>
                <tr>
                  <th>구성</th>
                  <th>내용</th>
                  <th style={{ textAlign: "right" }}>가격 (1인)</th>
                  <th style={{ textAlign: "right" }}>비고</th>
                </tr>
              </thead>
              <tbody>
                {(data.priceRows ?? []).map((row, i) => (
                  <tr key={i}>
                    <td>
                      <div className="pt-name">{row.name}</div>
                      {row.desc && <div style={{ fontSize: 11, color: "var(--dim)" }}>{row.desc}</div>}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--muted)" }}>{row.duration || "—"}</td>
                    <td style={{ textAlign: "right" }}><span className="pt-price">{row.price}</span></td>
                    <td style={{ textAlign: "right" }}>
                      {row.badge && <span className={`pt-badge ${row.badge}`}>{row.badge === "recommend" ? "추천" : "인기"}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.priceNote && (
              <p className="price-note" id="price-note" dangerouslySetInnerHTML={{ __html: data.priceNote.split("\n").map((l) => l).join("<br />") }} />
            )}
          </div>
        </section>

        {/* 섹션 3: 위치·지도 */}
        <section className="art-section" id="map">
          <VenueEditButton section="map" />
          <span className="sec-label">LOCATION · 위치 및 오시는 길</span>
          <h2 className="art-h2">찾아오시는 <em>길</em></h2>
          <div className="map-wrap">
            {data.mapEmbed ? (
              <iframe src={data.mapEmbed} title="지도" />
            ) : (
              <div className="map-placeholder">
                <span>🗺</span>
                <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>구글맵 연동 예정<br /><span style={{ fontSize: 10, color: "var(--dim)" }}>{data.locationDetail || data.location}</span></p>
              </div>
            )}
          </div>
          <div className="map-address-bar">
            <span className="ma-icon">📍</span>
            <div>
              <div className="ma-main" id="d-address">{data.locationDetail || data.location}</div>
              {data.locationSub && <div className="ma-sub" id="d-address-sub">{data.locationSub}</div>}
            </div>
          </div>
        </section>

        {/* 섹션 4: 리뷰 */}
        <section className="art-section" id="reviews">
          <VenueEditButton section="reviews" />
          <span className="sec-label">REVIEWS · 이용 후기</span>
          <h2 className="art-h2">{data.name} <em>이용 후기</em></h2>
          <p className="art-lead">Gemini AI가 6시간마다 최신 후기를 수집·정리합니다.</p>
          <div className="fr-grid">
            {(data.reviews ?? []).map((r) => (
              <Link key={r.id} href={r.href} className="fr-card">
                <div className="fr-card-head">
                  <span className="fr-stars">{r.stars}</span>
                  <span className="fr-date">{r.date}</span>
                </div>
                <div className="fr-title">{r.title}</div>
                <div className="fr-body">
                  <p>{r.body}</p>
                </div>
                <div className="fr-more">전문 보기 →</div>
              </Link>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <Link href={`${data.url}/reviews`} style={{ display: "inline-block", padding: "11px 28px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12, color: "var(--muted)", textDecoration: "none", transition: "all 0.2s" }}>
              {data.name} 후기 전체 {data.reviewCount}개 보기 →
            </Link>
          </div>
        </section>

        {/* 섹션 5: 유사 업소 */}
        <section className="art-section" id="similar">
          <VenueEditButton section="similar" />
          <span className="sec-label">SIMILAR · {regionName} 유사 업소</span>
          <h2 className="art-h2">함께 보면 좋은 <em>{regionName} {typeName}</em></h2>
          {(data.similarVenues ?? []).length > 0 ? (
            <div className="similar-grid">
              {data.similarVenues!.map((sim) => (
                <Link key={sim.name} href={sim.href} className="sim-card">
                  <div className="sim-top">
                    <span className="sim-type" style={sim.typeStyle}>{sim.type}</span>
                    <span className="sim-score">{sim.score}</span>
                  </div>
                  <div className="sim-name">{sim.name}</div>
                  <div className="sim-price">{sim.price}</div>
                  <p className="sim-preview">{sim.preview}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="art-p" style={{ color: "var(--dim)" }}>등록된 유사 업소가 없습니다.</p>
          )}
        </section>

        {/* SEO 섹션 */}
        {(data.seoCols ?? []).length > 0 && (
          <section className="art-section" id="seo-section">
            <span className="sec-label">GUIDE · {regionName} {typeName} 이용 가이드</span>
            <h2 className="art-h2">{regionName} {typeName} <em>완벽 가이드</em></h2>
            {data.seoCols.map((col, i) => (
              <div key={i}>
                {col.blocks.map((b, j) =>
                  b.type === "h3" ? (
                    <h3 key={j} style={{ marginTop: j > 0 ? 20 : 0, fontSize: 16, fontWeight: 700, color: "#e4e4e4", marginBottom: 12 }} dangerouslySetInnerHTML={{ __html: b.content }} />
                  ) : (
                    <p key={j} className="art-p" dangerouslySetInnerHTML={{ __html: b.content }} />
                  )
                )}
              </div>
            ))}
            {(data.seoKwLinks ?? []).length > 0 && (
              <div className="seo-kw" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 16 }}>
                {data.seoKwLinks.map((k, i) => (
                  <Link key={i} href={k.href} style={{ fontSize: 11, color: "var(--dim)", textDecoration: "none", border: "1px solid var(--border2)", padding: "3px 9px", borderRadius: 3 }}>{k.text}</Link>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* 편집 모달 */}
      <VenueEditModals
        data={{
          name: data.name,
          region: regionName,
          type: data.type,
          contact: data.contact,
          location: data.location,
          locationDetail: data.locationDetail,
          locationSub: data.locationSub,
          hours: data.hours,
          tagline: data.tagline,
          introLabel: data.introLabel,
          introHeadline: data.introHeadline ?? data.introTitle,
          introLead: data.introLead ?? (data.introParagraphs ?? [])[0],
          introQuote: data.introQuote,
          introBodyParagraphs: data.introBodyParagraphs ?? [],
          introTitle: data.introTitle,
          introParagraphs: data.introParagraphs ?? [],
          priceLead: data.priceLead,
          priceNote: data.priceNote,
          mapEmbed: data.mapEmbed,
          infoCards: data.infoCards ?? [],
        }}
      />

      {/* Mobile CTA */}
      <div className="mobile-cta">
        <a href={`tel:${data.contact.replace(/\D/g, "")}`} className="btn-m mcta-call">📞 전화 예약</a>
        <Link href="/contact" className="btn-m mcta-kakao">💬 카카오</Link>
      </div>

      {/* CTA Strip */}
      <div className="page-wrap">
        <div className="cta-strip">
          <h2>{data.name} 예약 및 문의</h2>
          <p>전화·카카오톡으로 편하게 예약하세요. 방문 전 가격 확인을 권장합니다.</p>
          <a href={`tel:${data.contact.replace(/\D/g, "")}`} className="btn-primary">전화 예약하기</a>
        </div>
      </div>

      <Footer
        data={{
          ...footer,
          cols: [
            { title: `${regionName} 업종`, items: (data.seoKwLinks ?? []).slice(0, 4).map((k) => ({ label: k.text, href: k.href })) },
            { title: "다른 지역", items: REGION_SLUGS.filter((s) => s !== region).slice(0, 4).map((s) => ({ label: REGION_SLUG_TO_NAME[s], href: `/${s}` })).concat([{ label: "전체 지역", href: "/regions" }]) },
            { title: "서비스", items: [{ label: `${regionName} 리뷰`, href: `/${region}/reviews` }, { label: `${regionName} 랭킹`, href: `/${region}/ranking` }, { label: "이용 가이드", href: "/guide" }, { label: "광고 문의", href: "/contact" }] },
          ],
        }}
      />
    </div>
  );
}
