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
  'room-salon': '룸싸롱',
  shirtsroom: '셔츠룸',
  shirtroom: '셔츠룸',
  public: '퍼블릭',
  bar: '바',
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
  /** AI 생성 시 저장: 핵심 주제(제휴업체명 포함), 이용 목적 */
  scenario_used?: { core_keywords?: string[]; purpose_label?: string; [key: string]: unknown }
}

export function buildReviewUrl(region: string, type: string, venueSlug: string, slug: string): string {
  return `/${region}/${type}/${venueSlug}/${slug}`
}

/** path → contact/hours 추출 헬퍼 */
function extractContactHours(data: { contact?: string; info_cards?: { label?: string; val?: string }[] }): { contact: string; hours: string } | null {
  const contact = typeof data.contact === 'string' ? data.contact.trim() : ''
  if (!contact) return null
  const infoCards = data.info_cards
  const hoursCard = Array.isArray(infoCards) ? infoCards.find((c) => /영업|시간|hours/i.test(c?.label ?? '')) : undefined
  const hours = hoursCard?.val ?? '영업시간 문의'
  return { contact, hours }
}

/** 리뷰 상세 "업소 정보"용. 모든 지역(gangnam, suwon, dongtan, osan, garak, jeju) 동일 로직. */
export async function getPartnerForVenue(
  region: string,
  type: string,
  venueSlug: string,
  venueName?: string
): Promise<{ name: string; contact?: string; hours?: string } | null> {
  const r = (region || '').trim().toLowerCase()
  const t = (type || '').replace(/^\/+|\/+$/g, '')
  const v = (venueSlug || '').replace(/^\/+|\/+$/g, '')
  const path = `/${r}/${t}/${v}`.replace(/\/+/g, '/')

  const { data, error } = await supabaseAdmin
    .from('partners')
    .select('contact, info_cards, name')
    .in('href', [path, path + '/'])
    .limit(1)
    .maybeSingle()

  if (!error && data) {
    const d = data as { contact?: string; info_cards?: { label?: string; val?: string }[]; name?: string }
    const name = (d.name ?? venueName ?? '').trim() || venueName
    if (name) {
      const ch = extractContactHours(d)
      return ch ? { name, contact: ch.contact, hours: ch.hours } : { name }
    }
  }

  if (!venueName && !venueSlug) return null

  const { data: list } = await supabaseAdmin
    .from('partners')
    .select('contact, info_cards, name, href')
    .ilike('href', `%/${r}/%`)
    .limit(100)

  const norm = (s: string) => (s ?? '').replace(/\s+/g, '').toLowerCase()
  const vNorm = venueName ? norm(venueName) : ''
  const rows = (list ?? []) as { contact?: string; info_cards?: { label?: string; val?: string }[]; name?: string; href?: string }[]
  let match = venueName
    ? rows.find((p) => {
        const n = (p.name ?? '').trim()
        if (!n) return false
        if (n === venueName || n.includes(venueName) || venueName.includes(n)) return true
        if (norm(n) === vNorm || norm(n).includes(vNorm) || vNorm.includes(norm(n))) return true
        return false
      })
    : null
  if (!match && venueSlug) {
    match = rows.find((p) => (p.href ?? '').toLowerCase().includes(`/${venueSlug}`) || (p.href ?? '').toLowerCase().endsWith(`/${venueSlug}`))
  }
  if (match) {
    const name = (((match.name ?? '').trim() || venueName) ?? '').trim()
    if (name) {
      const ch = extractContactHours(match)
      return ch ? { name, contact: ch.contact, hours: ch.hours } : { name }
    }
  }
  return null
}

/** @deprecated getPartnerForVenue 사용 권장. 연락처만 필요할 때 하위 호환용 */
export async function getPartnerContactForVenue(
  region: string,
  type: string,
  venueSlug: string,
  venueName?: string
): Promise<{ contact: string; hours?: string } | null> {
  const p = await getPartnerForVenue(region, type, venueSlug, venueName)
  return p?.contact ? { contact: p.contact, hours: p.hours } : null
}

/** 리뷰 상세 메타(키워드·설명 보강)용 제휴업체 태그·설명. href가 /{region}/{type}/{venueSlug} 와 일치하는 1건 조회 */
export async function getPartnerMetaForVenue(
  region: string,
  type: string,
  venueSlug: string
): Promise<{ tags: string[]; desc: string } | null> {
  const path = `/${(region || '').replace(/^\/+|\/+$/g, '')}/${(type || '').replace(/^\/+|\/+$/g, '')}/${(venueSlug || '').replace(/^\/+|\/+$/g, '')}`.replace(/\/+/g, '/')
  const { data, error } = await supabaseAdmin
    .from('partners')
    .select('tags, desc')
    .in('href', [path, path + '/'])
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  const tags = Array.isArray((data as { tags?: unknown }).tags)
    ? ((data as { tags: string[] }).tags).map((t) => String(t).trim()).filter(Boolean)
    : typeof (data as { tags?: string }).tags === 'string'
      ? (data as { tags: string }).tags.split(',').map((s) => s.trim()).filter(Boolean)
      : []
  const desc = typeof (data as { desc?: string }).desc === 'string' ? (data as { desc: string }).desc.trim() : ''
  return { tags, desc }
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

/** 지역별 published 리뷰 수 (지도·지역별정보 리뷰 수 연동용) */
export async function getReviewCountsByRegion(): Promise<Record<string, number>> {
  const { data } = await supabaseAdmin
    .from('review_posts')
    .select('region')
    .eq('status', 'published')
  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const r = (row as { region?: string }).region ?? ''
    if (r) counts[r] = (counts[r] ?? 0) + 1
  }
  return counts
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
    scenario_used: (r.scenario_used as ReviewPost['scenario_used']) ?? undefined,
  }
}
