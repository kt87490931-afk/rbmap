import { redirectToReviews } from '@/lib/legacy-redirects'

/** 구 업종 목록 → /reviews 301 */
export default function LegacyCategoryRedirectPage() {
  return redirectToReviews()
}
