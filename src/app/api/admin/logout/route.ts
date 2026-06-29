import { NextResponse } from 'next/server'
import { clearOtpSession } from '@/lib/otp'
import { clearAdminPasswordSession } from '@/lib/admin-password'

/** 로그아웃 시 OTP·비밀번호 세션 쿠키 삭제 */
export async function POST() {
  await clearOtpSession()
  await clearAdminPasswordSession()
  return NextResponse.json({ ok: true })
}
