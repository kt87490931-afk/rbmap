/**
 * 수동 실행: 선택한 제휴업체에 대해 리뷰 생성 (스케줄 무관)
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

  let partnerIds: string[] = []
  try {
    const body = await request.json()
    partnerIds = Array.isArray(body?.partnerIds) ? body.partnerIds : []
  } catch {
    return NextResponse.json({ error: 'partnerIds 배열이 필요합니다.' }, { status: 400 })
  }

  if (partnerIds.length === 0) {
    return NextResponse.json({ error: '제휴업체를 1개 이상 선택하세요.' }, { status: 400 })
  }

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

    if (healthId) {
      try {
        await supabaseAdmin
          .from('cron_health')
          .update({
            ended_at: new Date().toISOString(),
            ok: true,
            msg: `수동 실행: ${successCount}/${results.length}건`,
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
