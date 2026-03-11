'use client'

import { useState, useEffect, useCallback } from 'react'

interface ReviewItem {
  id: string
  href: string
  region: string
  date: string
  is_new: boolean
  title: string
  excerpt: string
  stars: string
  venue: string
  sort_order: number
}

export default function AdminReviewsPage() {
  const [items, setItems] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/reviews')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  function showMsg(text: string) {
    setMsg(text)
    setTimeout(() => setMsg(''), 3000)
  }

  async function deleteItem(id: string, title: string) {
    if (!confirm(`"${title.slice(0, 30)}..." 리뷰를 삭제하시겠습니까?`)) return
    const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setItems((prev) => prev.filter((r) => r.id !== id))
      showMsg('삭제 완료!')
    }
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>로딩 중...</p>

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-title">리뷰 관리</h1>
        <p className="admin-subtitle">최신 리뷰 섹션 관리</p>
      </div>

      {msg && (
        <div style={{ padding: '10px 16px', marginBottom: 14, borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'rgba(46,204,113,.1)', color: 'var(--green)', border: '1px solid rgba(46,204,113,.3)' }}>{msg}</div>
      )}

      <div className="card-box">
        <div className="card-box-title">📋 등록된 리뷰</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>지역</th>
                <th>날짜</th>
                <th>제목</th>
                <th>업소</th>
                <th>NEW</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td>{r.region}</td>
                  <td>{r.date}</td>
                  <td style={{ maxWidth: 220 }}>{r.title}</td>
                  <td>{r.venue}</td>
                  <td>{r.is_new ? 'Y' : '-'}</td>
                  <td><button className="btn-danger" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => deleteItem(r.id, r.title)}>삭제</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length === 0 && <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 24 }}>등록된 리뷰가 없습니다.</p>}
      </div>
    </>
  )
}
