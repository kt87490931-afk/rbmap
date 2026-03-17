/**
 * 리뷰 자동 생성 공통 로직 (Cron API / 어드민 수동 실행 공용)
 * 제휴업체별 스케줄 프리셋(6h/4, 8h/3, 12h/2, 24h/1) 적용
 * 1회 실행당 최대 MAX_PER_RUN건만 처리 (제휴업체 증가 시 타임아웃·API 한도 방지)
 *
 * [인프라 권장] 크론/리뷰 생성용 Supabase 쿼리는 Primary 연결 사용 권장.
 * 리드 레플리카 사용 시 스테일 리드로 간격·한도 재확인 전에 잘못 진입할 수 있어, 스케줄 재확인으로 완화하지만 Primary가 가장 안전함.
 */
import { supabaseAdmin } from './supabase-server'

/** 1회 cron 실행 시 처리할 최대 업체 수 (나머지는 다음 실행에서 처리) */
const MAX_PER_RUN = 25

/** 동일 업체 리뷰 중복 방지 윈도우(ms). 이 시간 이내 이미 리뷰가 있으면 AI 호출·삽입 모두 스킵. 12시간 윈도우로 비용·간격 보장 */
export const DUPLICATE_WINDOW_MS = 12 * 60 * 60 * 1000
import { generateReview } from './gemini/review-api'
import {
  pickScenarioCombo,
  pickTone,
  reviewGenSeed,
  type ScenarioCombo,
  type ReviewTone,
} from './review-scenarios'
import { REGION_SLUG_TO_NAME, SLUG_TO_TYPE } from './data/venues'
import { parseUrlSuffixFromHref } from './partner-url'
import { canGenerateReview, getTodayKSTRangeUTC, getNextReviewAtWithDailyCap } from './review-schedule'
import { pickTopicExcludingRecent } from './review-topics'

/** 해당 업소의 현재 오늘 리뷰 수 + 마지막 리뷰 시각 (등록된 리뷰 날짜·시간 기준 = published_at 우선, 스케줄 호가인용) */
async function getVenueScheduleState(
  regionSlug: string,
  typeSlug: string,
  venueSlug: string
): Promise<{ todayCount: number; lastReviewAt: string | null }> {
  const todayRange = getTodayKSTRangeUTC()
  const [todayRes, historyRes] = await Promise.all([
    supabaseAdmin
      .from('review_posts')
      .select('published_at')
      .eq('region', regionSlug)
      .eq('type', typeSlug)
      .eq('venue_slug', venueSlug)
      .gte('published_at', todayRange.start)
      .lt('published_at', todayRange.end),
    supabaseAdmin
      .from('review_posts')
      .select('published_at, created_at')
      .eq('region', regionSlug)
      .eq('type', typeSlug)
      .eq('venue_slug', venueSlug)
      .order('published_at', { ascending: false })
      .limit(1),
  ])
  const todayCount = todayRes.data?.length ?? 0
  const lastRow = historyRes.data?.[0]
  const lastReviewAt = (lastRow?.published_at ?? lastRow?.created_at) ?? null
  return { todayCount, lastReviewAt }
}

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

