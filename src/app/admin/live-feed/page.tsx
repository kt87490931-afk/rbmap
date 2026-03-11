'use client'

import { useState, useEffect, useCallback } from 'react'

interface FeedItem {
  id: string
  href: string
  pill: string
  pill_class: string
  title: string
  sub: string
  stars: string
  time: string
  sort_order: number
}

export default function AdminLiveFeedPage() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/feed')
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
    if (!confirm(`"${title.slice(0, 30)}..." 항목을 삭제하시겠습니까?`)) return
    const res = await fetch(`/api/admin/feed/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setItems((prev) => prev.filter((f) => f.id !== id))
      showMsg('삭제 완료!')
    }
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>로딩 중...</p>

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-title">Live Feed 관리</h1>
        <p className="admin-subtitle">실시간 최신 업데이트 피드 관리</p>
      </div>

      {msg && (
        <div style={{ padding: '10px 16px', marginBottom: 14, borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'rgba(46,204,113,.1)', color: 'var(--green)', border: '1px solid rgba(46,204,113,.3)' }}>{msg}</div>
      )}

      <div className="card-box">
        <div className="card-box-title">📋 등록된 피드</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>지역</th>
                <th>제목</th>
                <th>부제</th>
                <th>시간</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {items.map((f) => (
                <tr key={f.id}>
                  <td><span className={`feed-pill ${f.pill_class}`}>{f.pill}</span></td>
                  <td style={{ maxWidth: 240 }}>{f.title}</td>
                  <td style={{ maxWidth: 180, fontSize: 11 }}>{f.sub}</td>
                  <td>{f.time}</td>
                  <td><button className="btn-danger" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => deleteItem(f.id, f.title)}>삭제</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length === 0 && <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 24 }}>등록된 피드가 없습니다.</p>}
      </div>
    </>
  )
}
