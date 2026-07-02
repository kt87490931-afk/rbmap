import type { Metadata } from 'next'
import Link from 'next/link'
import { LoungeHeader } from '@/components/lounge/LoungeHeader'
import { LoungeFooter } from '@/components/lounge/LoungeFooter'
import { LoungeMobileCta } from '@/components/lounge/LoungeMobileCta'
import {
  buildFlatReviewPath,
  formatReviewDate,
  formatStars,
  getFlatReviewPostsPaginated,
  getPublishedReviewCount,
  reviewExcerpt,
} from '@/lib/data/review-flat'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rbbmap.com'
const PER_PAGE = 20

export const metadata: Metadata = {
  title: '이용 후기 | 룸빵여지도',
  description: '프라이빗 라운지 이용 후기 모음. 실제 방문 경험을 바탕으로 한 상세 후기를 최신순으로 확인하세요.',
  alternates: { canonical: `${SITE_URL}/reviews` },
  openGraph: {
    url: `${SITE_URL}/reviews`,
    type: 'website',
    title: '이용 후기 | 룸빵여지도',
    description: '프라이빗 라운지 이용 후기 모음. 실제 방문 경험을 바탕으로 한 상세 후기를 최신순으로 확인하세요.',
  },
  robots: { index: true, follow: true },
}

export const revalidate = 300

function buildPageHref(page: number): string {
  return page <= 1 ? '/reviews' : `/reviews?page=${page}`
}

export default async function ReviewsListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)

  const [{ posts, total }, totalCount] = await Promise.all([
    getFlatReviewPostsPaginated({ page, perPage: PER_PAGE }),
    getPublishedReviewCount(),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))
  const safePage = Math.min(page, totalPages)

  const avgStar =
    posts.length > 0
      ? (posts.reduce((s, r) => s + r.star, 0) / posts.length).toFixed(1)
      : '5.0'

  return (
    <>
      <a href="#main" className="skip-link">본문 바로가기</a>
      <LoungeHeader />

      <main id="main">
        <section className="page-hero">
          <div className="container">
            <nav className="breadcrumb" aria-label="breadcrumb">
              <Link href="/">룸빵여지도</Link>
              <span className="breadcrumb-sep">›</span>
              <span>이용 후기</span>
            </nav>
            <span className="eyebrow">Reviews</span>
            <h1>이용 후기</h1>
            <p>총 {totalCount}건의 후기 · 평균 {avgStar}점</p>
          </div>
        </section>

        <section className="section" style={{ borderBottom: 'none', paddingTop: 32 }}>
          <div className="container">
            <ul className="review-list">
              {posts.map((r) => (
                <li key={r.id}>
                  <Link href={buildFlatReviewPath(r.flatSlug)} className="review-item">
                    <div className="top">
                      <span className="name">{r.title}</span>
                      <span className="date">{formatReviewDate(r.published_at)}</span>
                    </div>
                    <span className="stars">{formatStars(r.star)}</span>
                    <p>{reviewExcerpt(r, 200)}</p>
                  </Link>
                </li>
              ))}
              {posts.length === 0 && (
                <li className="review-item"><p>등록된 후기가 없습니다.</p></li>
              )}
            </ul>

            {totalPages > 1 && (
              <nav className="pagination" aria-label="후기 목록 페이지">
                {safePage > 1 ? (
                  <Link href={buildPageHref(safePage - 1)}>이전</Link>
                ) : (
                  <span style={{ opacity: 0.4 }}>이전</span>
                )}
                {(() => {
                  const showPages: (number | 'ellipsis')[] = []
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) showPages.push(i)
                  } else {
                    showPages.push(1)
                    if (safePage > 3) showPages.push('ellipsis')
                    const midStart = Math.max(2, safePage - 1)
                    const midEnd = Math.min(totalPages - 1, safePage + 1)
                    for (let i = midStart; i <= midEnd; i++) showPages.push(i)
                    if (safePage < totalPages - 2) showPages.push('ellipsis')
                    if (totalPages > 1) showPages.push(totalPages)
                  }
                  const seen = new Set<number>()
                  return showPages.map((p, idx) => {
                    if (p === 'ellipsis') return <span key={`e-${idx}`}>…</span>
                    if (seen.has(p)) return null
                    seen.add(p)
                    return safePage === p ? (
                      <span key={p} className="current">{p}</span>
                    ) : (
                      <Link key={p} href={buildPageHref(p)}>{p}</Link>
                    )
                  })
                })()}
                {safePage < totalPages ? (
                  <Link href={buildPageHref(safePage + 1)}>다음</Link>
                ) : (
                  <span style={{ opacity: 0.4 }}>다음</span>
                )}
              </nav>
            )}
          </div>
        </section>
      </main>

      <LoungeFooter />
      <LoungeMobileCta />
    </>
  )
}
