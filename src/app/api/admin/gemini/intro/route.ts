import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { generateVenueIntro, type FormDataForGemini } from '@/lib/gemini'

export const dynamic = 'force-dynamic'

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

  const result = await generateVenueIntro(data, tone)

  if (result.success) {
    return NextResponse.json({ success: true, text: result.text })
  }
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
