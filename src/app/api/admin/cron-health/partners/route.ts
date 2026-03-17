/**
 * 수동 실행용: 활성 제휴업체 목록
 * - 제휴업체 관리의 최신 변경(업소명/스케쥴/활성화)과 즉시 연동
 */
import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const { data: partners, error } = await supabaseAdmin
    .from('partners')
    .select('id, name, review_schedule_preset, updated_at')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message, partners: [] }, { status: 500 })
  }

  const normalized = (partners ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    review_schedule_preset: (p as { review_schedule_preset?: string }).review_schedule_preset ?? '8h_3',
    updated_at: (p as { updated_at?: string }).updated_at ?? null,
  }))

  return NextResponse.json({ partners: normalized })
}
