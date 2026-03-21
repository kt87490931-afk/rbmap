import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'
import { buildReviewUrl, getPathCountsFromVisitLogs } from '@/lib/data/review-posts'

export const dynamic = 'force-dynamic'

function pathKey(path: string): string {
  return (path || '').replace(/^\/+|\/+$/g, '').trim() || ''
}

/** 리뷰 관리: review_posts (AI 생성 포함) 조회. sort=latest|popular, view_count 포함 */
export async function GET(request: NextRequest) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const { searchParams } = new URL(request.url)
  const sort = searchParams.get('sort') === 'popular' ? 'popular' : 'latest'

  const { data: raw, error } = await supabaseAdmin
    .from('review_posts')
    .select('*')
    .order(sort === 'latest' ? 'created_at' : 'published_at', { ascending: false })
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const rows = (raw ?? []) as Record<string, unknown>[]

  const pathCount = await getPathCountsFromVisitLogs()

  const items = rows.map((r) => {
    const region = (r.region as string) ?? ''
    const type = (r.type as string) ?? ''
    const venueSlug = (r.venue_slug as string) ?? ''
    const slug = (r.slug as string) ?? ''
    const path = pathKey(buildReviewUrl(region, type, venueSlug, slug))
    const view_count = pathCount[path] ?? 0
    return { ...r, view_count }
  })

  if (sort === 'popular') {
    items.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      const va = (a.view_count as number) ?? 0
      const vb = (b.view_count as number) ?? 0
      if (vb !== va) return vb - va
      const pa = (a.published_at as string) ?? (a.created_at as string) ?? ''
      const pb = (b.published_at as string) ?? (b.created_at as string) ?? ''
      return pb.localeCompare(pa)
    })
  }

  return NextResponse.json(items)
}

export async function POST(request: Request) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const body = await request.json()
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .insert({
      href: body.href,
      region: body.region,
      date: body.date,
      is_new: !!body.is_new,
      title: body.title,
      excerpt: body.excerpt ?? '',
      stars: body.stars ?? '★★★★☆',
      venue: body.venue ?? '',
      sort_order: body.sort_order ?? 0,
      body_json: Array.isArray(body.body_json) ? body.body_json : null,
      char_count: body.char_count ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
