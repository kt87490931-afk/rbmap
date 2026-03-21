/**
 * Gemini API 키 테스트 (이브알바 jobs_ai_content_action.php act=test_api_key 동일)
 */
import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { geminiModel, geminiSafetySettingsOff } from '@/lib/gemini/config'

export const dynamic = 'force-dynamic'

async function getApiKey(): Promise<string> {
  const { readFileSync, existsSync } = await import('fs')
  const { join } = await import('path')
  let key = (process.env.GEMINI_API_KEY || '').replace(/\ufeff/g, '').trim()
  if (key && key.length > 20) return key
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
      } catch {
        /* ignore */
      }
    }
  }
  return ''
}

export async function GET() {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const apiKey = await getApiKey()
  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      message: 'API 키가 설정되지 않았습니다.',
      hint: '.env.production 또는 gemini_api_key.env에 GEMINI_API_KEY 추가',
    })
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`
  const payload = JSON.stringify({
    contents: [{ parts: [{ text: 'Hello. Reply with OK only.' }] }],
    safetySettings: geminiSafetySettingsOff,
  })

  const start = Date.now()
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: payload,
    })
    const elapsed = Date.now() - start
    const json = await res.json()

    if (res.ok && json?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return NextResponse.json({
        ok: true,
        message: 'API 테스트 성공',
        keyPrefix: apiKey.slice(0, 10) + '...',
        httpStatus: res.status,
        elapsedMs: elapsed,
        reply: String(json.candidates[0].content.parts[0].text).trim().slice(0, 50),
      })
    }

    const errMsg = json?.error?.message || '알 수 없는 오류'
    return NextResponse.json({
      ok: false,
      message: 'API 테스트 실패',
      keyPrefix: apiKey.slice(0, 10) + '...',
      httpStatus: res.status,
      elapsedMs: elapsed,
      error: errMsg,
      fullError: json?.error || null,
    })
  } catch (e) {
    const elapsed = Date.now() - start
    return NextResponse.json({
      ok: false,
      message: 'API 연결 실패',
      error: e instanceof Error ? e.message : String(e),
      elapsedMs: elapsed,
    })
  }
}
