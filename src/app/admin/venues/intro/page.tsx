'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { hashSeed, pickOpeningPattern, pickFocus } from '@/lib/intro-diversity'
import {
  INTERIOR_LABELS,
  ROOM_CONDITION_LABELS,
  SOUND_FACILITY_LABELS,
  CLEAN_LABELS,
  MANAGER_STYLE_LABELS,
  MATCHING_LABELS,
  FREE_SERVICE_LABELS,
  CONVENIENCE_LABELS,
  DISCOUNT_LABELS,
  PHILOSOPHY_LABELS,
  MANAGER_CAREER_LABELS,
} from '@/lib/intro-options'

const TYPE_OPTIONS = [
  { value: 'karaoke', label: '가라오케' },
  { value: 'highpublic', label: '하이퍼블릭' },
  { value: 'room-salon', label: '룸싸롱' },
  { value: 'shirtsroom', label: '셔츠룸' },
  { value: 'public', label: '퍼블릭' },
  { value: 'jjomoh', label: '쩜오' },
]

const toOptions = (m: Record<string, string>) => Object.entries(m).map(([id, label]) => ({ id, label }))

const INTERIOR_OPTIONS = toOptions(INTERIOR_LABELS)
const ROOM_CONDITION_OPTIONS = toOptions(ROOM_CONDITION_LABELS)
const SOUND_FACILITY_OPTIONS = toOptions(SOUND_FACILITY_LABELS)
const CLEAN_OPTIONS = toOptions(CLEAN_LABELS)
const MANAGER_STYLE_OPTIONS = toOptions(MANAGER_STYLE_LABELS)
const MATCHING_OPTIONS = toOptions(MATCHING_LABELS)
const FREE_SERVICE_OPTIONS = toOptions(FREE_SERVICE_LABELS)
const CONVENIENCE_OPTIONS = toOptions(CONVENIENCE_LABELS)
const DISCOUNT_OPTIONS = toOptions(DISCOUNT_LABELS)
const PHILOSOPHY_OPTIONS = toOptions(PHILOSOPHY_LABELS)
const MANAGER_CAREER_OPTIONS = toOptions(MANAGER_CAREER_LABELS)

interface PartnerOption {
  id: string
  name: string
  region: string
  type: string
}

/** 지역관리(admin/regions)에서 등록한 지역 목록 — API에서 로드 */
interface RegionOption {
  value: string
  label: string
}

