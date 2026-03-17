import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const { id } = await params
  const body = await _request.json()

  const update: Record<string, unknown> = {}
  const keys = ['href', 'icon', 'region', 'type', 'type_class', 'type_style', 'name', 'stars', 'contact', 'tags', 'location', 'desc', 'char_count', 'sort_order', 'period_days', 'period_end', 'is_active', 'review_schedule_preset']
  for (const k of keys) {
    if (body[k] !== undefined) {
      if (k === 'type') {
        update[k] = body[k] === '기타' ? '가라오케' : body[k]
      } else {
        update[k] = body[k]
      }
    }
  }
  if (body.period_days !== undefined) {
    const days = Number(body.period_days) || 30
    const pe = new Date()
    pe.setDate(pe.getDate() + days)
    update.period_end = pe.toISOString().slice(0, 10)
  }
  update.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('partners')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const { id } = await params
  const { error } = await supabaseAdmin.from('partners').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
