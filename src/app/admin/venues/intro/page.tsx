'use client'

import { useState, useEffect, useCallback } from 'react'

const TYPE_OPTIONS = [
  { value: 'karaoke', label: '가라오케' },
  { value: 'highpublic', label: '하이퍼블릭' },
  { value: 'shirtsroom', label: '셔츠룸' },
  { value: 'public', label: '퍼블릭' },
  { value: 'jjomoh', label: '쩜오' },
]

const REGION_OPTIONS = [
  { value: 'gangnam', label: '강남' },
  { value: 'suwon', label: '수원' },
  { value: 'dongtan', label: '동탄' },
  { value: 'jeju', label: '제주' },
]

interface PartnerOption {
  id: string
  name: string
  region: string
  type: string
}

export default function AdminVenueIntroPage() {
  const [partners, setPartners] = useState<PartnerOption[]>([])
  const [selectedPartnerId, setSelectedPartnerId] = useState('')

  const [name, setName] = useState('')
  const [region, setRegion] = useState('')
  const [type, setType] = useState('')
  const [contact, setContact] = useState('')
  const [location, setLocation] = useState('')
  const [locationDesc, setLocationDesc] = useState('')
  const [facilityEnv, setFacilityEnv] = useState('')
  const [benefits, setBenefits] = useState('')
  const [qualify, setQualify] = useState('')
  const [extra, setExtra] = useState('')

  const [aiTone, setAiTone] = useState<'pro' | 'partner_pro'>('pro')
  const [periodDays, setPeriodDays] = useState(30)

  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchPartners = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/partners')
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      setPartners(list.map((p: { id: string; name: string; region: string; type: string }) => ({
        id: p.id,
        name: p.name || '',
        region: p.region || '',
        type: p.type || '',
      })))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchPartners()
  }, [fetchPartners])

  useEffect(() => {
    if (!selectedPartnerId) return
    const p = partners.find((x) => x.id === selectedPartnerId)
    if (p) {
      setName(p.name)
      setRegion(p.region)
      setType(p.type)
    }
  }, [selectedPartnerId, partners])

  function showMsg(text: string) {
    setMsg(text)
    setTimeout(() => setMsg(''), 3000)
  }

  const formData = {
    name,
    region,
    type,
    contact,
    location,
    location_desc: locationDesc,
    facility_env: facilityEnv,
    benefits,
    qualify,
    extra,
  }

  const handleSaveDraft = async () => {
    if (!name.trim()) {
      alert('업소명을 입력해주세요.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/venues/intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_id: selectedPartnerId || null,
          form: formData,
          ai_tone: aiTone,
          period_days: periodDays,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '저장 실패')
      showMsg('임시저장 되었습니다.')
    } catch (e) {
      alert(String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-title">업체소개글 작성</h1>
        <p className="admin-subtitle">양식 작성 후 AI 종합정리를 확인하고, AI 소개글 생성에 활용됩니다</p>
      </div>

      {msg && (
        <div style={{
          padding: '10px 16px', marginBottom: 14, borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: 'rgba(46,204,113,.1)', color: 'var(--green)', border: '1px solid rgba(46,204,113,.3)',
        }}>{msg}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* 왼쪽: 양식 */}
        <div className="card-box">
          <div className="card-box-title">📋 업체 기본 정보</div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label">업체 선택 (기존 제휴업체)</label>
            <select
              className="form-input"
              value={selectedPartnerId}
              onChange={(e) => setSelectedPartnerId(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">— 새 업체로 직접 입력 —</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>{p.region} · {p.name} ({p.type})</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label">업소명 *</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 달토 가라오케"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label className="form-label">지역</label>
              <select
                className="form-input"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">— 선택 —</option>
                {REGION_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">업종</label>
              <select
                className="form-input"
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">— 선택 —</option>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label">연락처</label>
            <input
              type="text"
              className="form-input"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="010-0000-0000"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label">주소/위치</label>
            <input
              type="text"
              className="form-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="예: 서울 강남구 역삼동"
              style={{ width: '100%' }}
            />
          </div>

          <div className="card-box-title" style={{ marginTop: 24, marginBottom: 12 }}>📝 상세 설명 (10자 이상 권장)</div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label">업소 위치 및 업소 소개</label>
            <textarea
              className="form-input"
              value={locationDesc}
              onChange={(e) => setLocationDesc(e.target.value)}
              placeholder="위치, 교통, 주변 환경 등을 입력"
              rows={3}
              style={{ width: '100%', resize: 'vertical' }}
            />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{locationDesc.length}자</span>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label">시설/환경</label>
            <textarea
              className="form-input"
              value={facilityEnv}
              onChange={(e) => setFacilityEnv(e.target.value)}
              placeholder="룸 구성, 청결도, 음향 등"
              rows={3}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label">혜택</label>
            <textarea
              className="form-input"
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              placeholder="지원 혜택, 복리후생"
              rows={2}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label">자격/우대</label>
            <textarea
              className="form-input"
              value={qualify}
              onChange={(e) => setQualify(e.target.value)}
              placeholder="지원 자격 및 우대사항"
              rows={2}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label">추가 상세설명</label>
            <textarea
              className="form-input"
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder="기타 상세 설명"
              rows={2}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="radio"
                name="aiTone"
                checked={aiTone === 'pro'}
                onChange={() => setAiTone('pro')}
              />
              <span>💎 전문가 톤</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="radio"
                name="aiTone"
                checked={aiTone === 'partner_pro'}
                onChange={() => setAiTone('partner_pro')}
              />
              <span>🤝 듬직한 파트너 톤</span>
            </label>
          </div>

          <div style={{ marginTop: 16 }}>
            <label className="form-label">노출 기간 (일)</label>
            <select
              className="form-input"
              value={periodDays}
              onChange={(e) => setPeriodDays(Number(e.target.value))}
              style={{ width: 120 }}
            >
              <option value={30}>30일</option>
              <option value={60}>60일</option>
              <option value={90}>90일</option>
            </select>
          </div>

          <div style={{ marginTop: 24 }}>
            <button
              type="button"
              className="btn-save"
              onClick={handleSaveDraft}
              disabled={saving}
            >
              {saving ? '저장 중...' : '임시 저장'}
            </button>
          </div>
        </div>

        {/* 오른쪽: AI 종합정리 */}
        <div className="card-box" style={{ position: 'sticky', top: 16 }}>
          <div className="card-box-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>🤖 AI소개글 종합정리</span>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>실시간 반영</span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>
            제출 전 확인 · AI 소개글 생성에 활용됩니다
          </p>

          <div style={{ fontSize: 12, lineHeight: 1.8 }}>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: 'var(--muted)' }}>🏪 업소명</span>
              <div>{name || '—'}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: 'var(--muted)' }}>📍 지역</span>
              <div>{REGION_OPTIONS.find((r) => r.value === region)?.label || region || '—'}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: 'var(--muted)' }}>💼 업종</span>
              <div>{TYPE_OPTIONS.find((t) => t.value === type)?.label || type || '—'}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: 'var(--muted)' }}>📞 연락처</span>
              <div>{contact || '—'}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: 'var(--muted)' }}>📍 주소</span>
              <div>{location || '—'}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: 'var(--muted)' }}>📝 업소 소개</span>
              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{locationDesc || '—'}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: 'var(--muted)' }}>🏭 시설/환경</span>
              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{facilityEnv || '—'}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: 'var(--muted)' }}>🎁 혜택</span>
              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{benefits || '—'}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: 'var(--muted)' }}>📋 자격/우대</span>
              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{qualify || '—'}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: 'var(--muted)' }}>➕ 추가 설명</span>
              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{extra || '—'}</div>
            </div>
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>톤</span>
              <div>{aiTone === 'pro' ? '💎 전문가' : '🤝 듬직한 파트너'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--muted)' }}>기간</span>
              <div>{periodDays}일</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
