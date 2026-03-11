import { supabase } from '../supabase'

export interface Review {
  id: string
  href: string
  region: string
  date: string
  is_new: boolean
  title: string
  excerpt: string
  stars: string
  venue: string
  sort_order: number
  body_json?: string[]
  char_count?: string
}

export async function getReviews(): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) return []
  return (data ?? []).map((r) => ({
    ...r,
    is_new: !!r.is_new,
    body_json: Array.isArray(r.body_json) ? r.body_json : [],
  }))
}
