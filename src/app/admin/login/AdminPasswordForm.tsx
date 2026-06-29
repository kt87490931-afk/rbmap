'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function AdminPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/password-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || '로그인에 실패했습니다.')
        return
      }
      const next = searchParams.get('callbackUrl') || '/admin'
      router.replace(next.startsWith('/admin') ? next : '/admin')
      router.refresh()
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 360, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>어드민 로그인</h1>
      <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
        비밀번호를 입력해 주세요.
      </p>
      {error && (
        <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 8, background: 'rgba(198,40,40,0.1)', color: '#c62828', fontSize: 13 }}>
          {error}
        </div>
      )}
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
        비밀번호
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          autoFocus
          required
          style={{
            display: 'block',
            width: '100%',
            marginTop: 6,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--card2)',
            color: 'var(--text)',
          }}
        />
      </label>
      <button type="submit" className="btn-save" disabled={loading} style={{ width: '100%', marginTop: 16 }}>
        {loading ? '확인 중…' : '로그인'}
      </button>
    </form>
  )
}
