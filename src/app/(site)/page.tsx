import type { Metadata } from 'next'
import { LoungeHomePage } from '@/components/lounge/LoungeHomePage'
import {
  formatStars,
  getLatestFlatReviews,
  getPublishedReviewCount,
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
    <LoungeHomePage
      latestReviews={latestReviews}
      totalCount={totalCount}
      avgStar={avgStar}
      webSiteSchema={webSiteSchema}
    />
  )
}
