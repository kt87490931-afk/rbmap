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

interface RegionItem {
  id: string
  slug: string
  name: string
}

const TYPE_OPTIONS = ['가라오케', '룸싸롱', '퍼블릭', '노래방', '바', '기타']

export default function AdminPartnersPage() {
  const [items, setItems] = useState<PartnerItem[]>([])
  const [regions, setRegions] = useState<RegionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'success' | 'error'>('success')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    href: '',
    region: '',
    type: '',
    name: '',
    icon: '🎤',
    contact: '',
    stars: '★★★★★',
    location: '',
    desc: '',
    tags: '',
  })

  const fetchItems = useCallback(async () => {
    try {
      const [partnersRes, regionsRes] = await Promise.all([
        fetch('/api/admin/partners', { credentials: 'include' }),
        fetch('/api/admin/regions', { credentials: 'include' }),
      ])
      const partnersData = await partnersRes.json()
      const regionsData = await regionsRes.json()
      setItems(Array.isArray(partnersData) ? partnersData : [])
      setRegions(Array.isArray(regionsData) ? regionsData : [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  function showMsg(text: string, type: 'success' | 'error' = 'success') {
    setMsgType(type)
    setMsg(text)
    setTimeout(() => setMsg(''), 4000)
  }

  async function addItem() {
    const regionVal = form.region.trim()
    if (!form.href?.trim() || !regionVal || !form.type?.trim() || !form.name?.trim()) {
      showMsg('링크, 지역, 유형, 이름을 모두 입력해 주세요.', 'error')
      return
    }
    setAdding(true)
    try {
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          href: form.href.trim(),
          region: regionVal,
          type: form.type.trim(),
          name: form.name.trim(),
          icon: form.icon || '🎤',
          contact: form.contact.trim() || '',
          stars: form.stars || '★★★★★',
          location: form.location.trim() || '',
          desc: form.desc.trim() || '',
          tags: form.tags ? form.tags.split(',').map((s) => s.trim()).filter(Boolean) : [],
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setItems((prev) => [...prev, data])
        setForm({ href: '', region: '', type: '', name: '', icon: '🎤', contact: '', stars: '★★★★★', location: '', desc: '', tags: '' })
        showMsg('추가 완료!')
      } else {
        const errMsg = data.error || (res.status === 403 ? 'OTP 인증이 필요합니다. OTP 인증 페이지에서 다시 인증해 주세요.' : '추가 실패')
        showMsg(errMsg, 'error')
      }
    } catch (e) {
      showMsg('네트워크 오류 또는 서버 연결 실패', 'error')
      console.error('[partners add]', e)
    }
    setAdding(false)
  }

  async function deleteItem(id: string, name: string) {
    if (!confirm(`"${name}" 제휴업체를 삭제하시겠습니까?`)) return
    try {
      const res = await fetch(`/api/admin/partners/${id}`, { method: 'DELETE', credentials: 'include' })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setItems((prev) => prev.filter((p) => p.id !== id))
        showMsg('삭제 완료!')
      } else {
        showMsg(data.error || (res.status === 403 ? 'OTP 인증이 필요합니다.' : '삭제 실패'), 'error')
      }
    } catch {
      showMsg('삭제 실패', 'error')
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
        <div
          style={{
            padding: '10px 16px',
            marginBottom: 14,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            background: msgType === 'error' ? 'rgba(255,71,87,.15)' : 'rgba(46,204,113,.1)',
            color: msgType === 'error' ? 'var(--red, #ff4757)' : 'var(--green)',
            border: msgType === 'error' ? '1px solid rgba(255,71,87,.3)' : '1px solid rgba(46,204,113,.3)',
          }}
        >
          {msg}
          {msgType === 'error' && msg.includes('OTP') && (
            <span style={{ marginLeft: 8 }}>
              <a href="/admin/verify-otp" style={{ color: 'inherit', textDecoration: 'underline' }}>OTP 인증하기 →</a>
            </span>
          )}
        </div>
      )}

      <div className="card-box" style={{ marginBottom: 16 }}>
        <div className="card-box-title">➕ 제휴업체 추가</div>
        <datalist id="partner-region-list">
          {regions.map((r) => (
            <option key={r.id} value={r.name} />
          ))}
        </datalist>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <input className="form-input" placeholder="링크 (예: https://...)" value={form.href} onChange={(e) => setForm((f) => ({ ...f, href: e.target.value }))} />
          <input className="form-input" list="partner-region-list" placeholder="지역 (예: 강남)" value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} />
          <select className="form-input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
            <option value="">유형 선택</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <input className="form-input" placeholder="업체명" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <input className="form-input" placeholder="아이콘 (예: 🎤)" value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} />
          <input className="form-input" placeholder="연락처" value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <input className="form-input" placeholder="별점 (예: ★★★★★)" value={form.stars} onChange={(e) => setForm((f) => ({ ...f, stars: e.target.value }))} />
          <input className="form-input" placeholder="위치/주소" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input className="form-input" style={{ flex: 1, minWidth: 200 }} placeholder="태그 (쉼표 구분)" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
          <input className="form-input" style={{ flex: 1, minWidth: 200 }} placeholder="설명 (선택)" value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))} />
          <button className="btn-save" onClick={addItem} disabled={adding}>추가</button>
        </div>
      </div>

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
        {items.length === 0 && <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 24 }}>등록된 제휴업체가 없습니다. 위 폼에서 추가해 보세요.</p>}
      </div>
    </>
  )
}
