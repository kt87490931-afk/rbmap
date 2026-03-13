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

  // intro_ai_json.content가 있으면 partners.desc에 동기화 (partner_id 없을 때 form_json으로 partner 검색)
  const aiContent = body.intro_ai_json && typeof body.intro_ai_json === 'object' && (body.intro_ai_json as { content?: string }).content
  if (!aiContent?.trim()) return NextResponse.json(data)

  let partnerId = data?.partner_id
  if (!partnerId) {
    const form = (data?.form_json ?? body?.form_json) as { name?: string; region?: string; type?: string } | undefined
    if (form?.name) {
      const regionName = form.region === '동탄' || form.region === 'dongtan' ? '동탄'
        : form.region === '강남' || form.region === 'gangnam' ? '강남'
        : form.region === '수원' || form.region?.includes('수원') || form.region === 'suwon' ? '수원'
        : form.region === '제주' || form.region === 'jeju' ? '제주' : (form.region as string) ?? ''
      const typeName = form.type === '가라오케' || form.type === '노래방' || form.type === 'karaoke' ? '가라오케'
        : form.type === '하이퍼블릭' || form.type === 'highpublic' ? '하이퍼블릭'
        : form.type === '퍼블릭' || form.type === 'public' ? '퍼블릭'
        : form.type === '셔츠룸' || form.type === 'shirtroom' ? '셔츠룸'
        : form.type === '쩜오' || form.type === 'jjomoh' ? '쩜오' : (form.type as string) ?? ''
      const nameNorm = (s: string) => (s ?? '').replace(/\s+/g, '')
      let q = supabaseAdmin.from('partners').select('id, name, region, type').limit(100)
      if (regionName) q = q.ilike('region', `%${regionName}%`)
      const { data: partners } = await q
      const match = (partners ?? []).find((row: { id: string; name?: string; region?: string; type?: string }) => {
        const pRegionOk = !regionName || (row.region && (String(row.region).includes(regionName) || regionName.includes(String(row.region))))
        const pTypeOk = !typeName || row.type === typeName
        const pNameOk = nameNorm(row.name ?? '') === nameNorm(form.name ?? '')
        return pRegionOk && pTypeOk && pNameOk
      })
      partnerId = match?.id
      if (partnerId) {
        await supabaseAdmin.from('venue_intros').update({ partner_id: partnerId }).eq('id', id)
      }
    }
  }
  if (partnerId) {
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
