'use client'

import { useState } from 'react'

export function VerifyOtpForm() {
  const [token, setToken] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/admin/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '인증 실패')
        setToken('')
        setSubmitting(false)
        return
      }

      window.location.href = '/admin'
    } catch {
      setError('네트워크 오류가 발생했습니다.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="card-box" style={{ marginBottom: 16 }}>
        <div className="card-box-title" style={{ justifyContent: 'center' }}>
          <span>🔢</span> 인증 코드 입력
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
            fontSize: 32,
            letterSpacing: '0.5em',
            fontFamily: "'DM Mono', monospace",
            padding: '16px 12px',
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
        {submitting ? '확인 중...' : '🔓 인증하기'}
      </button>

      <p style={{
        textAlign: 'center',
        fontSize: 11,
        color: 'var(--muted)',
        marginTop: 16,
      }}>
        OTP 세션은 로그아웃 전까지 유지됩니다.
      </p>
    </form>
  )
}
