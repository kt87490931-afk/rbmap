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

export async function getFeedItems(): Promise<FeedItem[]> {
  const { data, error } = await supabase
    .from('feed_items')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) return []
  return data ?? []
}
