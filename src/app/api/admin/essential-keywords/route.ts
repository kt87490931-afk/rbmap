import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const { data, error } = await supabaseAdmin
    .from('essential_keywords')
    .select('id, keyword, sort_order, created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json([])
  }
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const body = await request.json()
  const keyword = String(body.keyword ?? '').trim()
  if (!keyword) return NextResponse.json({ error: 'keyword 필드가 필요합니다.' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('essential_keywords')
    .insert({ keyword, sort_order: body.sort_order ?? 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
