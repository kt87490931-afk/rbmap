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
  const { data, error } = await supabaseAdmin
    .from('regions')
    .insert({
      slug: body.slug,
      name: body.name,
      short: body.short,
      thumb_class: body.thumb_class ?? 'default',
      tags: body.tags ?? [],
      venues: body.venues ?? 0,
      reviews: body.reviews ?? 0,
      badge: body.badge ?? null,
      coming: !!body.coming,
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
