/**
 * 리뷰 포스트 데이터 레이어
 * URL: /{region}/{type}/{venue_slug}/{slug}
 */

import { supabaseAdmin } from '../supabase-server'
import { REGION_SLUG_TO_NAME } from './venues'

export const REVIEW_TYPE_TO_NAME: Record<string, string> = {
  karaoke: '가라오케',
  highpublic: '하이퍼블릭',
  jjomoh: '쩜오',
  shirtsroom: '셔츠룸',
  shirtroom: '셔츠룸',
  public: '퍼블릭',
}

export const REGION_PILL_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  gangnam: { bg: 'rgba(192,57,43,.12)', color: '#e05c50', border: 'rgba(192,57,43,.28)' },
  suwon: { bg: 'rgba(58,123,213,.12)', color: '#5a9be8', border: 'rgba(58,123,213,.28)' },
  dongtan: { bg: 'rgba(46,204,113,.12)', color: '#3dba7a', border: 'rgba(46,204,113,.28)' },
  jeju: { bg: 'rgba(155,89,182,.12)', color: '#b07dd1', border: 'rgba(155,89,182,.28)' },
}

export interface ReviewPost {
  id: string
  region: string
  type: string
  venue: string
  venue_slug: string
  slug: string
  title: string
  star: number
  visit_date: string | null
  status: string
  published_at: string | null
  sec_overview: string
  sec_lineup: string
  sec_price: string
  sec_facility: string
  sec_summary: string
  good_tags: string[]
  bad_tags: string[]
  meta_description: string
  meta_keywords: string
  is_ai_written: boolean
  summary_rating: string
  summary_price: string
  summary_lineup: string
  summary_price_type: string
  venue_page_url: string
  sort_order: number
  created_at: string
  updated_at: string
}

export function buildReviewUrl(region: string, type: string, venueSlug: string, slug: string): string {
  return `/${region}/${type}/${venueSlug}/${slug}`
}

/** path 정규화 (앞뒤 슬래시 제거) */
function normalizePath(p: string): string {
  return (p || "").replace(/^\/+|\/+$/g, "") || "";
}

/**
 * /reviews 페이지와 동일한 review_posts를 클릭순(방문수)으로 정렬하여 반환
 * visit_logs의 path와 리뷰 URL을 매칭하여 방문 수로 정렬
 */
export async function getReviewPostsListByClickCount(limit = 5): Promise<ReviewPost[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startISO = thirtyDaysAgo.toISOString();

  const [postsRes, visitsRes] = await Promise.all([
    supabaseAdmin
      .from("review_posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(200),
    supabaseAdmin
      .from("visit_logs")
      .select("path")
      .gte("created_at", startISO),
  ]);

  const posts = (postsRes.data ?? []).map(mapRow);
  const visits = visitsRes.data ?? [];

  const pathCount: Record<string, number> = {};
  for (const v of visits) {
    const key = normalizePath((v as { path?: string }).path ?? "");
    if (key) pathCount[key] = (pathCount[key] ?? 0) + 1;
  }

  const withCount = posts.map((p) => {
    const path = normalizePath(buildReviewUrl(p.region, p.type, p.venue_slug, p.slug));
    return { post: p, count: pathCount[path] ?? 0 };
  });
  withCount.sort((a, b) => b.count - a.count || (b.post.published_at || "").localeCompare(a.post.published_at || ""));
  return withCount.slice(0, limit).map((w) => w.post);
}

export async function getReviewPostsList(filters?: {
  region?: string
  type?: string
  star?: string
  limit?: number
  offset?: number
}): Promise<ReviewPost[]> {
  let q = supabaseAdmin
    .from('review_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (filters?.region && filters.region !== 'all') {
    q = q.eq('region', filters.region)
  }
  if (filters?.type && filters.type !== 'all') {
    q = q.eq('type', filters.type)
  }
  if (filters?.star && filters.star !== 'all') {
    q = q.eq('star', parseInt(filters.star, 10))
  }
  const limit = filters?.limit ?? 50
  const offset = filters?.offset ?? 0
  q = q.range(offset, offset + limit - 1)

  const { data, error } = await q
  if (error) return []
  return (data ?? []).map(mapRow)
}

export async function getReviewPostBySlug(
  region: string,
  type: string,
  venueSlug: string,
  slug: string
): Promise<ReviewPost | null> {
  const { data, error } = await supabaseAdmin
    .from('review_posts')
    .select('*')
    .eq('status', 'published')
    .eq('region', region)
    .eq('type', type)
    .eq('venue_slug', venueSlug)
    .eq('slug', slug)
    .single()

  if (error || !data) return null
  return mapRow(data)
}

export async function getReviewPostsByVenue(
  region: string,
  venueSlug: string,
  excludeId?: string,
  limit = 5
): Promise<ReviewPost[]> {
  let q = supabaseAdmin
    .from('review_posts')
    .select('*')
    .eq('status', 'published')
    .eq('region', region)
    .eq('venue_slug', venueSlug)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (excludeId) q = q.neq('id', excludeId)

  const { data } = await q
  return (data ?? []).map(mapRow)
}

export async function getReviewPostsByRegion(
  region: string,
  type: string,
  excludeVenueSlug?: string,
  limit = 5
): Promise<ReviewPost[]> {
  let q = supabaseAdmin
    .from('review_posts')
    .select('*')
    .eq('status', 'published')
    .eq('region', region)
    .eq('type', type)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (excludeVenueSlug) q = q.neq('venue_slug', excludeVenueSlug)

  const { data } = await q
  return (data ?? []).map(mapRow)
}

export async function getPrevNextReviews(
  publishedAt: string,
  excludeId?: string
): Promise<{ prev: ReviewPost | null; next: ReviewPost | null }> {
  let prevQ = supabaseAdmin
    .from('review_posts')
    .select('*')
    .eq('status', 'published')
    .lt('published_at', publishedAt)
    .order('published_at', { ascending: false })
    .limit(1)
  if (excludeId) prevQ = prevQ.neq('id', excludeId)
  const { data: prevRows } = await prevQ
  const prev = prevRows?.[0] ? mapRow(prevRows[0]) : null

  let nextQ = supabaseAdmin
    .from('review_posts')
    .select('*')
    .eq('status', 'published')
    .gt('published_at', publishedAt)
    .order('published_at', { ascending: true })
    .limit(1)
  if (excludeId) nextQ = nextQ.neq('id', excludeId)
  const { data: nextRows } = await nextQ
  const next = nextRows?.[0] ? mapRow(nextRows[0]) : null

  return { prev, next }
}

export function getRegionName(slug: string): string {
  return REGION_SLUG_TO_NAME[slug] ?? slug
}

export function getTypeName(type: string): string {
  return REVIEW_TYPE_TO_NAME[type] ?? type
}

export function formatStars(star: number): string {
  return '★'.repeat(star) + '☆'.repeat(5 - star)
}

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
  }
}
