import { redirectLegacyReview } from '@/lib/legacy-redirects'

type Params = { region: string; category: string; venue: string; slug: string }

/** 구 4단계 리뷰 URL → /reviews/[flatSlug] 301 */
export default async function LegacyReviewRedirectPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { region, category, venue, slug } = await params
  return redirectLegacyReview(region, category, venue, slug)
}
