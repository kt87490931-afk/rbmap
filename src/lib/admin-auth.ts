import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifyOtpSession } from '@/lib/otp'
import { cookies } from 'next/headers'

/**
 * 로고 5클릭 dev-admin 쿠키 있으면 즉시 어드민 통과 (Google/OTP 없음)
 */
export async function hasDevAdminCookie(): Promise<boolean> {
  const c = await cookies()
  return c.get('rbmap_dev_admin')?.value === '1'
}

/**
 * Google OAuth가 설정되지 않았으면 "설정 모드"로 인증 없이 허용
 */
export function isSetupMode() {
  return !(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.NEXTAUTH_SECRET
  )
}

/**
 * 어드민 API용: dev 쿠키/설정 모드면 통과, 아니면 세션+OTP 검증
 */
export async function requireAdminOrSetup(): Promise<NextResponse | null> {
  if (await hasDevAdminCookie()) return null
  if (isSetupMode()) {
    return null
  }
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }
  const verified = await verifyOtpSession(session.user.id)
  if (!verified) {
    return NextResponse.json({ error: 'OTP 인증이 필요합니다.' }, { status: 403 })
  }
  return null
}
