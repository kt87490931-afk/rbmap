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

/** limit: 미지정 = 전체, N = 상위 N개만 */
export async function getReviews(limit?: number): Promise<Review[]> {
  let q = supabase
    .from('reviews')
    .select('*')
    .order('sort_order', { ascending: true })
  if (limit != null && limit > 0) {
    q = q.limit(limit)
  }
  const { data, error } = await q

  if (error) return []
  return (data ?? []).map((r) => ({
    ...r,
    is_new: !!r.is_new,
    body_json: Array.isArray(r.body_json) ? r.body_json : [],
  }))
}
