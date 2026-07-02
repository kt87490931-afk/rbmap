import { redirectToReviews } from '@/lib/legacy-redirects'

/** 구 지역+업종 → /reviews 301 */
export default function LegacyRegionCategoryRedirectPage() {
  return redirectToReviews()
}
