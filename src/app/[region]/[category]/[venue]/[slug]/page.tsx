import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import {
  getPublishedReviewPostWithVenueFix,
  getReviewPostsByVenue,
  getReviewPostsByRegion,
  getPrevNextReviews,
  getRegionName,
  getTypeName,
  formatStars,
  buildReviewUrl,
  REVIEW_TYPE_TO_NAME,
  getPartnerContactForVenue,
} from '@/lib/data/review-posts'
import { getVenueDetail } from '@/lib/data/venues'
import { getRegionBySlugServer, getRegionsServer } from '@/lib/data/regions'
import { getSiteSection } from '@/lib/data/site'
import { CallTrackLink } from '@/components/venue/CallTrackLink'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rbbmap.com'

type Params = { region: string; category: string; venue: string; slug: string }

/** 리뷰 페이지는 항상 서버에서 렌더링. 메타는 [slug]/layout.tsx에서 생성. */
export const dynamic = 'force-dynamic'

export default async function ReviewReadPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { region, category, venue, slug } = await params
  const slugDecoded = slug ? decodeURIComponent(slug) : slug

  const regionData = await getRegionBySlugServer(region)
  if (!regionData || regionData.coming || !REVIEW_TYPE_TO_NAME[category]) {
    notFound()
  }

  const resolved = await getPublishedReviewPostWithVenueFix(region, category, venue, slugDecoded)
  if (!resolved) notFound()
  if (resolved.redirectToCanonical) {
    redirect(resolved.redirectToCanonical)
  }
  const post = resolved.post
  const venueKey = post.venue_slug

  const [sameVenueReviews, sameRegionReviews, prevNext, venueData, header, footer, allRegions] = await Promise.all([
    getReviewPostsByVenue(region, venueKey, post.id, 5),
    getReviewPostsByRegion(region, category, venueKey, 5),
    post.published_at ? getPrevNextReviews(post.published_at, post.id) : Promise.resolve({ prev: null, next: null }),
    getVenueDetail(region, category, venueKey),
    getSiteSection<{ logo_icon?: string; logo_text?: string; nav?: { label: string; href: string }[] }>('header'),
    getSiteSection<{ desc?: string; copyright?: string }>('footer'),
    getRegionsServer(),
  ])

  const venueDisplayName = (venueData?.name ?? post.venue).trim() || post.venue
  let contact = (venueData?.contact ?? '').trim()
  if (!contact) {
    const partnerContact = await getPartnerContactForVenue(region, category, venueKey, venueDisplayName)
    contact = (partnerContact?.contact ?? '').trim()
  }

  const regionName = regionData.name ?? getRegionName(region)
  const typeName = getTypeName(category)
  const venueUrl = `/${region}/${category}/${venueKey}`
  const totalChars =
    post.sec_overview.length +
    post.sec_lineup.length +
    post.sec_price.length +
    post.sec_facility.length +
    post.sec_summary.length

  const reviewPath = buildReviewUrl(region, category, venueKey, post.slug)
  const canonicalUrl = `${SITE_URL}${reviewPath}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    name: post.title,
    url: canonicalUrl,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    author: { '@type': 'Organization', name: '룸빵여지도', url: SITE_URL },
    publisher: { '@type': 'Organization', name: '룸빵여지도', url: SITE_URL },
    reviewBody: post.sec_overview || post.sec_summary,
    reviewRating: { '@type': 'Rating', ratingValue: String(post.star), bestRating: '5' },
    itemReviewed: { '@type': 'LocalBusiness', name: venueDisplayName },
    datePublished: post.published_at || post.visit_date,
    dateModified: post.updated_at || post.published_at || post.visit_date,
  }

  const { prev, next } = prevNext

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header data={header} />

      <div className="breadcrumb">
        <div className="breadcrumb-inner">
          <Link href="/">룸빵여지도</Link>
          <span className="breadcrumb-sep">›</span>
          <Link href={`/${region}`}>{regionName}</Link>
          <span className="breadcrumb-sep">›</span>
          <Link href={`/${region}/${category}`}>{typeName}</Link>
          <span className="breadcrumb-sep">›</span>
          <Link href={venueUrl}>{venueDisplayName}</Link>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-current">{post.title}</span>
        </div>
      </div>

      <div className="art-header" data-region={region}>
        <div className="ah-glow" aria-hidden />
        <div className="ah-grid" aria-hidden />
        <div className="ah-inner">
          <div className="ah-badges">
            <span className="ah-region">{regionName}</span>
            <span className="ah-type">{typeName}</span>
            <Link href={venueUrl} className="ah-vtag">
              {venueDisplayName}
            </Link>
          </div>
          <h1 className="ah-title">{post.title}</h1>
          <div className="ah-meta">
            <span className="ah-stars">{formatStars(post.star)}</span>
            <span className="ah-rating">{post.star}.0</span>
            <span className="ah-date">
              {post.published_at
                ? new Date(post.published_at).toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : post.visit_date || ''}
            </span>
            <span className="ah-char">약 {totalChars}자</span>
          </div>
        </div>
      </div>

      <div className="page-wrap">
        <div className="article-layout">
          <article className="art-body">
            {(contact || post.summary_price || post.summary_lineup || post.summary_price_type || (post.scenario_used?.core_keywords?.length ?? 0) > 0 || post.scenario_used?.purpose_label) && (
              <div className="summary-box">
                <h4>✦ 핵심 요약</h4>
                {contact && (
                  <div className="summary-contact-banner">
                    {(() => {
                      const digits = contact.replace(/\D/g, '')
                      const isPhone = digits.length >= 10
                      return isPhone ? (
                        <CallTrackLink href={`tel:${digits}`} path={venueUrl} className="summary-contact-num">
                          {contact}
                        </CallTrackLink>
                      ) : (
                        <span className="summary-contact-num">{contact}</span>
                      )
                    })()}
                  </div>
                )}
                {(post.summary_price || post.summary_lineup || post.summary_price_type) && (
                <div className="summary-grid">
                  {post.summary_price && (
                    <div className="summary-item">
                      <strong>{post.summary_price}</strong>
                      <span>1인 주대</span>
                    </div>
                  )}
                  {post.summary_lineup && (
                    <div className="summary-item">
                      <strong>{post.summary_lineup}</strong>
                      <span>라인업</span>
                    </div>
                  )}
                  {post.summary_price_type && (
                    <div className="summary-item">
                      <strong>{post.summary_price_type}</strong>
                      <span>가격 방식</span>
                    </div>
                  )}
                </div>
                )}
                {(post.scenario_used?.core_keywords?.length ?? 0) > 0 && (
                  <div className="summary-keywords" style={{ marginTop: 12 }}>
                    {(post.scenario_used?.core_keywords ?? []).map((kw, i) => (
                      <span key={i} className="eval-tag good" style={{ marginRight: 6, marginBottom: 6 }}>{kw}</span>
                    ))}
                  </div>
                )}
                {post.scenario_used?.purpose_label && (
                  <div className="summary-purpose" style={{ marginTop: 8, fontSize: 13, color: 'var(--muted, #888)' }}>
                    이 리뷰가 어울리는 목적: <strong style={{ color: 'inherit' }}>{post.scenario_used.purpose_label}</strong>
                  </div>
                )}
              </div>
            )}

            <Link href={venueUrl} className="venue-link-card">
              <span className="vlc-icon">🎤</span>
              <div className="vlc-info">
                <div className="vlc-label">이 리뷰의 업소</div>
                <div className="vlc-name">{venueDisplayName}</div>
                <div className="vlc-sub">{regionName} · {typeName}</div>
              </div>
              <span className="vlc-arrow">›</span>
            </Link>

            {post.sec_overview && (
              <>
                <h2>방문 개요</h2>
                {post.sec_overview.split('\n').map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </>
            )}
            {post.sec_lineup && (
              <>
                <h2>라인업 / 서비스 분석</h2>
                {post.sec_lineup.split('\n').map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </>
            )}
            {post.sec_price && (
              <>
                <h2>가격 분석</h2>
                {post.sec_price.split('\n').map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </>
            )}
            {post.sec_facility && (
              <>
                <h2>시설 / 분위기</h2>
                {post.sec_facility.split('\n').map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </>
            )}

            {(post.good_tags.length > 0 || post.bad_tags.length > 0) && (
              <div className="eval-tags">
                {post.good_tags.map((t, i) => (
                  <span key={`g${i}`} className="eval-tag good">✓ {t}</span>
                ))}
                {post.bad_tags.map((t, i) => (
                  <span key={`b${i}`} className="eval-tag neutral">△ {t}</span>
                ))}
              </div>
            )}

            <div className="art-divider" />

            <div className="art-nav">
              {prev ? (
                <Link href={buildReviewUrl(prev.region, prev.type, prev.venue_slug, prev.slug)} className="an-btn">
                  <div className="an-label">◀ 이전 리뷰</div>
                  <div className="an-title">{prev.title}</div>
                </Link>
              ) : (
                <div />
              )}
              {next ? (
                <Link href={buildReviewUrl(next.region, next.type, next.venue_slug, next.slug)} className="an-btn next">
                  <div className="an-label">다음 리뷰 ▶</div>
                  <div className="an-title">{next.title}</div>
                </Link>
              ) : (
                <div />
              )}
            </div>
          </article>

          <aside className="sidebar">
            <div className="sw">
              <div className="sw-head">🎤 업소 정보</div>
              <div className="sw-body">
                <Link href={venueUrl} className="venue-mini">
                  <div className="vm-name">{venueDisplayName}</div>
                  <div className="vm-stars">{formatStars(post.star)} {post.star}.0</div>
                </Link>
                <div className="vm-list">
                  <div className="vm-item">
                    <span className="vm-label">지역</span>
                    <span className="vm-val">{regionName}</span>
                  </div>
                  <div className="vm-item">
                    <span className="vm-label">업종</span>
                    <span className="vm-val">{typeName}</span>
                  </div>
                </div>
                {contact && (() => {
                  const digits = contact.replace(/\D/g, '')
                  const isPhone = digits.length >= 10
                  return (
                    <div className="hb-phone-banner sw-phone-banner">
                      <div className="hb-phone-left">
                        <div className="hb-phone-label">{isPhone ? '예약 · 문의 전화' : '광고 · 문의'}</div>
                        {isPhone ? (
                          <CallTrackLink href={`tel:${digits}`} path={venueUrl} className="hb-phone-num">
                            {contact}
                          </CallTrackLink>
                        ) : (
                          <div className="hb-phone-num">{contact}</div>
                        )}
                        <div className="hb-phone-sub">
                          {isPhone ? `${venueData?.hours ?? '영업시간 문의'} · 전화·문자 예약 가능` : '텔레그램으로 문의하세요'}
                        </div>
                      </div>
                    </div>
                  )
                })()}
                <Link href={venueUrl} className="vm-btn">업소 상세 페이지 →</Link>
              </div>
            </div>

            {sameVenueReviews.length > 0 && (
              <div className="sw">
                <div className="sw-head">📋 {venueDisplayName} 다른 리뷰</div>
                <div className="sw-body" style={{ padding: '0 16px' }}>
                  <div className="rel-list">
                    {sameVenueReviews.map((r) => (
                      <Link key={r.id} href={buildReviewUrl(r.region, r.type, r.venue_slug, r.slug)} className="rel-item">
                        <div className="rel-title">{r.title}</div>
                        <div className="rel-meta">
                          <span className="rel-stars">{formatStars(r.star)}</span>
                          <span>{r.published_at ? new Date(r.published_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }) : ''}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {sameRegionReviews.length > 0 && (
              <div className="sw">
                <div className="sw-head">🏆 {regionName} 다른 {typeName}</div>
                <div className="sw-body" style={{ padding: '0 16px' }}>
                  <div className="rel-list">
                    {sameRegionReviews.map((r) => (
                      <Link key={r.id} href={buildReviewUrl(r.region, r.type, r.venue_slug, r.slug)} className="rel-item">
                        <div className="rel-title">{r.title}</div>
                        <div className="rel-meta">
                          <span className="rel-stars">{formatStars(r.star)}</span>
                          <span>{r.published_at ? new Date(r.published_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }) : ''}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <Link href="/reviews" className="see-all-link">
              전체 리뷰 보기 →
            </Link>
          </aside>
        </div>
      </div>

      <Footer
        data={{
          ...footer,
          cols: [
            { title: '지역', items: allRegions.filter((r) => !r.coming).slice(0, 4).map((r) => ({ label: r.name, href: `/${r.slug}` })) },
            { title: '서비스', items: [{ label: '전체 리뷰', href: '/reviews' }, { label: '랭킹', href: '/ranking' }, { label: '광고 문의', href: '/contact' }] },
          ],
        }}
      />
    </>
  )
}
