import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const body = await request.json()
  const { partner_id, form, ai_tone, period_days } = body

  if (!form || typeof form !== 'object') {
    return NextResponse.json({ error: 'form 필드가 필요합니다.' }, { status: 400 })
  }

  const days = Number(period_days) || 30
  const periodEnd = new Date()
  periodEnd.setDate(periodEnd.getDate() + days)

  const { data, error } = await supabaseAdmin
    .from('venue_intros')
    .insert({
      partner_id: partner_id || null,
      form_json: form,
      ai_tone: ai_tone === 'partner_pro' ? 'partner_pro' : 'pro',
      period_days: days,
      period_end: periodEnd.toISOString().slice(0, 10),
      contact_visible: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
