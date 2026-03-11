import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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

  return (
    <div data-region={region}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header data={header} />

      <div className="breadcrumb">
        <div className="breadcrumb-inner">
          <Link href="/">룸빵여지도</Link>
          <span className="breadcrumb-sep">›</span>
          <Link href="/regions">지역</Link>
          <span className="breadcrumb-sep">›</span>
          <Link href={`/${region}`}>{regionName}</Link>
          <span className="breadcrumb-sep">›</span>
          <Link href={`/${region}/category/${category}`}>{typeName}</Link>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-current">{data.name}</span>
        </div>
      </div>

      <section className="venue-hero">
        <div className="vh-glow" aria-hidden />
        <div className="vh-grid" aria-hidden />
        <div className="vh-inner">
          <div className="vh-gallery">
            <div className="vh-photo-main">
              <span>🎤</span>
              {data.ad && <span className="vh-ad-ribbon">AD</span>}
            </div>
            <div className="vh-photo-sub"><span>🎵</span></div>
            <div className="vh-photo-sub"><span>🍾</span></div>
          </div>
          <div className="vh-info">
            <div className="vh-info-left">
              <div className="vh-badge-row">
                <span className="vh-region-badge">{regionName}</span>
                <span className="vh-type-badge" style={{ background: "var(--region-dim)", border: "1px solid var(--region-border)", color: "var(--region)" }}>{data.type}</span>
                {data.ad && <span className="vh-ad-badge">AD</span>}
              </div>
              <h1 className="vh-name">{data.name}</h1>
              <div className="vh-rating-row">
                <span className="vh-stars">{data.stars}</span>
                <span className="vh-rating-num">{data.rating}</span>
                <span className="vh-rating-max">/ 5.0</span>
                <span className="vh-review-count">리뷰 {data.reviewCount}개</span>
                <div className="vh-update">
                  <span className="vh-live-dot" />
                  {data.updateText}
                </div>
              </div>
            </div>
            <div className="vh-info-right">
              <div className="vh-cta-group">
                <a href={`tel:${data.contact.replace(/\D/g, "")}`} className="btn-call">
                  📞 전화
                </a>
                <Link href="/contact" className="btn-primary btn-sm" style={{ textAlign: "center" }}>
                  예약 문의
                </Link>
              </div>
              <div className="vh-contact-info">
                <div className="vh-contact-item">
                  <span className="vh-contact-label">전화</span>
                  <span className="vh-contact-val">
                    <a href={`tel:${data.contact.replace(/\D/g, "")}`}>{data.contact}</a>
                  </span>
                </div>
                <div className="vh-contact-item">
                  <span className="vh-contact-label">주소</span>
                  <span className="vh-contact-val">{data.location}</span>
                </div>
                <div className="vh-contact-item">
                  <span className="vh-contact-label">영업</span>
                  <span className={`vh-contact-val ${data.hoursStyle === "open" ? "op-open" : ""}`}>{data.hours}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <nav className="tab-nav">
        <div className="tab-nav-inner">
          <a href="#info" className="tab-btn active">정보</a>
          <a href="#price" className="tab-btn">가격</a>
          <a href="#reviews" className="tab-btn">리뷰</a>
          <a href="#similar" className="tab-btn">비슷한 업소</a>
        </div>
      </nav>

      <div className="page-wrap">
        <div className="content-with-sidebar layout-main-side">
          <div>
            <div id="info" />
            <div className="info-grid">
              {(data.infoCards ?? []).map((card, i) => (
                <div key={i} className="info-card">
                  <div className="info-card-label">{card.label}</div>
                  <div className={`info-card-val ${card.gold ? "gold" : ""} ${card.green ? "op-open" : ""}`}>{card.val}</div>
                  <div className="info-card-sub">{card.sub}</div>
                </div>
              ))}
            </div>

            <h2 className="sec-title" style={{ marginTop: 28, marginBottom: 12 }}>{data.introTitle}</h2>
            <div style={{ marginBottom: 28 }}>
              {(data.introParagraphs ?? []).map((p, i) => (
                <p key={i} style={{ marginBottom: 12, color: "var(--muted)", fontSize: 13, lineHeight: 1.9 }} dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
              ))}
            </div>

            <div className="map-wrap">
              {data.mapEmbed ? (
                <iframe src={data.mapEmbed} title="지도" />
              ) : (
                <div className="map-placeholder">
                  <span>🗺</span>
                  <p>지도 연동 예정<br />{data.locationDetail || data.location}</p>
                  {data.locationSub && <p style={{ fontSize: 11 }}>{data.locationSub}</p>}
                </div>
              )}
            </div>
            {data.locationDetail && (
              <div className="map-address">
                <span>📍</span>
                <span>{data.locationDetail}</span>
              </div>
            )}
          </div>

          <aside className="sidebar">
            <div className="sw">
              <div className="sw-head">빠른 연락</div>
              <div className="sw-body">
                <div className="quick-contact">
                  <a href={`tel:${data.contact.replace(/\D/g, "")}`} className="qc-item">
                    <span className="qc-icon">📞</span>
                    <div>
                      <div className="qc-label">전화</div>
                      <div className="qc-val">{data.contact}</div>
                    </div>
                  </a>
                  <Link href="/contact" className="qc-item">
                    <span className="qc-icon">✉</span>
                    <div>
                      <div className="qc-label">예약 문의</div>
                      <div className="qc-val">카톡 / 전화</div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {(data.opList ?? []).length > 0 && (
              <div className="sw">
                <div className="sw-head">운영 정보</div>
                <div className="sw-body">
                  <div className="op-list">
                    {data.opList.map((op, i) => (
                      <div key={i} className="op-item">
                        <span className="op-label">{op.label}</span>
                        <span className={`op-val ${op.open ? "op-open" : ""}`}>{op.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {(data.stats ?? []).length > 0 && (
              <div className="sidebar-widget">
                <div className="sw-title">📊 통계</div>
                <div className="stat-grid">
                  {data.stats.map((s, i) => (
                    <div key={i} className="stat-item">
                      <div className="stat-val">{s.val}</div>
                      <div className="stat-label">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(data.nearbyVenues ?? []).length > 0 && (
              <div className="sidebar-widget">
                <div className="sw-title">📍 인근 업소</div>
                <div className="nearby-venue-list">
                  {data.nearbyVenues.map((nv) => (
                    <Link key={nv.rank} href={nv.href} className="nv-item">
                      <span className="nv-rank">{nv.rank}</span>
                      <div className="nv-info">
                        <div className="nv-name">{nv.name}</div>
                        <div className="nv-sub">{nv.sub}</div>
                      </div>
                      <span className="nv-score">{nv.score}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="ad-cta-box">
              <h4>✦ 업소 등록</h4>
              <p>룸빵여지도에 업소를 등록하고 방문자에게 직접 노출하세요</p>
              <Link href="/contact" className="btn-primary btn-sm" style={{ display: "block", textAlign: "center" }}>광고 문의</Link>
            </div>
          </aside>
        </div>
      </div>

      <section id="price" className="price-section section-sm">
        <div className="page-wrap">
          <div className="sec-header" style={{ marginBottom: 20 }}>
            <div><p className="sec-label">PRICE</p><h2 className="sec-title">가격 안내</h2></div>
          </div>
          <div className="price-table-wrap">
            <table className="ptable">
              <thead>
                <tr>
                  <th>상품</th>
                  <th>내용</th>
                  <th>시간</th>
                  <th style={{ textAlign: "right" }}>가격</th>
                </tr>
              </thead>
              <tbody>
                {(data.priceRows ?? []).map((row, i) => (
                  <tr key={i}>
                    <td>
                      <div className="p-item-name">
                        {row.name}
                        {row.badge && <span className={`p-badge ${row.badge}`}>{row.badge === "recommend" ? "추천" : "인기"}</span>}
                      </div>
                    </td>
                    <td><div className="p-item-desc">{row.desc}</div></td>
                    <td>{row.duration}</td>
                    <td style={{ textAlign: "right" }}><span className="p-price">{row.price}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.priceNote && (
              <div className="price-note">{data.priceNote.split("\n").map((line, i) => <p key={i}>{line}</p>)}</div>
            )}
          </div>
        </div>
      </section>

      <section id="reviews" className="section section-sm" style={{ background: "var(--deep)" }}>
        <div className="page-wrap">
          <div className="sec-header" style={{ marginBottom: 20 }}>
            <div><p className="sec-label">REVIEWS</p><h2 className="sec-title">이용 후기</h2></div>
            <Link href={`${data.url}/reviews`} className="see-all">전체 리뷰 →</Link>
          </div>

          {(data.reviewBars ?? []).length > 0 && (
            <div className="review-summary">
              <div className="rs-score">
                <span className="rs-score-num">{data.rating}</span>
                <span className="rs-score-stars">{data.stars}</span>
                <span className="rs-score-count">리뷰 {data.reviewCount}개</span>
              </div>
              <div className="rs-bars">
                {data.reviewBars.map((bar, i) => (
                  <div key={i} className="rs-bar-row">
                    <span className="rs-bar-label">{bar.label}</span>
                    <div className="rs-bar-track"><div className="rs-bar-fill" style={{ width: `${bar.width}%` }} /></div>
                    <span className="rs-bar-count">{bar.count}</span>
                  </div>
                ))}
              </div>
              {(data.aspects ?? []).length > 0 && (
                <div className="rs-aspects">
                  {data.aspects.map((a, i) => (
                    <div key={i} className="rs-aspect">
                      <span className="rs-aspect-label">{a.label}</span>
                      <span className="rs-aspect-val">{a.val}</span>
                      <div className="rs-aspect-bar"><div className="rs-aspect-fill" style={{ width: `${a.width}%` }} /></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="review-filter">
            <button type="button" className="rf-btn active">전체</button>
            <button type="button" className="rf-btn">최신순</button>
            <button type="button" className="rf-btn">별점순</button>
          </div>

          <div className="fr-grid">
            {(data.reviews ?? []).map((r) => (
              <Link key={r.id} href={r.href} className="fr-card">
                <div className="fr-head">
                  <div className="fr-head-left">
                    <span className="fr-num">#{r.id}</span>
                    <span className="fr-region-pill" style={{ background: "var(--region-dim)", color: "var(--region)" }}>{regionName}</span>
                    <span className="fr-type">{data.type}</span>
                  </div>
                  <span className="fr-date">{r.date}</span>
                </div>
                <h3 className="fr-title">{r.title}</h3>
                <div className="fr-stars">
                  <span className="fr-stars-val">{r.stars}</span>
                  <span className="fr-stars-num">{r.starsNum}</span>
                </div>
                <div className="fr-body">
                  <p>{r.body}</p>
                </div>
                <div className="fr-footer">
                  <span className="fr-char-count">{r.charCount}</span>
                  <span className="fr-read-more">전체 보기 →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {(data.similarVenues ?? []).length > 0 && (
        <section id="similar" className="similar-section section section-sm">
          <div className="page-wrap">
            <div className="sec-header" style={{ marginBottom: 20 }}>
              <div><p className="sec-label">SIMILAR</p><h2 className="sec-title">비슷한 업소</h2></div>
            </div>
            <div className="similar-grid">
              {data.similarVenues.map((sim) => (
                <Link key={sim.name} href={sim.href} className="sim-card">
                  <div className="sim-top">
                    <span className="sim-type" style={sim.typeStyle}>{sim.type}</span>
                    <span className="sim-score">{sim.score}</span>
                  </div>
                  <div className="sim-name">{sim.name}</div>
                  <div className="sim-price">{sim.price}</div>
                  <p className="sim-preview">{sim.preview}</p>
                  <div className="sim-footer">
                    <span className="sim-stars">{sim.stars}</span>
                    <span className="sim-arrow">상세 →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {(data.seoCols ?? []).length > 0 && (
        <section className="seo-section section">
          <div className="page-wrap">
            <p className="sec-label" style={{ marginBottom: 6 }}>GUIDE</p>
            <h2 className="sec-title">{data.name} <span>완전 가이드</span></h2>
            <div className="seo-cols">
              {data.seoCols.map((col, i) => (
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
            {(data.seoKwLinks ?? []).length > 0 && (
              <div className="seo-kw-block">
                <h4>{data.name} 관련 검색어</h4>
                <div className="seo-kw-links">
                  {data.seoKwLinks.map((k, i) => (
                    <Link key={i} href={k.href} className="seo-kw-link">{k.text}</Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

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
