import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getOtpSecret,
  verifyOtpToken,
  setOtpSessionCookie,
  checkOtpLockout,
  recordOtpAttempt,
} from '@/lib/otp'
import { notifyAdminLogin } from '@/lib/telegram'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const lockout = await checkOtpLockout(session.user.id)
  if (lockout.locked) {
    return NextResponse.json(
      { error: `너무 많은 시도. ${lockout.remainingMinutes}분 후 다시 시도해주세요.` },
      { status: 429 }
    )
  }

  const { token } = await request.json()
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'OTP 코드를 입력해주세요.' }, { status: 400 })
  }

  const secret = await getOtpSecret(session.user.id)
  if (!secret) {
    return NextResponse.json({ error: 'OTP가 설정되지 않았습니다.' }, { status: 400 })
  }

  const isValid = verifyOtpToken(secret, token)
  const { locked } = await recordOtpAttempt(session.user.id, isValid)

  if (!isValid) {
    if (locked) {
      return NextResponse.json(
        { error: '5회 실패로 15분간 잠금되었습니다.' },
        { status: 429 }
      )
    }
    return NextResponse.json(
      { error: 'OTP 코드가 올바르지 않습니다.' },
      { status: 400 }
    )
  }

  await setOtpSessionCookie(session.user.id)

  const headersList = await headers()
  const forwarded = headersList.get('x-forwarded-for')
  const realIp = headersList.get('x-real-ip')
  const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown'
  const email = (session.user as { email?: string }).email ?? session.user.name ?? 'admin'
  notifyAdminLogin(email, ip).catch(() => {})

  return NextResponse.json({ ok: true })
}
