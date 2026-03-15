/**
 * Gemini API 호출 (이브알바 gemini_api.lib.php 동일 패턴)
 * REST API: generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
 * API 키: 1) 환경변수 GEMINI_API_KEY, 2) .env.production 파일에서 파싱
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import {
  geminiModel,
  geminiTemperature,
  geminiTopP,
  geminiMaxOutputTokens,
  geminiRoles,
} from './config'
import { hashSeed, pickOpeningPattern, pickFocus } from '../intro-diversity'
import {
  idsToLabels,
  INTERIOR_LABELS,
  ROOM_CONDITION_LABELS,
  SOUND_FACILITY_LABELS,
  CLEAN_LABELS,
  MANAGER_STYLE_LABELS,
  MATCHING_LABELS,
  FREE_SERVICE_LABELS,
  CONVENIENCE_LABELS,
  DISCOUNT_LABELS,
  PHILOSOPHY_LABELS,
  MANAGER_CAREER_LABELS,
} from '../intro-options'

function getApiKey(): string {
  let key = (process.env.GEMINI_API_KEY || '').replace(/\ufeff/g, '').trim()
  if (key && key.length > 20) return key
  // 이브알바처럼 파일 fallback: .env.production 또는 gemini_api_key.env
  const cwd = process.cwd()
  const candidates: { path: string; raw?: boolean }[] = [
    { path: join(cwd, '.env.production') },
    { path: join(cwd, '.env.local') },
    { path: join(cwd, '..', '.env.production') },
    { path: join(cwd, '..', 'extend', 'gemini_api_key.env'), raw: true },
    { path: join(cwd, '..', 'gemini_api_key.env'), raw: true },
    { path: join(cwd, 'gemini_api_key.env'), raw: true },
  ]
  for (const { path: p, raw } of candidates) {
    if (existsSync(p)) {
      try {
        const content = readFileSync(p, 'utf-8')
        if (raw) {
          key = content.replace(/\ufeff/g, '').trim()
          if (key && key.length > 20) return key
        } else {
          const m = content.match(/GEMINI_API_KEY\s*=\s*(.+)/)
          if (m) {
            key = m[1].trim().replace(/^["']|["']$/g, '').replace(/\ufeff/g, '').trim()
            if (key && key.length > 20) return key
          }
        }
      } catch { /* ignore */ }
    }
  }
  return ''
}

export type IntroTone = 'pro' | 'partner_pro' | 'premium' | 'friendly' | 'trust'

export interface FormDataForGemini {
  name?: string
  region?: string
  type?: string
  contact?: string
  location?: string
  location_desc?: string
  facility_env?: string
  benefits?: string
  qualify?: string
  extra?: string
  interior?: string[]
  room_condition?: string[]
  sound_facility?: string[]
  clean_points?: string[]
  manager_style?: string[]
  matching?: string[]
  free_service?: string[]
  convenience?: string[]
  discount?: string[]
  philosophy?: string[]
  manager_career?: string[]
  staff_count?: string
}

const REGION_LABELS: Record<string, string> = {
  gangnam: '강남',
  suwon: '수원',
  dongtan: '동탄',
  jeju: '제주',
}

