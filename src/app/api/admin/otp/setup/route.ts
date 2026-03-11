import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  generateOtpSecret,
  generateOtpQrCode,
  verifyOtpToken,
  saveOtpSecret,
  getOtpSecret,
  setOtpSessionCookie,
} from '@/lib/otp'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const existing = await getOtpSecret(session.user.id)
  if (existing) {
    return NextResponse.json({ error: 'OTP가 이미 설정되어 있습니다.' }, { status: 400 })
  }

  const secret = generateOtpSecret()
  const qrCode = await generateOtpQrCode(secret, session.user.email ?? 'admin')

  return NextResponse.json({ secret, qrCode })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const { secret, token } = await request.json()

  if (!secret || !token) {
    return NextResponse.json({ error: 'secret과 token이 필요합니다.' }, { status: 400 })
  }

  const isValid = verifyOtpToken(secret, token)
  if (!isValid) {
    return NextResponse.json({ error: 'OTP 코드가 올바르지 않습니다. 다시 시도해주세요.' }, { status: 400 })
  }

  await saveOtpSecret(session.user.id, secret)
  await setOtpSessionCookie(session.user.id)

  return NextResponse.json({ ok: true, message: 'OTP 설정이 완료되었습니다.' })
}
