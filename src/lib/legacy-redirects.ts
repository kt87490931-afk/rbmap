import { notFound, permanentRedirect } from 'next/navigation'
import { buildFlatReviewPath, getFlatSlugIndex } from '@/lib/data/review-flat'
import { getPublishedReviewPostWithVenueFix, REVIEW_TYPE_TO_NAME } from '@/lib/data/review-posts'
import { getRegionBySlugServer } from '@/lib/data/regions'

/** 구 리뷰 URL → /reviews/[flatSlug] 301 */
export async function redirectLegacyReview(
  region: string,
  category: string,
  venue: string,
  slug: string
): Promise<never> {
  const slugDecoded = slug ? decodeURIComponent(slug) : slug
  const regionData = await getRegionBySlugServer(region)
  if (!regionData || regionData.coming || !REVIEW_TYPE_TO_NAME[category]) {
    notFound()
  }

  const resolved = await getPublishedReviewPostWithVenueFix(region, category, venue, slugDecoded)
  if (!resolved) notFound()

  const index = await getFlatSlugIndex()
  const flat = index.idToFlat.get(resolved.post.id)
  if (!flat) notFound()

  permanentRedirect(buildFlatReviewPath(flat))
}

export function redirectToReviews(): never {
  permanentRedirect('/reviews')
}

export function redirectToHome(): never {
  permanentRedirect('/')
}
