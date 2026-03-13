'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { REGION_SLUG_TO_NAME } from '@/lib/data/venues'
import { REVIEW_TYPE_TO_NAME } from '@/lib/data/review-posts'

interface ReviewItem {
  id: string
  region: string
  type: string
  venue: string
  venue_slug: string
  slug: string
  title: string
  published_at: string | null
  created_at: string
  star: number
  status: string
  is_ai_written: boolean
  sec_overview?: string
}

export default function AdminReviewsPage() {
  const [items, setItems] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/reviews', { credentials: 'include' })
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch { setItems([]) }
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
        <p className="admin-subtitle">생성된 리뷰 (review_posts) · AI 생성 · 수동 작성</p>
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
                <th>업종</th>
                <th>업소</th>
                <th>제목</th>
                <th>날짜</th>
                <th>AI</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => {
                const reviewUrl = `/${r.region}/${r.type}/${r.venue_slug}/${r.slug}`
                const dateStr = r.published_at || r.created_at
                const dateFormatted = dateStr
                  ? new Date(dateStr).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                  : '-'
                return (
                  <tr key={r.id}>
                    <td>{REGION_SLUG_TO_NAME[r.region] ?? r.region}</td>
                    <td>{REVIEW_TYPE_TO_NAME[r.type] ?? r.type}</td>
                    <td>{r.venue}</td>
                    <td style={{ maxWidth: 220 }}>
                      <Link href={reviewUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--gold)', textDecoration: 'underline' }}>
                        {r.title}
                      </Link>
                    </td>
                    <td style={{ fontSize: 12 }}>{dateFormatted}</td>
                    <td>{r.is_ai_written ? 'Y' : '-'}</td>
                    <td>
                      <button className="btn-danger" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => deleteItem(r.id, r.title)}>삭제</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {items.length === 0 && <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 24 }}>등록된 리뷰가 없습니다.</p>}
      </div>
    </>
  )
}
