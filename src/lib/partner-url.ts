/**
 * 룸빵여지도 제휴업체 링크 생성
 * 형식: /지역슬러그/종목슬러그/뒷부분URL
 * 예: /dongtan/karaoke/dongtan-choigga
 */

import { TYPE_TO_SLUG } from './data/venues'

/** 지역slug + 유형 + 뒷부분URL → 전체 링크 (사용자입력은 뒷부분만) */
export function buildPartnerHrefFromParts(
  regionSlug: string,
  typeName: string,
  urlSuffix: string
): string {
  const categorySlug = TYPE_TO_SLUG[typeName] ?? 'karaoke'
  const suffix = urlSuffix.trim().replace(/^\/+|\/+$/g, '').replace(/\s+/g, '-').toLowerCase()
  return `/${regionSlug}/${categorySlug}/${suffix || 'venue'}`
}

/** href에서 뒷부분(업소slug) 추출 - 수정 시 파싱용 */
export function parseUrlSuffixFromHref(href: string): string {
  if (!href?.trim()) return ''
  const parts = href.replace(/\/$/, '').split('/').filter(Boolean)
  return parts[parts.length - 1] ?? ''
}

/** href에서 region slug 추출 */
export function parseRegionSlugFromHref(href: string): string {
  const parts = href.replace(/\/$/, '').split('/').filter(Boolean)
  return parts[0] ?? ''
}
