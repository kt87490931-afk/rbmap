/**
 * 수동 실행: 사이트맵 검증 (생성 로직 직접 실행)
 * 외부 fetch 제거 - 서버가 자기 URL 요청 시 404 등 이슈 방지. sitemap 생성 성공 여부로 검증.
 */
import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

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

    // sitemap 생성 로직 직접 실행 (외부 fetch 없음, 네트워크 이슈 회피)
    let ok = false
    let msg = ''
    let urlCount = 0
    try {
      const sitemapMod = await import('@/app/sitemap')
      const urls = await sitemapMod.default()
      urlCount = Array.isArray(urls) ? urls.length : 0
      ok = urlCount > 0
      msg = ok ? `사이트맵 검증 성공 (${urlCount}개 URL)` : '사이트맵 URL 없음'
    } catch (e) {
      msg = e instanceof Error ? e.message : '사이트맵 생성 오류'
    }

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
            results: [{ check: 'sitemap_generate', url_count: urlCount }],
            duration_ms: durationMs,
          })
          .eq('id', healthId)
      } catch { /* ignore */ }
    }

    return NextResponse.json({ ok, msg, duration_ms: durationMs, url_count: urlCount })
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
    return NextResponse.json({ ok: false, msg: errMsg, error: errMsg, duration_ms: durationMs }, { status: 500 })
  }
}