function buildDataBlock(data: FormDataForGemini, essentialKeywords?: string[]): string {
  const arr = (v: string[] | undefined) => (Array.isArray(v) ? v : []).join(', ')
  const regionLabel = data.region ? (REGION_LABELS[data.region] || data.region) : ''

  let block = '[고정 참고 데이터] (참고만 하고 생성 글에 넣지 마라)\n'
  if (essentialKeywords && essentialKeywords.length > 0 && regionLabel) {
    block += `[필수 포함 키워드 - 지역+키워드 형태] 다음 키워드들을 본문에 반드시 "지역명+키워드" 형태로 자연스럽게 포함할 것.\n`
    block += `예: "${regionLabel} 가라오케는~", "${regionLabel} 룸싸롱으로~", "${regionLabel} 퍼블릭에서~"\n`
    block += `지역: ${regionLabel} | 키워드: ${essentialKeywords.join(', ')}\n`
  } else if (essentialKeywords && essentialKeywords.length > 0) {
    block += `[필수 포함 키워드] 다음 단어들을 본문에 반드시 자연스럽게 1회 이상 포함할 것: ${essentialKeywords.join(', ')}\n`
  }
  block += `업소명: ${data.name || ''}\n`
  block += `지역: ${data.region || ''}\n`
  block += `업종: ${data.type || ''}\n`
  block += `연락처: ${data.contact || ''}\n`
  block += `주소: ${data.location || ''}\n\n`

  block += '[작성할 데이터] (이 데이터를 바탕으로 2,500자 이상 3,000자 이내 업체소개글 작성)\n'
  if (arr(data.interior).length) block += `인테리어: ${idsToLabels(data.interior, INTERIOR_LABELS)}\n`
  if (arr(data.room_condition).length) block += `룸 구성: ${idsToLabels(data.room_condition, ROOM_CONDITION_LABELS)}\n`
  if (arr(data.sound_facility).length) block += `음향/시설: ${idsToLabels(data.sound_facility, SOUND_FACILITY_LABELS)}\n`
  if (arr(data.clean_points).length) block += `청결: ${idsToLabels(data.clean_points, CLEAN_LABELS)}\n`
  if (arr(data.manager_style).length) block += `매니저 스타일: ${idsToLabels(data.manager_style, MANAGER_STYLE_LABELS)}\n`
  if (arr(data.matching).length) block += `매칭/시스템: ${idsToLabels(data.matching, MATCHING_LABELS)}\n`
  if (data.staff_count) block += `출근 인원: ${data.staff_count}\n`
  if (arr(data.free_service).length) block += `무료 서비스: ${idsToLabels(data.free_service, FREE_SERVICE_LABELS)}\n`
  if (arr(data.convenience).length) block += `편의 서비스: ${idsToLabels(data.convenience, CONVENIENCE_LABELS)}\n`
  if (arr(data.discount).length) block += `할인: ${idsToLabels(data.discount, DISCOUNT_LABELS)}\n`
  if (arr(data.philosophy).length) block += `운영 철학: ${idsToLabels(data.philosophy, PHILOSOPHY_LABELS)}\n`
  if (arr(data.manager_career).length) block += `실장 경력: ${idsToLabels(data.manager_career, MANAGER_CAREER_LABELS)}\n`
  block += `업소 위치·소개: ${data.location_desc || ''}\n`
  block += `시설/환경: ${data.facility_env || ''}\n`
  block += `혜택: ${data.benefits || ''}\n`
  block += `자격/우대: ${data.qualify || ''}\n`
  block += `추가 상세설명: ${data.extra || ''}`
  return block
}

const DEFAULT_ESSENTIAL_KEYWORDS = ['가라오케', '룸싸롱', '퍼블릭', '노래방']

/** v2 intro 구조 (venue-detail-mapping.md 6-2, 7장) */
export interface VenueIntroV2 {
  tagline?: string
  intro?: {
    label?: string
    headline?: string
    lead?: string
    quote?: string
    body_paragraphs?: string[]
  }
}

/**
 * 업체소개글 텍스트 생성 (2,500자 이상 3,000자 이내)
 * format 'json' 시 v2 DOM 매핑용 구조화 JSON 반환
 */
export type VenueIntroResult =
  | { success: true; text: string; v2?: VenueIntroV2; elapsedMs?: number }
  | { success: false; message: string; httpStatus?: number; diag?: Record<string, unknown> }

/** 생성 글에서 이모지 제거 (프롬프트 지시 외 안전장치) */
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}\u{2705}\u{274C}\u{2728}\u{2764}\u{2763}\u{FE0F}]/gu
function stripEmoji(s: string): string {
  return s.replace(EMOJI_REGEX, '').trim()
}

function stripEmojiFromV2(v: VenueIntroV2): VenueIntroV2 {
  const out: VenueIntroV2 = {}
  if (typeof v.tagline === 'string') out.tagline = stripEmoji(v.tagline)
  if (v.intro && typeof v.intro === 'object') {
    const i = v.intro
    out.intro = {
      ...(typeof i.label === 'string' && { label: stripEmoji(i.label) }),
      ...(typeof i.headline === 'string' && { headline: stripEmoji(i.headline) }),
      ...(typeof i.lead === 'string' && { lead: stripEmoji(i.lead) }),
      ...(typeof i.quote === 'string' && { quote: stripEmoji(i.quote) }),
      ...(Array.isArray(i.body_paragraphs) && {
        body_paragraphs: i.body_paragraphs.map((p) => (typeof p === 'string' ? stripEmoji(p) : p)),
      }),
    }
  }
  return out
}

