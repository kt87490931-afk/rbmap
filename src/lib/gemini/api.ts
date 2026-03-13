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

export type IntroTone = 'pro' | 'partner_pro'

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
  if (arr(data.interior).length) block += `인테리어: ${arr(data.interior)}\n`
  if (arr(data.room_condition).length) block += `룸 구성: ${arr(data.room_condition)}\n`
  if (arr(data.sound_facility).length) block += `음향/시설: ${arr(data.sound_facility)}\n`
  if (arr(data.clean_points).length) block += `청결: ${arr(data.clean_points)}\n`
  if (arr(data.manager_style).length) block += `매니저 스타일: ${arr(data.manager_style)}\n`
  if (arr(data.matching).length) block += `매칭/시스템: ${arr(data.matching)}\n`
  if (data.staff_count) block += `출근 인원: ${data.staff_count}\n`
  if (arr(data.free_service).length) block += `무료 서비스: ${arr(data.free_service)}\n`
  if (arr(data.convenience).length) block += `편의 서비스: ${arr(data.convenience)}\n`
  if (arr(data.discount).length) block += `할인: ${arr(data.discount)}\n`
  if (arr(data.philosophy).length) block += `운영 철학: ${arr(data.philosophy)}\n`
  if (arr(data.manager_career).length) block += `실장 경력: ${arr(data.manager_career)}\n`
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

const V2_JSON_INSTRUCTION = `
[출력 형식 - JSON] 반드시 아래 JSON만 출력해라. 다른 설명 없이 JSON만.
{
  "tagline": "지역명 업종명 — 한 줄 캐치프레이즈 (예: 강남 가라오케의 기준 — 20년 업력이 만든 신뢰)",
  "intro": {
    "label": "ABOUT · 업소 소개",
    "headline": "업소명 — 지역명 업종명의 새로운 기준 (em dash 기준 앞/뒤)",
    "lead": "리드 문장 1개 (크게 표시할 핵심 요약)",
    "quote": "인용 강조할 문장 1개 (선택, 없으면 null)",
    "body_paragraphs": ["본문 단락1", "본문 단락2", "본문 단락3"]
  }
}
`

export async function generateVenueIntro(
  data: FormDataForGemini,
  tone: IntroTone = 'pro',
  essentialKeywords?: string[],
  options?: { format?: 'text' | 'json' }
): Promise<VenueIntroResult> {
  const apiKey = getApiKey()
  if (!apiKey) {
    return { success: false, message: 'API 키가 설정되지 않았습니다.' }
  }

  const format = options?.format ?? 'text'
  const keywords = essentialKeywords && essentialKeywords.length > 0
    ? essentialKeywords
    : DEFAULT_ESSENTIAL_KEYWORDS

  const roleId = tone === 'partner_pro' ? 'partner_pro' : 'pro'
  const role = geminiRoles[roleId] || geminiRoles.pro
  let basePrompt = role.prompt
  if (format === 'json') {
    basePrompt += '\n[중요] JSON 형식으로만 출력할 것. 마크다운 코드블록 없이 순수 JSON만 출력.\n'
    basePrompt += V2_JSON_INSTRUCTION
  }
  const dataBlock = buildDataBlock(data, keywords)
  const fullPrompt = basePrompt + '\n' + dataBlock

  // API 키 전달: 헤더 + 쿼리(이중화) — 일부 프록시/CDN에서 헤더 누락 대비
  const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`
  const url = `${baseUrl}?key=${encodeURIComponent(apiKey)}`
  const payload = {
    contents: [{ parts: [{ text: fullPrompt }] }],
    generationConfig: {
      temperature: geminiTemperature,
      maxOutputTokens: geminiMaxOutputTokens,
      topP: geminiTopP,
    },
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
      const text = rawText.trim()
      let v2: VenueIntroV2 | undefined
      if (format === 'json') {
        try {
          const cleaned = text.replace(/^```json?\s*/i, '').replace(/\s*```\s*$/, '').trim()
          v2 = JSON.parse(cleaned) as VenueIntroV2
        } catch {
          v2 = undefined
        }
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
