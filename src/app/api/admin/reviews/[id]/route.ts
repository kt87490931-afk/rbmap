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
  const keys = ['href', 'region', 'date', 'is_new', 'title', 'excerpt', 'stars', 'venue', 'sort_order', 'body_json', 'char_count']
  for (const k of keys) {
    if (body[k] !== undefined) update[k] = body[k]
  }
  update.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

/** review_posts (생성된 리뷰) 삭제 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const { id } = await params
  const { error } = await supabaseAdmin.from('review_posts').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
