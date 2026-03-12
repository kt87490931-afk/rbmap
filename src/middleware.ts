import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

/**
 * 랭킹마켓과 동일: /admin/* 접근 시 OTP 세션 쿠키 검사
 * - setup-otp, verify-otp는 통과 (OTP 설정/인증 페이지)
 * - 프로덕션(rbbmap.com)이 아닐 때 설정 모드(Google 미설정)면 통과
 * - 그 외: admin_otp_session 쿠키 없으면 verify-otp로 리다이렉트
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.includes('/setup-otp') || pathname.includes('/verify-otp')) {
    return NextResponse.next()
  }

  // 설정 모드 + 비프로덕션(로컬)이면 OTP 없이 통과
  const isSetupMode =
    !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET
  const isProduction = (process.env.NEXTAUTH_URL || '').includes('rbbmap.com')
  if (isSetupMode && !isProduction) {
    return NextResponse.next()
  }

  const otpCookie = request.cookies.get('admin_otp_session')

  if (!otpCookie?.value) {
    return NextResponse.redirect(new URL('/admin/verify-otp', request.url))
  }

  try {
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) {
      return NextResponse.redirect(new URL('/admin/verify-otp', request.url))
    }
    const key = new TextEncoder().encode(secret)
    await jwtVerify(otpCookie.value, key)
    return NextResponse.next()
  } catch {
    const response = NextResponse.redirect(new URL('/admin/verify-otp', request.url))
    response.cookies.delete('admin_otp_session')
    return response
  }
}

export const config = {
  matcher: ['/admin/:path*'],
}
