/**
 * 리뷰 자동 생성 공통 로직 (Cron API / 어드민 수동 실행 공용)
 */
import { supabaseAdmin } from './supabase-server'
import { generateReview } from './gemini/review-api'
import {
  pickScenarioCombo,
  pickTone,
  type ScenarioCombo,
  type ReviewTone,
} from './review-scenarios'
import { REGION_SLUG_TO_NAME, SLUG_TO_TYPE } from './data/venues'
import { parseUrlSuffixFromHref } from './partner-url'

export type GenerateReviewResult = { partnerId: string; name: string; ok: boolean; msg: string }

function parseHref(href: string): { regionSlug: string; typeSlug: string; venueSlug: string } {
  const parts = (href || '').replace(/\/$/, '').split('/').filter(Boolean)
  return {
    regionSlug: parts[0] ?? 'dongtan',
    typeSlug: parts[1] ?? 'karaoke',
    venueSlug: parts[2] ?? (parseUrlSuffixFromHref(href) || 'venue'),
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'review'
}

function extractIntroText(introJson: unknown): string {
  if (!introJson || typeof introJson !== 'object') return ''
  const v = introJson as {
    content?: string
    v2?: { intro?: { lead?: string; quote?: string; body_paragraphs?: string[] } }
  }
  if (typeof v.content === 'string' && v.content.trim()) return v.content.trim()
  if (v.v2?.intro) {
    const i = v.v2.intro
    const parts = [i.lead, i.quote, ...(i.body_paragraphs ?? [])].filter(Boolean)
    return parts.join('\n\n')
  }
  return ''
}

/**
 * @param partnerIds null = 전체 활성 제휴업체, string[] = 해당 ID만
 */
export async function runGenerateReviews(partnerIds: string[] | null): Promise<{
  results: GenerateReviewResult[]
  durationMs: number
}> {
  const startAt = Date.now()
  const results: GenerateReviewResult[] = []

  let q = supabaseAdmin
    .from('partners')
    .select('id, name, href, region, type')
    .eq('is_active', true)
  if (partnerIds != null && partnerIds.length > 0) {
    q = q.in('id', partnerIds)
  }
  const { data: partners, error: partnersErr } = await q

  if (partnersErr) {
    return {
      results: [{ partnerId: '', name: '', ok: false, msg: partnersErr.message }],
      durationMs: Date.now() - startAt,
    }
  }

  const list = partners ?? []

  for (const partner of list) {
    const { data: intros } = await supabaseAdmin
      .from('venue_intros')
      .select('id, intro_ai_json')
      .eq('partner_id', partner.id)
      .eq('is_applied', true)
      .limit(1)

    const intro = intros?.[0]
    if (!intro) {
      results.push({ partnerId: partner.id, name: partner.name, ok: false, msg: '적용된 소개글 없음' })
      continue
    }

    const introText = extractIntroText(intro.intro_ai_json)
    if (!introText.trim()) {
      results.push({ partnerId: partner.id, name: partner.name, ok: false, msg: '소개글 내용 없음' })
      continue
    }

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

    const scenario = pickScenarioCombo(recentCombos)
    const tone = pickTone(recentTones)

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
      results.push({ partnerId: partner.id, name: partner.name, ok: false, msg: genResult.message })
      continue
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
      sec_summary: genResult.content.slice(0, 200),
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
      scenario_used: { ...scenario, tone },
    }

    const { error: insertErr } = await supabaseAdmin.from('review_posts').insert(insertRow)

    if (insertErr) {
      results.push({ partnerId: partner.id, name: partner.name, ok: false, msg: insertErr.message })
    } else {
      results.push({ partnerId: partner.id, name: partner.name, ok: true, msg: '리뷰 생성 완료' })
    }
  }

  return { results, durationMs: Date.now() - startAt }
}
