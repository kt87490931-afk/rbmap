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
  const [toggling, setToggling] = useState<string | null>(null)

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

  async function togglePublic(item: IntroItem) {
    const next = !(item.is_public !== false)
    setToggling(item.id)
    try {
      const res = await fetch(`/api/admin/venues/intro/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: next }),
      })
      if (res.ok) {
        setItems((prev) =>
          prev.map((x) => (x.id === item.id ? { ...x, is_public: next } : x))
        )
        showMsg(next ? '공개로 변경되었습니다.' : '비공개로 변경되었습니다.')
      } else {
        const err = await res.json()
        alert(err.error || '변경 실패')
      }
    } catch (e) {
      alert(String(e))
    } finally {
      setToggling(null)
    }
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
        <p className="admin-subtitle">저장된 업체소개글 목록 · 공개/비공개 전환</p>
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
                <th>공개</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td style={{ maxWidth: 180 }}>{getName(r)}</td>
                  <td>{String(r.form_json?.region || '—')}</td>
                  <td>{String(r.form_json?.type || '—')}</td>
                  <td>{r.ai_tone === 'partner_pro' ? '파트너' : '전문가'}</td>
                  <td>{new Date(r.created_at).toLocaleDateString('ko-KR')}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => togglePublic(r)}
                      disabled={toggling === r.id}
                      style={{
                        padding: '4px 10px',
                        fontSize: 11,
                        borderRadius: 6,
                        background: r.is_public !== false ? 'rgba(46,204,113,0.2)' : 'rgba(255,99,71,0.2)',
                        color: r.is_public !== false ? 'var(--green)' : 'var(--red, #ff6347)',
                        border: '1px solid rgba(0,0,0,0.1)',
                        cursor: toggling === r.id ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {toggling === r.id ? '처리 중' : r.is_public !== false ? '공개' : '비공개'}
                    </button>
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
