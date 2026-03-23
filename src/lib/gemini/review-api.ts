/**
 * 업체 리뷰 AI 생성 (Gemini)
 * 적용된 venue_intros 기반, 시나리오 조합 + 7톤
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { geminiModel, geminiTemperature, geminiTopP, geminiMaxOutputTokens, geminiSafetySettingsOff } from './config'
import { reviewTonePrompts } from './review-config'
import type { ScenarioCombo, ReviewTone } from '../review-scenarios'
import { scenarioToPromptText, REVIEW_TONES } from '../review-scenarios'
import { pickReviewOpeningHook, pickReviewFocus, REVIEW_BAN_PATTERNS, reviewSeed } from '../review-diversity'

function getApiKey(): string {
  let key = (process.env.GEMINI_API_KEY || '').replace(/\ufeff/g, '').trim()
  if (key && key.length > 20) return key
  const cwd = process.cwd()
  const candidates: { path: string; raw?: boolean }[] = [
    { path: join(cwd, '.env.production') },
    { path: join(cwd, '.env.local') },
    { path: join(cwd, '..', '.env.production') },
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
            key = m[1].trim().replace(/^["']|["']$/g, '').trim()
            if (key && key.length > 20) return key
          }
        }
      } catch { /* ignore */ }
    }
  }
  return ''
}

export type ReviewResult =
  | { success: true; content: string; title: string; elapsedMs?: number; core_keywords?: string[]; purpose_label?: string }
  | { success: false; message: string }

const EMOJI_REGEX =
  /[\u{1F300}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}\u{2705}\u{274C}\u{2728}\u{2764}\u{2763}\u{FE0F}]/gu

const FORBIDDEN_REVIEW_TERMS = [/룸빵여지도/gi, /rbbmap\.com/gi, /\brbbmap\b/gi] as const

function stripEmoji(s: string): string {
  return s.replace(EMOJI_REGEX, '').trim()
}

