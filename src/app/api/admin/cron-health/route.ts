/**
 * Cron 실행 이력 (크론헬스 페이지용)
 * job: generate-reviews | sitemap-ping | all (기본: all)
 */
import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const JOB_NAMES = ['generate-reviews', 'sitemap-ping'] as const
const DEFAULT_LIMIT = 20

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

function buildSummary(items: ReturnType<typeof mapRow>[], totalRuns?: number) {
  const lastOk = items.find((x) => x.ok)
  const lastFail = items.find((x) => !x.ok)
  return {
    lastSuccess: lastOk ? lastOk.startedAt : null,
    lastFailure: lastFail ? lastFail.startedAt : null,
    totalRuns: totalRuns ?? items.length,
  }
}

export async function GET(request: Request) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const url = new URL(request.url)
  const jobParam = url.searchParams.get('job') ?? 'all'
  const limit = Math.min(100, Math.max(10, parseInt(url.searchParams.get('limit') ?? `${DEFAULT_LIMIT}`, 10)))
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10))
  const from = (page - 1) * limit
  const to = from + limit - 1

  const jobsToFetch: readonly string[] = jobParam === 'all' ? JOB_NAMES : (JOB_NAMES.includes(jobParam as (typeof JOB_NAMES)[number]) ? [jobParam] : JOB_NAMES)
  const jobs: Record<string, {
    items: ReturnType<typeof mapRow>[]
    summary: ReturnType<typeof buildSummary>
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasPrev: boolean
      hasNext: boolean
    }
  }> = {}

  let globalError: string | undefined
  for (const jobName of jobsToFetch) {
    const { count, error: countError } = await supabaseAdmin
      .from('cron_health')
      .select('*', { count: 'exact', head: true })
      .eq('job_name', jobName)

    const [{ data: lastOkRow, error: okError }, { data: lastFailRow, error: failError }] = await Promise.all([
      supabaseAdmin
        .from('cron_health')
        .select('started_at')
        .eq('job_name', jobName)
        .eq('ok', true)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from('cron_health')
        .select('started_at')
        .eq('job_name', jobName)
        .eq('ok', false)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    const { data, error } = await supabaseAdmin
      .from('cron_health')
      .select('*')
      .eq('job_name', jobName)
      .order('started_at', { ascending: false })
      .range(from, to)

    if (countError || okError || failError || error) {
      globalError = countError?.message ?? okError?.message ?? failError?.message ?? error?.message
      jobs[jobName] = {
        items: [],
        summary: buildSummary([]),
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 1,
          hasPrev: false,
          hasNext: false,
        },
      }
    } else {
      const items = (data ?? []).map((r: Record<string, unknown>) => mapRow(r))
      const total = count ?? 0
      const totalPages = Math.max(1, Math.ceil(total / limit))
      jobs[jobName] = {
        items,
        summary: {
          lastSuccess: (lastOkRow as { started_at?: string } | null)?.started_at ?? null,
          lastFailure: (lastFailRow as { started_at?: string } | null)?.started_at ?? null,
          totalRuns: total,
        },
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasPrev: page > 1,
          hasNext: page < totalPages,
        },
      }
    }
  }

  return NextResponse.json({ jobs, error: globalError })
}
