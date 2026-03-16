/**
 * 크론이 실제로 조회하는 제휴업체 수 진단 (runGenerateReviews와 동일한 쿼리)
 * "제휴 4개" vs 9개 불일치 원인 확인용
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
    .select('id, name, review_schedule_preset')
    .eq('is_active', true)
    .limit(100)

  if (error) {
    return NextResponse.json(
      { error: error.message, activeCount: 0, activeNames: [] },
      { status: 500 }
    )
  }

  const list = partners ?? []
  return NextResponse.json({
    activeCount: list.length,
    activeNames: list.map((p) => p.name),
    activePartners: list.map((p) => ({
      id: p.id,
      name: p.name,
      review_schedule_preset: (p as { review_schedule_preset?: string }).review_schedule_preset,
    })),
  })
}
