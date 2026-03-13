/**
 * 업체 리뷰 AI 생성 (Gemini)
 * 적용된 venue_intros 기반, 시나리오 조합 + 7톤
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { geminiModel, geminiTemperature, geminiTopP, geminiMaxOutputTokens } from './config'
import { reviewTonePrompts } from './review-config'
import type { ScenarioCombo, ReviewTone } from '../review-scenarios'
import { scenarioToPromptText } from '../review-scenarios'

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
  | { success: true; content: string; title: string; elapsedMs?: number }
  | { success: false; message: string }

const EMOJI_REGEX =
  /[\u{1F300}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}\u{2705}\u{274C}\u{2728}\u{2764}\u{2763}\u{FE0F}]/gu

function stripEmoji(s: string): string {
  return s.replace(EMOJI_REGEX, '').trim()
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
}): Promise<ReviewResult> {
  const apiKey = getApiKey()
  if (!apiKey) return { success: false, message: 'API 키가 설정되지 않았습니다.' }

  const toneConfig = reviewTonePrompts[params.tone] || reviewTonePrompts.early_30s
  const scenarioBlock = scenarioToPromptText(params.scenario, params.tone)

  const systemPrompt =
    '너는 실제로 해당 업소를 방문한 손님이다. 아래 [업소 소개글]을 참고하여, [시나리오]에 맞는 자연스러운 이용 후기를 작성해라.\n\n' +
    toneConfig.prompt +
    '\n[필수]\n' +
    '- 분량: 800자 이상 1000자 이하 (한글 기준)\n' +
    '- 이모지 사용 금지. 텍스트만.\n' +
    '- 실제 방문 경험처럼 구체적으로. 과장 없이.\n' +
    '- 제목 1줄 + 본문 형태로 작성. 제목은 --- 로 구분.\n\n' +
    `[시나리오]\n${scenarioBlock}\n\n` +
    `[업소 정보]\n업소명: ${params.venueName}\n지역: ${params.regionName}\n업종: ${params.typeName}\n\n` +
    '[업소 소개글]\n' +
    (params.introText.slice(0, 2500) || '업소 소개 정보 없음') +
    '\n\n---\n위 시나리오와 톤에 맞춰 손님 입장의 이용 후기를 작성해라. 첫 줄에 제목을 쓰고, 그 다음 줄에 --- 를 넣은 뒤 본문을 써라.'

  const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`
  const url = `${baseUrl}?key=${encodeURIComponent(apiKey)}`
  const payload = {
    contents: [{ parts: [{ text: systemPrompt }] }],
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

    let text = stripEmoji(rawText.trim())
    let title = ''
    let content = text

    const sep = text.indexOf('---')
    if (sep > 0) {
      title = text.slice(0, sep).trim().split('\n')[0] || ''
      content = text.slice(sep + 3).trim()
    }
    if (!title) title = `${params.venueName} 이용 후기`

    const len = content.length
    if (len < 700) {
      return {
        success: false,
        message: `생성된 리뷰가 ${len}자로 부족합니다. 800자 이상이 필요합니다.`,
      }
    }
    if (len > 1100) {
      content = content.slice(0, 1000) + '…'
    }

    return { success: true, content, title, elapsedMs }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'API 연결 오류'
    return { success: false, message: msg }
  }
}
