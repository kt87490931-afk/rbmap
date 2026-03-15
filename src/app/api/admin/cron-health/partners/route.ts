/**
 * 수동 실행용: 적용된 소개글이 있는 제휴업체 목록
 */
import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const { data: partners } = await supabaseAdmin
    .from('partners')
    .select('id, name, review_schedule_preset')
    .eq('is_active', true)

  const withIntro: { id: string; name: string; review_schedule_preset?: string }[] = []
  for (const p of partners ?? []) {
    const { data: intros } = await supabaseAdmin
      .from('venue_intros')
      .select('id')
      .eq('partner_id', p.id)
      .eq('is_applied', true)
      .limit(1)
    if (intros?.length) {
      withIntro.push({
        id: p.id,
        name: p.name,
        review_schedule_preset: (p as { review_schedule_preset?: string }).review_schedule_preset ?? '8h_3',
      })
    }
  }

  return NextResponse.json({ partners: withIntro })
}
