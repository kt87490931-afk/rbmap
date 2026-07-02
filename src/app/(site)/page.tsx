import type { Metadata } from 'next'
import Link from 'next/link'
import { LoungeHeader } from '@/components/lounge/LoungeHeader'
import { LoungeFooter } from '@/components/lounge/LoungeFooter'
import { LoungeMobileCta } from '@/components/lounge/LoungeMobileCta'
import {
  formatReviewDate,
  formatStars,
  getLatestFlatReviews,
  getPublishedReviewCount,
  reviewExcerpt,
  buildFlatReviewPath,
} from '@/lib/data/review-flat'
import { getSiteSection } from '@/lib/data/site'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rbbmap.com'

const DEFAULT_TITLE = '룸빵여지도 | 프라이빗 라운지 이용 후기'
const DEFAULT_DESC =
  '프라이빗 라운지 이용 후기와 정보를 확인하세요. 실제 방문 후기를 바탕으로 룸 안내와 이용 정보를 제공합니다.'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await getSiteSection<{ title?: string; description?: string; keywords?: string; siteUrl?: string }>('seo')
    const title = seo?.title || DEFAULT_TITLE
    const description = seo?.description || DEFAULT_DESC
    const siteUrl = (seo?.siteUrl || SITE_URL).replace(/\/+$/, '')
    return {
      title,
      description,
      keywords: seo?.keywords || '룸빵여지도, 프라이빗 라운지, 이용 후기, 룸 안내',
      alternates: { canonical: siteUrl },
      openGraph: {
        type: 'website',
        locale: 'ko_KR',
        url: siteUrl,
        siteName: '룸빵여지도',
        title,
        description,
      },
      robots: { index: true, follow: true },
    }
  } catch {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESC,
      alternates: { canonical: SITE_URL },
      robots: { index: true, follow: true },
    }
  }
}

export const revalidate = 300

