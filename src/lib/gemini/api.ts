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

  block += '[작성할 데이터] (이 데이터를 바탕으로 3,000자 이상 4,000자 미만 업체소개글 작성)\n'
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
 * 업체소개글 텍스트 생성 (3,000자 이상 4,000자 미만)
 * API는 평문만 요청하고, 서버에서 lead/quote/body_paragraphs 로 맵핑해 v2 반환
 */
export type VenueIntroResult =
  | { success: true; text: string; v2?: VenueIntroV2; elapsedMs?: number; needsReview?: boolean }
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

const MIN_CONTENT_LENGTH = 3000
const REVIEW_THRESHOLD_LENGTH = 4000

const INTRO_BAN_PATTERN =
  '[금지 오프닝] 다음과 같이 시작하지 마라: "업소명은 지역명에 위치한", "업소명은 지역명 OO에 자리한". 다른 업소 소개와 구분되는 독특한 오프닝을 써라.'

/** API는 텍스트만 생성. 서버에서 v2 구조로 맵핑 (JSON 파싱 오류 방지) */
const TEXT_ONLY_INSTRUCTION = `
[출력 형식] 반드시 순수 텍스트만 출력해라. JSON, 코드, 마크다운(백틱), 설명 문장 절대 금지.
[금지] 이모지(emoji) 절대 사용 금지.
[필수 분량] 3,000자 이상 4,000자 미만. 단락은 빈 줄(엔터 두 번)로 구분.
[구성] 첫 단락은 [오프닝 지시]에 맞게 핵심 요약(350~450자). 이어서 [포커스 지시]에 맞게 본문 단락들을 이어 써라.
`

/** 서버 측 맵핑: 평문을 lead / quote / body_paragraphs 로 나눔 */
function mapPlainTextToV2(text: string): VenueIntroV2 {
  const trimmed = text.trim()
  const paragraphs = trimmed.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
  const lead = paragraphs[0] ?? trimmed.slice(0, 450)
  const second = paragraphs[1]
  const quote =
    second && second.length >= 150 && second.length <= 350 ? second : null
  const bodyStart = quote ? 2 : 1
  let body_paragraphs = paragraphs.slice(bodyStart).filter(Boolean)
  if (body_paragraphs.length === 0) {
    const rest = trimmed.slice(lead.length).trim()
    if (rest.length > 0) body_paragraphs = [rest]
    else body_paragraphs = [lead]
  }
  return {
    intro: {
      label: 'ABOUT · 업소 소개',
      lead,
      ...(quote && { quote }),
      body_paragraphs,
    },
  }
}

export async function generateVenueIntro(
  data: FormDataForGemini,
  tone: IntroTone = 'pro',
  essentialKeywords?: string[],
  options?: { openingPatternSeed?: number; focusSeed?: number }
): Promise<VenueIntroResult> {
  const apiKey = getApiKey()
  if (!apiKey) {
    return { success: false, message: 'API 키가 설정되지 않았습니다.' }
  }

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
  basePrompt += TEXT_ONLY_INSTRUCTION
  const dataBlock = buildDataBlock(data, keywords)
  const fullPrompt = basePrompt + '\n' + dataBlock

  const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`
  const url = `${baseUrl}?key=${encodeURIComponent(apiKey)}`
  const generationConfig: Record<string, unknown> = {
    temperature: geminiTemperature,
    maxOutputTokens: geminiMaxOutputTokens,
    topP: geminiTopP,
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
      const text = stripEmoji(rawText.trim())
      if (text.length < 100) {
        return {
          success: false,
          message: 'AI 응답이 비어 있거나 너무 짧습니다. 다시 생성해 주세요.',
          diag: { rawPreview: text.slice(0, 300) },
        }
      }
      const v2 = mapPlainTextToV2(text)
      const v2Clean = stripEmojiFromV2(v2)
      const len = getV2ContentLength(v2Clean)
      if (len < MIN_CONTENT_LENGTH) {
        return {
          success: false,
          message: `생성된 글이 ${len}자로 분량 부족입니다. 3,000자 이상이 필요합니다. 다시 생성해 주세요.`,
          diag: { contentLength: len, required: MIN_CONTENT_LENGTH },
        }
      }
      const displayText = [v2Clean.intro?.lead, v2Clean.intro?.quote, ...(v2Clean.intro?.body_paragraphs ?? [])].filter(Boolean).join('\n\n')
      const needsReview = len > REVIEW_THRESHOLD_LENGTH
      return { success: true, text: displayText, v2: v2Clean, elapsedMs, needsReview }
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
