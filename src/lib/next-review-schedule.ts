/**
 * 어드민용: 다음 리뷰 생성 예정 시각 목록 (표기 전용, 생성 로직 없음)
 */
import { supabaseAdmin } from './supabase-server'
import { getNextReviewAtWithDailyCap, formatTimeUntil, getTodayKSTRangeUTC } from './review-schedule'

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
      .select('created_at')
      .eq('region', regionSlug)
      .eq('type', typeSlug)
      .eq('venue_slug', venueSlug)
      .gte('created_at', todayRange.start)
      .lt('created_at', todayRange.end)
    const todayCount = todayRows?.length ?? 0

    const { data: historyRows } = await supabaseAdmin
      .from('review_posts')
      .select('created_at')
      .eq('region', regionSlug)
      .eq('type', typeSlug)
      .eq('venue_slug', venueSlug)
      .order('created_at', { ascending: false })
      .limit(1)
    const lastReviewAt = historyRows?.[0]?.created_at ?? null
    const presetId = (partner as { review_schedule_preset?: string }).review_schedule_preset ?? undefined

    const { nextAt, isTomorrow } = getNextReviewAtWithDailyCap(lastReviewAt, todayCount, presetId)
    const presetLabel = presetLabels[presetId ?? '8h_3'] ?? presetId ?? '8시간 간격 · 하루 3개'

    list.push({
      partnerId: partner.id,
      name: partner.name,
      region: regionSlug,
      type: typeSlug,
      presetLabel,
      nextAt: nextAt.toISOString(),
      nextAtKST: nextAt.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      inText: formatTimeUntil(nextAt),
      isTomorrow,
    })
  }

  list.sort((a, b) => new Date(a.nextAt).getTime() - new Date(b.nextAt).getTime())
  return list
}
