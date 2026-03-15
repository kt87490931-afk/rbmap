/**
 * 수동 실행: 사이트맵 검증 + Bing Ping
 * 참고: Google sitemap ping은 2024년 폐기되어 404 반환. sitemap 접근성 검증 + Bing ping으로 대체.
 */
import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rbbmap.com'
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`
const BING_PING_URL = `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`

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

    // 1) sitemap.xml 접근 가능 여부 검증 (주요 체크)
    const sitemapRes = await fetch(SITEMAP_URL, {
      method: 'GET',
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'RBBMap-SitemapCheck/1.0' },
    })
    const sitemapOk = sitemapRes.ok
    let msg = sitemapOk ? '사이트맵 검증 성공' : `사이트맵 HTTP ${sitemapRes.status}`

    // 2) Bing ping 시도 (부가, 실패해도 메인은 sitemap 검증)
    let bingOk = false
    try {
      const bingRes = await fetch(BING_PING_URL, {
        method: 'GET',
        signal: AbortSignal.timeout(8000),
      })
      bingOk = bingRes.ok
      if (sitemapOk && bingOk) msg = '사이트맵 검증 + Bing Ping 성공'
      else if (sitemapOk && !bingOk) msg = '사이트맵 검증 성공 (Bing ping 보조 실패)'
    } catch { /* Bing 실패 시 무시 */ }

    const ok = sitemapOk
    const durationMs = Date.now() - startAt

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
            results: [
              { check: 'sitemap', url: SITEMAP_URL, http_status: sitemapRes.status },
              { check: 'bing_ping', url: BING_PING_URL, bing_ok: bingOk },
            ],
            duration_ms: durationMs,
          })
          .eq('id', healthId)
      } catch { /* ignore */ }
    }

    return NextResponse.json({ ok, msg, duration_ms: durationMs, http_status: sitemapRes.status })
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
