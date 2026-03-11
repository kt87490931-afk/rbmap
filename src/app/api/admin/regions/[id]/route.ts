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
  if (body.slug !== undefined) update.slug = body.slug
  if (body.name !== undefined) update.name = body.name
  if (body.short !== undefined) update.short = body.short
  if (body.thumb_class !== undefined) update.thumb_class = body.thumb_class
  if (body.tags !== undefined) update.tags = body.tags
  if (body.venues !== undefined) update.venues = body.venues
  if (body.reviews !== undefined) update.reviews = body.reviews
  if (body.badge !== undefined) update.badge = body.badge
  if (body.coming !== undefined) update.coming = body.coming
  if (body.sort_order !== undefined) update.sort_order = body.sort_order
  update.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('regions')
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
  const { error } = await supabaseAdmin.from('regions').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
