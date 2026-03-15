/**
 * 사이트맵 검증 Cron API (매일 KST 06시)
 * sitemap.xml 접근성 검증 + Bing ping (Google ping은 2024년 폐기)
 * GET ?cron_secret=xxx 또는 Authorization: Bearer xxx
 */
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rbbmap.com'
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`
const BING_PING_URL = `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const url = new URL(request.url)
  const secret = url.searchParams.get('cron_secret') || authHeader?.replace(/^Bearer\s+/i, '')
  const envSecret = process.env.CRON_SECRET
  if (envSecret && secret !== envSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
    } catch { /* cron_health 테이블 없으면 무시 */ }

    const sitemapRes = await fetch(SITEMAP_URL, {
      method: 'GET',
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'RBBMap-SitemapCheck/1.0' },
    })
    const sitemapOk = sitemapRes.ok
    let msg = sitemapOk ? '사이트맵 검증 성공' : `사이트맵 HTTP ${sitemapRes.status}`

    let bingOk = false
    try {
      const bingRes = await fetch(BING_PING_URL, { method: 'GET', signal: AbortSignal.timeout(8000) })
      bingOk = bingRes.ok
      if (sitemapOk && bingOk) msg = '사이트맵 검증 + Bing Ping 성공'
      else if (sitemapOk && !bingOk) msg = '사이트맵 검증 성공 (Bing ping 보조 실패)'
    } catch { /* ignore */ }

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
              { check: 'bing_ping', bing_ok: bingOk },
            ],
            duration_ms: durationMs,
          })
          .eq('id', healthId)
      } catch { /* ignore */ }
    }

    return NextResponse.json({
      ok,
      msg,
      duration_ms: durationMs,
      http_status: sitemapRes.status,
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
      { error: errMsg, duration_ms: durationMs },
      { status: 500 }
    )
  }
}
