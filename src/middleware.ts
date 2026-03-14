import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

/** env + DB blocked_ips 병합 */
async function getBlockedIps(request: NextRequest): Promise<string[]> {
  const fromEnv = (process.env.BLOCKED_IPS || '').split(',').map((s) => s.trim()).filter(Boolean)
  const secret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) return fromEnv
  try {
    const url = new URL('/api/internal/blocked-ips', request.url)
    const res = await fetch(url.toString(), { headers: { 'x-blocked-check': secret } } as RequestInit)
    if (res.ok) {
      const fromDb: string[] = await res.json()
      return [...new Set([...fromEnv, ...fromDb])]
    }
  } catch {
    /* fallback to env only */
  }
  return fromEnv
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. IP 차단 검사 (env + DB blocked_ips)
  const blocked = await getBlockedIps(request)
  if (blocked.length > 0) {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0]?.trim() || realIp || request.ip || ''
    if (ip && blocked.includes(ip)) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  // 2. /admin/* 접근 시 OTP 세션 쿠키 검사
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }
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
  matcher: [
    /*
     * IP 차단: 전체 경로. /api/internal 제외 (자기 자신 fetch 시 루프 방지)
     * /admin 은 OTP 검사 추가 적용
     */
    '/((?!_next/static|_next/image|favicon.ico|api/internal|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
