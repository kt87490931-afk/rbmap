/**
 * 리뷰 상세 URL일 때만 <head>에 title/og 메타를 직접 주입.
 * Next.js 깊은 동적 라우트에서 generateMetadata가 초기 HTML에 안 들어가는 경우,
 * 크롤러(텔레그램 등)가 첫 응답에서 메타를 읽을 수 있도록 함.
 */
import { headers } from 'next/headers'
import {
  getReviewPostBySlug,
  getPartnerMetaForVenue,
  getTypeName,
} from '@/lib/data/review-posts'
import { REGION_SLUGS } from '@/lib/data/venues'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rbbmap.com'
const META_DESC_MAX = 160

const REVIEW_CATEGORIES = [
  'karaoke',
  'highpublic',
  'jjomoh',
  'room-salon',
  'shirtroom',
  'shirtsroom',
  'public',
  'bar',
]

function isReviewPath(segments: string[]): segments is [string, string, string, string] {
  if (segments.length !== 4) return false
  const [region, category] = segments
  return (
    (REGION_SLUGS as readonly string[]).includes(region) &&
    REVIEW_CATEGORIES.includes(category)
  )
}

export async function ReviewMetaInHead() {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const segments = pathname.split('/').filter(Boolean)
  if (!isReviewPath(segments)) return null

  const [region, category, venue, slug] = segments
  const [post, partnerMeta] = await Promise.all([
    getReviewPostBySlug(region, category, venue, slug),
    getPartnerMetaForVenue(region, category, venue),
  ])
  if (!post) return null

  const title = `${post.title} | 룸빵여지도`
  let desc =
    post.meta_description ||
    post.sec_overview?.slice(0, 120) ||
    `${post.venue} ${getTypeName(post.type)} 이용 후기`
  if (partnerMeta?.desc && desc.length < 100) {
    const extra = partnerMeta.desc.slice(0, 80).trim()
    if (extra) desc = (desc + ' ' + extra).slice(0, META_DESC_MAX)
  } else if (desc.length > META_DESC_MAX) {
    desc = desc.slice(0, META_DESC_MAX)
  }
  const canonicalPath = `/${region}/${category}/${venue}/${slug}`
  const canonicalUrl = `${SITE_URL}${canonicalPath}`
  const ogImage = `${SITE_URL}/og/og-home.png`

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="article" />
      <meta property="og:site_name" content="룸빵여지도" />
      <meta property="og:locale" content="ko_KR" />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />
      <link rel="canonical" href={canonicalUrl} />
    </>
  )
}
