/**
 * 리뷰 일일 자동 공개: draft 중 랜덤 N건 → published
 * 초기 시드: published_at 최신 20개만 유지, 나머지 published → draft
 */
import { supabaseAdmin } from './supabase-server'

export const PROTECTED_PUBLISHED_COUNT = 20
export const DAILY_PUBLISH_COUNT = 5

export type PublishReviewResult = {
  id: string
  title: string
  ok: boolean
  error?: string
}

export type RunDailyPublishReviewsResult = {
  picked: number
  published: number
  failed: number
  remainingDrafts: number
  results: PublishReviewResult[]
  durationMs: number
}

export type SeedDraftExceptLatestResult = {
  keptPublished: number
  movedToDraft: number
  durationMs: number
}

/** Fisher–Yates 셔플 후 상위 n개 (테스트 가능하도록 export) */
export function pickRandomIds(ids: string[], n: number): string[] {
  if (n <= 0 || ids.length === 0) return []
  const copy = [...ids]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, Math.min(n, copy.length))
}

async function fetchAllIdsByStatus(status: 'draft' | 'published'): Promise<string[]> {
  const PAGE = 1000
  const ids: string[] = []
  let from = 0
  for (;;) {
    const { data, error } = await supabaseAdmin
      .from('review_posts')
      .select('id')
      .eq('status', status)
      .order('id')
      .range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    if (!data?.length) break
    ids.push(...data.map((r) => r.id as string))
    if (data.length < PAGE) break
    from += PAGE
  }
  return ids
}

/** draft 중 랜덤 count건 published 전환 (published_at = now) */
export async function runDailyPublishReviews(
  count = DAILY_PUBLISH_COUNT
): Promise<RunDailyPublishReviewsResult> {
  const startAt = Date.now()
  const draftIds = await fetchAllIdsByStatus('draft')
  const pickedIds = pickRandomIds(draftIds, count)

  const results: PublishReviewResult[] = []
  const now = new Date().toISOString()

  for (const id of pickedIds) {
    const { data: row, error: fetchErr } = await supabaseAdmin
      .from('review_posts')
      .select('id, title, status')
      .eq('id', id)
      .maybeSingle()

    if (fetchErr || !row) {
      results.push({ id, title: '', ok: false, error: fetchErr?.message ?? 'not found' })
      continue
    }
    if (row.status !== 'draft') {
      results.push({ id, title: row.title ?? '', ok: false, error: 'already not draft' })
      continue
    }

    const { error: updErr } = await supabaseAdmin
      .from('review_posts')
      .update({ status: 'published', published_at: now, updated_at: now })
      .eq('id', id)
      .eq('status', 'draft')

    if (updErr) {
      results.push({ id, title: row.title ?? '', ok: false, error: updErr.message })
    } else {
      results.push({ id, title: row.title ?? '', ok: true })
    }
  }

  const remainingDrafts = draftIds.length - results.filter((r) => r.ok).length

  return {
    picked: pickedIds.length,
    published: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    remainingDrafts: Math.max(0, remainingDrafts),
    results,
    durationMs: Date.now() - startAt,
  }
}

/** published_at 최신 20개만 published 유지, 나머지 published → draft */
export async function seedDraftExceptLatest(
  keepCount = PROTECTED_PUBLISHED_COUNT
): Promise<SeedDraftExceptLatestResult> {
  const startAt = Date.now()

  const { data: topRows, error: topErr } = await supabaseAdmin
    .from('review_posts')
    .select('id')
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(keepCount)

  if (topErr) throw new Error(topErr.message)

  const keepIds = new Set((topRows ?? []).map((r) => r.id as string))
  const allPublished = await fetchAllIdsByStatus('published')
  const toDraft = allPublished.filter((id) => !keepIds.has(id))

  const BATCH = 100
  let movedToDraft = 0
  const now = new Date().toISOString()

  for (let i = 0; i < toDraft.length; i += BATCH) {
    const batch = toDraft.slice(i, i + BATCH)
    const { error } = await supabaseAdmin
      .from('review_posts')
      .update({ status: 'draft', updated_at: now })
      .in('id', batch)
      .eq('status', 'published')
    if (error) throw new Error(error.message)
    movedToDraft += batch.length
  }

  return {
    keptPublished: keepIds.size,
    movedToDraft,
    durationMs: Date.now() - startAt,
  }
}
