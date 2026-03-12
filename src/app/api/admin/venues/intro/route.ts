import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const { data, error } = await supabaseAdmin
    .from('venue_intros')
    .select('id, form_json, ai_tone, period_days, intro_ai_json, is_public, created_at')
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
    is_public: body.is_public !== false,
  }
  if (intro_ai_json && typeof intro_ai_json === 'object') {
    insertData.intro_ai_json = intro_ai_json
  }

  const { data, error } = await supabaseAdmin
    .from('venue_intros')
    .insert(insertData)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
