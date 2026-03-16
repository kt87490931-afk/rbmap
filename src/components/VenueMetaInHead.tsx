/**
 * 업체소개글(업소 상세) URL일 때 <head>에 title/og/메타를 직접 주입.
 * 리뷰 상세와 동일하게 크롤러가 초기 HTML에서 og:title, og:description 등을 읽을 수 있도록 함.
 */
import { headers } from 'next/headers'
import { getVenueDetail, REGION_SLUGS, REGION_SLUG_TO_NAME, SLUG_TO_TYPE } from '@/lib/data/venues'
import { getPartnerMetaForVenue } from '@/lib/data/review-posts'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rbbmap.com'
const META_DESC_MAX = 160

function isVenuePath(segments: string[]): segments is [string, string, string] {
  if (segments.length !== 3) return false
  const [region, category] = segments
  const regionOk = (REGION_SLUGS as readonly string[]).includes(region)
  const categoryOk = !!SLUG_TO_TYPE[category]
  return regionOk && categoryOk
}

function getPathnameFromHeaders(headersList: Headers): string {
  const fromMiddleware = headersList.get('x-pathname')?.trim()
  if (fromMiddleware) return fromMiddleware
  const referer = headersList.get('referer')?.trim()
  if (referer) {
    try {
      const u = new URL(referer)
      if (u.origin === SITE_URL || u.hostname === 'rbbmap.com') return u.pathname || ''
    } catch {
      /* ignore */
    }
  }
  return ''
}

export async function VenueMetaInHead() {
  const headersList = await headers()
  const pathname = getPathnameFromHeaders(headersList)
  const segments = pathname.split('/').filter(Boolean)
  if (!isVenuePath(segments)) return null

  const [region, category, venue] = segments
  const [data, partnerMeta] = await Promise.all([
    getVenueDetail(region, category, venue),
    getPartnerMetaForVenue(region, category, venue),
  ])

  if (!data) return null

  const regionName = REGION_SLUG_TO_NAME[region] ?? region
  const typeName = SLUG_TO_TYPE[category] ?? category
  const title = `${data.name} | ${regionName} ${typeName} - 룸빵여지도`
  const canonicalPath = data.url.startsWith('/') ? data.url : `/${region}/${category}/${venue}`
  const canonicalUrl = `${SITE_URL}${canonicalPath}`
  const ogImage = `${SITE_URL}/og/og-home.png`

  let description =
    partnerMeta?.desc?.trim() ||
    `${data.name} 상세 정보. ${regionName} ${typeName} 평점 ${data.rating}, 리뷰 ${data.reviewCount}개. ${data.location || ''} ${data.contact || ''}`.trim()
  if (description.length > META_DESC_MAX) description = description.slice(0, META_DESC_MAX - 1) + '…'

  const keywords =
    (partnerMeta?.tags?.length ?? 0) > 0
      ? (partnerMeta?.tags ?? []).join(', ')
      : [
          data.name,
          `${regionName} ${data.name}`,
          `${regionName} ${typeName}`,
          `${data.name} 가격`,
          `${data.name} 후기`,
          `${data.name} 위치`,
        ].join(', ')

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="룸빵여지도" />
      <meta property="og:locale" content="ko_KR" />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <link rel="canonical" href={canonicalUrl} />
    </>
  )
}
