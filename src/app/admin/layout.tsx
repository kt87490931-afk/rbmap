import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifyOtpSession } from '@/lib/otp'
import { isSetupMode, hasDevAdminCookie } from '@/lib/admin-auth'
import { AdminSidebar } from './AdminSidebar'
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
  if (await hasDevAdminCookie()) {
    return (
      <div className="admin-layout">
        <AdminSidebar disabled={false} />
        <div className="admin-content">{children}</div>
      </div>
    )
  }
  if (isSetupMode()) {
    return (
      <div className="admin-layout">
        <AdminSidebar disabled={false} setupMode />
        <div className="admin-content">
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
        </div>
      </div>
    )
  }

  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/api/auth/signin?callbackUrl=/admin')
  }

  if (session.user.role !== 'admin') {
    return (
      <div className="admin-section" style={{ textAlign: 'center', paddingTop: 80 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>접근 권한 없음</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 20 }}>관리자만 접근할 수 있습니다.</p>
        <Link href="/" className="btn-save">홈으로 돌아가기</Link>
      </div>
    )
  }

  const isOtpVerified = await verifyOtpSession(session.user.id)
  if (!isOtpVerified) {
    redirect('/admin/verify-otp')
  }

  return (
    <div className="admin-layout">
      <AdminSidebar disabled={false} />
      <div className="admin-content">
        {children}
      </div>
    </div>
  )
}
