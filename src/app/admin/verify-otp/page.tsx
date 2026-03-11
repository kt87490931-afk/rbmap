import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getOtpSecret, verifyOtpSession } from '@/lib/otp'
import Link from 'next/link'
import { VerifyOtpForm } from './VerifyOtpForm'

export default async function VerifyOtpPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/api/auth/signin?callbackUrl=/admin')
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

  const otpSecret = await getOtpSecret(session.user.id)
  if (!otpSecret) {
    redirect('/admin/setup-otp')
  }

  const isVerified = await verifyOtpSession(session.user.id)
  if (isVerified) {
    redirect('/admin')
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
            OTP 인증
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.6 }}>
            Google Authenticator 앱의 6자리 코드를 입력해주세요.
          </p>
        </div>
        <VerifyOtpForm />
      </div>
    </div>
  )
}
