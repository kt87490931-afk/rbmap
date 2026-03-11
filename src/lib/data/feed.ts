import { supabase } from '../supabase'

export interface FeedItem {
  id: string
  href: string
  pill: string
  pill_class: string
  title: string
  sub: string
  stars: string
  time: string
  sort_order: number
}

/** limit: 0 = 전체, N = 상위 N개, 미지정 = 10 */
export async function getFeedItems(limit?: number): Promise<FeedItem[]> {
  let q = supabase
    .from('feed_items')
    .select('*')
    .order('sort_order', { ascending: true })
  const effectiveLimit = limit === 0 ? undefined : (limit ?? 10)
  if (effectiveLimit != null && effectiveLimit > 0) {
    q = q.limit(effectiveLimit)
  }
  const { data, error } = await q

  if (error) return []
  return data ?? []
}
