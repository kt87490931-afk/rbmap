import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const { id } = await params
  const body = await request.json()

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  // is_public: Supabase에 해당 컬럼이 있을 때만 사용 (supabase-venue-intros-is-public.sql 실행 후)
  // if (typeof body.is_public === 'boolean') update.is_public = body.is_public
  if (body.form_json && typeof body.form_json === 'object') update.form_json = body.form_json
  if (body.intro_ai_json && typeof body.intro_ai_json === 'object') update.intro_ai_json = body.intro_ai_json
  if (body.ai_tone === 'partner_pro' || body.ai_tone === 'pro') update.ai_tone = body.ai_tone

  const { data, error } = await supabaseAdmin
    .from('venue_intros')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // intro_ai_json.content가 있으면 partners.desc에 동기화
  const aiContent = body.intro_ai_json && typeof body.intro_ai_json === 'object' && (body.intro_ai_json as { content?: string }).content
  const partnerId = data?.partner_id
  if (partnerId && aiContent?.trim()) {
    await supabaseAdmin
      .from('partners')
      .update({
        desc: aiContent.trim().slice(0, 2000),
        char_count: `소개글 약 ${aiContent.trim().length}자`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', partnerId)
  }
  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const { id } = await params
  const { error } = await supabaseAdmin.from('venue_intros').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
