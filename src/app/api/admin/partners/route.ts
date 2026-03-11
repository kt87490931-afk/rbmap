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
  const { data, error } = await supabaseAdmin
    .from('partners')
    .insert({
      href: body.href,
      icon: body.icon ?? '🎤',
      region: body.region,
      type: body.type,
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
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
