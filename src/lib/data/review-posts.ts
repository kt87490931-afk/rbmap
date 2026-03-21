/**
 * 리뷰 포스트 데이터 레이어
 * URL: /{region}/{type}/{venue_slug}/{slug}
 */

import { unstable_noStore } from 'next/cache'
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
  garak: { bg: 'rgba(230,126,34,.12)', color: '#e67e22', border: 'rgba(230,126,34,.28)' },
  osan: { bg: 'rgba(52,152,219,.12)', color: '#5dade2', border: 'rgba(52,152,219,.28)' },
  jamsil: { bg: 'rgba(192,57,43,.15)', color: '#e74c3c', border: 'rgba(231,76,60,.35)' },
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
  unstable_noStore()
  const r = (region || '').trim().toLowerCase()
  const t = (type || '').replace(/^\/+|\/+$/g, '')
  const v = (venueSlug || '').replace(/^\/+|\/+$/g, '')
  const path = `/${r}/${t}/${v}`.replace(/\/+/g, '/')

  type PartnerRow = { contact?: string; info_cards?: { label?: string; val?: string }[]; name?: string }
  let data: PartnerRow | null = null

  let res = await supabaseAdmin.from('partners').select('contact, info_cards, name').eq('href', path).limit(1).maybeSingle()
  if (res.data) {
    data = res.data as PartnerRow
  } else if (!res.error) {
    res = await supabaseAdmin.from('partners').select('contact, info_cards, name').eq('href', path + '/').limit(1).maybeSingle()
    if (res.data) data = res.data as PartnerRow
    if (!data) {
      res = await supabaseAdmin.from('partners').select('contact, info_cards, name').ilike('href', path).limit(1).maybeSingle()
      if (res.data) data = res.data as PartnerRow
    }
  }

  if (data) {
    const name = (data.name ?? venueName ?? '').trim() || venueName
    if (name) {
      const ch = extractContactHours(data)
      if (ch) return { name, contact: ch.contact, hours: ch.hours }
      return { name }
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

/** path 정규화 (디코딩 + 앞뒤 슬래시 제거, 매칭용) */
function normalizePath(p: string): string {
  let s = (p || "").trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    /* keep as-is */
  }
  return s.replace(/^\/+|\/+$/g, "") || "";
}

/**
 * 클릭순(전체 누적 방문수)으로 정렬하여 반환
 */
export async function getReviewPostsListByClickCount(limit = 5): Promise<ReviewPost[]> {
  const [postsRes, pathCount] = await Promise.all([
    supabaseAdmin
      .from("review_posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(200),
    getPathCountsFromVisitLogs(),
  ]);

  const posts = (postsRes.data ?? []).map(mapRow);

  const withCount = posts.map((p) => {
    const path = normalizePath(buildReviewUrl(p.region, p.type, p.venue_slug, p.slug));
    return { post: p, count: pathCount[path] ?? 0 };
  });
  withCount.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    if (a.count === 0) return (a.post.published_at || "").localeCompare(b.post.published_at || "");
    return (b.post.published_at || "").localeCompare(a.post.published_at || "");
  });
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

/** 리뷰 목록 필터 적용 (select 이후 체인용). from().select(...) 뒤에 eq 적용한 빌더 반환 */
function applyListFilters(
  q: ReturnType<ReturnType<typeof supabaseAdmin.from>['select']>,
  filters: { region?: string; type?: string; star?: string }
) {
  let out = q.eq('status', 'published')
  if (filters?.region) out = out.eq('region', filters.region)
  if (filters?.type) out = out.eq('type', filters.type)
  if (filters?.star) out = out.eq('star', parseInt(filters.star, 10))
  return out
}

const POPULAR_SORT_CAP = 2000

/** visit_logs path별 전체 누적 방문수. RPC 우선, 없으면 raw select fallback. (어드민 조회수 표시용 export) */
export async function getPathCountsFromVisitLogs(): Promise<Record<string, number>> {
  const out: Record<string, number> = {}
  try {
    const { data } = await supabaseAdmin.rpc('get_visit_log_path_counts')
    for (const row of data ?? []) {
      const key = (row as { path_key?: string }).path_key ?? ''
      const cnt = Number((row as { cnt?: number }).cnt ?? 0)
      if (key) out[key] = cnt
    }
    if (Object.keys(out).length > 0) return out
  } catch {
    /* RPC 없음 → fallback */
  }
  const { data: visits } = await supabaseAdmin
    .from('visit_logs')
    .select('path')
    .order('created_at', { ascending: false })
    .range(0, 99999)
  for (const v of visits ?? []) {
    const key = normalizePath((v as { path?: string }).path ?? '')
    if (key) out[key] = (out[key] ?? 0) + 1
  }
  return out
}

/**
 * /reviews 페이지용: 페이지네이션 + 정렬(최신순/인기순)
 * - sort: 'latest' | 'popular'
 * - page: 1부터 시작
 * - perPage: 한 페이지당 개수 (기본 50)
 */
export async function getReviewPostsListPaginated(filters: {
  region?: string
  type?: string
  star?: string
  sort?: 'latest' | 'popular'
  page?: number
  perPage?: number
}): Promise<{ posts: ReviewPost[]; total: number }> {
  const page = Math.max(1, filters.page ?? 1)
  const perPage = Math.min(100, Math.max(1, filters.perPage ?? 50))
  const sort = filters.sort === 'popular' ? 'popular' : 'latest'
  const region = filters.region && filters.region !== 'all' ? filters.region : undefined
  const type = filters.type && filters.type !== 'all' ? filters.type : undefined
  const star = filters.star && filters.star !== 'all' ? filters.star : undefined

  if (sort === 'latest') {
    const countQ = applyListFilters(
      supabaseAdmin.from('review_posts').select('*', { count: 'exact', head: true }),
      { region, type, star }
    )
    const { count: total, error: countError } = await countQ
    if (countError) return { posts: [], total: 0 }
    const offset = (page - 1) * perPage
    const listQ = applyListFilters(supabaseAdmin.from('review_posts').select('*'), { region, type, star })
      .order('published_at', { ascending: false })
      .range(offset, offset + perPage - 1)
    const { data, error } = await listQ
    if (error) return { posts: [], total: total ?? 0 }
    const rows = (data ?? []) as Record<string, unknown>[]
    return { posts: rows.map(mapRow), total: total ?? 0 }
  }

  // 인기순: 동일 필터로 최대 POPULAR_SORT_CAP건 조회 후 visit_logs 전체 누적 방문수로 정렬
  const listForPopular = applyListFilters(supabaseAdmin.from('review_posts').select('*'), { region, type, star })
    .order('published_at', { ascending: false })
    .limit(POPULAR_SORT_CAP)
  const [postsRes, pathCountRes] = await Promise.all([
    listForPopular,
    getPathCountsFromVisitLogs(),
  ])

  const posts = ((postsRes.data ?? []) as Record<string, unknown>[]).map(mapRow)
  const pathCount = pathCountRes

  const withCount = posts.map((p) => {
    const path = normalizePath(buildReviewUrl(p.region, p.type, p.venue_slug, p.slug))
    return { post: p, count: pathCount[path] ?? 0 }
  })
  // 방문수 내림차순. 동점일 때: 방문 있음 → 최신순, 방문 0건 → 오래된 글 먼저 (신규 글이 인기 1위 불가)
  withCount.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    if (a.count === 0) return (a.post.published_at || '').localeCompare(b.post.published_at || '') // 0건: 오래된 순
    return (b.post.published_at || '').localeCompare(a.post.published_at || '') // 방문 있음: 최신순
  })

  const total = withCount.length
  const start = (page - 1) * perPage
  const pagePosts = withCount.slice(start, start + perPage).map((w) => w.post)
  return { posts: pagePosts, total }
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

