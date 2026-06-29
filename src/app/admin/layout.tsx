import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'

export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isSetupModeEffective, hasDevAdminCookie } from '@/lib/admin-auth'
import { isOtpEnforced } from '@/lib/otp-config'
import { hasAdminPasswordSession, isAdminPasswordEnabled } from '@/lib/admin-password'
import { AdminShell } from './AdminShell'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: '어드민', template: '%s | 어드민' },
  robots: { index: false, follow: false },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = (await headers()).get('x-pathname') || ''
  const isLoginPage = pathname === '/admin/login' || pathname.startsWith('/admin/login/')

  if (isLoginPage) {
    return (
      <AdminShell bare>
        {children}
      </AdminShell>
    )
  }

  if (await hasDevAdminCookie()) {
    return (
      <AdminShell disabled={false}>
        {children}
      </AdminShell>
    )
  }

  if (isAdminPasswordEnabled()) {
    if (!(await hasAdminPasswordSession())) {
      redirect('/admin/login')
    }
    return (
      <AdminShell disabled={false} passwordMode>
        {children}
      </AdminShell>
    )
  }

  if (isSetupModeEffective()) {
    return (
      <AdminShell disabled={false} setupMode>
        <div style={{
          background: 'rgba(200, 168, 75, 0.15)',
          border: '1px solid rgba(200, 168, 75, 0.4)',
          borderRadius: 8,
          padding: '14px 18px',
          marginBottom: 16,
          fontSize: 13,
          color: 'var(--gold, #c8a84b)',
          lineHeight: 1.6,
        }}>
          ⚠️ <strong>설정 모드</strong> — 로그인·OTP가 비활성화된 상태입니다.
          <br />
          <span style={{ fontSize: 12, opacity: 0.9 }}>
            서버 .env.production에 <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: 4 }}>GOOGLE_CLIENT_ID</code>, <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: 4 }}>GOOGLE_CLIENT_SECRET</code>를 추가 후 빌드/재시작하면 Google 로그인과 OTP가 활성화됩니다.
          </span>
        </div>
        {children}
      </AdminShell>
    )
  }

  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/api/auth/signin?callbackUrl=/admin')
  }

  if (session.user.role !== 'admin') {
    return (
      <AdminShell bare>
        <div className="admin-section" style={{ textAlign: 'center', paddingTop: 80 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>접근 권한 없음</h1>
          <p style={{ color: 'var(--muted)', marginBottom: 20 }}>관리자만 접근할 수 있습니다.</p>
          <Link href="/" className="btn-save">홈으로 돌아가기</Link>
        </div>
      </AdminShell>
    )
  }

  const cookieStore = await cookies()
  const otpCookie = cookieStore.get('admin_otp_session')
  const isOtpVerified = !isOtpEnforced() || !!otpCookie?.value

  return (
    <AdminShell disabled={!isOtpVerified} setupMode={false}>
      {children}
    </AdminShell>
  )
}
