import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('reviews')
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