/** 업종별 published 리뷰 수 (/reviews 필터 버튼용) */
export async function getReviewCountsByType(): Promise<Record<string, number>> {
  const { data } = await supabaseAdmin
    .from('review_posts')
    .select('type')
    .eq('status', 'published')
  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const t = (row as { type?: string }).type ?? ''
    if (t) counts[t] = (counts[t] ?? 0) + 1
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

/**
 * URL의 venue 세그먼트가 DB(venue_slug)와 다를 때(예: jsroom vs 실제 한글 slug) 404 방지.
 * region+type+review_slug로 1건 매칭되면 canonical venue_slug로 리다이렉트하도록 페이지에서 사용.
 */
export async function getPublishedReviewPostWithVenueFix(
  region: string,
  type: string,
  venueSlugFromUrl: string,
  slug: string
): Promise<{ post: ReviewPost; redirectToCanonical: string | null } | null> {
  const exact = await getReviewPostBySlug(region, type, venueSlugFromUrl, slug)
  if (exact) return { post: exact, redirectToCanonical: null }

  const { data, error } = await supabaseAdmin
    .from('review_posts')
    .select('*')
    .eq('status', 'published')
    .eq('region', region)
    .eq('type', type)
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) return null
  const post = mapRow(data)
  if (post.venue_slug === venueSlugFromUrl) return { post, redirectToCanonical: null }

  const canonicalPath = buildReviewUrl(region, type, post.venue_slug, post.slug)
  return { post, redirectToCanonical: canonicalPath }
}

/** 업체별 리뷰 수 (가벼운 COUNT 쿼리 — 초기 페이지 로드용) */
export async function getReviewCountByVenue(region: string, venueSlug: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('review_posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .eq('region', region)
    .eq('venue_slug', venueSlug)
  if (error) return 0
  return count ?? 0
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

/** regions 테이블에서 만든 slug→표시명 맵을 넘기면 신규 지역도 한글명 표시 */
export function getRegionName(slug: string, slugToDisplayName?: Record<string, string>): string {
  const fromDb = slugToDisplayName?.[slug]
  if (fromDb) return fromDb
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
