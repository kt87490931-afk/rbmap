import { NextResponse } from 'next/server'

/** 로고 5클릭 시 즉시 어드민 모드 (Google/OTP 없음). 톱니바퀴 확인용 */
export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('rbmap_dev_admin', '1', {
    path: '/',
    maxAge: 60 * 60 * 24, // 24h
    httpOnly: true,
    sameSite: 'lax',
  })
  return res
}
