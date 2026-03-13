import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifyOtpSession } from '@/lib/otp'
import { cookies } from 'next/headers'

/**
 * 로고 5클릭 dev-admin 쿠키 — 로컬/IP 접속 시에만 통과, 프로덕션 도메인에서는 Google+OTP 필수
 */
export async function hasDevAdminCookie(): Promise<boolean> {
  const url = process.env.NEXTAUTH_URL || ''
  const isProductionDomain = url.includes('rbbmap.com') || (url.startsWith('https://') && !url.includes('localhost'))
  if (isProductionDomain) return false

  const c = await cookies()
  return c.get('rbmap_dev_admin')?.value === '1'
}

/**
 * Google OAuth가 설정되지 않았으면 "설정 모드" — 로컬/비프로덕션에서만 사용
 */
export function isSetupMode() {
  return !(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.NEXTAUTH_SECRET
  )
}

/**
 * 프로덕션 도메인(rbbmap.com) 여부 — 여기서는 설정 모드 미적용, Google+OTP 필수
 */
export function isProductionDomain(): boolean {
  const url = process.env.NEXTAUTH_URL || ''
  return url.includes('rbbmap.com')
}

/**
 * 설정 모드가 실제로 적용되는지 — 프로덕션에서는 항상 false
 */
export function isSetupModeEffective(): boolean {
  return isSetupMode() && !isProductionDomain()
}

/** 403 응답 시 클라이언트에서 구분용 코드 */
export type AuthErrorCode = 'no-session' | 'not-admin' | 'otp-required'

/**
 * 어드민 API용: dev 쿠키/설정 모드면 통과, 아니면 세션+OTP 검증
 */
export async function requireAdminOrSetup(): Promise<NextResponse | null> {
  if (await hasDevAdminCookie()) return null
  if (isSetupModeEffective()) {
    return null
  }
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: '로그인이 필요합니다.', code: 'no-session' as AuthErrorCode }, { status: 403 })
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: '관리자 권한이 없습니다.', code: 'not-admin' as AuthErrorCode }, { status: 403 })
  }
  const verified = await verifyOtpSession(session.user.id)
  if (!verified) {
    return NextResponse.json({ error: 'OTP 인증이 필요합니다. OTP 인증 페이지에서 다시 인증해 주세요.', code: 'otp-required' as AuthErrorCode }, { status: 403 })
  }
  return null
}