function sanitizeForbiddenMentions(text: string): string {
  let sanitized = text
  for (const pattern of FORBIDDEN_REVIEW_TERMS) {
    sanitized = sanitized.replace(pattern, '')
  }
  return sanitized
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** 업체소개글 텍스트 추출 */
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
 * 리뷰 생성 (800자 이상 1000자 이하)
 */
export async function generateReview(params: {
  venueName: string
  regionName: string
  typeName: string
  introText: string
  scenario: ScenarioCombo
  tone: ReviewTone
  /** 이번 리뷰 주제 — 제목·본문이 이 주제를 반영해야 함 */
  topic?: string
}): Promise<ReviewResult> {
  const apiKey = getApiKey()
  if (!apiKey) return { success: false, message: 'API 키가 설정되지 않았습니다.' }

  const toneConfig = reviewTonePrompts[params.tone] || reviewTonePrompts.early_30s
  const toneInfo = REVIEW_TONES.find((t) => t.id === params.tone)
  const charMin = toneInfo?.charTarget ?? 800
  const charMax = Math.max(charMin + 200, 1000)
  const scenarioBlock = scenarioToPromptText(params.scenario, params.tone)
  const scenarioHash = JSON.stringify(params.scenario)
  const seed = reviewSeed(params.venueName, scenarioHash)
  const openingHook = pickReviewOpeningHook(seed)
  const focus = pickReviewFocus(seed + 100)

  const topicBlock = params.topic
    ? `[이번 리뷰 주제 — 반드시 준수, 본문의 80% 이상]\n${params.topic}\n\n이 주제가 본문의 80% 이상을 차지해야 한다. 다른 주제로 바꾸지 마라. 이 주제(상황/에피소드)에 맞는 구체적 경험을 "썰" 스타일로 작성하라. 객관적 리뷰보다 내 생각·감정·반응을 충분히 담아라. 독자 궁금증을 유발해 클릭과 읽기를 이끌어라.\n\n`
    : ''

  /** topic이 이미 "썰"로 끝나면 suffix 추가 안 함 (썰 썰 방지) */
  const topicEndsWithSsul = params.topic?.trimEnd().endsWith('썰') ?? false
  const titleSsulSuffix = topicEndsWithSsul ? '' : ' 썰'

  const titleFormatBlock =
    '[제목 형식 — 필수]\n' +
    '- 제목은 반드시 "썰"로 끝나야 한다. "이용 후기", "리뷰" 같은 단어는 쓰지 말고 오직 "썰"로만 끝내라.\n' +
    '- 괄호 [] 를 제목에 넣지 마라. 지역명·업종명을 그대로 붙여서 써라.\n' +
    (params.topic
      ? `- 제목 예시: "${params.regionName} ${params.typeName}에서 ${params.topic}${titleSsulSuffix}"\n`
      : '- 형식: 지역명 업종명에서 상황/에피소드 썰 (예: 강남 룸싸롱에서 연예인급 그녀 만난 썰)\n')

  const systemPrompt =
    '너는 실제로 해당 업소를 방문한 손님이다. 아래 [업소 소개글]을 참고하여, [시나리오]에 맞는 "썰"(경험담)을 작성해라. 리뷰보다 썰 느낌이 강하게 — 본인 생각·감정이 많이 담긴 글로.\n\n' +
    toneConfig.prompt +
    '[필수]\n' +
    `- 분량: ${charMin}자 이상 ${charMax}자 이하 (한글 기준)\n` +
    '- 이모지 사용 금지. 텍스트만.\n' +
    '- 실제 방문 경험처럼 구체적으로. 과장 없이.\n' +
    '- 본문/제목 어디에도 "룸빵여지도", "rbbmap", "rbbmap.com" 같은 사이트/브랜드/도메인 언급을 절대 쓰지 마라.\n' +
    '\n' +
    '[리뷰 디테일 강화 지침]\n' +
    '- MZ 유행어는 "럭키비키", "폼 미쳤다", "T야?", "중꺾마" 등에서 문맥에 맞게 1~2번만 사용해라. 과하게 반복하면 인위적으로 보이니 결정적인 감탄사나 대사에만 쓰자.\n' +
    '- 외모나 분위기를 단순히 예쁘다/좋다라고 쓰지 말고, 조명 아래 비친 앵두 같은 입술 산, 귓가에 닿는 촉촉한 숨소리처럼 1인칭 시점의 시각·청각·촉각 묘사를 사용해라.\n' +
    '- 이야기 전개에는 감정선이 있어야 한다. 그냥 술 마시러 온 시작 → 그녀의 반전 매력에 당황하고 끌리는 중간 → 번호 교환이나 애프터 약속으로 설레는 결말까지 감정 변화를 드라마처럼 써라.\n' +
    '- 문단은 짧게 끊고, 중간중간 [!], [후기] 같은 말머리를 섞어 모바일에서 읽기 편하게 구성해라.\n' +
    '- 본문 마지막에는 "한 줄 평: ~" 형식으로 오늘 경험을 한 문장으로 정리하는 요약 문장을 반드시 추가해라.\n' +
    titleFormatBlock +
    '- 제목 1줄 + 본문 형태로 작성. 제목은 --- 로 구분.\n' +
    `[오프닝 지시] ${openingHook.instruction}\n` +
    `[포커스 지시] ${focus.instruction}\n` +
    `[금지] ${REVIEW_BAN_PATTERNS}\n\n` +
    topicBlock +
    `[시나리오]\n${scenarioBlock}\n\n` +
    `[업소 정보]\n업소명: ${params.venueName}\n지역: ${params.regionName}\n업종: ${params.typeName}\n\n` +
    '[업소 소개글]\n' +
    (params.introText.slice(0, 2500) || '업소 소개 정보 없음') +
    '\n\n[필수 — 본문 맨 마지막 두 줄]\n본문을 모두 쓴 뒤, 반드시 다음 두 줄을 한 줄씩 추가하라.\n' +
    '핵심주제: (제휴업체명을 포함한 이 리뷰의 핵심 주제 2~3개만, 쉼표로 구분. 예: 가락룸싸롱 정찰제 운영, 추가 요금 없이 정해진 가격)\n' +
    '이용목적: (회식/접대/친구모임/소규모모임 중 하나만)\n\n---\n위 시나리오와 톤에 맞춰 손님 입장의 이용 후기를 작성해라. 첫 줄에 제목을 쓰고, 그 다음 줄에 --- 를 넣은 뒤 본문을 써라. 본문 끝에 반드시 핵심주제: 와 이용목적: 두 줄을 붙여라.'

  const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`
  const url = `${baseUrl}?key=${encodeURIComponent(apiKey)}`
  const payload = {
    contents: [{ parts: [{ text: systemPrompt }] }],
    generationConfig: {
      temperature: geminiTemperature,
      maxOutputTokens: geminiMaxOutputTokens,
      topP: geminiTopP,
    },
    safetySettings: geminiSafetySettingsOff,
  }

  const start = Date.now()
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    const elapsedMs = Date.now() - start

    const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!rawText || typeof rawText !== 'string') {
      const errMsg = json?.error?.message || '알 수 없는 오류'
      return { success: false, message: `생성 실패: ${errMsg}` }
    }

    let text = sanitizeForbiddenMentions(stripEmoji(rawText.trim()))
    let title = ''
    let content = text

    const sep = text.indexOf('---')
    if (sep > 0) {
      title = text.slice(0, sep).trim().split('\n')[0] || ''
      content = text.slice(sep + 3).trim()
    }
    if (!title) title = `${params.venueName} 이용 후기`
    if (params.topic) {
      title = `${params.regionName} ${params.typeName}에서 ${params.topic}${titleSsulSuffix}`
    }
    title = sanitizeForbiddenMentions(title)
    // AI가 topic에 이미 "썰"이 있는데 또 붙인 경우 "썰 썰" → "썰"로 정리
    if (title.endsWith('썰 썰')) title = title.slice(0, -3)

    const len = content.length
    const minLen = Math.max(600, Math.floor(charMin * 0.7))
    if (len < minLen) {
      return {
        success: false,
        message: `생성된 리뷰가 ${len}자로 부족합니다. ${charMin}자 이상이 필요합니다.`,
      }
    }
    if (len > 2000) {
      const at = content.slice(0, 1900).replace(/\n+$/, '').length
      const lastDot = content.lastIndexOf('.', at)
      const lastEnd = content.lastIndexOf('다.', at)
      const cut = lastEnd > 0 ? lastEnd + 2 : lastDot > 0 ? lastDot + 1 : at
      content = content.slice(0, cut).trim() + (cut < content.length ? '…' : '')
    }
    content = sanitizeForbiddenMentions(content)

    let core_keywords: string[] = []
    let purpose_label = ''
    const lines = content.split(/\r?\n/)
    const tail: string[] = []
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim()
      if (line.startsWith('핵심주제:')) {
        const raw = line.slice(5).trim()
        core_keywords = raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : []
        continue
      }
      if (line.startsWith('이용목적:')) {
        purpose_label = line.slice(5).trim()
        continue
      }
      tail.unshift(lines[i])
    }
    if (core_keywords.length > 0 || purpose_label) {
      content = tail.join('\n').trim()
    }

    return { success: true, content, title, elapsedMs, core_keywords: core_keywords.length ? core_keywords : undefined, purpose_label: purpose_label || undefined }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'API 연결 오류'
    return { success: false, message: msg }
  }
}
