/**
 * 00:00 리뷰 자동 공개 — 어드민 수동 실행 / 상태 조회
 * POST { test: true } → draft 랜덤 1건 공개
 * POST { test: false } → draft 랜덤 5건 공개 (일일 크론과 동일)
 */
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'
import {
  runDailyPublishReviews,
  DAILY_PUBLISH_COUNT,
} from '@/lib/cron-publish-reviews'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const JOB_NAME = 'publish-reviews'

export async function GET() {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const [{ count: published }, { count: draft }] = await Promise.all([
    supabaseAdmin.from('review_posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabaseAdmin.from('review_posts').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
  ])

  const [{ data: lastOk }, { data: lastFail }, { count: totalRuns }] = await Promise.all([
    supabaseAdmin
      .from('cron_health')
      .select('started_at, msg, success_count, processed')
      .eq('job_name', JOB_NAME)
      .eq('ok', true)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from('cron_health')
      .select('started_at, msg')
      .eq('job_name', JOB_NAME)
      .eq('ok', false)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from('cron_health')
      .select('*', { count: 'exact', head: true })
      .eq('job_name', JOB_NAME),
  ])

  const { data: recent } = await supabaseAdmin
    .from('cron_health')
    .select('id, started_at, ended_at, ok, msg, processed, success_count, duration_ms')
    .eq('job_name', JOB_NAME)
    .order('started_at', { ascending: false })
    .limit(5)

  return NextResponse.json({
    published: published ?? 0,
    draft: draft ?? 0,
    schedule: '매일 00:00 KST · 랜덤 5건',
    lastSuccess: lastOk?.started_at ?? null,
    lastFailure: lastFail?.started_at ?? null,
    lastSuccessMsg: lastOk?.msg ?? null,
    lastFailureMsg: lastFail?.msg ?? null,
    totalRuns: totalRuns ?? 0,
    recent: recent ?? [],
  })
}

export async function POST(request: Request) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  let test = false
  try {
    const body = await request.json().catch(() => ({}))
    test = body?.test === true
  } catch { /* default daily count */ }

  const count = test ? 1 : DAILY_PUBLISH_COUNT
  const startAt = Date.now()
  let healthId: string | null = null

  try {
    try {
      const { data: healthRow } = await supabaseAdmin
        .from('cron_health')
        .insert({
          job_name: JOB_NAME,
          started_at: new Date().toISOString(),
          ok: false,
          msg: test ? '어드민 테스트 실행 중 (1건)' : '어드민 수동 실행 중 (5건)',
        })
        .select('id')
        .single()
      healthId = healthRow?.id ?? null
    } catch { /* ignore */ }

    const result = await runDailyPublishReviews(count)
    const prefix = test ? '테스트' : '수동'
    const msg = `${prefix} 공개: ${result.published}/${result.picked}건 성공, draft 잔여 ${result.remainingDrafts}건`

    if (healthId) {
      try {
        await supabaseAdmin
          .from('cron_health')
          .update({
            ended_at: new Date().toISOString(),
            ok: result.failed === 0,
            msg,
            processed: result.picked,
            success_count: result.published,
            results: result.results,
            duration_ms: result.durationMs,
          })
          .eq('id', healthId)
      } catch { /* ignore */ }
    }

    if (result.published > 0) {
      revalidatePath('/')
      revalidatePath('/reviews')
      revalidatePath('/sitemap.xml')
    }

    return NextResponse.json({
      ok: result.failed === 0,
      test,
      ...result,
      msg,
      duration_ms: result.durationMs,
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
