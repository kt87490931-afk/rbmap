import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { generateVenueIntro, type FormDataForGemini } from '@/lib/gemini'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const DEFAULT_KEYWORDS = ['가라오케', '룸싸롱', '퍼블릭', '노래방']

async function getEssentialKeywords(): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('essential_keywords')
      .select('keyword')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    if (error || !data?.length) return DEFAULT_KEYWORDS
    return data.map((r) => r.keyword).filter(Boolean)
  } catch {
    return DEFAULT_KEYWORDS
  }
}

export async function POST(request: Request) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const body = await request.json()
  const { form, ai_tone } = body

  if (!form || typeof form !== 'object') {
    return NextResponse.json({ error: 'form 필드가 필요합니다.' }, { status: 400 })
  }

  const tone = ai_tone === 'partner_pro' ? 'partner_pro' : 'pro'
  const data = form as FormDataForGemini
  const essentialKeywords = await getEssentialKeywords()

  const result = await generateVenueIntro(data, tone, essentialKeywords)

  if (result.success) {
    // eslint-disable-next-line no-console
    console.log('[gemini/intro] ok', { name: data.name, elapsedMs: result.elapsedMs, len: result.text?.length })
    return NextResponse.json({
      success: true,
      text: result.text,
      elapsedMs: result.elapsedMs,
    })
  }
  // eslint-disable-next-line no-console
  console.error('[gemini/intro] fail', { name: data.name, message: result.message, diag: result.diag })
  const status = result.httpStatus && result.httpStatus >= 400 ? result.httpStatus : 400
  return NextResponse.json(
    {
      success: false,
      message: result.message,
      httpStatus: result.httpStatus,
      diag: result.diag || null,
    },
    { status }
  )
}
