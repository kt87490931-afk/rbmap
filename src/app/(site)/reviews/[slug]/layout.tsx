import type { Metadata } from 'next'
import { getPublishedReviewByFlatSlug } from '@/lib/data/review-flat'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rbbmap.com'
const META_DESC_MAX = 160

type Params = { slug: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublishedReviewByFlatSlug(slug)
  if (!post) return {}

  const title = `${post.title} | 룸빵여지도`
  let desc =
    post.meta_description ||
    post.sec_overview?.slice(0, 120) ||
    `${post.title} 이용 후기`
  if (desc.length > META_DESC_MAX) desc = desc.slice(0, META_DESC_MAX)

  const canonicalUrl = `${SITE_URL}/reviews/${encodeURIComponent(slug)}`
  const ogImage = `${SITE_URL}/og/og-home.png`
  const keywords =
    post.meta_keywords?.trim() ||
    `${post.title}, 프라이빗 라운지 후기, 룸빵여지도`

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description: desc,
    keywords,
    openGraph: {
      title,
      description: desc,
      type: 'article',
      url: canonicalUrl,
      siteName: '룸빵여지도',
      locale: 'ko_KR',
      publishedTime: post.published_at ?? post.visit_date ?? undefined,
      modifiedTime: post.updated_at ?? post.published_at ?? post.visit_date ?? undefined,
      authors: ['룸빵여지도'],
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: [ogImage],
    },
    alternates: { canonical: canonicalUrl },
    robots: { index: true, follow: true },
  }
}

export default function ReviewSlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
