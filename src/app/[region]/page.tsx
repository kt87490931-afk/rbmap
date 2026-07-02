import { redirectToReviews } from '@/lib/legacy-redirects'

/** 구 지역 메인 → /reviews 301 */
export default function LegacyRegionRedirectPage() {
  return redirectToReviews()
}
