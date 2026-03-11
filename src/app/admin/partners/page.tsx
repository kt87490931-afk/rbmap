'use client'

import { useState, useEffect, useCallback } from 'react'

interface PartnerItem {
  id: string
  href: string
  icon: string
  region: string
  type: string
  name: string
  stars: string
  contact: string
  tags: string[]
  location: string
  desc: string
  sort_order: number
}

export default function AdminPartnersPage() {
  const [items, setItems] = useState<PartnerItem[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/partners')
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

  async function deleteItem(id: string, name: string) {
    if (!confirm(`"${name}" 제휴업체를 삭제하시겠습니까?`)) return
    const res = await fetch(`/api/admin/partners/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setItems((prev) => prev.filter((p) => p.id !== id))
      showMsg('삭제 완료!')
    }
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>로딩 중...</p>

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-title">제휴업체 관리</h1>
        <p className="admin-subtitle">메인 페이지 제휴업체 카드 관리</p>
      </div>

      {msg && (
        <div style={{ padding: '10px 16px', marginBottom: 14, borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'rgba(46,204,113,.1)', color: 'var(--green)', border: '1px solid rgba(46,204,113,.3)' }}>{msg}</div>
      )}

      <div className="card-box">
        <div className="card-box-title">📋 등록된 제휴업체</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>아이콘</th>
                <th>지역</th>
                <th>유형</th>
                <th>이름</th>
                <th>연락처</th>
                <th>링크</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td>{p.icon}</td>
                  <td>{p.region}</td>
                  <td>{p.type}</td>
                  <td>{p.name}</td>
                  <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.contact}</td>
                  <td><a href={p.href} target="_blank" rel="noreferrer" style={{ fontSize: 11 }}>{p.href.slice(0, 30)}...</a></td>
                  <td><button className="btn-danger" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => deleteItem(p.id, p.name)}>삭제</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length === 0 && <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 24 }}>등록된 제휴업체가 없습니다.</p>}
      </div>

      <div className="card-box">
        <div className="card-box-title">➕ 제휴업체 추가</div>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>제휴업체는 Supabase partners 테이블에 직접 INSERT 하거나, API 연동 후 폼을 추가할 수 있습니다.</p>
      </div>
    </>
  )
}
