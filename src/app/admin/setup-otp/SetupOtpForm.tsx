'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function SetupOtpForm() {
  const router = useRouter()
  const [secret, setSecret] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/otp/setup')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setSecret(data.secret)
          setQrCode(data.qrCode)
        }
      })
      .catch(() => setError('QR코드 생성에 실패했습니다.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/admin/otp/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, token: token.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '설정 실패')
        return
      }

      router.push('/admin')
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="card-box" style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 24, marginBottom: 12 }}>⏳</div>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>QR코드를 생성하는 중...</p>
      </div>
    )
  }

  if (error && !qrCode) {
    return (
      <div className="card-box" style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 24, marginBottom: 12 }}>⚠️</div>
        <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="card-box" style={{ textAlign: 'center', marginBottom: 16 }}>
        <div className="card-box-title" style={{ justifyContent: 'center' }}>
          <span>📱</span> Step 1. Google Authenticator로 스캔
        </div>
        {qrCode && (
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 16,
            display: 'inline-block',
            marginBottom: 12,
          }}>
            <img src={qrCode} alt="OTP QR Code" width={180} height={180} />
          </div>
        )}
        <details style={{ marginTop: 8 }}>
          <summary style={{
            cursor: 'pointer',
            fontSize: 11,
            color: 'var(--muted)',
            userSelect: 'none',
          }}>
            QR스캔이 안 되면 수동 입력 키 보기
          </summary>
          <code style={{
            display: 'block',
            marginTop: 8,
            padding: '8px 12px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            wordBreak: 'break-all',
            color: 'var(--blue)',
            userSelect: 'all',
          }}>
            {secret}
          </code>
        </details>
      </div>

      <div className="card-box" style={{ marginBottom: 16 }}>
        <div className="card-box-title">
          <span>🔢</span> Step 2. 앱에 표시된 6자리 코드 입력
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          value={token}
          onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          className="form-input"
          style={{
            textAlign: 'center',
            fontSize: 28,
            letterSpacing: '0.5em',
            fontFamily: "'DM Mono', monospace",
            padding: '14px 12px',
            fontWeight: 700,
          }}
          required
          autoFocus
        />
      </div>

      {error && (
        <div style={{
          background: 'rgba(230,57,70,.1)',
          border: '1px solid rgba(230,57,70,.3)',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 16,
          fontSize: 12,
          color: 'var(--red)',
          textAlign: 'center',
        }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || token.length !== 6}
        className="btn-save"
        style={{
          width: '100%',
          padding: '14px 20px',
          fontSize: 15,
          opacity: (submitting || token.length !== 6) ? 0.5 : 1,
          cursor: (submitting || token.length !== 6) ? 'not-allowed' : 'pointer',
        }}
      >
        {submitting ? '확인 중...' : '✅ OTP 설정 완료'}
      </button>
    </form>
  )
}
