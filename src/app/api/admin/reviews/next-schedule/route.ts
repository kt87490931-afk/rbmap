import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { getNextReviewSchedules } from '@/lib/next-review-schedule'

export const dynamic = 'force-dynamic'

/** 어드민: 다음 리뷰 생성 예정 시각 목록 (파트너별 다음 가능 시각·약 N시간 N분 후) */
export async function GET() {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  try {
    const list = await getNextReviewSchedules()
    return NextResponse.json(list)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
