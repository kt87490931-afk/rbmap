import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'
import { SECTION_FALLBACKS } from '@/lib/data/site'

export const dynamic = 'force-dynamic'

const VALID_KEYS = [
  'hero', 'ticker', 'header', 'about', 'region_guide', 'category_guide',
  'widgets_a', 'widgets_b', 'stats', 'cta', 'footer', 'region_preview',
  'partners_config', 'feed_config', 'review_config', 'region_sidebar', 'seo',
  'visitor_config', 'cron_control', 'faq',
] as const

function isEmptyObj(obj: unknown): boolean {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj) && Object.keys(obj).length === 0
}

function mergeWithFallback(fallback: unknown, dbContent: unknown): unknown {
  if (dbContent == null || isEmptyObj(dbContent)) {
    return fallback
  }
  if (Array.isArray(dbContent) && dbContent.length > 0) return dbContent
  if (Array.isArray(fallback) && !Array.isArray(dbContent)) return fallback
  if (typeof fallback !== 'object' || fallback === null) return dbContent ?? fallback
  if (typeof dbContent !== 'object' || dbContent === null) return fallback
  const merged = { ...(fallback as Record<string, unknown>) }
  for (const k of Object.keys(dbContent as Record<string, unknown>)) {
    const fv = (fallback as Record<string, unknown>)[k]
    const dv = (dbContent as Record<string, unknown>)[k]
    if (dv != null && (typeof dv !== 'object' || Array.isArray(dv) || !isEmptyObj(dv))) {
      merged[k] = typeof fv === 'object' && typeof dv === 'object' && fv != null && dv != null && !Array.isArray(fv) && !Array.isArray(dv)
        ? mergeWithFallback(fv, dv)
        : dv
    }
  }
  return merged
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const { key } = await params
  if (!VALID_KEYS.includes(key as typeof VALID_KEYS[number])) {
    return NextResponse.json({ error: 'Invalid section key' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('site_sections')
    .select('content')
    .eq('section_key', key)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const fallback = SECTION_FALLBACKS[key as keyof typeof SECTION_FALLBACKS] ?? {}
  const dbContent = data?.content ?? {}
  const merged = mergeWithFallback(fallback, dbContent)
  return NextResponse.json(merged)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const { key } = await params
  if (!VALID_KEYS.includes(key as typeof VALID_KEYS[number])) {
    return NextResponse.json({ error: 'Invalid section key' }, { status: 400 })
  }

  const body = await request.json()
  const content = typeof body === 'object' && body !== null ? body : {}

  const { data, error } = await supabaseAdmin
    .from('site_sections')
    .upsert(
      {
        section_key: key,
        content,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'section_key' }
    )
    .select('content')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data.content)
}
