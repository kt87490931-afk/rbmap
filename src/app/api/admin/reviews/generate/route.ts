/**
 * 수동 리뷰 생성 (1개 제휴업체)
 */
import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'
import { generateReview } from '@/lib/gemini/review-api'
import { pickScenarioCombo, pickTone, reviewGenSeed, REVIEW_TONES, type ScenarioCombo, type ReviewTone } from '@/lib/review-scenarios'
import { REGION_SLUG_TO_NAME, SLUG_TO_TYPE } from '@/lib/data/venues'
import { parseUrlSuffixFromHref } from '@/lib/partner-url'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function parseHref(href: string) {
  const parts = (href || '').replace(/\/$/, '').split('/').filter(Boolean)
  return {
    regionSlug: parts[0] ?? 'dongtan',
    typeSlug: parts[1] ?? 'karaoke',
    venueSlug: parts[2] ?? (parseUrlSuffixFromHref(href) || 'venue'),
  }
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9가-힣-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'review'
}

function extractIntroText(introJson: unknown): string {
  if (!introJson || typeof introJson !== 'object') return ''
  const v = introJson as { content?: string; v2?: { intro?: { lead?: string; quote?: string; body_paragraphs?: string[] } } }
  if (typeof v.content === 'string' && v.content.trim()) return v.content.trim()
  if (v.v2?.intro) {
    const i = v.v2.intro
    const parts = [i.lead, i.quote, ...(i.body_paragraphs ?? [])].filter(Boolean)
    return parts.join('\n\n')
  }
  return ''
}

export async function POST(request: Request) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const body = await request.json()
  const partnerId = body.partner_id ?? body.partnerId
  if (!partnerId) return NextResponse.json({ error: 'partner_id 필요' }, { status: 400 })

  const { data: partner, error: partnerErr } = await supabaseAdmin
    .from('partners')
    .select('id, name, href, region, type')
    .eq('id', partnerId)
    .single()

  if (partnerErr || !partner) return NextResponse.json({ error: '제휴업체를 찾을 수 없습니다.' }, { status: 404 })

  const { data: intros } = await supabaseAdmin
    .from('venue_intros')
    .select('id, intro_ai_json')
    .eq('partner_id', partner.id)
    .eq('is_applied', true)
    .limit(1)

  const intro = intros?.[0]
  if (!intro) return NextResponse.json({ error: '적용된 소개글이 없습니다.' }, { status: 400 })

  const introText = extractIntroText(intro.intro_ai_json)
  if (!introText.trim()) return NextResponse.json({ error: '소개글 내용이 없습니다.' }, { status: 400 })

  const { regionSlug, typeSlug, venueSlug } = parseHref(partner.href)

  const { data: historyRows } = await supabaseAdmin
    .from('review_posts')
    .select('scenario_used')
    .eq('region', regionSlug)
    .eq('type', typeSlug)
    .eq('venue_slug', venueSlug)
    .order('created_at', { ascending: false })
    .limit(10)

  const recentCombos: ScenarioCombo[] = (historyRows ?? [])
    .map((r) => r.scenario_used as ScenarioCombo | null)
    .filter((c): c is ScenarioCombo => c != null && typeof c === 'object')
  const recentTones: ReviewTone[] = (historyRows ?? [])
    .map((r) => (r.scenario_used as { tone?: string })?.tone)
    .filter((t): t is ReviewTone => typeof t === 'string')

  const venueKey = `${partner.name}|${regionSlug}|${typeSlug}|${venueSlug}`
  const existingCount = (historyRows ?? []).length
  const seed = reviewGenSeed(venueKey, existingCount)

  const scenario = pickScenarioCombo(recentCombos, seed)
  const tone = pickTone(recentTones, seed + 10)
  const regionName = REGION_SLUG_TO_NAME[regionSlug] ?? partner.region ?? regionSlug
  const typeName = SLUG_TO_TYPE[typeSlug] ?? partner.type ?? typeSlug

  const genResult = await generateReview({
    venueName: partner.name,
    regionName,
    typeName,
    introText,
    scenario,
    tone,
  })

  if (!genResult.success) {
    return NextResponse.json({ error: genResult.message }, { status: 500 })
  }

  const reviewSlug = `${slugify(partner.name)}-${Date.now().toString(36)}`
  const insertRow = {
    region: regionSlug,
    type: typeSlug,
    venue: partner.name,
    venue_slug: venueSlug,
    slug: reviewSlug,
    title: genResult.title,
    star: 5,
    visit_date: new Date().toISOString().slice(0, 10),
    status: 'published',
    published_at: new Date().toISOString(),
    sec_overview: genResult.content,
    sec_lineup: '',
    sec_price: '',
    sec_facility: '',
    sec_summary: '',
    good_tags: [],
    bad_tags: [],
    meta_description: genResult.content.slice(0, 150),
    meta_keywords: '',
    is_ai_written: true,
    summary_rating: '5.0',
    summary_price: '',
    summary_lineup: '',
    summary_price_type: '',
    venue_page_url: partner.href?.startsWith('/') ? partner.href : `/${regionSlug}/${typeSlug}/${venueSlug}`,
    sort_order: 0,
    partner_id: partner.id,
    scenario_used: { ...scenario, tone, core_keywords: genResult.core_keywords ?? [], purpose_label: genResult.purpose_label ?? '' },
  }

  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from('review_posts')
    .insert(insertRow)
    .select()
    .single()

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    review: inserted,
    charCount: genResult.content.length,
    tone: REVIEW_TONES.find((t) => t.id === tone)?.name ?? tone,
    elapsedMs: genResult.elapsedMs,
  })
}
