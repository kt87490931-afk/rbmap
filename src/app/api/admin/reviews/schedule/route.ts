/**
 * 제휴업체별 리뷰 스케줄 정보 (리뷰생성 페이지용)
 */
import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'
import { REVIEW_TONES } from '@/lib/review-scenarios'

export const dynamic = 'force-dynamic'

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000

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
    .select('id, name, href, region, type, is_active')
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
  }[] = []

  for (const p of partners ?? []) {
    const { regionSlug, typeSlug, venueSlug } = parseHref(p.href)

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

    const lastReviewAt = lastReview?.created_at ?? null
    const lastCharCount = lastReview?.sec_overview ? lastReview.sec_overview.length : null
    const scenario = lastReview?.scenario_used as { tone?: string } | null
    const lastTone = scenario?.tone ?? null
    const toneName = lastTone ? REVIEW_TONES.find((t) => t.id === lastTone)?.name ?? lastTone : null

    let nextReviewAt: string | null = null
    if (lastReviewAt) {
      const next = new Date(new Date(lastReviewAt).getTime() + EIGHT_HOURS_MS)
      nextReviewAt = next.toISOString()
    } else {
      nextReviewAt = new Date().toISOString()
    }
    const canGenerate = hasIntro && (new Date(nextReviewAt) <= new Date() || !lastReviewAt)

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
    })
  }

  return NextResponse.json(items)
}
