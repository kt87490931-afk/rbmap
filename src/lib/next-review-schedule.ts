/**
 * 어드민용: 다음 리뷰 생성 예정 시각 목록 (표기 전용, 생성 로직 없음)
 * 크론과 동일한 canGenerateReview 기준으로 "생성 가능" 여부 표시, 예정 경과 시 "처리 대기 중 · 다음 크론(HH:MM)" 표기
 */
import { supabaseAdmin } from './supabase-server'
import {
  getNextReviewAtWithDailyCap,
  formatTimeUntil,
  getTodayKSTRangeUTC,
  canGenerateReview,
  getPreset,
} from './review-schedule'

/** 크론 실행 간격(분). 서버 crontab(0,20,40)과 맞춤 */
const CRON_INTERVAL_MINUTES = 20

/** 다음 크론 실행 시각(KST) "HH:MM" 형태 */
function getNextCronRunKST(): string {
  const now = new Date()
  const kstMs = now.getTime() + 9 * 60 * 60 * 1000
  const kst = new Date(kstMs)
  const hour = kst.getUTCHours()
  const min = kst.getUTCMinutes()
  let nextMin = 0
  let nextHour = hour
  if (min < CRON_INTERVAL_MINUTES) {
    nextMin = CRON_INTERVAL_MINUTES
  } else if (min < 40) {
    nextMin = 40
  } else {
    nextMin = 0
    nextHour = (hour + 1) % 24
  }
  return `${String(nextHour).padStart(2, '0')}:${String(nextMin).padStart(2, '0')}`
}

function parseHref(href: string): { regionSlug: string; typeSlug: string; venueSlug: string } {
  const parts = (href || '').replace(/\/$/, '').split('/').filter(Boolean)
  return {
    regionSlug: parts[0] ?? 'dongtan',
    typeSlug: parts[1] ?? 'karaoke',
    venueSlug: parts[2] ?? 'venue',
  }
}

export type NextReviewScheduleItem = {
  partnerId: string
  name: string
  region: string
  type: string
  presetLabel: string
  nextAt: string
  nextAtKST: string
  inText: string
  isTomorrow: boolean
  /** 크론과 동일 조건으로 지금 생성 가능한지 */
  canGenerateNow: boolean
  /** 표시용: 생성 가능 | 오늘 한도 소진 | 간격 미충족 */
  statusLabel: string
  /** 예정 시각이 이미 지났을 때 다음 크론 시각 "HH:MM" */
  nextCronKST: string
}

export async function getNextReviewSchedules(): Promise<NextReviewScheduleItem[]> {
  const { data: partners, error: partnersErr } = await supabaseAdmin
    .from('partners')
    .select('id, name, href, region, type, review_schedule_preset')
    .eq('is_active', true)

  if (partnersErr || !partners?.length) return []

  const todayRange = getTodayKSTRangeUTC()
  const presetLabels: Record<string, string> = {
    '6h_4': '6시간 간격 · 하루 4개',
    '8h_3': '8시간 간격 · 하루 3개',
    '12h_2': '12시간 간격 · 하루 2개',
    '24h_1': '24시간 간격 · 하루 1개',
  }

  const list: NextReviewScheduleItem[] = []

  for (const partner of partners) {
    const { data: intros } = await supabaseAdmin
      .from('venue_intros')
      .select('id')
      .eq('partner_id', partner.id)
      .eq('is_applied', true)
      .limit(1)
    if (!intros?.length) continue

    const { regionSlug, typeSlug, venueSlug } = parseHref(partner.href ?? '')

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
      .select('published_at, created_at')
      .eq('region', regionSlug)
      .eq('type', typeSlug)
      .eq('venue_slug', venueSlug)
      .order('published_at', { ascending: false })
      .limit(1)
    const lastRow = historyRows?.[0]
    const lastReviewAt = (lastRow?.published_at ?? lastRow?.created_at) ?? null
    const presetId = (partner as { review_schedule_preset?: string }).review_schedule_preset ?? undefined

    const { nextAt, isTomorrow } = getNextReviewAtWithDailyCap(lastReviewAt, todayCount, presetId)
    const presetLabel = presetLabels[presetId ?? '8h_3'] ?? presetId ?? '8시간 간격 · 하루 3개'
    const canGenerateNow = canGenerateReview(lastReviewAt, todayCount, presetId)
    const preset = getPreset(presetId)
    const statusLabel = canGenerateNow
      ? '생성 가능'
      : todayCount >= preset.maxPerDay
        ? '오늘 한도 소진'
        : '간격 미충족'
    const nextCronKST = getNextCronRunKST()
    const nowMs = Date.now()
    const inText =
      nextAt.getTime() <= nowMs + 60 * 1000
        ? `처리 대기 중 · 다음 크론(${nextCronKST}) 처리 예정`
        : formatTimeUntil(nextAt)

    list.push({
      partnerId: partner.id,
      name: partner.name,
      region: regionSlug,
      type: typeSlug,
      presetLabel,
      nextAt: nextAt.toISOString(),
      nextAtKST: nextAt.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      inText,
      isTomorrow,
      canGenerateNow,
      statusLabel,
      nextCronKST,
    })
  }

  list.sort((a, b) => new Date(a.nextAt).getTime() - new Date(b.nextAt).getTime())
  return list
}
