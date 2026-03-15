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
  const { form, ai_tone, format } = body

  if (!form || typeof form !== 'object') {
    return NextResponse.json({ error: 'form 필드가 필요합니다.' }, { status: 400 })
  }

  const validTones = ['pro', 'partner_pro', 'premium', 'friendly', 'trust'] as const
  const tone = validTones.includes(ai_tone as (typeof validTones)[number]) ? (ai_tone as (typeof validTones)[number]) : 'pro'
  const data = form as FormDataForGemini
  const essentialKeywords = await getEssentialKeywords()
  const outFormat = format === 'json' ? 'json' : 'text'

  const result = await generateVenueIntro(data, tone, essentialKeywords, { format: outFormat })

  if (result.success) {
    // eslint-disable-next-line no-console
    console.log('[gemini/intro] ok', { name: data.name, format: outFormat, elapsedMs: result.elapsedMs, len: result.text?.length, hasV2: !!result.v2, needsReview: result.needsReview })
    return NextResponse.json({
      success: true,
      text: result.text,
      v2: result.v2 ?? null,
      elapsedMs: result.elapsedMs,
      needsReview: result.needsReview ?? false,
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