/** v2 본문(lead+quote+body_paragraphs) 총 글자 수 */
function getV2ContentLength(v: VenueIntroV2): number {
  if (!v?.intro) return 0
  const i = v.intro
  const lead = (typeof i.lead === 'string' ? i.lead : '').length
  const quote = (typeof i.quote === 'string' ? i.quote : '').length
  const body = Array.isArray(i.body_paragraphs)
    ? i.body_paragraphs.reduce((sum, p) => sum + (typeof p === 'string' ? p : '').length, 0)
    : 0
  return lead + quote + body
}

const MIN_CONTENT_LENGTH = 2300

const INTRO_BAN_PATTERN =
  '[금지 오프닝] 다음과 같이 시작하지 마라: "업소명은 지역명에 위치한", "업소명은 지역명 OO에 자리한". 다른 업소 소개와 구분되는 독특한 오프닝을 써라.'

const V2_JSON_INSTRUCTION = `
[출력 형식 - JSON] 반드시 아래 JSON만 출력해라. 마크다운 코드블록(백틱), 설명, 주석 절대 금지. 순수 JSON만.
[금지] 이모지(emoji) 절대 사용 금지. 텍스트만.

[필수 분량 - 반드시 준수] lead+quote+body_paragraphs 합계 2,500자 이상 3,000자 이내.
- lead: 280~350자 (핵심 요약) — [오프닝 지시]에 맞게 시작할 것
- quote: 180~250자 (인용 강조 문장, 없으면 null)
- body_paragraphs: 최소 5개 단락, 각 350~500자, 합계 2,000자 이상 (본문의 대부분을 차지) — [포커스 지시]에 맞게 강조
- 총합이 2,500자 미만이면 실패로 간주함.

headline은 예시일 뿐, 업소에 맞게 다양하게 변형하라. (예: "업소명 — 지역명 대표 프리미엄", "업소명 — 투명한 가격이 차별점")

{
  "tagline": "지역명 업종명 — 한 줄 캐치프레이즈 (50자 내외)",
  "intro": {
    "label": "ABOUT · 업소 소개",
    "headline": "업소에 맞는 다양한 표현",
    "lead": "리드 문장 280~350자. [오프닝 지시] 준수.",
    "quote": "인용 강조 문장 180~250자. 없으면 null",
    "body_paragraphs": ["본문 단락1 (350~500자)", "본문 단락2 (350~500자)", "본문 단락3 (350~500자)", "본문 단락4 (350~500자)", "본문 단락5 (350~500자)"]
  }
}
`

