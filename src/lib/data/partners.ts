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

/** limit: 0 또는 미지정 = 전체, N = 상위 N개만 */
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
  return (data ?? []).map((p) => ({
    ...p,
    type_style: p.type_style && typeof p.type_style === 'object' ? p.type_style : {},
    tags: Array.isArray(p.tags) ? p.tags : [],
  }))
}

export async function getPartnersByRegion(regionName: string): Promise<Partner[]> {
  const all = await getPartners()
  return all.filter((p) => p.region?.includes(regionName) || regionName?.includes(p.region ?? ''))
}
