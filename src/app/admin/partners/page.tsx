'use client'

import { useState, useEffect, useCallback } from 'react'
import { buildPartnerHrefFromParts, parseUrlSuffixFromHref } from '@/lib/partner-url'
import { SLUG_TO_TYPE } from '@/lib/data/venues'
import { REVIEW_SCHEDULE_PRESETS, type ReviewSchedulePresetId } from '@/lib/review-schedule'

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
  period_days?: number
  period_end?: string
  is_active?: boolean
  review_schedule_preset?: string
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
    period_days: 30,
    is_active: true,
    review_schedule_preset: '8h_3' as ReviewSchedulePresetId,
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
          period_days: form.period_days || 30,
          is_active: form.is_active !== false,
          review_schedule_preset: form.review_schedule_preset || '8h_3',
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setItems((prev) => [...prev, data])
        setForm({ regionSlug: '', type: '', urlSuffix: '', name: '', icon: '🎤', contact: '', stars: '★★★★★', location: '', desc: '', tags: '', period_days: 30, is_active: true, review_schedule_preset: '8h_3' })
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
    const preset = (item.review_schedule_preset && (REVIEW_SCHEDULE_PRESETS as Record<string, unknown>)[item.review_schedule_preset]) ? item.review_schedule_preset : '8h_3'
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
      period_days: item.period_days ?? 30,
      is_active: item.is_active !== false,
      review_schedule_preset: preset as ReviewSchedulePresetId,
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
      period_days: form.period_days || 30,
      is_active: form.is_active !== false,
      review_schedule_preset: form.review_schedule_preset || '8h_3',
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
        setForm({ regionSlug: '', type: '', urlSuffix: '', name: '', icon: '🎤', contact: '', stars: '★★★★★', location: '', desc: '', tags: '', period_days: 30, is_active: true, review_schedule_preset: '8h_3' })
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <select className="form-input" value={form.period_days} onChange={(e) => setForm((f) => ({ ...f, period_days: Number(e.target.value) }))} title="제휴 기간">
            <option value={30}>30일</option>
            <option value={60}>60일</option>
            <option value={90}>90일</option>
          </select>
          <select className="form-input" value={form.review_schedule_preset} onChange={(e) => setForm((f) => ({ ...f, review_schedule_preset: e.target.value as ReviewSchedulePresetId }))} title="리뷰 자동생성 스케줄 (24시간 기준)">
            {(Object.keys(REVIEW_SCHEDULE_PRESETS) as ReviewSchedulePresetId[]).map((id) => (
              <option key={id} value={id}>{REVIEW_SCHEDULE_PRESETS[id].label}</option>
            ))}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
            활성화 (비활성 시 리뷰 생성 제외)
          </label>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input className="form-input" style={{ flex: 1, minWidth: 200 }} placeholder="태그 (쉼표 구분)" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
          <input className="form-input" style={{ flex: 1, minWidth: 200 }} placeholder="설명 (선택)" value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))} />
          {editingId ? (
            <>
              <button className="btn-save" onClick={saveEdit} disabled={adding}>수정 저장</button>
              <button className="btn-ghost" style={{ padding: '8px 14px' }} onClick={() => { setEditingId(null); setForm({ regionSlug: '', type: '', urlSuffix: '', name: '', icon: '🎤', contact: '', stars: '★★★★★', location: '', desc: '', tags: '', period_days: 30, is_active: true, review_schedule_preset: '8h_3' }) }}>취소</button>
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
        <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>
          리뷰 자동 생성 크론은 <strong>활성화</strong>된 제휴업체만 조회합니다. 크론헬스/리뷰관리에서 「제휴 N개」가 예상보다 적다면 아래에서 활성 여부를 확인하세요.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>아이콘</th>
                <th>지역</th>
                <th>유형</th>
                <th>이름</th>
                <th>연락처</th>
                <th>기간</th>
                <th>리뷰 스케줄</th>
                <th>활성</th>
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
                  <td style={{ fontSize: 11, whiteSpace: 'nowrap' }} title={`만료: ${p.period_end ?? '-'}`}>{p.period_days ?? 30}일{p.period_end ? ` (~${p.period_end})` : ''}</td>
                  <td style={{ fontSize: 11 }}>
                    {p.review_schedule_preset && REVIEW_SCHEDULE_PRESETS[p.review_schedule_preset as ReviewSchedulePresetId]
                      ? REVIEW_SCHEDULE_PRESETS[p.review_schedule_preset as ReviewSchedulePresetId].label
                      : REVIEW_SCHEDULE_PRESETS['8h_3'].label}
                  </td>
                  <td>
                    <button
                      className={p.is_active !== false ? 'btn-save' : 'btn-ghost'}
                      style={{ padding: '4px 8px', fontSize: 11 }}
                      onClick={() => updateItem(p.id, 'is_active', !(p.is_active !== false))}
                      title={p.is_active !== false ? '활성 (클릭 시 비활성)' : '비활성 (클릭 시 활성)'}
                    >
                      {p.is_active !== false ? '활성' : '비활성'}
                    </button>
                  </td>
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
