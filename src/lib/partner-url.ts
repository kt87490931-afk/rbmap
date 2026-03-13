/**
 * 룸빵여지도 제휴업체 링크 생성
 * 형식: /지역슬러그/종목슬러그/업소슬러그
 * 예: /dongtan/karaoke/dongtan-choigga
 */

import { TYPE_TO_SLUG, REGION_NAME_TO_SLUG } from './data/venues'

const VENUE_SLUG_MAP: Record<string, string> = {
  '동탄 최저가': 'dongtan-choigga',
  '동탄최저가': 'dongtan-choigga',
}

/** 업소명 → URL slug */
function nameToVenueSlug(name: string): string {
  const trimmed = name?.trim() || ''
  return VENUE_SLUG_MAP[trimmed] ?? trimmed.replace(/\s+/g, '-').toLowerCase()
}

/** 제휴업체 내부 링크 생성 (rbbmap.com/지역/종목/업소명) */
export function buildPartnerHref(
  regionName: string,
  typeName: string,
  venueName: string
): string {
  const regionSlug = REGION_NAME_TO_SLUG[regionName] ?? regionName.toLowerCase().replace(/\s+/g, '-')
  const categorySlug = TYPE_TO_SLUG[typeName] ?? 'karaoke'
  const venueSlug = nameToVenueSlug(venueName)
  return `/${regionSlug}/${categorySlug}/${venueSlug}`
}
