import { redirectToReviews } from '@/lib/legacy-redirects'

/** 구 지역 카테고리 → /reviews 301 */
export default function LegacyRegionCategoryAltRedirectPage() {
  return redirectToReviews()
}
