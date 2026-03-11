import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('feed_items')
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
    .from('feed_items')
    .insert({
      href: body.href,
      pill: body.pill,
      pill_class: body.pill_class ?? 'p-default',
      title: body.title,
      sub: body.sub ?? '',
      stars: body.stars ?? '★★★★☆',
      time: body.time ?? '',
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
