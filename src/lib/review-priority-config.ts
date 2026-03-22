/**
 * 리뷰 주제/말투 우선순위 설정 (전역)
 * site_sections.review_priority_config에 저장
 * 1순위·2순위 중 랜덤 선택 → 조합 다양성
 */

import { supabaseAdmin } from './supabase-server'
import { resolveTopicValue } from './review-topics'
import { pickTone, REVIEW_TONES, type ReviewTone } from './review-scenarios'
import { TOPIC_SELECT_OPTIONS_PRIORITY, TOPIC_CATEGORIES } from './review-topics'

// site_sections에 저장하기 위해 section_key가 필요. upsert 시 자동 생성됨.
const SITE_SECTION_KEY = 'review_priority_config'

export interface ReviewPriorityConfig {
  topic_1: string // '' | 'random' | topic string
  topic_2: string
  tone_1: string  // '' | 'random' | tone id
  tone_2: string
}

const DEFAULT_CONFIG: ReviewPriorityConfig = {
  topic_1: '',
  topic_2: '',
  tone_1: '',
  tone_2: '',
}

/** site_sections에서 review_priority_config 조회 */
export async function getReviewPriorityConfig(): Promise<ReviewPriorityConfig> {
  const { data } = await supabaseAdmin
    .from('site_sections')
    .select('content')
    .eq('section_key', SITE_SECTION_KEY)
    .maybeSingle()

  const c = data?.content as Partial<ReviewPriorityConfig> | null
  if (!c || typeof c !== 'object') return { ...DEFAULT_CONFIG }

  return {
    topic_1: typeof c.topic_1 === 'string' ? c.topic_1 : '',
    topic_2: typeof c.topic_2 === 'string' ? c.topic_2 : '',
    tone_1: typeof c.tone_1 === 'string' ? c.tone_1 : '',
    tone_2: typeof c.tone_2 === 'string' ? c.tone_2 : '',
  }
}

/** site_sections에 review_priority_config 저장 */
export async function setReviewPriorityConfig(config: ReviewPriorityConfig): Promise<void> {
  await supabaseAdmin
    .from('site_sections')
    .upsert(
      {
        section_key: SITE_SECTION_KEY,
        content: config,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'section_key' }
    )
}

/** 설정 기반 topic 결정. cat:xxx → 카테고리 내 랜덤, 미설정/랜덤 → 전체 랜덤. feedRecentTopics=최근 24h 피드 주제 */
export function resolveTopicFromConfig(
  config: ReviewPriorityConfig,
  recentSituations: string[],
  seed: number,
  feedRecentTopics?: string[]
): string {
  const pickSlot = Math.abs(seed) % 2 === 0 ? config.topic_1 : config.topic_2
  return resolveTopicValue(pickSlot ?? '', recentSituations, seed, feedRecentTopics)
}

/** 설정 기반 tone 결정. 미설정/랜덤이면 pickTone 사용 */
export function resolveToneFromConfig(
  config: ReviewPriorityConfig,
  recentTones: ReviewTone[],
  seed: number
): ReviewTone {
  const pickSlot = Math.abs(seed >> 1) % 2 === 0 ? config.tone_1 : config.tone_2
  if (!pickSlot || pickSlot === 'random') {
    return pickTone(recentTones, seed)
  }
  const valid = REVIEW_TONES.some((t) => t.id === pickSlot)
  return valid ? (pickSlot as ReviewTone) : pickTone(recentTones, seed)
}

/** 설정이 유효한지 (적어도 하나라도 topic/tone이 지정됨) */
export function hasActivePriorityConfig(config: ReviewPriorityConfig): boolean {
  const slotSet = (c: string) => !!(c && c !== 'random')
  return slotSet(config.topic_1) || slotSet(config.topic_2) || slotSet(config.tone_1) || slotSet(config.tone_2)
}

/** cat:xxx → 카테고리 라벨, 그 외 → 그대로 */
function getTopicLabel(value: string): string {
  if (!value) return '미설정'
  if (value === 'random') return '랜덤'
  if (value.startsWith('cat:')) {
    const cat = TOPIC_CATEGORIES.find((c) => c.id === value.slice(4))
    return cat?.label ?? value
  }
  return value.length > 20 ? value.slice(0, 20) + '…' : value
}

/** 적용된 설정 요약 문자열 (UI 표시용) */
export function formatAppliedConfig(config: ReviewPriorityConfig): string {
  const topic1 = formatTopicSlot(config.topic_1)
  const topic2 = formatTopicSlot(config.topic_2)
  const tone1 = formatToneSlot(config.tone_1)
  const tone2 = formatToneSlot(config.tone_2)
  if (!hasActivePriorityConfig(config)) return '전체 랜덤'
  const parts: string[] = []
  if (topic1 !== '미설정' || topic2 !== '미설정') {
    parts.push(`주제: ${topic1} / ${topic2}`)
  }
  if (tone1 !== '미설정' || tone2 !== '미설정') {
    parts.push(`말투: ${tone1} / ${tone2}`)
  }
  return parts.join(' · ') || '전체 랜덤'
}

function formatTopicSlot(v: string): string {
  return getTopicLabel(v)
}

function formatToneSlot(v: string): string {
  if (!v) return '미설정'
  if (v === 'random') return '랜덤'
  const t = REVIEW_TONES.find((x) => x.id === v)
  return t ? t.name : v
}

/** 드롭다운용 주제 옵션 (미설정, 랜덤 + 카테고리) */
export const TOPIC_PRIORITY_OPTIONS = TOPIC_SELECT_OPTIONS_PRIORITY

/** 드롭다운용 말투 옵션 (미설정, 랜덤 + 실제 톤) */
export const TONE_PRIORITY_OPTIONS = [
  { value: '', label: '미설정' },
  { value: 'random', label: '랜덤' },
  ...REVIEW_TONES.map((t) => ({ value: t.id, label: t.name })),
]
