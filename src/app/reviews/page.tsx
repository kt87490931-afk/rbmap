import Link from 'next/link'
import { unstable_noStore } from 'next/cache'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getRegions } from '@/lib/data/regions'
import { getReviewPostsListPaginated, getReviewCountsByRegion, getReviewCountsByType, buildReviewUrl, getRegionName, getTypeName, formatStars, REGION_PILL_STYLE } from '@/lib/data/review-posts'
import { getSiteSection } from '@/lib/data/site'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rbbmap.com'

export const metadata: Metadata = {
  title: '전체 후기 | 썰로 읽는 전국 룸싸롱·가라오케·셔츠룸·쩜오·퍼블릭·노래방 | 룸빵여지도',
  description: '썰로 읽는 전국 룸싸롱·가라오케·셔츠룸·쩜오·퍼블릭·노래방 유흥 후기 모음. 20분마다 최신 리뷰를 자동 업데이트합니다.',
  alternates: { canonical: `${SITE_URL}/reviews` },
  openGraph: {
    url: `${SITE_URL}/reviews`,
    type: 'website',
    title: '전체 후기 | 썰로 읽는 전국 룸싸롱·가라오케·셔츠룸·쩜오·퍼블릭·노래방 | 룸빵여지도',
    description: '썰로 읽는 전국 룸싸롱·가라오케·셔츠룸·쩜오·퍼블릭·노래방 유흥 후기 모음. 20분마다 최신 리뷰를 자동 업데이트합니다.',
    images: [
      {
        url: `${SITE_URL}/og/og-home.png?v=v20260318`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '전체 후기 | 썰로 읽는 전국 룸싸롱·가라오케·셔츠룸·쩜오·퍼블릭·노래방 | 룸빵여지도',
    description: '썰로 읽는 전국 룸싸롱·가라오케·셔츠룸·쩜오·퍼블릭·노래방 유흥 후기 모음. 20분마다 최신 리뷰를 자동 업데이트합니다.',
    images: [`${SITE_URL}/og/og-home.png?v=v20260318`],
  },
}

export const dynamic = 'force-dynamic'

const PER_PAGE = 30

function buildQuery(overrides: { region?: string; type?: string; sort?: string; page?: number; view?: string }) {
  const q: Record<string, string> = {}
  if (overrides.region && overrides.region !== 'all') q.region = overrides.region
  if (overrides.type && overrides.type !== 'all') q.type = overrides.type
  if (overrides.sort) q.sort = overrides.sort
  if (overrides.page && overrides.page > 1) q.page = String(overrides.page)
  if (overrides.view && overrides.view === 'column') q.view = 'column'
  return new URLSearchParams(q).toString()
}

export default async function ReviewsListPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; type?: string; sort?: string; page?: string; view?: string }>
}) {
  unstable_noStore()
  const params = await searchParams
  const region = params.region ?? 'all'
  const type = params.type ?? 'all'
  const sort = params.sort === 'popular' ? 'popular' : 'latest'
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const view = params.view === 'column' ? 'column' : 'list'

  const [result, header, footer, regions, regionCounts, typeCounts] = await Promise.all([
    getReviewPostsListPaginated({
      region: region !== 'all' ? region : undefined,
      type: type !== 'all' ? type : undefined,
      sort,
      page,
      perPage: PER_PAGE,
    }),
    getSiteSection<{ logo_icon?: string; logo_text?: string; nav?: { label: string; href: string }[] }>('header'),
    getSiteSection<{ desc?: string; copyright?: string; links?: { label: string; href: string }[] }>('footer'),
    getRegions(),
    getReviewCountsByRegion(),
    getReviewCountsByType(),
  ])
  const { posts, total } = result
  const totalCount = Object.values(regionCounts).reduce((a, b) => a + b, 0) || total

  const regionDisplayNames = Object.fromEntries(regions.map((r) => [r.slug, r.name]))
  const getListRegionLabel = (slug: string) => {
    const full = getRegionName(slug, regionDisplayNames)
    const first = full.split(/\s/)[0] || full
    return first.length >= 2 ? first.slice(0, 2) : first
  }
  const typeSlugToDisplay: Record<string, string> = {
    karaoke: '가라오케',
    highpublic: '하이퍼블릭',
    jjomoh: '쩜오',
    shirtsroom: '셔츠룸',
    shirtroom: '셔츠룸',
    public: '퍼블릭',
    'room-salon': '룸싸롱',
    bar: '바',
  }
  const pillStyle = (r: string) => REGION_PILL_STYLE[r] ?? { bg: 'rgba(255,255,255,.05)', color: 'var(--muted)', border: 'var(--border)' }

  return (
    <>
      <Header data={header} />
      <div className="breadcrumb">
        <div className="breadcrumb-inner">
          <Link href="/">룸빵여지도</Link>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-current">전체 리뷰</span>
        </div>
      </div>

      <section className="page-hero reviews-hero">
        <div className="ph-glow" aria-hidden />
        <div className="ph-grid" aria-hidden />
        <div className="ph-inner">
          <div>
            <div className="ph-label">ALL REVIEWS · AI 자동 업데이트</div>
            <h1 className="ph-title">전체 <em>이용 후기</em></h1>
            <p className="ph-desc">
              썰로 읽는 전국 룸싸롱·가라오케·셔츠룸·쩜오·퍼블릭·노래방 유흥 후기<br />
              20분마다 자동으로 업데이트되는 최신 정보로 실패 없는 밤을 약속합니다.
            </p>
          </div>
          <div className="ph-kpi">
            <div className="ph-kpi-item"><strong>{total}</strong><span>리뷰 수</span></div>
            <div className="ph-kpi-item"><strong>4.7</strong><span>전체 평점</span></div>
            <div className="ph-kpi-item"><strong>20분</strong><span>업데이트</span></div>
          </div>
        </div>
      </section>

      <div className="filter-panel">
        <div className="fp">
          <div className="fp-grp">
            <span className="fp-lbl">지역</span>
            <Link href={`/reviews?${buildQuery({ region: 'all', type, sort, page: 1, view })}`} className={`fp-btn ${region === 'all' ? 'active' : ''}`}>전체 ({totalCount})</Link>
            {regions.filter((r) => !r.coming).map((r) => {
              const cnt = regionCounts[r.slug] ?? 0
              return (
                <Link
                  key={r.slug}
                  href={`/reviews?${buildQuery({ region: r.slug, type, sort, page: 1, view })}`}
                  className={`fp-btn ${region === r.slug ? 'active' : ''}`}
                >
                  {r.name} {cnt > 0 ? `(${cnt})` : ''}
                </Link>
              )
            })}
          </div>
          <div className="fp-div" />
          <div className="fp-grp">
            <span className="fp-lbl">업종</span>
            <Link href={`/reviews?${buildQuery({ region, type: 'all', sort, page: 1, view })}`} className={`fp-btn ${type === 'all' ? 'active' : ''}`}>전체 ({totalCount})</Link>
            {[
              { slug: 'karaoke', label: '가라오케' },
              { slug: 'highpublic', label: '하이퍼블릭' },
              { slug: 'jjomoh', label: '쩜오' },
              { slug: 'room-salon', label: '룸싸롱' },
              { slug: 'shirtsroom', label: '셔츠룸', altSlug: 'shirtroom' },
              { slug: 'public', label: '퍼블릭' },
            ].map((x) => {
              const cnt = (typeCounts[x.slug] ?? 0) + ((x as { altSlug?: string }).altSlug ? (typeCounts[(x as { altSlug: string }).altSlug] ?? 0) : 0)
              const slugToUse = (typeCounts[x.slug] ?? 0) > 0 ? x.slug : ((x as { altSlug?: string }).altSlug && (typeCounts[(x as { altSlug: string }).altSlug] ?? 0) > 0) ? (x as { altSlug: string }).altSlug : x.slug
              return (
                <Link
                  key={x.slug}
                  href={`/reviews?${buildQuery({ region, type: slugToUse, sort, page: 1, view })}`}
                  className={`fp-btn ${(type === x.slug || type === (x as { altSlug?: string }).altSlug) ? 'active' : ''}`}
                >
                  {x.label} {cnt > 0 ? `(${cnt})` : ''}
                </Link>
              )
            })}
          </div>
          <div className="fp-grp fp-sort">
            <Link href={`/reviews?${buildQuery({ region, type, sort: 'latest', page: 1, view })}`} className={`fp-btn ${sort === 'latest' ? 'active' : ''}`}>최신순</Link>
            <Link href={`/reviews?${buildQuery({ region, type, sort: 'popular', page: 1, view })}`} className={`fp-btn ${sort === 'popular' ? 'active' : ''}`}>인기순</Link>
            <span className="fp-div" />
            <Link href={`/reviews?${buildQuery({ region, type, sort, page: 1, view: 'list' })}`} className={`fp-btn ${view === 'list' ? 'active' : ''}`}>리스트형</Link>
            <Link href={`/reviews?${buildQuery({ region, type, sort, page: 1, view: 'column' })}`} className={`fp-btn ${view === 'column' ? 'active' : ''}`}>컬럼형</Link>
          </div>
          <div className="fp-right">
            <span className="fp-count">리뷰 {total > 0 ? `${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, total)} / ${total}개` : '0개'} 표시</span>
          </div>
        </div>
      </div>

      <div className="page-wrap">
        <section className="section">
          {view === 'list' ? (
            <div className="fr-list">
              {posts.map((r, i) => {
                const href = buildReviewUrl(r.region, r.type, r.venue_slug, r.slug)
                const style = pillStyle(r.region)
                const regionShort = getListRegionLabel(r.region)
                return (
                  <Link key={r.id} href={href} className="fr-list-row" data-region={r.region} data-type={r.type} data-star={String(r.star)}>
                    <span className="fr-list-pill" style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>{regionShort}</span>
                    <span className="fr-list-title">{r.title}</span>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="fr-grid fr-grid-3">
              {posts.map((r, i) => {
                const href = buildReviewUrl(r.region, r.type, r.venue_slug, r.slug)
                const style = pillStyle(r.region)
                const excerpt = r.sec_overview || r.sec_summary || ''
                const charEst = Math.round(excerpt.length / 100) * 100 || 300
                const displayNum = (page - 1) * PER_PAGE + i + 1
                return (
                  <Link key={r.id} href={href} className="fr-card" data-region={r.region} data-type={r.type} data-star={String(r.star)}>
                    <div className="fr-head">
                      <div className="fr-hl">
                        <span className="fr-num">{String(displayNum).padStart(2, '0')}</span>
                        <span className="fr-rpill" style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>{getRegionName(r.region, regionDisplayNames)}</span>
                        <span className="fr-type">{getTypeName(r.type)}</span>
                        <span className="fr-vtag">{r.venue}</span>
                      </div>
                      <span className="fr-date">{r.published_at ? new Date(r.published_at).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '') : ''}</span>
                    </div>
                    <div className="fr-title">{r.title}</div>
                    <div className="fr-stars">
                      <span className="fr-sv">{formatStars(r.star)}</span>
                      <span className="fr-sn">{r.star}.0 / 5.0</span>
                    </div>
                    <div className="fr-body">
                      <p>{excerpt.slice(0, 200)}{excerpt.length > 200 ? '...' : ''}</p>
                    </div>
                    <div className="fr-foot">
                      <span className="fr-cc">약 {charEst}자</span>
                      <span className="fr-rm">전문 보기 →</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
          {posts.length === 0 && (
            <p style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>등록된 리뷰가 없습니다.</p>
          )}

          {total > PER_PAGE && (
            <nav className="reviews-pagination" aria-label="리뷰 목록 페이지 넘김">
              <div className="reviews-pagination-inner">
                {page > 1 ? (
                  <Link href={`/reviews?${buildQuery({ region, type, sort, page: page - 1, view })}`} className="reviews-pagination-btn reviews-pagination-prev">이전</Link>
                ) : (
                  <span className="reviews-pagination-btn reviews-pagination-prev disabled">이전</span>
                )}
                <div className="reviews-pagination-pages">
                  {(() => {
                    const totalPages = Math.ceil(total / PER_PAGE)
                    const showPages: (number | 'ellipsis')[] = []
                    if (totalPages <= 7) {
                      for (let i = 1; i <= totalPages; i++) showPages.push(i)
                    } else {
                      showPages.push(1)
                      if (page > 3) showPages.push('ellipsis')
                      const midStart = Math.max(2, page - 1)
                      const midEnd = Math.min(totalPages - 1, page + 1)
                      for (let i = midStart; i <= midEnd; i++) showPages.push(i)
                      if (page < totalPages - 2) showPages.push('ellipsis')
                      if (totalPages > 1) showPages.push(totalPages)
                    }
                    const seen = new Set<number>()
                    const deduped: (number | 'ellipsis')[] = []
                    for (const p of showPages) {
                      if (p === 'ellipsis') deduped.push(p)
                      else if (!seen.has(p)) { seen.add(p); deduped.push(p) }
                    }
                    return deduped.map((p, idx) =>
                      p === 'ellipsis' ? (
                        <span key={`e-${idx}`} className="reviews-pagination-ellipsis">…</span>
                      ) : (
                        p === page ? (
                          <span key={p} className="reviews-pagination-num current">{p}</span>
                        ) : (
                          <Link key={p} href={`/reviews?${buildQuery({ region, type, sort, page: p, view })}`} className="reviews-pagination-num">{p}</Link>
                        )
                      )
                    )
                  })()}
                </div>
                {page < Math.ceil(total / PER_PAGE) ? (
                  <Link href={`/reviews?${buildQuery({ region, type, sort, page: page + 1, view })}`} className="reviews-pagination-btn reviews-pagination-next">다음</Link>
                ) : (
                  <span className="reviews-pagination-btn reviews-pagination-next disabled">다음</span>
                )}
              </div>
            </nav>
          )}
        </section>
      </div>

      <Footer data={footer} />
    </>
  )
}
