/**
 * Gemini API 호출 (이브알바 gemini_api.lib.php 동일 패턴)
 * REST API: generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
 */

import {
  geminiModel,
  geminiTemperature,
  geminiTopP,
  geminiMaxOutputTokens,
  geminiRoles,
} from './config'

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim() || ''
  return key
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

function buildDataBlock(data: FormDataForGemini): string {
  const arr = (v: string[] | undefined) => (Array.isArray(v) ? v : []).join(', ')
  let block = '[고정 참고 데이터] (참고만 하고 생성 글에 넣지 마라)\n'
  block += `업소명: ${data.name || ''}\n`
  block += `지역: ${data.region || ''}\n`
  block += `업종: ${data.type || ''}\n`
  block += `연락처: ${data.contact || ''}\n`
  block += `주소: ${data.location || ''}\n\n`

  block += '[작성할 데이터] (이 데이터를 바탕으로 2,000자 이내 업체소개글 작성)\n'
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

/**
 * 업체소개글 텍스트 생성 (다이렉트 2,000자 이내)
 */
export async function generateVenueIntro(
  data: FormDataForGemini,
  tone: IntroTone = 'pro'
): Promise<{ success: true; text: string } | { success: false; message: string }> {
  const apiKey = getApiKey()
  if (!apiKey) {
    return { success: false, message: 'API 키가 설정되지 않았습니다.' }
  }

  const roleId = tone === 'partner_pro' ? 'partner_pro' : 'pro'
  const role = geminiRoles[roleId] || geminiRoles.pro
  const basePrompt = role.prompt
  const dataBlock = buildDataBlock(data)
  const fullPrompt = basePrompt + '\n' + dataBlock

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`
  const payload = {
    contents: [{ parts: [{ text: fullPrompt }] }],
    generationConfig: {
      temperature: geminiTemperature,
      maxOutputTokens: geminiMaxOutputTokens,
      topP: geminiTopP,
    },
  }

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

    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text
    if (text && typeof text === 'string') {
      return { success: true, text: text.trim() }
    }

    const errMsg = json?.error?.message || '알 수 없는 오류'
    return { success: false, message: `글 생성 중 오류가 발생했습니다. (${errMsg})` }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'API 연결 중 오류'
    return { success: false, message: msg }
  }
}
