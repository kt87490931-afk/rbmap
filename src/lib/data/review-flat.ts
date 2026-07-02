/**
 * 평면 리뷰 URL: /reviews/[flatSlug]
 * SEO: 키워드 slug 유지, 충돌 시 짧은 id 접미사
 */

import { cache } from 'react'
import { supabaseAdmin } from '../supabase-server'
import {
  buildReviewUrl,
  formatStars,
  getReviewPostsListPaginated,
  type ReviewPost,
} from './review-posts'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rbbmap.com'

export interface FlatSlugIndex {
  idToFlat: Map<string, string>
  flatToId: Map<string, string>
  legacyToFlat: Map<string, string>
}

function normalizeFlatKey(raw: string): string {
  try {
    return decodeURIComponent(raw.trim())
  } catch {
    return raw.trim()
  }
}

function shortId(id: string): string {
  return id.replace(/-/g, '').slice(0, 8)
}

/** published 리뷰 전체에 대해 flat slug 인덱스 생성 (요청 단위 캐시) */
export const getFlatSlugIndex = cache(async (): Promise<FlatSlugIndex> => {
  const { data, error } = await supabaseAdmin
    .from('review_posts')
    .select('id, slug, region, type, venue_slug, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: true })

  const idToFlat = new Map<string, string>()
  const flatToId = new Map<string, string>()
  const legacyToFlat = new Map<string, string>()
  const used = new Set<string>()

  if (error || !data) {
    return { idToFlat, flatToId, legacyToFlat }
  }

  for (const row of data) {
    const id = String(row.id)
    const baseRaw = String(row.slug || '').trim()
    const base = baseRaw || `review-${shortId(id)}`
    let flat = base
    if (used.has(flat)) {
      flat = `${base}-${shortId(id)}`
    }
    let n = 2
    while (used.has(flat)) {
      flat = `${base}-${n}`
      n += 1
    }
    used.add(flat)
    idToFlat.set(id, flat)
    flatToId.set(flat, id)

    const legacy = buildReviewUrl(
      String(row.region),
      String(row.type),
      String(row.venue_slug),
      String(row.slug)
    )
    legacyToFlat.set(legacy.replace(/^\/+|\/+$/g, ''), flat)
    legacyToFlat.set(decodeURIComponent(legacy.replace(/^\/+|\/+$/g, '')), flat)
  }

  return { idToFlat, flatToId, legacyToFlat }
})

export function buildFlatReviewPath(flatSlug: string): string {
  return `/reviews/${encodeURIComponent(flatSlug)}`
}

export function buildFlatReviewUrl(flatSlug: string): string {
  return `${SITE_URL}${buildFlatReviewPath(flatSlug)}`
}

export async function getFlatSlugForPostId(postId: string): Promise<string | null> {
  const index = await getFlatSlugIndex()
  return index.idToFlat.get(postId) ?? null
}

export async function getPublishedReviewByFlatSlug(flatSlug: string): Promise<ReviewPost | null> {
  const key = normalizeFlatKey(flatSlug)
  const index = await getFlatSlugIndex()
  const postId = index.flatToId.get(key)
  if (!postId) return null

  const { data, error } = await supabaseAdmin
    .from('review_posts')
    .select('*')
    .eq('id', postId)
    .eq('status', 'published')
    .maybeSingle()

  if (error || !data) return null
  return mapRow(data as Record<string, unknown>)
}

export async function getFlatReviewPostsPaginated(filters: {
  page?: number
  perPage?: number
}): Promise<{ posts: (ReviewPost & { flatSlug: string })[]; total: number }> {
  const page = Math.max(1, filters.page ?? 1)
  const perPage = Math.min(50, Math.max(1, filters.perPage ?? 20))
  const { posts, total } = await getReviewPostsListPaginated({
    sort: 'latest',
    page,
    perPage,
  })
  const index = await getFlatSlugIndex()
  const enriched = posts.map((p) => ({
    ...p,
    flatSlug: index.idToFlat.get(p.id) ?? p.slug,
  }))
  return { posts: enriched, total }
}

export async function getLatestFlatReviews(limit = 4): Promise<(ReviewPost & { flatSlug: string })[]> {
  const { posts } = await getReviewPostsListPaginated({ sort: 'latest', page: 1, perPage: limit })
  const index = await getFlatSlugIndex()
  return posts.map((p) => ({
    ...p,
    flatSlug: index.idToFlat.get(p.id) ?? p.slug,
  }))
}

export async function getPrevNextFlatReviews(
  publishedAt: string,
  excludeId?: string
): Promise<{
  prev: (ReviewPost & { flatSlug: string }) | null
  next: (ReviewPost & { flatSlug: string }) | null
}> {
  let prevQ = supabaseAdmin
    .from('review_posts')
    .select('*')
    .eq('status', 'published')
    .lt('published_at', publishedAt)
    .order('published_at', { ascending: false })
    .limit(1)
  if (excludeId) prevQ = prevQ.neq('id', excludeId)

  let nextQ = supabaseAdmin
    .from('review_posts')
    .select('*')
    .eq('status', 'published')
    .gt('published_at', publishedAt)
    .order('published_at', { ascending: true })
    .limit(1)
  if (excludeId) nextQ = nextQ.neq('id', excludeId)

  const [prevRes, nextRes, index] = await Promise.all([prevQ, nextQ, getFlatSlugIndex()])
  const prevRow = prevRes.data?.[0]
  const nextRow = nextRes.data?.[0]

  const wrap = (row: Record<string, unknown> | undefined) => {
    if (!row) return null
    const post = mapRow(row)
    return { ...post, flatSlug: index.idToFlat.get(post.id) ?? post.slug }
  }

  return { prev: wrap(prevRow as Record<string, unknown> | undefined), next: wrap(nextRow as Record<string, unknown> | undefined) }
}

export async function getPublishedReviewCount(): Promise<number> {
  const { count } = await supabaseAdmin
    .from('review_posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
  return count ?? 0
}

export function reviewExcerpt(post: ReviewPost, max = 160): string {
  const raw = post.meta_description || post.sec_overview || post.sec_summary || post.title
  const t = raw.replace(/\s+/g, ' ').trim()
  return t.length > max ? `${t.slice(0, max)}…` : t
}

export function formatReviewDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\.\s/g, '.').replace(/\.$/, '')
}

