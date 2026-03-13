import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const { data, error } = await supabaseAdmin
    .from('venue_intros')
    .select('id, partner_id, form_json, ai_tone, period_days, intro_ai_json, is_applied, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data || [])
}

export async function POST(request: Request) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const body = await request.json()
  const { partner_id, form, ai_tone, period_days, intro_ai_json } = body

  if (!form || typeof form !== 'object') {
    return NextResponse.json({ error: 'form 필드가 필요합니다.' }, { status: 400 })
  }

  const days = Number(period_days) || 30
  const periodEnd = new Date()
  periodEnd.setDate(periodEnd.getDate() + days)

  const insertData: Record<string, unknown> = {
    partner_id: partner_id || null,
    form_json: form,
    ai_tone: ai_tone === 'partner_pro' ? 'partner_pro' : 'pro',
    period_days: days,
    period_end: periodEnd.toISOString().slice(0, 10),
    contact_visible: true,
  }
  if (intro_ai_json && typeof intro_ai_json === 'object') {
    insertData.intro_ai_json = {
      ...intro_ai_json,
      generated_at: (intro_ai_json as { generated_at?: string }).generated_at || new Date().toISOString(),
      elapsed_ms: (intro_ai_json as { elapsed_ms?: number }).elapsed_ms ?? null,
    }
  }
  insertData.is_applied = true

  const { data, error } = await supabaseAdmin
    .from('venue_intros')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[venues/intro POST]', { error: error.message })
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  const ij = intro_ai_json && typeof intro_ai_json === 'object' ? intro_ai_json as { content?: string; v2?: { intro?: { lead?: string; quote?: string; body_paragraphs?: string[] } } } : null
  let aiContent = ij?.content?.trim()
  if (!aiContent && ij?.v2?.intro) {
    const v = ij.v2.intro
    aiContent = [v.lead, v.quote, ...(v.body_paragraphs ?? [])].filter(Boolean).join('\n\n')
  }
  const formData = form as { name?: string; region?: string }
  const nameNorm = (s: string) => (s ?? '').replace(/\s+/g, '')

  // 같은 업소의 다른 intro들 is_applied 해제
  if (partner_id) {
    await supabaseAdmin.from('venue_intros').update({ is_applied: false, updated_at: new Date().toISOString() }).eq('partner_id', partner_id).neq('id', data?.id ?? '')
  } else if (formData?.name) {
    const { data: others } = await supabaseAdmin.from('venue_intros').select('id, partner_id, form_json').neq('id', data?.id ?? '')
    const targetName = nameNorm(formData.name)
    for (const r of others ?? []) {
      const f = r.form_json as { name?: string; region?: string } | null
      if (f?.name && nameNorm(String(f.name)) === targetName) {
        await supabaseAdmin.from('venue_intros').update({ is_applied: false, updated_at: new Date().toISOString() }).eq('id', r.id)
      }
    }
  }

  // AI 본문이 있으면 partners.desc에 동기화 (partner_id 직접 또는 form으로 partner 매칭)
  let syncPartnerId = partner_id
  if (!syncPartnerId && formData?.name && aiContent?.trim()) {
    const regionName = formData.region === '동탄' || formData.region === 'dongtan' ? '동탄'
      : formData.region === '강남' || formData.region === 'gangnam' ? '강남'
      : formData.region === '수원' || formData.region?.includes('수원') || formData.region === 'suwon' ? '수원'
      : formData.region === '제주' || formData.region === 'jeju' ? '제주' : (formData.region as string) ?? ''
    const { data: partners } = await supabaseAdmin.from('partners').select('id, name, region').limit(100)
    const match = (partners ?? []).find((row: { id: string; name?: string; region?: string }) => {
      const pRegionOk = !regionName || (row.region && String(row.region).includes(regionName))
      const pNameOk = nameNorm(row.name ?? '') === nameNorm(formData.name ?? '')
      return pRegionOk && pNameOk
    })
    syncPartnerId = match?.id ?? null
  }
  if (syncPartnerId && aiContent?.trim()) {
    await supabaseAdmin
      .from('partners')
      .update({
        desc: aiContent.trim().slice(0, 3000),
        char_count: `소개글 약 ${aiContent.trim().length}자`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', syncPartnerId)
  }
  // eslint-disable-next-line no-console
  console.log('[venues/intro POST] ok', { id: data?.id, name: (form as { name?: string }).name, hasAi: !!intro_ai_json })
  return NextResponse.json(data)
}
