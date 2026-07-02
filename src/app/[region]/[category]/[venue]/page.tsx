import { redirectToReviews } from '@/lib/legacy-redirects'

/** 구 업소 상세 → /reviews 301 */
export default function LegacyVenueRedirectPage() {
  return redirectToReviews()
}
