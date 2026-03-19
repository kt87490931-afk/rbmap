import type { Metadata } from 'next'
import {
  getPublishedReviewPostWithVenueFix,
  getPartnerMetaForVenue,
  buildReviewUrl,
  getTypeName,
} from '@/lib/data/review-posts'
import { getVenueDetail } from '@/lib/data/venues'
import { getRegionBySlugServer } from '@/lib/data/regions'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rbbmap.com'
const META_DESC_MAX = 160

type Params = { region: string; category: string; venue: string; slug: string }

/**
 * 리뷰 상세 세그먼트 레이아웃.
 * 메타를 여기서 생성해 초기 HTML head에 title/og가 반영되도록 함.
 * (페이지의 generateMetadata만으로는 깊은 동적 라우트에서 크롤러에 안 나가는 경우 대비)
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { region, category, venue, slug } = await params
  const slugDecoded = slug ? decodeURIComponent(slug) : slug
  const [regionData, resolved] = await Promise.all([
    getRegionBySlugServer(region),
    getPublishedReviewPostWithVenueFix(region, category, venue, slugDecoded),
  ])
  if (!regionData || regionData.coming || !resolved) return {}
  const post = resolved.post
  const venueKey = post.venue_slug
  const canonicalRel =
    resolved.redirectToCanonical ?? buildReviewUrl(region, category, venueKey, post.slug)

  const [partnerMeta, venueData] = await Promise.all([
    getPartnerMetaForVenue(region, category, venueKey),
    getVenueDetail(region, category, venueKey),
  ])
  const venueDisplayName = (venueData?.name ?? post.venue).trim() || post.venue
  const title = `${post.title} | 룸빵여지도`
  let desc =
    post.meta_description ||
    post.sec_overview?.slice(0, 120) ||
    `${venueDisplayName} ${getTypeName(post.type)} 이용 후기`
  if (partnerMeta?.desc && desc.length < 100) {
    const extra = partnerMeta.desc.slice(0, 80).trim()
    if (extra) desc = (desc + ' ' + extra).slice(0, META_DESC_MAX)
  } else if (desc.length > META_DESC_MAX) {
    desc = desc.slice(0, META_DESC_MAX)
  }
  const canonicalUrl = `${SITE_URL}${encodeURI(canonicalRel)}`
  const ogImage = `${SITE_URL}/og/og-home.png`

  const regionName = regionData.name ?? region
  const typeName = getTypeName(post.type)
  const keywords = partnerMeta?.tags?.length
    ? partnerMeta.tags.join(', ')
    : `${venueDisplayName} 이용 후기, ${venueDisplayName} 리뷰, ${regionName} ${typeName}, 룸빵여지도`

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description: desc,
    keywords,
    openGraph: {
      title: `${post.title} | 룸빵여지도`,
      description: desc,
      type: 'article',
      url: canonicalUrl,
      siteName: '룸빵여지도',
      locale: 'ko_KR',
      publishedTime: post.published_at ?? post.visit_date ?? undefined,
      modifiedTime: post.updated_at ?? post.published_at ?? post.visit_date ?? undefined,
      authors: ['룸빵여지도'],
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${venueDisplayName} 이용 후기 | 룸빵여지도`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.title} | 룸빵여지도`,
      description: desc,
      images: [ogImage],
    },
    alternates: { canonical: canonicalUrl },
    robots: { index: true, follow: true },
  }
}

export default function ReviewSlugLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