export async function generateVenueIntro(
  data: FormDataForGemini,
  tone: IntroTone = 'pro',
  essentialKeywords?: string[],
  options?: { format?: 'text' | 'json'; openingPatternSeed?: number; focusSeed?: number }
): Promise<VenueIntroResult> {
  const apiKey = getApiKey()
  if (!apiKey) {
    return { success: false, message: 'API 키가 설정되지 않았습니다.' }
  }

  const format = options?.format ?? 'text'
  const keywords = essentialKeywords && essentialKeywords.length > 0
    ? essentialKeywords
    : DEFAULT_ESSENTIAL_KEYWORDS

  const seedStr = `${data.name ?? ''}|${data.region ?? ''}|${data.type ?? ''}`
  const seed = options?.openingPatternSeed ?? hashSeed(seedStr)
  const openingPattern = pickOpeningPattern(seed)
  const focus = pickFocus(seed)

  const roleId = ['pro', 'partner_pro', 'premium', 'friendly', 'trust'].includes(tone) ? tone : 'pro'
  const role = geminiRoles[roleId] || geminiRoles.pro
  let basePrompt = role.prompt
  basePrompt += INTRO_BAN_PATTERN + '\n'
  basePrompt += `[오프닝 지시] ${openingPattern.instruction}\n`
  basePrompt += `[포커스 지시] ${focus.instruction}\n`
  if (format === 'json') {
    basePrompt += '\n[중요] JSON 형식으로만 출력할 것. 마크다운 코드블록 없이 순수 JSON만 출력.\n'
    basePrompt += V2_JSON_INSTRUCTION
  }
  const dataBlock = buildDataBlock(data, keywords)
  const fullPrompt = basePrompt + '\n' + dataBlock

  // API 키 전달: 헤더 + 쿼리(이중화) — 일부 프록시/CDN에서 헤더 누락 대비
  const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`
  const url = `${baseUrl}?key=${encodeURIComponent(apiKey)}`
  const generationConfig: Record<string, unknown> = {
    temperature: geminiTemperature,
    maxOutputTokens: geminiMaxOutputTokens,
    topP: geminiTopP,
  }
  if (format === 'json') {
    generationConfig.responseMimeType = 'application/json'
  }
  const payload = {
    contents: [{ parts: [{ text: fullPrompt }] }],
    generationConfig,
  }

  const start = Date.now()
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    const elapsedMs = Date.now() - start

    const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text
    if (rawText && typeof rawText === 'string') {
      let text = rawText.trim()
      let v2: VenueIntroV2 | undefined
      if (format === 'json') {
        function tryParseJson(raw: string): VenueIntroV2 | undefined {
          let cleaned = raw
            .replace(/^```(?:json)?\s*\n?/i, '')
            .replace(/\n?\s*```\s*$/i, '')
            .trim()
          if (!cleaned.startsWith('{')) {
            const first = cleaned.indexOf('{')
            const last = cleaned.lastIndexOf('}')
            if (first >= 0 && last > first) cleaned = cleaned.slice(first, last + 1)
          }
          cleaned = cleaned.replace(/,[\s\n]*([}\]])/g, '$1')
          try {
            return JSON.parse(cleaned) as VenueIntroV2
          } catch {
            return undefined
          }
        }
        v2 = tryParseJson(text)
        if (!v2 && text.includes('{')) {
          const first = text.indexOf('{')
          const last = text.lastIndexOf('}')
          if (first >= 0 && last > first) {
            const extracted = text.slice(first, last + 1).replace(/,[\s\n]*([}\]])/g, '$1')
            try {
              v2 = JSON.parse(extracted) as VenueIntroV2
            } catch { /* ignore */ }
          }
        }
        if (v2) {
          v2 = stripEmojiFromV2(v2)
          const len = getV2ContentLength(v2)
          if (len < MIN_CONTENT_LENGTH) {
            return {
              success: false,
              message: `생성된 글이 ${len}자로 분량 부족입니다. 2,500자 이상이 필요합니다. 다시 생성해 주세요.`,
              diag: { contentLength: len, required: MIN_CONTENT_LENGTH },
            }
          }
          text = [v2.intro?.lead, v2.intro?.quote, ...(v2.intro?.body_paragraphs ?? [])].filter(Boolean).join('\n\n')
        } else {
          const trimmed = text.trim()
          const minFallbackLength = 200
          if (trimmed.length >= minFallbackLength) {
            v2 = {
              intro: {
                label: 'ABOUT · 업소 소개',
                lead: trimmed.slice(0, 400),
                body_paragraphs: [trimmed],
              },
            }
            text = trimmed
          } else {
            return {
              success: false,
              message: 'AI 응답 JSON 파싱에 실패했습니다. 다시 생성해 주세요.',
              diag: {
                rawPreview: text.slice(0, 500),
                parseError: 'JSON parse failed',
              },
            }
          }
        }
      } else {
        text = stripEmoji(text)
      }
      return { success: true, text, v2, elapsedMs }
    }

    const errMsg = json?.error?.message || '알 수 없는 오류'
    return {
      success: false,
      message: `글 생성 중 오류가 발생했습니다. (${errMsg})`,
      httpStatus: res.status,
      diag: { error: json?.error, status: res.status },
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'API 연결 중 오류'
    return { success: false, message: msg, diag: { stack: e instanceof Error ? e.stack : null } }
  }
}