export { formatStars }

function mapRow(r: Record<string, unknown>): ReviewPost {
  return {
    id: r.id as string,
    region: (r.region as string) ?? '',
    type: (r.type as string) ?? '',
    venue: (r.venue as string) ?? '',
    venue_slug: (r.venue_slug as string) ?? '',
    slug: (r.slug as string) ?? '',
    title: (r.title as string) ?? '',
    star: (r.star as number) ?? 5,
    visit_date: (r.visit_date as string) ?? null,
    status: (r.status as string) ?? 'draft',
    published_at: (r.published_at as string) ?? null,
    sec_overview: (r.sec_overview as string) ?? '',
    sec_lineup: (r.sec_lineup as string) ?? '',
    sec_price: (r.sec_price as string) ?? '',
    sec_facility: (r.sec_facility as string) ?? '',
    sec_summary: (r.sec_summary as string) ?? '',
    good_tags: Array.isArray(r.good_tags) ? (r.good_tags as string[]) : [],
    bad_tags: Array.isArray(r.bad_tags) ? (r.bad_tags as string[]) : [],
    meta_description: (r.meta_description as string) ?? '',
    meta_keywords: (r.meta_keywords as string) ?? '',
    is_ai_written: !!(r.is_ai_written as boolean),
    summary_rating: (r.summary_rating as string) ?? '',
    summary_price: (r.summary_price as string) ?? '',
    summary_lineup: (r.summary_lineup as string) ?? '',
    summary_price_type: (r.summary_price_type as string) ?? '',
    venue_page_url: (r.venue_page_url as string) ?? '',
    sort_order: (r.sort_order as number) ?? 0,
    created_at: (r.created_at as string) ?? '',
    updated_at: (r.updated_at as string) ?? '',
    scenario_used: (r.scenario_used as ReviewPost['scenario_used']) ?? undefined,
  }
}
