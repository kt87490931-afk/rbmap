'use client'

import { useState, useEffect, useCallback } from 'react'
import { buildPartnerHrefFromParts, parseUrlSuffixFromHref } from '@/lib/partner-url'
import { SLUG_TO_TYPE } from '@/lib/data/venues'

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

/** 유형선택: 한글(label) → slug 매핑 */
const TYPE_OPTIONS = [
  { label: '가라오케', slug: 'karaoke' },
  { label: '룸싸롱', slug: 'room-salon' },
  { label: '퍼블릭', slug: 'public' },
  { label: '노래방', slug: 'karaoke' },
  { label: '바', slug: 'bar' },
  { label: '하이퍼블릭', slug: 'highpublic' },
  { label: '셔츠룸', slug: 'shirtroom' },
  { label: '쩜오', slug: 'jjomoh' },
  { label: '기타', slug: 'karaoke' },
]

export default function AdminPartnersPage() {
  const [items, setItems] = useState<PartnerItem[]>([])
  const [regions, setRegions] = useState<RegionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'success' | 'error'>('success')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    regionSlug: '',
    type: '',
    urlSuffix: '',
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

  function getHref(): string {
    return buildPartnerHrefFromParts(form.regionSlug, form.type, form.urlSuffix)
  }

  function getRegionName(): string {
    return regions.find((r) => r.slug === form.regionSlug)?.name ?? form.regionSlug
  }

  async function addItem() {
    const regionSlug = form.regionSlug.trim()
    const typeVal = form.type.trim()
    const nameVal = form.name.trim()
    const urlSuffix = form.urlSuffix.trim()
    if (!regionSlug || !typeVal || !nameVal) {
      showMsg('지역, 유형, 업체명을 선택/입력해 주세요.', 'error')
      return
    }
    if (!urlSuffix) {
      showMsg('URL 뒷부분을 입력해 주세요. (예: dongtan-choigga)', 'error')
      return
    }
    const href = getHref()
    setAdding(true)
    try {
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          href,
          region: getRegionName(),
          type: typeVal,
          name: nameVal,
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
        setForm({ regionSlug: '', type: '', urlSuffix: '', name: '', icon: '🎤', contact: '', stars: '★★★★★', location: '', desc: '', tags: '' })
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

  async function updateItem(id: string, field: string, value: unknown) {
    const item = items.find((p) => p.id === id)
    if (!item) return
    const payload = { ...item, [field]: value }
    try {
      const res = await fetch(`/api/admin/partners/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setItems((prev) => prev.map((p) => (p.id === id ? data : p)))
        if (editingId === id) setEditingId(null)
        showMsg('저장 완료!')
      } else {
        showMsg(data.error || (res.status === 403 ? 'OTP 인증이 필요합니다.' : '저장 실패'), 'error')
      }
    } catch {
      showMsg('저장 실패', 'error')
    }
  }

  function startEdit(item: PartnerItem) {
    const parts = (item.href || '').replace(/\/$/, '').split('/').filter(Boolean)
    const regionSlug = parts[0] ?? regions.find((r) => r.name === item.region)?.slug ?? ''
    const categorySlug = parts[1] ?? ''
    const typeLabel = SLUG_TO_TYPE[categorySlug] || item.type
    const urlSuffix = parts[2] ?? parseUrlSuffixFromHref(item.href)
    setForm({
      regionSlug,
      type: typeLabel,
      urlSuffix,
      name: item.name || '',
      icon: item.icon || '🎤',
      contact: item.contact || '',
      stars: item.stars || '★★★★★',
      location: item.location || '',
      desc: item.desc || '',
      tags: (item.tags || []).join(', '),
    })
    setEditingId(item.id)
  }

  async function saveEdit() {
    if (!editingId) return
    const regionSlug = form.regionSlug.trim()
    const typeVal = form.type.trim()
    const nameVal = form.name.trim()
    const urlSuffix = form.urlSuffix.trim()
    if (!regionSlug || !typeVal || !nameVal) {
      showMsg('지역, 유형, 업체명은 필수입니다.', 'error')
      return
    }
    if (!urlSuffix) {
      showMsg('URL 뒷부분을 입력해 주세요.', 'error')
      return
    }
    const item = items.find((p) => p.id === editingId)
    if (!item) return
    const href = getHref()
    const payload = {
      ...item,
      href,
      region: getRegionName(),
      type: typeVal,
      name: nameVal,
      icon: form.icon || '🎤',
      contact: form.contact.trim() || '',
      stars: form.stars || '★★★★★',
      location: form.location.trim() || '',
      desc: form.desc.trim() || '',
      tags: form.tags ? form.tags.split(',').map((s) => s.trim()).filter(Boolean) : [],
    }
    try {
      const res = await fetch(`/api/admin/partners/${editingId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setItems((prev) => prev.map((p) => (p.id === editingId ? data : p)))
        setEditingId(null)
        setForm({ regionSlug: '', type: '', urlSuffix: '', name: '', icon: '🎤', contact: '', stars: '★★★★★', location: '', desc: '', tags: '' })
        showMsg('수정 완료!')
      } else {
        showMsg(data.error || '수정 실패', 'error')
      }
    } catch {
      showMsg('수정 실패', 'error')
    }
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
        <div className="card-box-title">{editingId ? '✏️ 제휴업체 수정' : '➕ 제휴업체 추가'}</div>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
          <strong>URL 자동생성</strong>: 지역·유형 선택 후 <strong>뒷부분만</strong> 입력하세요. → rbbmap.com/<em>지역</em>/<em>종목</em>/<strong>뒷부분</strong>
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <select className="form-input" value={form.regionSlug} onChange={(e) => setForm((f) => ({ ...f, regionSlug: e.target.value }))}>
            <option value="">지역 선택</option>
            {regions.map((r) => (
              <option key={r.id} value={r.slug}>{r.name} ({r.slug})</option>
            ))}
          </select>
          <select className="form-input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
            <option value="">유형 선택</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t.slug + t.label} value={t.label}>{t.label} ({t.slug})</option>
            ))}
          </select>
          <input className="form-input" placeholder="URL 뒷부분 (예: dongtan-choigga)" value={form.urlSuffix} onChange={(e) => setForm((f) => ({ ...f, urlSuffix: e.target.value }))} title="여기만 입력하세요" />
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
          {editingId ? (
            <>
              <button className="btn-save" onClick={saveEdit} disabled={adding}>수정 저장</button>
              <button className="btn-ghost" style={{ padding: '8px 14px' }} onClick={() => { setEditingId(null); setForm({ regionSlug: '', type: '', urlSuffix: '', name: '', icon: '🎤', contact: '', stars: '★★★★★', location: '', desc: '', tags: '' }) }}>취소</button>
            </>
          ) : (
            <button className="btn-save" onClick={addItem} disabled={adding}>추가</button>
          )}
        </div>
        {form.regionSlug && form.type && form.urlSuffix && (
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>→ 생성 링크: {getHref()}</p>
        )}
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
                  <td style={{ fontSize: 11, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }} title={p.href}>
                    {p.href?.startsWith('/') ? (
                      <a href={p.href} target="_blank" rel="noreferrer">{p.href}</a>
                    ) : (
                      <span style={{ color: 'var(--red)' }}>{p.href || '(잘못된 링크)'}</span>
                    )}
                  </td>
                  <td>
                    <button className="btn-save" style={{ padding: '4px 8px', fontSize: 11, marginRight: 4 }} onClick={() => startEdit(p)}>수정</button>
                    <button className="btn-danger" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => deleteItem(p.id, p.name)}>삭제</button>
                  </td>
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
