/**
 * 사이트맵 검증 Cron API (매일 KST 06시)
 * sitemap 생성 로직 직접 실행 (외부 fetch 없음)
 * GET ?cron_secret=xxx 또는 Authorization: Bearer xxx
 */
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

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

    let ok = false
    let msg = ''
    let urlCount = 0
    let diagnostics: Record<string, unknown> = {}
    try {
      const sitemapMod = await import('@/app/sitemap')
      const payload = await sitemapMod.generateSitemapPayload()
      urlCount = Array.isArray(payload?.urls) ? payload.urls.length : 0
      diagnostics = (payload?.diagnostics ?? {}) as Record<string, unknown>
      const hasErrors = Array.isArray(diagnostics.errors) && diagnostics.errors.length > 0
      ok = urlCount > 0 && !hasErrors
      msg = ok
        ? `사이트맵 검증 성공 (총 ${urlCount}개 URL / 리뷰 ${diagnostics.review_count ?? 0}개 / 제휴 ${diagnostics.partner_count ?? 0}개)`
        : `사이트맵 검증 실패 (총 ${urlCount}개 URL / 오류 ${Array.isArray(diagnostics.errors) ? diagnostics.errors.length : 0}건)`
    } catch (e) {
      msg = e instanceof Error ? e.message : '사이트맵 생성 오류'
      diagnostics = { errors: [msg] }
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
            results: [{ check: 'sitemap_generate', url_count: urlCount, diagnostics }],
            duration_ms: durationMs,
          })
          .eq('id', healthId)
      } catch { /* ignore */ }
    }

    return NextResponse.json({
      ok,
      msg,
      duration_ms: durationMs,
      url_count: urlCount,
      diagnostics,
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
