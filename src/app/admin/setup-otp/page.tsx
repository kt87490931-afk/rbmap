import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getOtpSecret } from '@/lib/otp'
import Link from 'next/link'
import { SetupOtpForm } from './SetupOtpForm'

export default async function SetupOtpPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/api/auth/signin?callbackUrl=/admin/setup-otp')
  }

  if (session.user.role !== 'admin') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 60px)',
        padding: '40px 16px',
      }}>
        <div className="card-box" style={{ textAlign: 'center', maxWidth: 400, width: '100%', padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🚫</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>접근 권한 없음</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>관리자만 접근할 수 있습니다.</p>
          <Link href="/" className="btn-save">홈으로 돌아가기</Link>
        </div>
      </div>
    )
  }

  const existingSecret = await getOtpSecret(session.user.id)
  if (existingSecret) {
    redirect('/admin/verify-otp')
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 60px)',
      padding: '40px 16px',
    }}>
      <div style={{ maxWidth: 440, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
          <h1 style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 28,
            letterSpacing: 1,
            marginBottom: 6,
          }}>
            Google OTP 설정
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.6 }}>
            어드민 접근을 위해 Google Authenticator 앱에서<br />
            아래 QR코드를 스캔한 후, 표시된 6자리 코드를 입력해주세요.
          </p>
        </div>
        <SetupOtpForm />
      </div>
    </div>
  )
}
