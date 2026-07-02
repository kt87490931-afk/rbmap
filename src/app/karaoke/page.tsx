import { redirectToReviews } from '@/lib/legacy-redirects'

/** /karaoke → /reviews 301 */
export default function KaraokeRedirectPage() {
  return redirectToReviews()
}
