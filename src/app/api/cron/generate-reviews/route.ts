/**
 * 리뷰 자동 생성 Cron API
 * 30분마다 호출 권장 (vercel.json crons): 업체별 다음 가능 시각(예: 12시간 간격 → 01:04)에 맞춰 처리
 * GET ?cron_secret=xxx 또는 Authorization: Bearer xxx
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { runGenerateReviews } from '@/lib/cron-generate-reviews'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const url = new URL(request.url)
  const secret = url.searchParams.get('cron_secret') || authHeader?.replace(/^Bearer\s+/i, '')
  const envSecret = process.env.CRON_SECRET || process.env.CRON_GENERATE_REVIEWS_SECRET
  if (envSecret && secret !== envSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startAt = Date.now()
  let healthId: string | null = null

  try {
    // 1) 먼저 이번 실행 기록 삽입 (동시 실행 판단용)
    try {
      const { data: healthRow } = await supabaseAdmin
        .from('cron_health')
        .insert({ job_name: 'generate-reviews', started_at: new Date().toISOString(), ok: false })
        .select('id, started_at')
        .single()
      healthId = healthRow?.id ?? null
      const myStartedAt = healthRow?.started_at

      // 2) 동시 실행 방지: 나보다 먼저 시작됐고 아직 안 끝난 실행이 있으면 스킵 (토큰·리뷰 중복 방지)
      if (myStartedAt) {
        const { data: olderRunning } = await supabaseAdmin
          .from('cron_health')
          .select('id')
          .eq('job_name', 'generate-reviews')
          .is('ended_at', null)
          .lt('started_at', myStartedAt)
          .limit(1)
        if (olderRunning && olderRunning.length > 0) {
          await supabaseAdmin
            .from('cron_health')
            .update({
              ended_at: new Date().toISOString(),
              ok: false,
              msg: '다른 실행이 먼저 진행 중이라 스킵 (중복 방지)',
              duration_ms: Date.now() - startAt,
            })
            .eq('id', healthId)
          return NextResponse.json({
            ok: true,
            skipped: true,
            reason: '다른 리뷰 생성 실행이 진행 중이라 이번 호출은 스킵했습니다. 토큰/리뷰 중복을 방지합니다.',
            duration_ms: Date.now() - startAt,
          })
        }
        // 15분 넘게 ended_at 없는 오래된 실행은 무시 (크래시 복구)
      }
    } catch { /* cron_health 테이블 없으면 무시 */ }

    const { results, durationMs } = await runGenerateReviews(null)
    const successCount = results.filter((r) => r.ok).length

    if (healthId) {
      try {
        await supabaseAdmin
          .from('cron_health')
          .update({
            ended_at: new Date().toISOString(),
            ok: true,
            msg: `완료: ${successCount}/${results.length}건`,
            processed: results.length,
            success_count: successCount,
            results,
            duration_ms: durationMs,
          })
          .eq('id', healthId)
      } catch { /* ignore */ }
    }

    return NextResponse.json({
      ok: true,
      duration_ms: durationMs,
      processed: results.length,
      success: successCount,
      results,
    })
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : 'Unknown error'
    const durationMs = Date.now() - startAt
    if (healthId) {
      try {
        await supabaseAdmin
          .from('cron_health')
          .update({
            ended_at: new Date().toISOString(),
            ok: false,
            msg: errMsg,
            processed: 0,
            success_count: 0,
            results: [],
            duration_ms: durationMs,
          })
          .eq('id', healthId)
      } catch { /* ignore */ }
    }
    return NextResponse.json(
      { error: errMsg, results: [], duration_ms: durationMs },
      { status: 500 }
    )
  }
}
