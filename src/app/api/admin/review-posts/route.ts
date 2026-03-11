import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const body = await request.json()
  const publishedAt = body.status === 'published'
    ? (body.published_at ? new Date(body.published_at).toISOString() : new Date().toISOString())
    : null

  const row = {
    region: body.region,
    type: body.type,
    venue: body.venue,
    venue_slug: body.venue_slug || slugify(body.venue),
    slug: body.slug,
    title: body.title,
    star: Math.min(5, Math.max(1, parseInt(String(body.star), 10) || 5)),
    visit_date: body.visit_date || null,
    status: body.status === 'published' ? 'published' : 'draft',
    published_at: publishedAt,
    sec_overview: body.sec_overview ?? '',
    sec_lineup: body.sec_lineup ?? '',
    sec_price: body.sec_price ?? '',
    sec_facility: body.sec_facility ?? '',
    sec_summary: body.sec_summary ?? '',
    good_tags: Array.isArray(body.good_tags) ? body.good_tags : [],
    bad_tags: Array.isArray(body.bad_tags) ? body.bad_tags : [],
    meta_description: body.meta_description ?? '',
    meta_keywords: body.meta_keywords ?? '',
    is_ai_written: !!body.is_ai_written,
    summary_rating: body.summary_rating ?? '',
    summary_price: body.summary_price ?? '',
    summary_lineup: body.summary_lineup ?? '',
    summary_price_type: body.summary_price_type ?? '',
    venue_page_url: body.venue_page_url ?? '',
    sort_order: body.sort_order ?? 0,
  }

  const { data, error } = await supabaseAdmin
    .from('review_posts')
    .insert(row)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'venue'
}
