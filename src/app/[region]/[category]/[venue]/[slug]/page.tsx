import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import {
  getReviewPostBySlug,
  getReviewPostsByVenue,
  getReviewPostsByRegion,
  getPrevNextReviews,
  getRegionName,
  getTypeName,
  formatStars,
  buildReviewUrl,
  getPartnerMetaForVenue,
  REVIEW_TYPE_TO_NAME,
} from '@/lib/data/review-posts'
import { REGION_SLUG_TO_NAME, REGION_SLUGS } from '@/lib/data/venues'
import { getSiteSection } from '@/lib/data/site'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rbbmap.com'

type Params = { region: string; category: string; venue: string; slug: string }

function isValidRegion(r: string): r is (typeof REGION_SLUGS)[number] {
  return (REGION_SLUGS as readonly string[]).includes(r)
}

const META_DESC_MAX = 160

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { region, category, venue, slug } = await params
  const [post, partnerMeta] = await Promise.all([
    getReviewPostBySlug(region, category, venue, slug),
    getPartnerMetaForVenue(region, category, venue),
  ])
  if (!post) return {}

  const title = `${post.title} | 룸빵여지도`
  let desc = post.meta_description || post.sec_overview?.slice(0, 120) || `${post.venue} ${getTypeName(post.type)} 이용 후기`
  if (partnerMeta?.desc && desc.length < 100) {
    const extra = partnerMeta.desc.slice(0, 80).trim()
    if (extra) desc = (desc + ' ' + extra).slice(0, META_DESC_MAX)
  } else if (desc.length > META_DESC_MAX) {
    desc = desc.slice(0, META_DESC_MAX)
  }
  const canonicalPath = buildReviewUrl(region, category, venue, slug)
  const canonicalUrl = `${SITE_URL}${canonicalPath}`
  const ogImage = `${SITE_URL}/og/og-home.png`

  const metadata: Metadata = {
    title,
    description: desc,
    openGraph: {
      title: `${post.title} | 룸빵여지도`,
      description: desc,
      type: 'article',
      url: canonicalUrl,
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${post.venue} 이용 후기 | 룸빵여지도` }],
    },
    alternates: { canonical: canonicalUrl },
    robots: { index: true, follow: true },
  }
  if (partnerMeta?.tags?.length) {
    metadata.keywords = partnerMeta.tags.join(', ')
  }
  return metadata
}

export default async function ReviewReadPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { region, category, venue, slug } = await params

  if (!isValidRegion(region) || !REVIEW_TYPE_TO_NAME[category]) {
    notFound()
  }

  const slugDecoded = slug ? decodeURIComponent(slug) : slug
  const post = await getReviewPostBySlug(region, category, venue, slugDecoded)
  if (!post) notFound()

  const [sameVenueReviews, sameRegionReviews, prevNext, header, footer] = await Promise.all([
    getReviewPostsByVenue(region, venue, post.id, 5),
    getReviewPostsByRegion(region, category, venue, 5),
    post.published_at ? getPrevNextReviews(post.published_at, post.id) : Promise.resolve({ prev: null, next: null }),
    getSiteSection<{ logo_icon?: string; logo_text?: string; nav?: { label: string; href: string }[] }>('header'),
    getSiteSection<{ desc?: string; copyright?: string }>('footer'),
  ])

  const regionName = getRegionName(region)
  const typeName = getTypeName(category)
  const venueUrl = `/${region}/${category}/${venue}`
  const totalChars =
    post.sec_overview.length +
    post.sec_lineup.length +
    post.sec_price.length +
    post.sec_facility.length +
    post.sec_summary.length

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    name: post.title,
    author: { '@type': 'Organization', name: '룸빵여지도' },
    reviewBody: post.sec_overview || post.sec_summary,
    reviewRating: { '@type': 'Rating', ratingValue: String(post.star), bestRating: '5' },
    itemReviewed: { '@type': 'LocalBusiness', name: `${post.venue} ${typeName}` },
    datePublished: post.published_at || post.visit_date,
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
          <Link href={venueUrl}>{post.venue}</Link>
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
              {post.venue}
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
            {post.is_ai_written && <span className="ah-ai">AI 작성</span>}
            <span className="ah-char">약 {totalChars}자</span>
          </div>
        </div>
      </div>

      <div className="page-wrap">
        <div className="article-layout">
          <article className="art-body">
            {(post.summary_rating || post.summary_price || post.summary_lineup || post.summary_price_type) && (
              <div className="summary-box">
                <h4>✦ 핵심 요약</h4>
                <div className="summary-grid">
                  {post.summary_rating && (
                    <div className="summary-item">
                      <strong>{post.summary_rating}</strong>
                      <span>종합 평점</span>
                    </div>
                  )}
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
              </div>
            )}

            <Link href={venueUrl} className="venue-link-card">
              <span className="vlc-icon">🎤</span>
              <div className="vlc-info">
                <div className="vlc-label">이 리뷰의 업소</div>
                <div className="vlc-name">{post.venue}</div>
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
            {post.sec_summary && (
              <>
                <h2>종합 평가</h2>
                {post.sec_summary.split('\n').map((p, i) => (
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
                  <div className="vm-name">{post.venue}</div>
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
                <Link href={venueUrl} className="vm-btn">업소 상세 페이지 →</Link>
              </div>
            </div>

            {sameVenueReviews.length > 0 && (
              <div className="sw">
                <div className="sw-head">📋 {post.venue} 다른 리뷰</div>
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
            { title: '지역', items: REGION_SLUGS.slice(0, 4).map((s) => ({ label: REGION_SLUG_TO_NAME[s] ?? s, href: `/${s}` })) },
            { title: '서비스', items: [{ label: '전체 리뷰', href: '/reviews' }, { label: '랭킹', href: '/ranking' }, { label: '광고 문의', href: '/contact' }] },
          ],
        }}
      />
    </>
  )
}
