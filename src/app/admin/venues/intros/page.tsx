'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface IntroItem {
  id: string
  form_json: { name?: string; region?: string; type?: string }
  ai_tone: string
  period_days: number
  intro_ai_json?: { content?: string }
  is_public?: boolean
  created_at: string
}

export default function AdminVenueIntrosPage() {
  const [items, setItems] = useState<IntroItem[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/venues/intro')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  function showMsg(text: string) {
    setMsg(text)
    setTimeout(() => setMsg(''), 3000)
  }

  async function deleteItem(id: string, title: string) {
    if (!confirm(`"${title}" 소개글을 삭제하시겠습니까?`)) return
    const res = await fetch(`/api/admin/venues/intro/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setItems((prev) => prev.filter((r) => r.id !== id))
      showMsg('삭제 완료')
    } else {
      const err = await res.json()
      alert(err.error || '삭제 실패')
    }
  }

  const getName = (x: IntroItem) =>
    (x.form_json?.name as string) || '제목없음'

  if (loading) return <p style={{ color: 'var(--muted)' }}>로딩 중...</p>

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-title">업체소개글 관리</h1>
        <p className="admin-subtitle">저장된 업체소개글 목록 (공개/비공개는 DB 마이그레이션 후 사용)</p>
      </div>

      {msg && (
        <div
          style={{
            padding: '10px 16px',
            marginBottom: 14,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            background: 'rgba(46,204,113,.1)',
            color: 'var(--green)',
            border: '1px solid rgba(46,204,113,.3)',
          }}
        >
          {msg}
        </div>
      )}

      <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link
          href="/admin/venues/intro"
          className="btn-save"
          style={{ padding: '8px 16px', textDecoration: 'none', fontSize: 14 }}
        >
          📝 새 소개글 작성
        </Link>
        <button
          type="button"
          onClick={() => {
            setLoading(true)
            fetchItems()
          }}
          style={{ fontSize: 13, padding: '8px 12px' }}
        >
          새로고침
        </button>
      </div>

      <div className="card-box">
        <div className="card-box-title">📋 저장된 업체소개글</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>업소명</th>
                <th>지역</th>
                <th>업종</th>
                <th>톤</th>
                <th>생성일</th>
                <th style={{ minWidth: 320 }}>AI 작성글</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td style={{ maxWidth: 120 }}>{getName(r)}</td>
                  <td>{String(r.form_json?.region || '—')}</td>
                  <td>{String(r.form_json?.type || '—')}</td>
                  <td>{r.ai_tone === 'partner_pro' ? '파트너' : '전문가'}</td>
                  <td>{new Date(r.created_at).toLocaleDateString('ko-KR')}</td>
                  <td>
                    <div
                      style={{
                        maxWidth: 400,
                        maxHeight: 160,
                        overflowY: 'auto',
                        fontSize: 12,
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        padding: 8,
                        background: 'var(--bg)',
                        borderRadius: 6,
                        color: 'var(--text)',
                      }}
                    >
                      {r.intro_ai_json?.content || (
                        <span style={{ color: 'var(--muted)' }}>— AI 작성글이 없습니다 (임시저장 시 AI 생성 후 저장 필요) —</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <Link
                      href={`/admin/venues/intro?load=${r.id}`}
                      style={{ marginRight: 8, fontSize: 12 }}
                    >
                      수정
                    </Link>
                    <button
                      type="button"
                      className="btn-danger"
                      style={{ padding: '4px 10px', fontSize: 11 }}
                      onClick={() => deleteItem(r.id, getName(r))}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length === 0 && (
          <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 24 }}>
            저장된 업체소개글이 없습니다. 업체소개글 작성에서 생성 후 임시저장해 주세요.
          </p>
        )}
      </div>
    </>
  )
}
