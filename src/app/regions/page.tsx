import { redirectToHome } from '@/lib/legacy-redirects'

/** 구 지역 목록 → / 301 */
export default function LegacyRegionsRedirectPage() {
  return redirectToHome()
}