/** 제목 비교용 정규화 (공백 축소·trim) — 시드/인코딩 차이로 인한 동일 내용 중복 방지 */
function normalizeTitleForCompare(title: string): string {
  return (title || '').trim().replace(/\s+/g, ' ')
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
  scheduleRecheckSkips: number
  totalPartners: number
  inDueListCount: number
}> {
  const startAt = Date.now()
  const results: GenerateReviewResult[] = []

  let q = supabaseAdmin
    .from('partners')
    .select('id, name, href, region, type, review_schedule_preset')
    .eq('is_active', true)
    .limit(100)
  if (partnerIds != null && partnerIds.length > 0) {
    q = q.in('id', partnerIds)
  }
  const { data: partners, error: partnersErr } = await q

  if (partnersErr) {
    return {
      results: [{ partnerId: '', name: '', ok: false, msg: partnersErr.message }],
      durationMs: Date.now() - startAt,
      scheduleRecheckSkips: 0,
      totalPartners: 0,
      inDueListCount: 0,
    }
  }

  const list = partners ?? []
  type DueItem = {
    partner: (typeof list)[0]
    introText: string
    regionSlug: string
    typeSlug: string
    venueSlug: string
    scenario: ScenarioCombo
    tone: ReviewTone
    regionName: string
    typeName: string
    nextAtMs: number
  }
  const dueList: DueItem[] = []

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

    const presetId = (partner as { review_schedule_preset?: string }).review_schedule_preset ?? undefined
    const todayRange = getTodayKSTRangeUTC()
    const { data: todayRows } = await supabaseAdmin
      .from('review_posts')
      .select('published_at')
      .eq('region', regionSlug)
      .eq('type', typeSlug)
      .eq('venue_slug', venueSlug)
      .gte('published_at', todayRange.start)
      .lt('published_at', todayRange.end)
    const todayCount = todayRows?.length ?? 0

    const { data: historyRows } = await supabaseAdmin
      .from('review_posts')
      .select('scenario_used, published_at, created_at')
      .eq('region', regionSlug)
      .eq('type', typeSlug)
      .eq('venue_slug', venueSlug)
      .order('published_at', { ascending: false })
      .limit(10)

    const lastRow = historyRows?.[0]
    const lastReviewAt = (lastRow?.published_at ?? lastRow?.created_at) ?? null
    if (!canGenerateReview(lastReviewAt, todayCount, presetId)) {
      results.push({ partnerId: partner.id, name: partner.name, ok: false, msg: '간격/일 한도 미충족' })
      continue
    }

    const recentCombos: ScenarioCombo[] = (historyRows ?? [])
      .map((r) => r.scenario_used as ScenarioCombo | null)
      .filter((c): c is ScenarioCombo => c != null && typeof c === 'object')
    const recentTones: ReviewTone[] = (historyRows ?? [])
      .map((r) => (r.scenario_used as { tone?: string })?.tone)
      .filter((t): t is ReviewTone => typeof t === 'string')

    const venueKey = `${partner.name}|${regionSlug}|${typeSlug}|${venueSlug}`
    const existingCount = (historyRows ?? []).length
    // 실행 시각(분 단위)을 시드에 포함 → 같은 업소라도 실행마다 다른 주제/톤/시나리오
    const seed = reviewGenSeed(venueKey, existingCount, startAt)

    const scenario = pickScenarioCombo(recentCombos, seed)
    const tone = pickTone(recentTones, seed + 10)

    const regionName = REGION_SLUG_TO_NAME[regionSlug] ?? partner.region ?? regionSlug
    const typeName = SLUG_TO_TYPE[typeSlug] ?? partner.type ?? typeSlug
    const { nextAt } = getNextReviewAtWithDailyCap(lastReviewAt, todayCount, presetId)

    dueList.push({
      partner,
      introText,
      regionSlug,
      typeSlug,
      venueSlug,
      scenario,
      tone,
      regionName,
      typeName,
      nextAtMs: nextAt.getTime(),
    })
  }

  // 다음 가능 시각이 빠른 순(곧 → 나중)으로 정렬 → "곧"인 업체가 먼저 처리되도록
  dueList.sort((a, b) => a.nextAtMs - b.nextAtMs)
  const toProcess = dueList.slice(0, MAX_PER_RUN)
  if (dueList.length > MAX_PER_RUN) {
    results.push({
      partnerId: '',
      name: '',
      ok: false,
      msg: `이번 실행은 상위 ${MAX_PER_RUN}건만 처리합니다. 미처리 ${dueList.length - MAX_PER_RUN}건은 다음 cron에서 처리됩니다.`,
    })
  }

  // AI 호출 전 검사로 비용 방지, 삽입 직전 재확인으로 동시 실행 시 중복 방지

  for (const item of toProcess) {
    const { partner, introText, regionSlug, typeSlug, venueSlug, scenario, tone, regionName, typeName } = item

    // [1] AI 호출 전 중복 검사 — 최근 12시간 이내 동일 업체 리뷰 있으면 API 호출하지 않음 (비용·간격 보장)
    const windowStart = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString()
    const { data: recentSameBefore } = await supabaseAdmin
      .from('review_posts')
      .select('id')
      .eq('region', regionSlug)
      .eq('type', typeSlug)
      .eq('venue_slug', venueSlug)
      .gte('published_at', windowStart)
      .limit(1)
    if (recentSameBefore && recentSameBefore.length > 0) {
      results.push({ partnerId: partner.id, name: partner.name, ok: false, msg: '최근 12시간 이내 동일 업체 리뷰 있음(중복·비용 방지)' })
      continue
    }

    // [스케줄 재확인] API 호출 직전 최신 DB로 간격/일한도 재검사 — 스테일 리드·레플리카 지연 시 토큰 과다 사용 방지
    const presetId = (partner as { review_schedule_preset?: string }).review_schedule_preset ?? undefined
    const stateBeforeApi = await getVenueScheduleState(regionSlug, typeSlug, venueSlug)
    if (!canGenerateReview(stateBeforeApi.lastReviewAt, stateBeforeApi.todayCount, presetId)) {
      results.push({
        partnerId: partner.id,
        name: partner.name,
        ok: false,
        msg: '스케줄 재확인: 간격/한도 미충족(API 호출 방지)',
      })
      continue
    }

    // 1번: 같은 업소 최근 주제 회피 — 최근 N건에서 사용한 주제는 제외하고 선택
    const RECENT_TOPICS_LIMIT = 15
    const { data: recentReviewsForTopic } = await supabaseAdmin
      .from('review_posts')
      .select('scenario_used')
      .eq('region', regionSlug)
      .eq('type', typeSlug)
      .eq('venue_slug', venueSlug)
      .order('published_at', { ascending: false })
      .limit(RECENT_TOPICS_LIMIT)
    const recentTopics = (recentReviewsForTopic ?? [])
      .map((r) => (r.scenario_used as { topic?: string } | null)?.topic)
      .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
    const venueKey = `${partner.name}|${regionSlug}|${typeSlug}|${venueSlug}`
    const seedForTopic = reviewGenSeed(venueKey, recentTopics.length, startAt)
    const topic = pickTopicExcludingRecent(recentTopics, seedForTopic)

    const genResult = await generateReview({
      venueName: partner.name,
      regionName,
      typeName,
      introText,
      scenario,
      tone,
      topic,
    })

    if (!genResult.success) {
      results.push({ partnerId: partner.id, name: partner.name, ok: false, msg: genResult.message })
      continue
    }

    const publishedAt = new Date().toISOString()
    // [2] 삽입 직전 재확인 — 동시 실행 시 중복 삽입 방지
    const { data: recentSameAfter } = await supabaseAdmin
      .from('review_posts')
      .select('id')
      .eq('region', regionSlug)
      .eq('type', typeSlug)
      .eq('venue_slug', venueSlug)
      .gte('published_at', windowStart)
      .limit(1)
    if (recentSameAfter && recentSameAfter.length > 0) {
      results.push({ partnerId: partner.id, name: partner.name, ok: false, msg: '삽입 직전 동일 업체 리뷰 발견(중복 방지)' })
      continue
    }

    // 3번: 제목 중복 방지 — 공백 정규화 후 동일 제목이 이미 있으면 삽입 스킵
    const titleNorm = normalizeTitleForCompare(genResult.title)
    const { data: existingTitles } = await supabaseAdmin
      .from('review_posts')
      .select('title')
      .eq('region', regionSlug)
      .eq('type', typeSlug)
      .eq('venue_slug', venueSlug)
      .limit(200)
    const hasSameTitle =
      (existingTitles ?? []).some((r) => normalizeTitleForCompare((r as { title?: string }).title ?? '') === titleNorm)
    if (hasSameTitle) {
      results.push({ partnerId: partner.id, name: partner.name, ok: false, msg: '동일 제목 리뷰 있음(중복 방지)' })
      continue
    }

    // [스케줄 재확인] 삽입 직전 한 번 더 검사 — 동시 실행/지연 반영 시 중복 행 방지
    const stateBeforeInsert = await getVenueScheduleState(regionSlug, typeSlug, venueSlug)
    if (!canGenerateReview(stateBeforeInsert.lastReviewAt, stateBeforeInsert.todayCount, presetId)) {
      results.push({
        partnerId: partner.id,
        name: partner.name,
        ok: false,
        msg: '스케줄 재확인: 삽입 직전 한도 초과(중복 방지)',
      })
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
      published_at: publishedAt,
      sec_overview: genResult.content,
      sec_lineup: '',
      sec_price: '',
      sec_facility: '',
      sec_summary: genResult.content,
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
      scenario_used: { ...scenario, tone, topic, core_keywords: genResult.core_keywords ?? [], purpose_label: genResult.purpose_label ?? '' },
    }

    const { error: insertErr } = await supabaseAdmin.from('review_posts').insert(insertRow)

    if (insertErr) {
      results.push({ partnerId: partner.id, name: partner.name, ok: false, msg: insertErr.message })
    } else {
      results.push({ partnerId: partner.id, name: partner.name, ok: true, msg: '리뷰 생성 완료' })
    }
  }

  const durationMs = Date.now() - startAt
  const scheduleRecheckSkips = results.filter(
    (r) => r.msg && (r.msg.includes('스케줄 재확인: 간격') || r.msg.includes('스케줄 재확인: 삽입'))
  ).length

  return {
    results,
    durationMs,
    scheduleRecheckSkips,
    totalPartners: list.length,
    inDueListCount: dueList.length,
  }
}