export default async function HomePage() {
  const [latestReviews, totalCount] = await Promise.all([
    getLatestFlatReviews(4),
    getPublishedReviewCount(),
  ])

  const avgStar =
    latestReviews.length > 0
      ? (latestReviews.reduce((s, r) => s + r.star, 0) / latestReviews.length).toFixed(1)
      : '5.0'

  const webSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '룸빵여지도',
    url: SITE_URL,
    description: DEFAULT_DESC,
    inLanguage: 'ko',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/reviews` },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }} />
      <a href="#main" className="skip-link">본문 바로가기</a>
      <LoungeHeader />

      <main id="main">
        <section className="hero" id="top">
          <div className="container hero-inner">
            <div className="hero-text">
              <div className="hero-badges">
                <span>프라이빗 라운지</span>
                <span>이용 후기</span>
                <span>정보 안내</span>
              </div>
              <h1>조용한 밤, <em>완전한 프라이버시.</em></h1>
              <p className="hero-sub">룸 안내와 이용 정보, 실제 방문 후기를 한곳에서 확인하세요.</p>
              <div className="hero-actions">
                <Link href="/reviews" className="btn btn-primary">후기 보기</Link>
                <Link href="#about" className="btn btn-ghost">소개 보기</Link>
              </div>
            </div>
            <div className="hero-media">
              <div className="ph" data-slot="hero-main"><span>대표 이미지</span></div>
            </div>
          </div>
          <div className="quickbar">
            <div className="container">
              <div className="quickbar-item"><span className="label">후기</span><span className="value">{totalCount}건</span></div>
              <div className="quickbar-item"><span className="label">평점</span><span className="value">{avgStar} / 5.0</span></div>
              <div className="quickbar-item"><span className="label">업데이트</span><span className="value">정기 갱신</span></div>
              <div className="quickbar-item"><span className="label">문의</span><span className="value">하단 문의란</span></div>
            </div>
          </div>
        </section>

        <section className="section" id="about">
          <div className="container about-grid">
            <div className="about-media">
              <div className="ph" data-slot="about-main"><span>공간 사진</span></div>
            </div>
            <div className="about-copy">
              <span className="eyebrow">About</span>
              <h2>격식 있는 자리를 위한 프라이빗 라운지</h2>
              <p>비즈니스 미팅부터 소규모 모임까지, 목적에 맞는 룸과 서비스를 소개합니다.</p>
              <p>실제 방문 후기를 바탕으로 이용 정보를 제공합니다.</p>
              <ul className="about-list">
                <li><span className="num">01</span><div><h3>프라이빗 룸</h3><p>인원과 목적에 맞는 다양한 룸 타입.</p></div></li>
                <li><span className="num">02</span><div><h3>이용 후기</h3><p>실제 방문 경험을 바탕으로 한 상세 후기.</p></div></li>
                <li><span className="num">03</span><div><h3>이용 안내</h3><p>요금·위치·문의 정보를 한곳에서 확인.</p></div></li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section" id="gallery">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Space</span>
              <h2>공간 둘러보기</h2>
              <p>이미지는 추후 업로드됩니다.</p>
            </div>
            <div className="gallery-grid">
              <div className="ph"><span>1</span></div>
              <div className="ph"><span>2</span></div>
              <div className="ph"><span>3</span></div>
              <div className="ph"><span>4</span></div>
            </div>
          </div>
        </section>

        <section className="section" id="menu">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Price</span>
              <h2>이용 요금 안내</h2>
              <p className="menu-tabs-note">아래 요금은 예시이며, 추후 수정할 수 있습니다.</p>
            </div>
            <div className="menu-groups">
              <div className="menu-group">
                <h3>룸 이용 코스</h3>
                <div className="menu-row"><div><div className="name">스탠다드 코스</div><div className="desc">기본 이용 · 2~4인</div></div><div className="leader" /><div className="price">문의</div></div>
                <div className="menu-row"><div><div className="name">프리미엄 코스</div><div className="desc">프라이빗 룸 · 4~6인</div></div><div className="leader" /><div className="price">문의</div></div>
              </div>
              <div className="menu-group">
                <h3>추가 옵션</h3>
                <div className="menu-row"><div><div className="name">음료 추가</div><div className="desc">브랜드 상담 가능</div></div><div className="leader" /><div className="price">문의</div></div>
                <div className="menu-row"><div><div className="name">안주</div><div className="desc">제철 구성</div></div><div className="leader" /><div className="price">문의</div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="reviews">
          <div className="container review-layout">
            <div>
              <span className="eyebrow">Review</span>
              <h2 style={{ marginBottom: 18 }}>이용 후기</h2>
              <div className="review-summary">
                <div className="score">{avgStar}</div>
                <div>
                  <span className="stars">{formatStars(Math.round(Number(avgStar)))}</span>
                  <span className="count">총 {totalCount}건의 후기</span>
                </div>
              </div>
              <p style={{ color: 'var(--ink-muted)', fontSize: 13 }}>최신 후기를 확인하고 전체 목록에서 더 볼 수 있습니다.</p>
            </div>
            <div>
              <ul className="review-list">
                {latestReviews.map((r) => (
                  <li key={r.id}>
                    <Link href={buildFlatReviewPath(r.flatSlug)} className="review-item">
                      <div className="top">
                        <span className="name">{r.title}</span>
                        <span className="date">{formatReviewDate(r.published_at)}</span>
                      </div>
                      <span className="stars">{formatStars(r.star)}</span>
                      <p>{reviewExcerpt(r, 120)}</p>
                    </Link>
                  </li>
                ))}
                {latestReviews.length === 0 && (
                  <li className="review-item"><p>등록된 후기가 없습니다.</p></li>
                )}
              </ul>
              <div className="review-more">
                <Link href="/reviews" className="btn btn-ghost btn-block">후기 더보기</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="location">
          <div className="container location-grid">
            <div className="location-map">
              <div className="ph"><span>지도 임베드 자리</span></div>
            </div>
            <div>
              <span className="eyebrow">Location</span>
              <h2 style={{ marginBottom: 18 }}>오시는 길</h2>
              <ul className="info-list">
                <li><span className="k">주소</span><span className="v">추후 입력</span></li>
                <li><span className="k">교통</span><span className="v">추후 입력</span></li>
                <li><span className="k">주차</span><span className="v">추후 입력</span></li>
                <li><span className="k">영업</span><span className="v">추후 입력</span></li>
              </ul>
            </div>
          </div>
        </section>

        <section className="cta-band">
          <div className="container">
            <span className="eyebrow">Reviews</span>
            <h2>실제 방문 후기를 확인하세요</h2>
            <p>이용 전 참고할 수 있는 상세 후기를 모았습니다.</p>
            <div className="cta-actions">
              <Link href="/reviews" className="btn btn-primary">전체 후기 보기</Link>
              <Link href="#contact" className="btn btn-ghost">문의하기</Link>
            </div>
          </div>
        </section>

        <section className="section" id="contact" style={{ borderBottom: 'none' }}>
          <div className="container contact-grid">
            <div>
              <span className="eyebrow">Contact</span>
              <h2 style={{ marginBottom: 18 }}>문의</h2>
              <ul className="contact-info">
                <li><span className="k">안내</span><span className="v">문의 내용은 추후 입력합니다.</span></li>
              </ul>
            </div>
            <form className="form-grid" aria-label="문의 폼">
              <div className="form-row">
                <div><label htmlFor="name">이름</label><input id="name" name="name" type="text" placeholder="이름" /></div>
                <div><label htmlFor="phone">연락처</label><input id="phone" name="phone" type="tel" placeholder="010-0000-0000" /></div>
              </div>
              <div><label htmlFor="message">문의 내용</label><textarea id="message" name="message" placeholder="문의 내용을 남겨주세요" /></div>
              <button type="button" className="btn btn-primary btn-block">문의 보내기 (준비 중)</button>
            </form>
          </div>
        </section>
      </main>

      <LoungeFooter />
      <LoungeMobileCta />
    </>
  )
}
