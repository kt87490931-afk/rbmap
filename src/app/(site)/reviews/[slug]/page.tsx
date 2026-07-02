import { notFound } from 'next/navigation'
import Link from 'next/link'
import { LoungeHeader } from '@/components/lounge/LoungeHeader'
import { LoungeFooter } from '@/components/lounge/LoungeFooter'
import { LoungeMobileCta } from '@/components/lounge/LoungeMobileCta'
import {
  buildFlatReviewPath,
  buildFlatReviewUrl,
  formatReviewDate,
  formatStars,
  getPrevNextFlatReviews,
  getPublishedReviewByFlatSlug,
} from '@/lib/data/review-flat'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rbbmap.com'

export const revalidate = 300

type Params = { slug: string }

export default async function FlatReviewPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const post = await getPublishedReviewByFlatSlug(slug)
  if (!post) notFound()

  const { prev, next } = post.published_at
    ? await getPrevNextFlatReviews(post.published_at, post.id)
    : { prev: null, next: null }

  const canonicalUrl = buildFlatReviewUrl(slug)
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
    url: canonicalUrl,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    author: { '@type': 'Organization', name: '룸빵여지도', url: SITE_URL },
    publisher: { '@type': 'Organization', name: '룸빵여지도', url: SITE_URL },
    reviewBody: post.sec_overview || post.sec_summary,
    reviewRating: { '@type': 'Rating', ratingValue: String(post.star), bestRating: '5' },
    itemReviewed: { '@type': 'LocalBusiness', name: post.venue || post.title },
    datePublished: post.published_at || post.visit_date,
    dateModified: post.updated_at || post.published_at || post.visit_date,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <a href="#main" className="skip-link">본문 바로가기</a>
      <LoungeHeader />

      <main id="main" className="article-wrap">
        <div className="container">
          <nav className="breadcrumb" aria-label="breadcrumb">
            <Link href="/">룸빵여지도</Link>
            <span className="breadcrumb-sep">›</span>
            <Link href="/reviews">이용 후기</Link>
            <span className="breadcrumb-sep">›</span>
            <span>{post.title}</span>
          </nav>

          <article>
            <header className="article-header">
              <h1>{post.title}</h1>
              <div className="article-meta">
                <span className="stars">{formatStars(post.star)}</span>
                <span>{post.star}.0 / 5.0</span>
                <span>{formatReviewDate(post.published_at)}</span>
                <span>약 {totalChars}자</span>
              </div>
            </header>

            <div className="article-body">
              {(post.summary_price || post.summary_lineup || post.summary_price_type) && (
                <div className="summary-box" style={{ marginBottom: 24, padding: 16, border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}>
                  <h2 style={{ fontSize: 16, marginBottom: 12 }}>핵심 요약</h2>
                  <div style={{ display: 'grid', gap: 8, fontSize: 14, color: 'var(--ink-muted)' }}>
                    {post.summary_price && <div><strong style={{ color: 'var(--brass)' }}>1인 주대</strong> {post.summary_price}</div>}
                    {post.summary_lineup && <div><strong style={{ color: 'var(--brass)' }}>라인업</strong> {post.summary_lineup}</div>}
                    {post.summary_price_type && <div><strong style={{ color: 'var(--brass)' }}>가격 방식</strong> {post.summary_price_type}</div>}
                  </div>
                </div>
              )}

              {post.sec_overview && (
                <>
                  <h2>방문 개요</h2>
                  {post.sec_overview.split('\n').map((p, i) => (
                    <p key={`o-${i}`}>{p}</p>
                  ))}
                </>
              )}
              {post.sec_lineup && (
                <>
                  <h2>라인업 / 서비스 분석</h2>
                  {post.sec_lineup.split('\n').map((p, i) => (
                    <p key={`l-${i}`}>{p}</p>
                  ))}
                </>
              )}
              {post.sec_price && (
                <>
                  <h2>가격 분석</h2>
                  {post.sec_price.split('\n').map((p, i) => (
                    <p key={`p-${i}`}>{p}</p>
                  ))}
                </>
              )}
              {post.sec_facility && (
                <>
                  <h2>시설 / 분위기</h2>
                  {post.sec_facility.split('\n').map((p, i) => (
                    <p key={`f-${i}`}>{p}</p>
                  ))}
                </>
              )}
              {post.sec_summary && (
                <>
                  <h2>총평</h2>
                  {post.sec_summary.split('\n').map((p, i) => (
                    <p key={`s-${i}`}>{p}</p>
                  ))}
                </>
              )}

              {(post.good_tags.length > 0 || post.bad_tags.length > 0) && (
                <div className="article-tags">
                  {post.good_tags.map((t, i) => (
                    <span key={`g-${i}`} className="good">✓ {t}</span>
                  ))}
                  {post.bad_tags.map((t, i) => (
                    <span key={`b-${i}`}>△ {t}</span>
                  ))}
                </div>
              )}
            </div>

            <nav className="article-nav" aria-label="이전·다음 후기">
              {prev ? (
                <Link href={buildFlatReviewPath(prev.flatSlug)}>
                  <div className="label">◀ 이전 후기</div>
                  <div className="title">{prev.title}</div>
                </Link>
              ) : (
                <div />
              )}
              {next ? (
                <Link href={buildFlatReviewPath(next.flatSlug)}>
                  <div className="label">다음 후기 ▶</div>
                  <div className="title">{next.title}</div>
                </Link>
              ) : (
                <div />
              )}
            </nav>
          </article>
        </div>
      </main>

      <LoungeFooter />
      <LoungeMobileCta />
    </>
  )
}
