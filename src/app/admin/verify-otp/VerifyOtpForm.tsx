'use client'

import { useEffect, useRef, useState } from 'react'

function normalizeOtp(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 6)
}

export function VerifyOtpForm() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [token, setToken] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // 브라우저 OTP 자동완성은 onChange 없이 value만 채우는 경우가 있음
  useEffect(() => {
    const syncFromDom = () => {
      const domVal = inputRef.current?.value ?? ''
      const next = normalizeOtp(domVal)
      if (next && next !== token) setToken(next)
    }
    syncFromDom()
    const t1 = window.setTimeout(syncFromDom, 100)
    const t2 = window.setTimeout(syncFromDom, 500)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [token])

  function handleInput(e: React.FormEvent<HTMLInputElement>) {
    setToken(normalizeOtp(e.currentTarget.value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = normalizeOtp(inputRef.current?.value || token)
    if (code.length !== 6) {
      setError('6자리 인증 코드를 입력해주세요.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/admin/otp/verify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: code }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error || '인증 실패')
        setToken('')
        if (inputRef.current) inputRef.current.value = ''
        return
      }

      window.location.href = '/admin'
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = token.length === 6

  return (
    <form onSubmit={handleSubmit}>
      <div className="card-box" style={{ marginBottom: 16 }}>
        <div className="card-box-title" style={{ justifyContent: 'center' }}>
          <span>🔢</span> 인증 코드 입력
        </div>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={token}
          onChange={handleInput}
          onInput={handleInput}
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
        disabled={submitting}
        className="btn-save"
        style={{
          width: '100%',
          padding: '14px 20px',
          fontSize: 15,
          opacity: submitting ? 0.6 : canSubmit ? 1 : 0.85,
          cursor: submitting ? 'wait' : 'pointer',
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
