import { supabase } from '../supabase'

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
