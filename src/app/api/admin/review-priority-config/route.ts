/**
 * 리뷰 주제/말투 우선순위 설정 API (전역)
 * GET: 현재 설정 조회
 * PATCH: 설정 저장
 */
import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { getReviewPriorityConfig, setReviewPriorityConfig, type ReviewPriorityConfig } from '@/lib/review-priority-config'

export const dynamic = 'force-dynamic'

export async function GET() {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const config = await getReviewPriorityConfig()
  return NextResponse.json(config)
}

export async function PATCH(request: Request) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const body = await request.json()
  const config: ReviewPriorityConfig = {
    topic_1: typeof body.topic_1 === 'string' ? body.topic_1 : '',
    topic_2: typeof body.topic_2 === 'string' ? body.topic_2 : '',
    tone_1: typeof body.tone_1 === 'string' ? body.tone_1 : '',
    tone_2: typeof body.tone_2 === 'string' ? body.tone_2 : '',
  }

  await setReviewPriorityConfig(config)
  return NextResponse.json(config)
}
