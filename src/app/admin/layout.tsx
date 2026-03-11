import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifyOtpSession } from '@/lib/otp'
import { isSetupMode } from '@/lib/admin-auth'
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
  if (isSetupMode()) {
    return (
      <div className="admin-layout">
        <AdminSidebar disabled={false} setupMode />
        <div className="admin-content">
          <div style={{
            background: 'rgba(200, 168, 75, 0.15)',
            border: '1px solid rgba(200, 168, 75, 0.4)',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 16,
            fontSize: 12,
            color: 'var(--gold, #c8a84b)',
          }}>
            ⚠️ <strong>설정 모드</strong> — Google OAuth 미설정. 지역·제휴업체·리뷰 세팅 후, 도메인 구입 시 인증을 설정하세요.
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

  return (
    <div className="admin-layout">
      <AdminSidebar disabled={!isOtpVerified} />
      <div className="admin-content">
        {children}
      </div>
    </div>
  )
}
