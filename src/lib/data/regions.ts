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
  return (data ?? []).map((r) => ({
    ...r,
    tags: Array.isArray(r.tags) ? r.tags : [],
    coming: !!r.coming,
    map_x: r.map_x != null ? Number(r.map_x) : null,
    map_y: r.map_y != null ? Number(r.map_y) : null,
  }))
}

export async function getRegionBySlug(slug: string): Promise<Region | null> {
  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) return null
  return {
    ...data,
    tags: Array.isArray(data.tags) ? data.tags : [],
    coming: !!data.coming,
    map_x: data.map_x != null ? Number(data.map_x) : null,
    map_y: data.map_y != null ? Number(data.map_y) : null,
  }
}
