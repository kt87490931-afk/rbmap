/**
 * 제휴업체별 리뷰 스케줄 정보 (리뷰생성 페이지용)
 * 제휴업체별 프리셋(6h/4, 8h/3, 12h/2, 24h/1) 반영
 */
import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'
import { REVIEW_TONES } from '@/lib/review-scenarios'
import { canGenerateReview, getNextReviewAt, getTodayKSTRangeUTC } from '@/lib/review-schedule'

export const dynamic = 'force-dynamic'

function parseHref(href: string) {
  const parts = (href || '').replace(/\/$/, '').split('/').filter(Boolean)
  return {
    regionSlug: parts[0] ?? 'dongtan',
    typeSlug: parts[1] ?? 'karaoke',
    venueSlug: parts[2] ?? 'venue',
  }
}

export async function GET() {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const { data: partners } = await supabaseAdmin
    .from('partners')
    .select('id, name, href, region, type, is_active, review_schedule_preset')
    .eq('is_active', true)

  const items: {
    partnerId: string
    name: string
    region: string
    type: string
    href: string
    hasIntro: boolean
    lastReviewAt: string | null
    lastCharCount: number | null
    lastTone: string | null
    nextReviewAt: string | null
    canGenerate: boolean
    reviewSchedulePreset: string
  }[] = []

  const todayRange = getTodayKSTRangeUTC()

  for (const p of partners ?? []) {
    const { regionSlug, typeSlug, venueSlug } = parseHref(p.href)
    const presetId = (p as { review_schedule_preset?: string }).review_schedule_preset ?? undefined

    const { data: intros } = await supabaseAdmin
      .from('venue_intros')
      .select('id')
      .eq('partner_id', p.id)
      .eq('is_applied', true)
      .limit(1)

    const hasIntro = (intros?.length ?? 0) > 0

    const { data: lastReview } = await supabaseAdmin
      .from('review_posts')
      .select('created_at, sec_overview, scenario_used')
      .eq('region', regionSlug)
      .eq('type', typeSlug)
      .eq('venue_slug', venueSlug)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const { data: todayRows } = await supabaseAdmin
      .from('review_posts')
      .select('created_at')
      .eq('region', regionSlug)
      .eq('type', typeSlug)
      .eq('venue_slug', venueSlug)
      .gte('created_at', todayRange.start)
      .lt('created_at', todayRange.end)

    const lastReviewAt = lastReview?.created_at ?? null
    const todayCount = todayRows?.length ?? 0
    const lastCharCount = lastReview?.sec_overview ? lastReview.sec_overview.length : null
    const scenario = lastReview?.scenario_used as { tone?: string } | null
    const lastTone = scenario?.tone ?? null
    const toneName = lastTone ? REVIEW_TONES.find((t) => t.id === lastTone)?.name ?? lastTone : null

    const next = getNextReviewAt(lastReviewAt, presetId)
    const nextReviewAt = next.getTime() > 0 ? next.toISOString() : new Date().toISOString()
    const canGenerate = hasIntro && canGenerateReview(lastReviewAt, todayCount, presetId)

    items.push({
      partnerId: p.id,
      name: p.name,
      region: p.region,
      type: p.type,
      href: p.href,
      hasIntro,
      lastReviewAt,
      lastCharCount,
      lastTone: toneName ?? lastTone,
      nextReviewAt,
      canGenerate,
      reviewSchedulePreset: presetId ?? '8h_3',
    })
  }

  return NextResponse.json(items)
}
