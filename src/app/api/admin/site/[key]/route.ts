import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const VALID_KEYS = [
  'hero', 'ticker', 'header', 'seo', 'widgets_a', 'widgets_b',
  'stats', 'cta', 'footer', 'region_preview',
] as const

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
  return NextResponse.json(data?.content ?? {})
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
