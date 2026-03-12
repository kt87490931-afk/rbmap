import { NextResponse } from 'next/server'
import { clearOtpSession } from '@/lib/otp'

/** 로그아웃 시 OTP 세션 쿠키 삭제 (재접속 시 OTP 재인증 필요) */
export async function POST() {
  await clearOtpSession()
  return NextResponse.json({ ok: true })
}
