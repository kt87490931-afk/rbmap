import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

function getContentFromIntro(intro: { content?: string; v2?: { intro?: { lead?: string; quote?: string; body_paragraphs?: string[] } } }): string {
  if (intro?.content?.trim()) return intro.content.trim()
  const v2 = intro?.v2?.intro
  if (v2) {
    const parts = [v2.lead, v2.quote, ...(v2.body_paragraphs ?? [])].filter(Boolean)
    return parts.join('\n\n')
  }
  return ''
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const { id } = await params

  const { data: intro, error: fetchErr } = await supabaseAdmin
    .from('venue_intros')
    .select('id, partner_id, form_json, intro_ai_json')
    .eq('id', id)
    .single()

  if (fetchErr || !intro) {
    return NextResponse.json({ error: '소개글을 찾을 수 없습니다.' }, { status: 404 })
  }

  const content = getContentFromIntro((intro.intro_ai_json as { content?: string; v2?: { intro?: { lead?: string; quote?: string; body_paragraphs?: string[] } } }) ?? {})
  if (!content) {
    return NextResponse.json({ error: '적용할 AI 작성글이 없습니다.' }, { status: 400 })
  }

  const partnerId = intro.partner_id as string | null
  const form = intro.form_json as { name?: string; region?: string } | null
  const nameNorm = (s: string) => (s ?? '').replace(/\s+/g, '')

  // 같은 업소를 가리키는 다른 intro들의 is_applied 해제
  if (partnerId) {
    await supabaseAdmin
      .from('venue_intros')
      .update({ is_applied: false, updated_at: new Date().toISOString() })
      .eq('partner_id', partnerId)
  } else if (form?.name) {
    const { data: allIntros } = await supabaseAdmin
      .from('venue_intros')
      .select('id, partner_id, form_json')
      .limit(100)
    const targetName = nameNorm(form.name)
    const targetRegion = String(form.region ?? '')
    const sameVenue = (allIntros ?? []).filter((r) => {
      const f = r.form_json as { name?: string; region?: string } | null
      if (!f?.name || nameNorm(String(f.name)) !== targetName) return false
      if (targetRegion && String(f.region ?? '') !== targetRegion) return false
      return true
    })
    for (const r of sameVenue) {
      if (r.id !== id) {
        await supabaseAdmin.from('venue_intros').update({ is_applied: false, updated_at: new Date().toISOString() }).eq('id', r.id)
      }
    }
  }

  // 이 intro를 적용 상태로
  await supabaseAdmin
    .from('venue_intros')
    .update({ is_applied: true, updated_at: new Date().toISOString() })
    .eq('id', id)

  // partner_id가 있으면 partners.desc 동기화
  let syncPartnerId = partnerId
  if (!syncPartnerId && form?.name) {
    const regionName = form.region === '동탄' || form.region === 'dongtan' ? '동탄'
      : form.region === '강남' || form.region === 'gangnam' ? '강남'
      : form.region === '수원' || form.region?.includes('수원') || form.region === 'suwon' ? '수원'
      : form.region === '제주' || form.region === 'jeju' ? '제주' : (form.region as string) ?? ''
    const { data: partners } = await supabaseAdmin.from('partners').select('id, name, region, type').limit(100)
    const match = (partners ?? []).find((row: { id: string; name?: string; region?: string; type?: string }) => {
      const pRegionOk = !regionName || (row.region && String(row.region).includes(regionName))
      const pNameOk = nameNorm(row.name ?? '') === nameNorm(form.name ?? '')
      return pRegionOk && pNameOk
    })
    syncPartnerId = match?.id ?? null
  }
  if (syncPartnerId) {
    await supabaseAdmin
      .from('partners')
      .update({
        desc: content.slice(0, 3000),
        char_count: `소개글 약 ${content.length}자`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', syncPartnerId)
  }

  return NextResponse.json({ ok: true, message: '적용되었습니다.' })
}
