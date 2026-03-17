/**
 * Cloudflare 보안 이벤트 기반 봇 로그 동기화 Cron API
 * GET ?cron_secret=xxx 또는 Authorization: Bearer xxx
 */
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { syncCloudflareBotEvents } from '@/lib/cloudflare-bot-sync'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const JOB_NAME = 'cloudflare-bot-sync'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const url = new URL(request.url)
  const secret = url.searchParams.get('cron_secret') || authHeader?.replace(/^Bearer\s+/i, '')
  const envSecret =
    process.env.CRON_CLOUDFLARE_BOT_SYNC_SECRET ||
    process.env.CRON_SECRET
  if (envSecret && secret !== envSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startAt = Date.now()
  let healthId: string | null = null
  try {
    try {
      const { data: healthRow } = await supabaseAdmin
        .from('cron_health')
        .insert({ job_name: JOB_NAME, started_at: new Date().toISOString(), ok: false })
        .select('id')
        .single()
      healthId = healthRow?.id ?? null
    } catch {
      /* cron_health 미존재 시 무시 */
    }

    const result = await syncCloudflareBotEvents()
    const durationMs = Date.now() - startAt
    const msg = `완료: fetched ${result.fetched}, bot ${result.botEvents}, inserted ${result.inserted}, dup ${result.skippedDuplicates}`

    if (healthId) {
      try {
        await supabaseAdmin
          .from('cron_health')
          .update({
            ended_at: new Date().toISOString(),
            ok: true,
            msg,
            processed: result.botEvents,
            success_count: result.inserted,
            results: [result],
            duration_ms: durationMs,
          })
          .eq('id', healthId)
      } catch {
        /* ignore */
      }
    }

    return NextResponse.json({
      ok: true,
      duration_ms: durationMs,
      ...result,
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
      } catch {
        /* ignore */
      }
    }
    return NextResponse.json({ error: errMsg, duration_ms: durationMs }, { status: 500 })
  }
}

