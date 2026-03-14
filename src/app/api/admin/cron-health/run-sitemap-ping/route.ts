/**
 * 수동 실행: 구글 사이트맵 Ping (스케줄 무관)
 */
import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const SITEMAP_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rbbmap.com'
const PING_URL = `https://www.google.com/ping?sitemap=${SITEMAP_URL}/sitemap.xml`

export async function POST() {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const startAt = Date.now()
  let healthId: string | null = null

  try {
    try {
      const { data: healthRow } = await supabaseAdmin
        .from('cron_health')
        .insert({ job_name: 'sitemap-ping', started_at: new Date().toISOString(), ok: false })
        .select('id')
        .single()
      healthId = healthRow?.id ?? null
    } catch { /* ignore */ }

    const res = await fetch(PING_URL, { method: 'GET', signal: AbortSignal.timeout(15000) })
    const durationMs = Date.now() - startAt
    const ok = res.ok
    const msg = ok ? '구글 Ping 성공' : `HTTP ${res.status}`

    if (healthId) {
      try {
        await supabaseAdmin
          .from('cron_health')
          .update({
            ended_at: new Date().toISOString(),
            ok,
            msg,
            processed: 1,
            success_count: ok ? 1 : 0,
            results: [{ ping_url: PING_URL, http_status: res.status }],
            duration_ms: durationMs,
          })
          .eq('id', healthId)
      } catch { /* ignore */ }
    }

    return NextResponse.json({ ok, msg, duration_ms: durationMs, http_status: res.status })
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
    return NextResponse.json({ error: errMsg, duration_ms: durationMs }, { status: 500 })
  }
}
