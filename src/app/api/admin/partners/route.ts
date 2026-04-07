import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('partners')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const body = await request.json()
  const normalizedType = (body.type === '기타' ? '가라오케' : body.type) ?? ''
  const days = Number(body.period_days) || 30
  const periodEnd = new Date()
  periodEnd.setDate(periodEnd.getDate() + days)

  const { data, error } = await supabaseAdmin
    .from('partners')
    .insert({
      href: body.href,
      icon: body.icon ?? '🎤',
      region: body.region,
      type: normalizedType,
      type_class: body.type_class ?? '',
      type_style: body.type_style ?? {},
      name: body.name,
      stars: body.stars ?? '★★★★★',
      contact: body.contact ?? '',
      tags: body.tags ?? [],
      location: body.location ?? '',
      desc: body.desc ?? '',
      char_count: body.char_count ?? '',
      sort_order: body.sort_order ?? 0,
      period_days: days,
      period_end: periodEnd.toISOString().slice(0, 10),
      is_active: body.is_active !== false,
      review_schedule_preset: body.review_schedule_preset ?? '24h_1',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
