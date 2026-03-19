import { supabase } from '../supabase'
import { supabaseAdmin } from '../supabase-server'

export interface Region {
  id: string
  slug: string
  name: string
  short: string
  thumb_class: string
  tags: string[]
  venues: number
  reviews: number
  badge: 'HOT' | 'NEW' | null
  coming: boolean
  sort_order: number
  map_x?: number | null
  map_y?: number | null
}

export async function getRegions(): Promise<Region[]> {
  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) return []
  return (data ?? []).map((r) => {
    const numX = r.map_x != null ? Number(r.map_x) : NaN
    const numY = r.map_y != null ? Number(r.map_y) : NaN
    return {
      ...r,
      tags: Array.isArray(r.tags) ? r.tags : [],
      coming: !!r.coming,
      map_x: Number.isFinite(numX) ? numX : null,
      map_y: Number.isFinite(numY) ? numY : null,
    }
  })
}

export async function getRegionBySlug(slug: string): Promise<Region | null> {
  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) return null
  const numX = data.map_x != null ? Number(data.map_x) : NaN
  const numY = data.map_y != null ? Number(data.map_y) : NaN
  return {
    ...data,
    tags: Array.isArray(data.tags) ? data.tags : [],
    coming: !!data.coming,
    map_x: Number.isFinite(numX) ? numX : null,
    map_y: Number.isFinite(numY) ? numY : null,
  }
}

/** 서버 컴포넌트용: DB에서 지역 목록 조회 (supabaseAdmin) */
export async function getRegionsServer(): Promise<Region[]> {
  const { data, error } = await supabaseAdmin
    .from('regions')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) return []
  return (data ?? []).map((r) => {
    const numX = r.map_x != null ? Number(r.map_x) : NaN
    const numY = r.map_y != null ? Number(r.map_y) : NaN
    return {
      ...r,
      tags: Array.isArray(r.tags) ? r.tags : [],
      coming: !!r.coming,
      map_x: Number.isFinite(numX) ? numX : null,
      map_y: Number.isFinite(numY) ? numY : null,
    }
  })
}

/** 서버 컴포넌트용: DB에서 slug로 지역 조회 */
export async function getRegionBySlugServer(slug: string): Promise<Region | null> {
  const { data, error } = await supabaseAdmin
    .from('regions')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) return null
  const numX = data.map_x != null ? Number(data.map_x) : NaN
  const numY = data.map_y != null ? Number(data.map_y) : NaN
  return {
    ...data,
    tags: Array.isArray(data.tags) ? data.tags : [],
    coming: !!data.coming,
    map_x: Number.isFinite(numX) ? numX : null,
    map_y: Number.isFinite(numY) ? numY : null,
  }
}

/** 색인/라우팅용 유효 지역 slug 목록 (준비중 제외) */
export async function getValidRegionSlugs(): Promise<string[]> {
  const regions = await getRegionsServer()
  return regions.filter((r) => !r.coming).map((r) => r.slug)
}
