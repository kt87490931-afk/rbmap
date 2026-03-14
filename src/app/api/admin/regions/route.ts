import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('regions')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const body = await request.json()
  const slug = String(body.slug ?? '').trim().toLowerCase()
  const badge = body.badge && body.badge !== '' ? body.badge : null
  if (!slug || !body.name?.trim() || !body.short?.trim()) {
    return NextResponse.json({ error: 'slug, name, short는 필수입니다.' }, { status: 400 })
  }

  const { data: maxRow } = await supabaseAdmin.from('regions').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle()
  const maxOrder = maxRow?.sort_order ?? 0

  const { data, error } = await supabaseAdmin
    .from('regions')
    .insert({
      slug,
      name: String(body.name).trim(),
      short: String(body.short).trim(),
      thumb_class: body.thumb_class ?? 'default',
      tags: Array.isArray(body.tags) ? body.tags : [],
      venues: Number(body.venues) || 0,
      reviews: Number(body.reviews) || 0,
      badge,
      coming: !!body.coming,
      sort_order: body.sort_order ?? maxOrder + 1,
    })
    .select()
    .single()

  if (error) {
    const msg = error.code === '23505' ? `이미 존재하는 slug입니다: ${slug}` : error.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }
  return NextResponse.json(data)
}