export default function AdminVenueIntroPage() {
  const [partners, setPartners] = useState<PartnerOption[]>([])
  const [regionOptions, setRegionOptions] = useState<RegionOption[]>([])
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

  const [interior, setInterior] = useState<string[]>([])
  const [roomCondition, setRoomCondition] = useState<string[]>([])
  const [soundFacility, setSoundFacility] = useState<string[]>([])
  const [cleanPoints, setCleanPoints] = useState<string[]>([])
  const [managerStyle, setManagerStyle] = useState<string[]>([])
  const [matching, setMatching] = useState<string[]>([])
  const [freeService, setFreeService] = useState<string[]>([])
  const [convenience, setConvenience] = useState<string[]>([])
  const [discount, setDiscount] = useState<string[]>([])
  const [philosophy, setPhilosophy] = useState<string[]>([])
  const [managerCareer, setManagerCareer] = useState<string[]>([])
  const [staffCount, setStaffCount] = useState('')

  const [aiTone, setAiTone] = useState<'pro' | 'partner_pro' | 'premium' | 'friendly' | 'trust'>('pro')
  const [periodDays, setPeriodDays] = useState(30)

  /** 시드 기반 다양성: 업소명+지역+업종으로 오프닝·포커스 자동 결정 (백엔드와 동일 로직) */
  const seedBasedDiversity = useMemo(() => {
    const seedStr = `${name ?? ''}|${region ?? ''}|${type ?? ''}`
    const seed = hashSeed(seedStr)
    const opening = pickOpeningPattern(seed)
    const focus = pickFocus(seed)
    return { seed, opening, focus }
  }, [name, region, type])

  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [introAiContent, setIntroAiContent] = useState('')
  const [generating, setGenerating] = useState(false)
  const [testingApi, setTestingApi] = useState(false)
  const [savedIntros, setSavedIntros] = useState<Array<{ id: string; form_json: Record<string, unknown>; ai_tone: string; period_days: number; intro_ai_json?: { content?: string; v2?: unknown }; created_at: string }>>([])
  const [loadingIntros, setLoadingIntros] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

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

  /** 지역관리에서 등록한 지역 목록 로드 — 지역 추가 시 업체소개글 작성 지역 선택에 반영 */
  const fetchRegions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/regions', { credentials: 'include' })
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      setRegionOptions(list.map((r: { slug: string; name: string }) => ({
        value: r.slug || '',
        label: r.name || r.slug || '',
      })))
    } catch { /* ignore */ }
  }, [])

  const buildContentFromV2 = (v2: { intro?: { lead?: string; quote?: string; body_paragraphs?: string[] } }) => {
    if (!v2?.intro) return ''
    const parts = [
      v2.intro.lead,
      v2.intro.quote,
      ...(v2.intro.body_paragraphs ?? []),
    ].filter(Boolean)
    return parts.join('\n\n')
  }

  const fetchSavedIntros = useCallback(async () => {
    setLoadingIntros(true)
    try {
      const res = await fetch('/api/admin/venues/intro')
      const data = await res.json()
      setSavedIntros(Array.isArray(data) ? data : [])
    } catch { /* ignore */ } finally {
      setLoadingIntros(false)
    }
  }, [])

  useEffect(() => {
    fetchPartners()
    fetchRegions()
    fetchSavedIntros()
  }, [fetchPartners, fetchRegions, fetchSavedIntros])

  const loadId = searchParams.get('load')
  useEffect(() => {
    if (!loadId || !savedIntros.length) return
    const item = savedIntros.find((x) => x.id === loadId)
    if (item) loadSavedIntro(item)
  }, [loadId, savedIntros])

  const loadSavedIntro = (item: { form_json: Record<string, unknown>; ai_tone: string; period_days: number; intro_ai_json?: { content?: string; v2?: unknown } }) => {
    const f = item.form_json
    setName(String(f.name ?? ''))
    setRegion(String(f.region ?? ''))
    setType(String(f.type ?? ''))
    setContact(String(f.contact ?? ''))
    setLocation(String(f.location ?? ''))
    setLocationDesc(String(f.location_desc ?? ''))
    setFacilityEnv(String(f.facility_env ?? ''))
    setBenefits(String(f.benefits ?? ''))
    setQualify(String(f.qualify ?? ''))
    setExtra(String(f.extra ?? ''))
    setInterior(Array.isArray(f.interior) ? f.interior : [])
    setRoomCondition(Array.isArray(f.room_condition) ? f.room_condition : [])
    setSoundFacility(Array.isArray(f.sound_facility) ? f.sound_facility : [])
    setCleanPoints(Array.isArray(f.clean_points) ? f.clean_points : [])
    setManagerStyle(Array.isArray(f.manager_style) ? f.manager_style : [])
    setMatching(Array.isArray(f.matching) ? f.matching : [])
    setFreeService(Array.isArray(f.free_service) ? f.free_service : [])
    setConvenience(Array.isArray(f.convenience) ? f.convenience : [])
    setDiscount(Array.isArray(f.discount) ? f.discount : [])
    setPhilosophy(Array.isArray(f.philosophy) ? f.philosophy : [])
    setManagerCareer(Array.isArray(f.manager_career) ? f.manager_career : [])
    setStaffCount(String(f.staff_count ?? ''))
    const validTones = ['pro', 'partner_pro', 'premium', 'friendly', 'trust'] as const
    setAiTone(validTones.includes(item.ai_tone as typeof validTones[number]) ? (item.ai_tone as typeof validTones[number]) : 'pro')
    setPeriodDays(Number(item.period_days) || 30)
    const ij = item.intro_ai_json
    const v2 = ij?.v2 as { intro?: { lead?: string; quote?: string; body_paragraphs?: string[] } } | undefined
    const content = v2 ? buildContentFromV2(v2) : (ij?.content ?? '')
    setIntroAiContent(content)
    showMsg('저장된 소개글을 불러왔습니다.')
  }

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

  const toggleCheck = (ids: string[], setIds: (v: string[]) => void, id: string) => {
    if (ids.includes(id)) setIds(ids.filter((x) => x !== id))
    else setIds([...ids, id])
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
    interior,
    room_condition: roomCondition,
    sound_facility: soundFacility,
    clean_points: cleanPoints,
    manager_style: managerStyle,
    matching,
    free_service: freeService,
    convenience,
    discount,
    philosophy,
    manager_career: managerCareer,
    staff_count: staffCount,
  }

  const handleTestApiKey = async () => {
    setTestingApi(true)
    try {
      const res = await fetch('/api/admin/gemini/test')
      const data = await res.json()
      if (data.ok) {
        alert(`API 키 테스트 성공\n${data.message}\n응답 시간: ${data.elapsedMs}ms`)
      } else {
        alert(`API 키 테스트 실패\n${data.message || data.error}\n${data.error ? `상세: ${JSON.stringify(data.fullError || data.error)}` : ''}`)
      }
    } catch (e) {
      alert('연결 오류: ' + String(e))
    } finally {
      setTestingApi(false)
    }
  }

  const handleGenerateAi = async () => {
    if (!name.trim()) {
      alert('업소명을 입력해주세요.')
      return
    }
    setGenerating(true)
    setIntroAiContent('')
    try {
      const res = await fetch('/api/admin/gemini/intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form: formData, ai_tone: aiTone, format: 'json' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.error || `생성 실패 (HTTP ${res.status})`)
      if (!data.success || !data.text) throw new Error(data.message || 'AI 응답이 비어 있습니다.')
      const aiText = data.text
      const v2 = data.v2
      const contentForDisplay = v2 ? buildContentFromV2(v2) : aiText
      setIntroAiContent(contentForDisplay)

      // AI 생성 성공 시 즉시 저장 (v2 구조 포함 — 업소 상세 페이지 DOM 매핑용)
      const introJson: Record<string, unknown> = {
        content: contentForDisplay,
        generated_at: new Date().toISOString(),
        elapsed_ms: data.elapsedMs ?? null,
      }
      if (v2) introJson.v2 = v2

      const payload: Record<string, unknown> = {
        partner_id: selectedPartnerId || null,
        form: formData,
        ai_tone: aiTone,
        period_days: periodDays,
        intro_ai_json: introJson,
      }
      const saveRes = await fetch('/api/admin/venues/intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const saveData = await saveRes.json()
      if (!saveRes.ok) throw new Error(saveData.error || '저장 실패')
      showMsg(`AI 생성 완료 (${data.elapsedMs ?? 0}ms) · 리스트에 저장됨`)
      router.push('/admin/venues/intros')
    } catch (e) {
      console.error('[AI 생성]', e)
      alert(String(e))
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!name.trim()) {
      alert('업소명을 입력해주세요.')
      return
    }
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        partner_id: selectedPartnerId || null,
        form: formData,
        ai_tone: aiTone,
        period_days: periodDays,
      }
      if (introAiContent) {
        payload.intro_ai_json = { content: introAiContent }
      }
      const res = await fetch('/api/admin/venues/intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '저장 실패')
      showMsg('임시저장 되었습니다.')
      fetchSavedIntros()
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
          <div style={{ marginBottom: 16, padding: 12, background: 'var(--bg)', borderRadius: 8 }}>
            <label className="form-label">저장된 소개글 불러오기</label>
            <select
              className="form-input"
              value=""
              onChange={(e) => {
                const id = e.target.value
                if (!id) return
                const item = savedIntros.find((x) => x.id === id)
                if (item) loadSavedIntro(item)
                e.target.value = ''
              }}
              style={{ width: '100%' }}
              disabled={loadingIntros}
            >
              <option value="">— 선택하여 불러오기 —</option>
              {savedIntros.map((x) => (
                <option key={x.id} value={x.id}>
                  {String((x.form_json as { name?: string }).name || '제목없음')} · {new Date(x.created_at).toLocaleDateString('ko-KR')}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={fetchSavedIntros}
              disabled={loadingIntros}
              style={{ marginTop: 8, fontSize: 12 }}
            >
              {loadingIntros ? '로딩 중...' : '목록 새로고침'}
            </button>
          </div>

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
                {regionOptions.map((r) => (
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

          <div className="card-box-title" style={{ marginTop: 24, marginBottom: 12 }}>1. 시설 및 환경</div>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>분위기를 결정하는 시각적 요소 선택 (다중 선택 가능)</p>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">인테리어 컨셉</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {INTERIOR_OPTIONS.map((o) => (
                <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={interior.includes(o.id)} onChange={() => toggleCheck(interior, setInterior, o.id)} />
                  <span style={{ fontSize: 13 }}>{o.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">룸 구성 / 룸 컨디션</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ROOM_CONDITION_OPTIONS.map((o) => (
                <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={roomCondition.includes(o.id)} onChange={() => toggleCheck(roomCondition, setRoomCondition, o.id)} />
                  <span style={{ fontSize: 13 }}>{o.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">음향 / 특수시설</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SOUND_FACILITY_OPTIONS.map((o) => (
                <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={soundFacility.includes(o.id)} onChange={() => toggleCheck(soundFacility, setSoundFacility, o.id)} />
                  <span style={{ fontSize: 13 }}>{o.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">청결 포인트</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CLEAN_OPTIONS.map((o) => (
                <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={cleanPoints.includes(o.id)} onChange={() => toggleCheck(cleanPoints, setCleanPoints, o.id)} />
                  <span style={{ fontSize: 13 }}>{o.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="card-box-title" style={{ marginTop: 24, marginBottom: 12 }}>2. 매니저 및 수질 (핵심 데이터)</div>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>리뷰·소개글의 메인 테마가 됩니다</p>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">출근 인원 (선택)</label>
            <input
              type="text"
              className="form-input"
              value={staffCount}
              onChange={(e) => setStaffCount(e.target.value)}
              placeholder="예: 평균 25명, 피크 35명"
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">매니저 스타일</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {MANAGER_STYLE_OPTIONS.map((o) => (
                <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={managerStyle.includes(o.id)} onChange={() => toggleCheck(managerStyle, setManagerStyle, o.id)} />
                  <span style={{ fontSize: 13 }}>{o.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">매칭 및 시스템</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {MATCHING_OPTIONS.map((o) => (
                <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={matching.includes(o.id)} onChange={() => toggleCheck(matching, setMatching, o.id)} />
                  <span style={{ fontSize: 13 }}>{o.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="card-box-title" style={{ marginTop: 24, marginBottom: 12 }}>3. 서비스 및 이벤트 (가성비·혜택)</div>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>손님이 &apos;지금 바로 가야 할 이유&apos;를 만들어줍니다</p>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">무료 안주/주류 서비스</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {FREE_SERVICE_OPTIONS.map((o) => (
                <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={freeService.includes(o.id)} onChange={() => toggleCheck(freeService, setFreeService, o.id)} />
                  <span style={{ fontSize: 13 }}>{o.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">편의 서비스</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CONVENIENCE_OPTIONS.map((o) => (
                <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={convenience.includes(o.id)} onChange={() => toggleCheck(convenience, setConvenience, o.id)} />
                  <span style={{ fontSize: 13 }}>{o.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">가격 할인</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {DISCOUNT_OPTIONS.map((o) => (
                <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={discount.includes(o.id)} onChange={() => toggleCheck(discount, setDiscount, o.id)} />
                  <span style={{ fontSize: 13 }}>{o.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="card-box-title" style={{ marginTop: 24, marginBottom: 12 }}>4. 실장/부장 마인드 (운영 신뢰도)</div>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>업소의 공신력을 높여주는 항목입니다</p>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">운영 철학</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PHILOSOPHY_OPTIONS.map((o) => (
                <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={philosophy.includes(o.id)} onChange={() => toggleCheck(philosophy, setPhilosophy, o.id)} />
                  <span style={{ fontSize: 13 }}>{o.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">실장 경력</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {MANAGER_CAREER_OPTIONS.map((o) => (
                <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={managerCareer.includes(o.id)} onChange={() => toggleCheck(managerCareer, setManagerCareer, o.id)} />
                  <span style={{ fontSize: 13 }}>{o.label}</span>
                </label>
              ))}
            </div>
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

          <div style={{ marginTop: 24, padding: 14, background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div className="form-label" style={{ marginBottom: 8 }}>🌱 시드 기반 다양성 (자동 적용)</div>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>업소명+지역+업종 기준으로 오프닝·포커스가 자동 선택됩니다. AI 생성 시 적용됩니다.</p>
            <div style={{ fontSize: 12, lineHeight: 1.6 }}>
              <div><span style={{ color: 'var(--muted)' }}>오프닝:</span> {seedBasedDiversity.opening.hint}</div>
              <div><span style={{ color: 'var(--muted)' }}>포커스:</span> {seedBasedDiversity.focus.label}</div>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <div className="form-label" style={{ marginBottom: 8 }}>AI 톤 (5종 선택)</div>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>소개글 말투·분위기를 선택합니다</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
              {(['pro', 'partner_pro', 'premium', 'friendly', 'trust'] as const).map((t) => (
                <label
                  key={t}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                    padding: '10px 12px', borderRadius: 8, border: aiTone === t ? '2px solid var(--accent)' : '1px solid var(--border)',
                    background: aiTone === t ? 'rgba(var(--accent-rgb, 99, 102, 241), 0.08)' : 'transparent',
                  }}
                >
                  <input type="radio" name="aiTone" checked={aiTone === t} onChange={() => setAiTone(t)} />
                  <span style={{ fontSize: 12, fontWeight: aiTone === t ? 600 : 400 }}>
                    {t === 'pro' && '💎 전문가'}
                    {t === 'partner_pro' && '🤝 듬직한 파트너'}
                    {t === 'premium' && '✨ 럭셔리'}
                    {t === 'friendly' && '😊 친근'}
                    {t === 'trust' && '🛡 신뢰'}
                  </span>
                </label>
              ))}
            </div>
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

          <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleGenerateAi}
              disabled={generating}
              style={{
                padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                background: 'var(--accent)', color: '#fff', border: 'none', cursor: generating ? 'not-allowed' : 'pointer',
              }}
            >
              {generating ? 'AI 생성 중...' : '🤖 AI 소개글 생성'}
            </button>
            <button
              type="button"
              onClick={handleTestApiKey}
              disabled={testingApi}
              style={{
                padding: '8px 14px', borderRadius: 8, fontSize: 12, background: 'var(--bg)', color: 'var(--fg)', border: '1px solid var(--border)', cursor: testingApi ? 'not-allowed' : 'pointer',
              }}
            >
              {testingApi ? '테스트 중...' : '🔑 API 키 테스트'}
            </button>
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
          <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
            제출 전 확인 · AI 소개글 생성에 활용됩니다
          </p>
          <p style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: 12 }}>
            ⚠ AI 소개글은 2,500자 이상 3,000자 이내로 생성됩니다 (선택 항목을 충분히 체크하면 더 디테일해집니다)
          </p>

          <div style={{ fontSize: 12, lineHeight: 1.8, maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: 'var(--muted)' }}>🏪 업소명</span>
              <div>{name || '—'}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: 'var(--muted)' }}>📍 지역</span>
              <div>{regionOptions.find((r) => r.value === region)?.label || region || '—'}</div>
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
              <span style={{ color: 'var(--muted)' }}>🏠 시설·환경 (선택)</span>
              <div style={{ marginTop: 2 }}>
                {[
                  ...interior.map((id) => INTERIOR_OPTIONS.find((o) => o.id === id)?.label),
                  ...roomCondition.map((id) => ROOM_CONDITION_OPTIONS.find((o) => o.id === id)?.label),
                  ...soundFacility.map((id) => SOUND_FACILITY_OPTIONS.find((o) => o.id === id)?.label),
                  ...cleanPoints.map((id) => CLEAN_OPTIONS.find((o) => o.id === id)?.label),
                ].filter(Boolean).join(' · ') || '—'}
              </div>
              {facilityEnv ? <div style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{facilityEnv}</div> : null}
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: 'var(--muted)' }}>👥 매니저·수질 (선택)</span>
              {staffCount ? <div style={{ marginTop: 2 }}>출근: {staffCount}</div> : null}
              <div style={{ marginTop: 2 }}>
                {(managerStyle.length || matching.length)
                  ? [...managerStyle.map((id) => MANAGER_STYLE_OPTIONS.find((o) => o.id === id)?.label), ...matching.map((id) => MATCHING_OPTIONS.find((o) => o.id === id)?.label)].filter(Boolean).join(' · ')
                  : !staffCount ? '—' : ''}
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: 'var(--muted)' }}>🎁 서비스·이벤트 (선택)</span>
              <div style={{ marginTop: 2 }}>
                {[
                  ...freeService.map((id) => FREE_SERVICE_OPTIONS.find((o) => o.id === id)?.label),
                  ...convenience.map((id) => CONVENIENCE_OPTIONS.find((o) => o.id === id)?.label),
                  ...discount.map((id) => DISCOUNT_OPTIONS.find((o) => o.id === id)?.label),
                ].filter(Boolean).join(' · ') || '—'}
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: 'var(--muted)' }}>🛡 실장마인드 (선택)</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                {philosophy.length || managerCareer.length
                  ? [...philosophy.map((id) => PHILOSOPHY_OPTIONS.find((o) => o.id === id)?.label), ...managerCareer.map((id) => MANAGER_CAREER_OPTIONS.find((o) => o.id === id)?.label)].filter(Boolean).join(' · ')
                  : '—'}
              </div>
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
              <span style={{ color: 'var(--muted)' }}>시드 기반 다양성</span>
              <div style={{ fontSize: 11, marginTop: 4 }}>
                오프닝: {seedBasedDiversity.opening.hint} · 포커스: {seedBasedDiversity.focus.label}
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{ color: 'var(--muted)' }}>톤</span>
              <div>
                {aiTone === 'pro' && '💎 전문가'}
                {aiTone === 'partner_pro' && '🤝 듬직한 파트너'}
                {aiTone === 'premium' && '✨ 럭셔리'}
                {aiTone === 'friendly' && '😊 친근'}
                {aiTone === 'trust' && '🛡 신뢰'}
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: 'var(--muted)' }}>기간</span>
              <div>{periodDays}일</div>
            </div>
            {introAiContent ? (
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>📄 AI 생성 소개글</span>
                <div style={{ marginTop: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12, maxHeight: 200, overflowY: 'auto', background: 'var(--bg)', padding: 10, borderRadius: 8 }}>
                  {introAiContent}
                </div>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>{introAiContent.length}자</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}
