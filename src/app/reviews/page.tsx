import Link from 'next/link'
import { unstable_noStore } from 'next/cache'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getRegions } from '@/lib/data/regions'
import { getReviewPostsList, buildReviewUrl, getRegionName, getTypeName, formatStars, REGION_PILL_STYLE } from '@/lib/data/review-posts'
import { getSiteSection } from '@/lib/data/site'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rbbmap.com'

export const metadata: Metadata = {
  title: '전체 리뷰 | 강남·수원·동탄·제주 가라오케·하이퍼블릭 이용 후기 | 룸빵여지도',
  description: '강남·수원·동탄·제주 가라오케·하이퍼블릭·쩜오 이용 후기 모음. AI가 6시간마다 최신 리뷰를 업데이트합니다.',
  alternates: { canonical: `${SITE_URL}/reviews` },
}

export const dynamic = 'force-dynamic'

export default async function ReviewsListPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; type?: string; star?: string }>
}) {
  unstable_noStore()
  const params = await searchParams
  const region = params.region ?? 'all'
  const type = params.type ?? 'all'
  const star = params.star ?? 'all'

  const [posts, header, footer, regions] = await Promise.all([
    getReviewPostsList({ region: region !== 'all' ? region : undefined, type: type !== 'all' ? type : undefined, star: star !== 'all' ? star : undefined }),
    getSiteSection<{ logo_icon?: string; logo_text?: string; nav?: { label: string; href: string }[] }>('header'),
    getSiteSection<{ desc?: string; copyright?: string; links?: { label: string; href: string }[] }>('footer'),
    getRegions(),
  ])

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
              검증된 전국 1종 및 2종 업소와 실제 이용 후기가 당신의 선택을 돕습니다.<br />
              6시간마다 자동으로 업데이트되는 최신 정보로 실패 없는 밤을 약속합니다.
            </p>
          </div>
          <div className="ph-kpi">
            <div className="ph-kpi-item"><strong>{posts.length}</strong><span>리뷰 수</span></div>
            <div className="ph-kpi-item"><strong>4.7</strong><span>전체 평점</span></div>
            <div className="ph-kpi-item"><strong>6H</strong><span>업데이트</span></div>
          </div>
        </div>
      </section>

      <div className="filter-panel">
        <div className="fp">
          <div className="fp-grp">
            <span className="fp-lbl">지역</span>
            <Link href="/reviews" className={`fp-btn ${region === 'all' ? 'active' : ''}`}>전체</Link>
            {regions.filter((r) => !r.coming).map((r) => (
              <Link
                key={r.slug}
                href={`/reviews?region=${r.slug}`}
                className={`fp-btn ${region === r.slug ? 'active' : ''}`}
              >
                {r.name}
              </Link>
            ))}
          </div>
          <div className="fp-div" />
          <div className="fp-grp">
            <span className="fp-lbl">업종</span>
            <Link href={`/reviews${region !== 'all' ? `?region=${region}` : ''}`} className={`fp-btn ${type === 'all' ? 'active' : ''}`}>전체</Link>
            <Link href={`/reviews?${new URLSearchParams({ ...(region !== 'all' && { region }), type: 'karaoke' }).toString()}`} className={`fp-btn ${type === 'karaoke' ? 'active' : ''}`}>가라오케</Link>
            <Link href={`/reviews?${new URLSearchParams({ ...(region !== 'all' && { region }), type: 'highpublic' }).toString()}`} className={`fp-btn ${type === 'highpublic' ? 'active' : ''}`}>하이퍼블릭</Link>
            <Link href={`/reviews?${new URLSearchParams({ ...(region !== 'all' && { region }), type: 'jjomoh' }).toString()}`} className={`fp-btn ${type === 'jjomoh' ? 'active' : ''}`}>쩜오</Link>
            <Link href={`/reviews?${new URLSearchParams({ ...(region !== 'all' && { region }), type: 'shirtsroom' }).toString()}`} className={`fp-btn ${type === 'shirtsroom' ? 'active' : ''}`}>셔츠룸</Link>
            <Link href={`/reviews?${new URLSearchParams({ ...(region !== 'all' && { region }), type: 'public' }).toString()}`} className={`fp-btn ${type === 'public' ? 'active' : ''}`}>퍼블릭</Link>
          </div>
          <div className="fp-div" />
          <div className="fp-grp">
            <span className="fp-lbl">별점</span>
            <Link href={`/reviews?${new URLSearchParams({ ...(region !== 'all' && { region }), ...(type !== 'all' && { type }) }).toString()}`} className={`fp-btn ${star === 'all' ? 'active' : ''}`}>전체</Link>
            <Link href={`/reviews?${new URLSearchParams({ ...(region !== 'all' && { region }), ...(type !== 'all' && { type }), star: '5' }).toString()}`} className={`fp-btn ${star === '5' ? 'active' : ''}`}>★★★★★</Link>
            <Link href={`/reviews?${new URLSearchParams({ ...(region !== 'all' && { region }), ...(type !== 'all' && { type }), star: '4' }).toString()}`} className={`fp-btn ${star === '4' ? 'active' : ''}`}>★★★★</Link>
          </div>
          <div className="fp-right">
            <span className="fp-count">리뷰 {posts.length}개 표시 중</span>
          </div>
        </div>
      </div>

      <div className="page-wrap">
        <section className="section">
          <div className="fr-grid">
            {posts.map((r, i) => {
              const href = buildReviewUrl(r.region, r.type, r.venue_slug, r.slug)
              const style = pillStyle(r.region)
              const excerpt = r.sec_overview || r.sec_summary || ''
              const charEst = Math.round(excerpt.length / 100) * 100 || 300
              return (
                <Link key={r.id} href={href} className="fr-card" data-region={r.region} data-type={r.type} data-star={String(r.star)}>
                  <div className="fr-head">
                    <div className="fr-hl">
                      <span className="fr-num">{String(i + 1).padStart(2, '0')}</span>
                      <span className="fr-rpill" style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>{getRegionName(r.region)}</span>
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
          {posts.length === 0 && (
            <p style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>등록된 리뷰가 없습니다.</p>
          )}
        </section>
      </div>

      <Footer data={footer} />
    </>
  )
}
