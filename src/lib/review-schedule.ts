/**
 * 제휴업체별 리뷰 생성 스케줄 프리셋
 * 24시간 기준: 간격(시간) + 하루 최대 건수
 */
export const REVIEW_SCHEDULE_PRESETS = {
  '6h_4': { intervalHours: 6, maxPerDay: 4, label: '6시간 간격 · 하루 4개' },
  '8h_3': { intervalHours: 8, maxPerDay: 3, label: '8시간 간격 · 하루 3개' },
  '12h_2': { intervalHours: 12, maxPerDay: 2, label: '12시간 간격 · 하루 2개' },
  '24h_1': { intervalHours: 24, maxPerDay: 1, label: '24시간 간격 · 하루 1개' },
} as const

export type ReviewSchedulePresetId = keyof typeof REVIEW_SCHEDULE_PRESETS

export const DEFAULT_REVIEW_SCHEDULE_PRESET: ReviewSchedulePresetId = '8h_3'

export function getPreset(presetId: string | null | undefined): (typeof REVIEW_SCHEDULE_PRESETS)[ReviewSchedulePresetId] {
  const id = (presetId && REVIEW_SCHEDULE_PRESETS[presetId as ReviewSchedulePresetId]) ? presetId as ReviewSchedulePresetId : DEFAULT_REVIEW_SCHEDULE_PRESET
  return REVIEW_SCHEDULE_PRESETS[id]
}

const MS_PER_HOUR = 60 * 60 * 1000

/** 날짜를 KST 기준 YYYY-MM-DD 문자열로 */
function toKSTDateString(date: Date): string {
  return date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }) // 'YYYY-MM-DD'
}

/** 오늘(KST) 날짜 문자열 */
function getTodayKSTDateString(): string {
  return toKSTDateString(new Date())
}

/**
 * 리뷰 생성 가능 여부
 * @param lastReviewAt 마지막 리뷰 생성 시각 (ISO 문자열 또는 null)
 * @param todayCount 오늘 이미 생성된 리뷰 수
 * @param presetId 프리셋 ID (없으면 8h_3)
 */
export function canGenerateReview(
  lastReviewAt: string | null | undefined,
  todayCount: number,
  presetId: string | null | undefined
): boolean {
  const preset = getPreset(presetId)
  if (todayCount >= preset.maxPerDay) return false
  if (!lastReviewAt) return true
  const last = new Date(lastReviewAt).getTime()
  const intervalMs = preset.intervalHours * MS_PER_HOUR
  return Date.now() - last >= intervalMs
}

/**
 * 다음 리뷰 생성 가능 시각
 */
export function getNextReviewAt(lastReviewAt: string | null | undefined, presetId: string | null | undefined): Date {
  const preset = getPreset(presetId)
  if (!lastReviewAt) return new Date(0) // 즉시 가능
  const last = new Date(lastReviewAt).getTime()
  const next = new Date(last + preset.intervalHours * MS_PER_HOUR)
  return next
}

/**
 * 오늘(KST) 해당 venue의 리뷰 수: created_at이 오늘(KST) 날짜인 개수
 */
export function countTodayReviews(createdAts: (string | null)[]): number {
  const todayStr = getTodayKSTDateString()
  return createdAts.filter((at) => at && toKSTDateString(new Date(at)) === todayStr).length
}

/** 오늘(KST) 0시 ~ 내일 0시를 UTC ISO 문자열로 (DB 쿼리용) */
export function getTodayKSTRangeUTC(): { start: string; end: string } {
  const now = new Date()
  const kstMs = now.getTime() + 9 * 60 * 60 * 1000
  const kst = new Date(kstMs)
  const y = kst.getUTCFullYear()
  const m = kst.getUTCMonth()
  const d = kst.getUTCDate()
  const startUTC = Date.UTC(y, m, d) - 9 * 60 * 60 * 1000
  const start = new Date(startUTC).toISOString()
  const end = new Date(startUTC + 24 * 60 * 60 * 1000).toISOString()
  return { start, end }
}
