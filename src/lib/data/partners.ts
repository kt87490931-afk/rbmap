import { supabase } from '../supabase'

export interface Partner {
  id: string
  href: string
  icon: string
  region: string
  type: string
  type_class: string
  type_style: { background?: string; border?: string; color?: string }
  name: string
  stars: string
  contact: string
  tags: string[]
  location: string
  desc: string
  char_count: string
  sort_order: number
}

/** 샘플 업체명 블랙리스트 (디자인용 샘플 — 항상 제외) */
const SAMPLE_NAMES = new Set([
  "비너스 셔츠룸", "비너스", "오로라 가라오케", "오로라",
  "달토 가라오케", "퍼펙트 가라오케", "인트로 하이퍼블릭", "구구단 쩜오",
  "다이아몬드 하이퍼블릭", "스카이라운지 퍼블릭", "아우라 가라오케",
  "마징가 가라오케", "메칸더 셔츠룸", "스타 퍼블릭", "제니스 클럽", "오션뷰 가라오케",
])

/** 샘플/플레이스홀더 연락처 패턴 — 제외 대상 */
const PLACEHOLDER_PHONE = /0\d{1,2}[.\s-]*000[.\s-]*\d{4}|02[.\s-]*000[.\s-]*0000|0{2,3}[.\s-]?0{3}[.\s-]?0{4}/i

function isSamplePartner(p: { name?: string; contact?: string; is_active?: boolean }): boolean {
  if (p.is_active === false) return true
  if (p.name && SAMPLE_NAMES.has(p.name.trim())) return true
  const contact = (p.contact ?? "").replace(/[\s📞]/g, "")
  const digitsOnly = contact.replace(/\D/g, "")
  if (PLACEHOLDER_PHONE.test(p.contact ?? "")) return true
  if (/^0+$/.test(digitsOnly) || digitsOnly === "200000000" || digitsOnly === "310000000" || digitsOnly === "310000001") return true
  if (/0\d{1,2}0000000/.test(contact) || contact === "02-000-0000" || contact.includes("000-0000")) return true
  return false
}

/** limit: 0 또는 미지정 = 전체, N = 상위 N개만. 샘플/플레이스홀더 업체는 제외 */
export async function getPartners(limit?: number): Promise<Partner[]> {
  let q = supabase
    .from('partners')
    .select('*')
    .order('sort_order', { ascending: true })
  if (limit != null && limit > 0) {
    q = q.limit(limit)
  }
  const { data, error } = await q

  if (error) return []
  const list = (data ?? []).map((p) => ({
    ...p,
    type_style: p.type_style && typeof p.type_style === 'object' ? p.type_style : {},
    tags: Array.isArray(p.tags) ? p.tags : [],
  }))
  return list.filter((p) => !isSamplePartner(p))
}

/** regionName: '동탄' 등, regionSlug: 'dongtan' (href·slug 매칭용) */
export async function getPartnersByRegion(regionName: string, regionSlug?: string): Promise<Partner[]> {
  const all = await getPartners()
  return all.filter((p) => {
    if (p.region?.includes(regionName) || regionName?.includes(p.region ?? '')) return true
    if (regionSlug && p.region === regionSlug) return true
    if (regionSlug && p.href?.includes(`/${regionSlug}/`)) return true
    return false
  })
}

/** 제휴업체가 1개 이상 등록된 지역 slug/name 목록 (지역 드롭다운·지역별 페이지용) */
const REGION_NAME_TO_SLUG: Record<string, string> = {
  강남: "gangnam",
  수원: "suwon",
  "수원 인계동": "suwon",
  동탄: "dongtan",
  제주: "jeju",
}
const REGION_SLUG_TO_NAME: Record<string, string> = {
  gangnam: "강남",
  suwon: "수원 인계동",
  dongtan: "동탄",
  jeju: "제주",
}

export async function getRegionsWithPartners(): Promise<{ slug: string; name: string }[]> {
  const all = await getPartners()
  const slugSet = new Set<string>()
  for (const p of all) {
    const r = p.region?.trim()
    if (r) {
      const slug = REGION_NAME_TO_SLUG[r] ?? REGION_NAME_TO_SLUG[r.replace(/\s+인계동$/, "")] ?? r.toLowerCase().replace(/\s+/g, "-")
      slugSet.add(slug)
    }
    const hrefSlug = p.href?.replace(/^\//, "").split("/")[0]
    if (hrefSlug && (REGION_SLUG_TO_NAME[hrefSlug] || ["gangnam", "suwon", "dongtan", "jeju"].includes(hrefSlug))) slugSet.add(hrefSlug)
  }
  const order = ["gangnam", "suwon", "dongtan", "jeju"]
  return order.filter((s) => slugSet.has(s)).map((s) => ({ slug: s, name: REGION_SLUG_TO_NAME[s] ?? s }))
}

/** 지역별 제휴업체 수 (인근 지역 바로가기 등용) */
export async function getPartnerCountsByRegion(): Promise<Record<string, { venues: number }>> {
  const all = await getPartners()
  const counts: Record<string, number> = {}
  for (const p of all) {
    let slug = REGION_NAME_TO_SLUG[p.region?.trim() ?? ""] ?? REGION_NAME_TO_SLUG[(p.region ?? "").replace(/\s+인계동$/, "")]
    if (!slug && p.href) slug = p.href.replace(/^\//, "").split("/")[0] ?? ""
    if (slug) counts[slug] = (counts[slug] ?? 0) + 1
  }
  return Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, { venues: v }]))
}
