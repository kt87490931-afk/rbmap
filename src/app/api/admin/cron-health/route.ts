/**
 * Cron 실행 이력 (크론헬스 페이지용)
 * job: generate-reviews | sitemap-ping | all (기본: all)
 */
import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const JOB_NAMES = ['generate-reviews', 'sitemap-ping'] as const

function mapRow(r: Record<string, unknown>) {
  return {
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
  }
}

function buildSummary(items: ReturnType<typeof mapRow>[]) {
  const lastOk = items.find((x) => x.ok)
  const lastFail = items.find((x) => !x.ok)
  return {
    lastSuccess: lastOk ? lastOk.startedAt : null,
    lastFailure: lastFail ? lastFail.startedAt : null,
    totalRuns: items.length,
  }
}

export async function GET(request: Request) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const url = new URL(request.url)
  const jobParam = url.searchParams.get('job') ?? 'all'
  const limit = Math.min(100, Math.max(10, parseInt(url.searchParams.get('limit') ?? '50', 10)))

  const jobsToFetch: readonly string[] = jobParam === 'all' ? JOB_NAMES : (JOB_NAMES.includes(jobParam as (typeof JOB_NAMES)[number]) ? [jobParam] : JOB_NAMES)
  const jobs: Record<string, { items: ReturnType<typeof mapRow>[]; summary: ReturnType<typeof buildSummary> }> = {}

  let globalError: string | undefined
  for (const jobName of jobsToFetch) {
    const { data, error } = await supabaseAdmin
      .from('cron_health')
      .select('*')
      .eq('job_name', jobName)
      .order('started_at', { ascending: false })
      .limit(limit)

    if (error) {
      globalError = error.message
      jobs[jobName] = { items: [], summary: buildSummary([]) }
    } else {
      const items = (data ?? []).map((r: Record<string, unknown>) => mapRow(r))
      jobs[jobName] = { items, summary: buildSummary(items) }
    }
  }

  return NextResponse.json({ jobs, error: globalError })
}
