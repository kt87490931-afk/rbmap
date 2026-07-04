/**
 * 리뷰 일일 자동 공개 Cron API
 * 매일 00:00 KST: draft 중 랜덤 5건 → published
 * GET ?mode=seed — 1회성: 최신 20개만 published, 나머지 → draft
 */
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-server'
import {
  runDailyPublishReviews,
  seedDraftExceptLatest,
  DAILY_PUBLISH_COUNT,
} from '@/lib/cron-publish-reviews'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

function checkCronAuth(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const url = new URL(request.url)
  const secret = url.searchParams.get('cron_secret') || authHeader?.replace(/^Bearer\s+/i, '')
  const envSecret = process.env.CRON_SECRET || process.env.CRON_PUBLISH_REVIEWS_SECRET
  if (!envSecret) return true
  return secret === envSecret
}

export async function GET(request: Request) {
  if (!checkCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const mode = url.searchParams.get('mode')
  const startAt = Date.now()
  let healthId: string | null = null
  const jobName = mode === 'seed' ? 'publish-reviews-seed' : 'publish-reviews'

  try {
    try {
      const { data: healthRow } = await supabaseAdmin
        .from('cron_health')
        .insert({ job_name: jobName, started_at: new Date().toISOString(), ok: false })
        .select('id')
        .single()
      healthId = healthRow?.id ?? null
    } catch { /* cron_health 없으면 무시 */ }

    if (mode === 'seed') {
      const seed = await seedDraftExceptLatest()
      const msg = `시드 완료: published ${seed.keptPublished}건 유지, ${seed.movedToDraft}건 draft 전환`
      if (healthId) {
        try {
          await supabaseAdmin
            .from('cron_health')
            .update({
              ended_at: new Date().toISOString(),
              ok: true,
              msg,
              processed: seed.movedToDraft,
              success_count: seed.movedToDraft,
              duration_ms: seed.durationMs,
            })
            .eq('id', healthId)
        } catch { /* ignore */ }
      }
      revalidatePath('/')
      revalidatePath('/reviews')
      revalidatePath('/sitemap.xml')
      return NextResponse.json({ ok: true, mode: 'seed', ...seed, duration_ms: seed.durationMs })
    }

    const result = await runDailyPublishReviews(DAILY_PUBLISH_COUNT)
    const msg = `일일 공개: ${result.published}/${result.picked}건 성공, draft 잔여 ${result.remainingDrafts}건`
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
      ok: true,
      mode: 'daily',
      ...result,
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
