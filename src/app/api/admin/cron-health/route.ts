/**
 * Cron 실행 이력 (크론헬스 페이지용)
 */
import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const url = new URL(request.url)
  const limit = Math.min(100, Math.max(10, parseInt(url.searchParams.get('limit') ?? '50', 10)))

  const { data, error } = await supabaseAdmin
    .from('cron_health')
    .select('*')
    .eq('job_name', 'generate-reviews')
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ items: [], summary: { lastSuccess: null, lastFailure: null, totalRuns: 0 }, error: error.message })
  }

  const items = (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id,
    jobName: r.job_name,
    startedAt: r.started_at,
    endedAt: r.ended_at,
    ok: r.ok,
    msg: r.msg,
    processed: r.processed,
    successCount: r.success_count,
    durationMs: r.duration_ms,
    results: r.results,
  }))

  const lastOk = items.find((x) => x.ok)
  const lastFail = items.find((x) => !x.ok)

  return NextResponse.json({
    items,
    summary: {
      lastSuccess: lastOk ? lastOk.startedAt : null,
      lastFailure: lastFail ? lastFail.startedAt : null,
      totalRuns: items.length,
    },
  })
}
