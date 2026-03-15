/**
 * 수동 실행
 * - body 없음 또는 partnerIds 빈 배열: "곧"인 항목만 스케줄대로 처리 (다음 가능 시각 지난 업체, 최대 25건)
 * - partnerIds 있음: 선택한 제휴업체만 처리 (스케줄 무관)
 */
import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'
import { runGenerateReviews } from '@/lib/cron-generate-reviews'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(request: Request) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  let partnerIds: string[] | null = null
  try {
    const body = await request.json().catch(() => ({}))
    if (body && Array.isArray(body.partnerIds) && body.partnerIds.length > 0) {
      partnerIds = body.partnerIds
    }
  } catch {
    partnerIds = null
  }
  // partnerIds가 없거나 빈 배열 → "곧" 항목 전체 처리 (runGenerateReviews(null))
  // partnerIds 있음 → 선택 업체만 처리

  const startAt = Date.now()
  let healthId: string | null = null

  try {
    try {
      const { data: healthRow } = await supabaseAdmin
        .from('cron_health')
        .insert({
          job_name: 'generate-reviews',
          started_at: new Date().toISOString(),
          ok: false,
          msg: '수동 실행 중',
        })
        .select('id')
        .single()
      healthId = healthRow?.id ?? null
    } catch { /* ignore */ }

    const { results, durationMs } = await runGenerateReviews(partnerIds)
    const successCount = results.filter((r) => r.ok).length
    const isDueRun = partnerIds === null

    if (healthId) {
      try {
        await supabaseAdmin
          .from('cron_health')
          .update({
            ended_at: new Date().toISOString(),
            ok: true,
            msg: isDueRun ? `곧 항목 수동 처리: ${successCount}/${results.length}건` : `수동 실행: ${successCount}/${results.length}건`,
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
            duration_ms: durationMs,
          })
          .eq('id', healthId)
      } catch { /* ignore */ }
    }
    return NextResponse.json({ error: errMsg, duration_ms: durationMs }, { status: 500 })
  }
}
