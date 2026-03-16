'use client'

import { useState, useEffect, useCallback } from 'react'

interface RegionItem {
  id: string
  slug: string
  name: string
  short: string
  thumb_class: string
  tags: string[]
  venues: number
  reviews: number
  badge: string | null
  coming: boolean
  sort_order: number
  map_x?: number | null
  map_y?: number | null
}

const THUMB_CLASS_OPTIONS: { value: string; label: string }[] = [
  { value: 'default', label: '기본 (신규 지역용)' },
  { value: 'gangnam', label: '강남 스타일' },
  { value: 'suwon', label: '수원 스타일' },
  { value: 'dongtan', label: '동탄 스타일' },
  { value: 'jeju', label: '제주 스타일' },
  { value: 'incheon', label: '인천 스타일' },
  { value: 'busan', label: '부산 스타일' },
]

export default function AdminRegionsPage() {
  const [items, setItems] = useState<RegionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'success' | 'error'>('success')
  const [adding, setAdding] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [form, setForm] = useState({ slug: '', name: '', short: '', thumb_class: 'default', tags: '', venues: 0, reviews: 0, badge: '', coming: false, map_x: '', map_y: '' })
  const [editingTags, setEditingTags] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState<Record<string, Partial<RegionItem>>>({})

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/regions', { credentials: 'include' })
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
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
    if (!form.slug?.trim() || !form.name?.trim() || !form.short?.trim()) {
      showMsg('slug, 이름, short를 모두 입력해 주세요.', 'error')
      return
    }
    const slug = form.slug.trim().toLowerCase().replace(/\s+/g, '-')
    setAdding(true)
    try {
      const res = await fetch('/api/admin/regions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          slug,
          name: form.name.trim(),
          short: form.short.trim(),
          badge: form.badge && form.badge !== '' ? form.badge : null,
          tags: form.tags ? form.tags.split(',').map((s) => s.trim()).filter(Boolean) : [],
          map_x: form.map_x ? Number(form.map_x) : null,
          map_y: form.map_y ? Number(form.map_y) : null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setItems((prev) => [...prev, data])
        setForm({ slug: '', name: '', short: '', thumb_class: 'default', tags: '', venues: 0, reviews: 0, badge: '', coming: false, map_x: '', map_y: '' })
        showMsg('추가 완료!')
      } else {
        const errMsg = data.error || (res.status === 403 ? 'OTP 인증이 필요합니다. OTP 인증 페이지에서 다시 인증해 주세요.' : '추가 실패')
        showMsg(errMsg, 'error')
      }
    } catch (e) {
      showMsg('네트워크 오류 또는 서버 연결 실패', 'error')
      console.error('[regions add]', e)
    }
    setAdding(false)
  }

  async function updateItem(id: string, field: string, value: unknown) {
    const item = items.find((r) => r.id === id)
    if (!item) return
    const payload = { ...item, [field]: value }
    try {
      const res = await fetch(`/api/admin/regions/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setItems((prev) => prev.map((r) => (r.id === id ? data : r)))
        showMsg('저장 완료!')
      } else {
        showMsg(data.error || (res.status === 403 ? 'OTP 인증이 필요합니다.' : '저장 실패'), 'error')
      }
    } catch {
      showMsg('저장 실패', 'error')
    }
  }

  /** 해당 행의 수정 중인 값(이름·short·태그·map 등)을 한 번에 저장 */
  async function saveRow(id: string) {
    const item = items.find((r) => r.id === id)
    if (!item) return
    const edit = editing[id]
    const tagsStr = editingTags[id]
    const tags =
      tagsStr !== undefined
        ? tagsStr.split(',').map((s) => s.trim()).filter(Boolean)
        : item.tags ?? []
    const payload: RegionItem = {
      ...item,
      ...edit,
      tags,
    }
    setSavingId(id)
    try {
      const res = await fetch(`/api/admin/regions/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setItems((prev) => prev.map((r) => (r.id === id ? data : r)))
        setEditing((p) => { const n = { ...p }; delete n[id]; return n })
        setEditingTags((p) => { const n = { ...p }; delete n[id]; return n })
        showMsg('저장 완료!')
      } else {
        showMsg(data.error || (res.status === 403 ? 'OTP 인증이 필요합니다.' : '저장 실패'), 'error')
      }
    } catch {
      showMsg('저장 실패', 'error')
    }
    setSavingId(null)
  }

  async function deleteItem(id: string, name: string) {
    if (!confirm(`"${name}" 지역을 삭제하시겠습니까?`)) return
    try {
      const res = await fetch(`/api/admin/regions/${id}`, { method: 'DELETE', credentials: 'include' })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setItems((prev) => prev.filter((r) => r.id !== id))
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
        <h1 className="admin-title">지역 관리</h1>
        <p className="admin-subtitle">메인 페이지 지역 카드 관리</p>
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
        <div className="card-box-title">➕ 지역 추가</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <input className="form-input" placeholder="slug (예: gangnam)" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
          <input className="form-input" placeholder="이름" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <input className="form-input" placeholder="short (예: GN)" value={form.short} onChange={(e) => setForm((f) => ({ ...f, short: e.target.value }))} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>카드 스타일</label>
            <select className="form-input" value={form.thumb_class} onChange={(e) => setForm((f) => ({ ...f, thumb_class: e.target.value }))}>
              {THUMB_CLASS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <input className="form-input" type="number" placeholder="업소 수" value={form.venues || ''} onChange={(e) => setForm((f) => ({ ...f, venues: parseInt(e.target.value, 10) || 0 }))} />
          <input className="form-input" type="number" placeholder="리뷰 수" value={form.reviews || ''} onChange={(e) => setForm((f) => ({ ...f, reviews: parseInt(e.target.value, 10) || 0 }))} />
          <select className="form-input" value={form.badge} onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value || '' }))}>
            <option value="">없음</option>
            <option value="HOT">HOT</option>
            <option value="NEW">NEW</option>
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>지도 X좌표 (SVG 340 기준)</label>
            <input className="form-input" type="number" placeholder="map_x (예: 192)" value={form.map_x || ''} onChange={(e) => setForm((f) => ({ ...f, map_x: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>지도 Y좌표 (SVG 460 기준)</label>
            <input className="form-input" type="number" placeholder="map_y (예: 118)" value={form.map_y || ''} onChange={(e) => setForm((f) => ({ ...f, map_y: e.target.value }))} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input className="form-input" style={{ flex: 1, minWidth: 200 }} placeholder="태그 (쉼표 구분)" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <input type="checkbox" checked={form.coming} onChange={(e) => setForm((f) => ({ ...f, coming: e.target.checked }))} />
            준비중
          </label>
          <button className="btn-save" onClick={addItem} disabled={adding}>추가</button>
        </div>
      </div>

      <div className="card-box">
        <div className="card-box-title">📋 등록된 지역</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>slug</th>
                <th>이름</th>
                <th>short</th>
                <th>map_x</th>
                <th>map_y</th>
                <th>태그</th>
                <th>업소</th>
                <th>리뷰</th>
                <th>badge</th>
                <th>준비중</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td><input className="form-input" style={{ width: 90, padding: 6 }} value={editing[r.id]?.slug ?? r.slug} onChange={(e) => setEditing((p) => ({ ...p, [r.id]: { ...p[r.id], slug: e.target.value } }))} onBlur={(e) => { updateItem(r.id, 'slug', e.target.value); setEditing((p) => { const n = { ...p }; delete n[r.id]; return n }) }} /></td>
                  <td><input className="form-input" style={{ width: 70, padding: 6 }} value={editing[r.id]?.name ?? r.name} onChange={(e) => setEditing((p) => ({ ...p, [r.id]: { ...p[r.id], name: e.target.value } }))} onBlur={(e) => { updateItem(r.id, 'name', e.target.value); setEditing((p) => { const n = { ...p }; delete n[r.id]; return n }) }} /></td>
                  <td><input className="form-input" style={{ width: 50, padding: 6 }} value={editing[r.id]?.short ?? r.short} onChange={(e) => setEditing((p) => ({ ...p, [r.id]: { ...p[r.id], short: e.target.value } }))} onBlur={(e) => { updateItem(r.id, 'short', e.target.value); setEditing((p) => { const n = { ...p }; delete n[r.id]; return n }) }} /></td>
                  <td><input className="form-input" type="number" style={{ width: 56, padding: 6 }} value={editing[r.id]?.map_x ?? r.map_x ?? ''} onChange={(e) => setEditing((p) => ({ ...p, [r.id]: { ...p[r.id], map_x: e.target.value === '' ? null : parseInt(e.target.value, 10) } }))} onBlur={(e) => { const v = e.target.value; updateItem(r.id, 'map_x', v === '' ? null : parseInt(v, 10)); setEditing((p) => { const n = { ...p }; delete n[r.id]; return n }) }} placeholder="x" /></td>
                  <td><input className="form-input" type="number" style={{ width: 56, padding: 6 }} value={editing[r.id]?.map_y ?? r.map_y ?? ''} onChange={(e) => setEditing((p) => ({ ...p, [r.id]: { ...p[r.id], map_y: e.target.value === '' ? null : parseInt(e.target.value, 10) } }))} onBlur={(e) => { const v = e.target.value; updateItem(r.id, 'map_y', v === '' ? null : parseInt(v, 10)); setEditing((p) => { const n = { ...p }; delete n[r.id]; return n }) }} placeholder="y" /></td>
                  <td>
                    <input
                      className="form-input"
                      style={{ width: 120, padding: 6 }}
                      value={editingTags[r.id] ?? (r.tags || []).join(', ')}
                      onChange={(e) => setEditingTags((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      onFocus={(e) => setEditingTags((prev) => ({ ...prev, [r.id]: (r.tags || []).join(', ') }))}
                    />
                  </td>
                  <td><input className="form-input" type="number" style={{ width: 60, padding: 6 }} value={editing[r.id]?.venues ?? r.venues} onChange={(e) => setEditing((p) => ({ ...p, [r.id]: { ...p[r.id], venues: parseInt(e.target.value, 10) || 0 } }))} onBlur={(e) => { updateItem(r.id, 'venues', parseInt(e.target.value, 10) || 0); setEditing((p) => { const n = { ...p }; delete n[r.id]; return n }) }} /></td>
                  <td><input className="form-input" type="number" style={{ width: 60, padding: 6 }} value={editing[r.id]?.reviews ?? r.reviews} onChange={(e) => setEditing((p) => ({ ...p, [r.id]: { ...p[r.id], reviews: parseInt(e.target.value, 10) || 0 } }))} onBlur={(e) => { updateItem(r.id, 'reviews', parseInt(e.target.value, 10) || 0); setEditing((p) => { const n = { ...p }; delete n[r.id]; return n }) }} /></td>
                  <td>
                    <select className="form-input" style={{ width: 70, padding: 6 }} value={r.badge || ''} onChange={(e) => updateItem(r.id, 'badge', e.target.value || null)}>
                      <option value="">없음</option>
                      <option value="HOT">HOT</option>
                      <option value="NEW">NEW</option>
                    </select>
                  </td>
                  <td><input type="checkbox" checked={!!r.coming} onChange={(e) => updateItem(r.id, 'coming', e.target.checked)} /></td>
                  <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button className="btn-save" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => saveRow(r.id)} disabled={savingId === r.id}>{savingId === r.id ? '저장 중…' : '저장'}</button>
                    <button className="btn-danger" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => deleteItem(r.id, r.name)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length === 0 && <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 24 }}>등록된 지역이 없습니다. Supabase에 supabase-sections.sql을 실행했는지 확인하세요.</p>}
      </div>
    </>
  )
}
