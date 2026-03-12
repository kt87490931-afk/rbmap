'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'

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

const INTERIOR_OPTIONS = [
  { id: 'luxury_gold', label: '럭셔리 & 골드 (고급스러운 대리석 느낌)' },
  { id: 'modern_white', label: '모던 & 화이트 (심플하고 깔끔한 느낌)' },
  { id: 'cyberpunk', label: '사이버 펑크 (화려한 네온 조명)' },
  { id: 'private_classic', label: '프라이빗 클래식 (중후하고 조용한 분위기)' },
  { id: 'hip_club', label: '힙한 클럽 스타일 (화려한 무빙 라이트)' },
]

const ROOM_CONDITION_OPTIONS = [
  { id: 'large_50', label: '50인 수용 대형룸 (단체/회식 최적)' },
  { id: 'room_toilet', label: '룸 내 개별 화장실 완비' },
  { id: 'non_smoking', label: '비흡연자를 위한 금연룸 운영' },
  { id: 'air_purifier', label: '최신형 공기청정기 풀가동' },
  { id: 'soundproof', label: '층간 소음 완벽 차단 (방음 시설)' },
  { id: 'small_private', label: '프라이빗 소형룸' },
  { id: 'party_room', label: '파티/이벤트룸' },
]

const SOUND_FACILITY_OPTIONS = [
  { id: 'latest_karaoke', label: '최신형 노래방 기기' },
  { id: 'high_speaker', label: '고성능 스피커' },
  { id: 'laser_light', label: '레이저 조명' },
  { id: 'mirror_ball', label: '미러볼' },
]

const CLEAN_OPTIONS = [
  { id: 'daily_sterilize', label: '매일 소독·살균' },
  { id: 'air_purifier_24', label: '공기청정기 24시간 가동' },
  { id: 'no_smell', label: '담배 냄새 없는 청결한 룸' },
]

const MANAGER_STYLE_OPTIONS = [
  { id: 'young_20s', label: '20대 초반 위주 (젊은 에너지)' },
  { id: 'model_grade', label: '모델/연예인 지망생 급 (비주얼 강조)' },
  { id: 'friendly', label: '싹싹하고 친절한 마인드 (내상 제로)' },
  { id: 'party_type', label: '텐션 높은 파티형 (분위기 메이커)' },
  { id: 'innocent_intel', label: '청순/지적인 이미지' },
]

const MATCHING_OPTIONS = [
  { id: 'unlimited_choice', label: '무한 초이스 시스템 (마음에 들 때까지)' },
  { id: 'manager_match', label: '실장 추천 맞춤 매칭 (실패 없는 선택)' },
  { id: 'no_rotation', label: '로테이션 없는 고정 시스템' },
  { id: 'first_30', label: '첫 타임 출근 인원 30명 이상' },
]

const FREE_SERVICE_OPTIONS = [
  { id: 'fruit_refill', label: '고급 과일 안주 무한 리필' },
  { id: 'soju_beer', label: '소주/맥주 무제한 제공 이벤트' },
  { id: 'ramen_meal', label: '라면/짜파게티 등 식사 대용 서비스' },
  { id: 'whiskey_upgrade', label: '고급 양주 승급 이벤트 (저녁 9시 이전)' },
]

const CONVENIENCE_OPTIONS = [
  { id: 'valet', label: '발렛 파킹 무료 서비스' },
  { id: 'pickup', label: '인근 지역 픽업/샌딩 가능' },
  { id: 'hangover', label: '숙취해소제(컨디션 등) 증정' },
  { id: 'charging', label: '휴대폰 초고속 충전 서비스' },
]

const DISCOUNT_OPTIONS = [
  { id: 'first_visit', label: '첫 방문 고객 특별 할인' },
  { id: 'cash_extra', label: '현금 결제 시 추가 서비스 룸 제공' },
  { id: 'birthday', label: '생일/기념일 축하 샴페인 증정' },
]

const PHILOSOPHY_OPTIONS = [
  { id: 'fixed_price', label: '정찰제 운영 (추가금 일체 없음)' },
  { id: 'real_liquor', label: '정품 양주/새 술 확인 시스템' },
  { id: 'as_100', label: '내상 발생 시 100% AS 보장' },
  { id: 'privacy', label: '프라이버시 철저 보장 (비밀 유지)' },
]

const MANAGER_CAREER_OPTIONS = [
  { id: 'veteran', label: 'OO지역 10년차 베테랑 실장' },
  { id: 'youtube_famous', label: '유튜브/커뮤니티 유명 실장 직접 케어' },
  { id: 'outgoing', label: '외성적인 성격의 화끈한 케어 가능' },
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

  const [aiTone, setAiTone] = useState<'pro' | 'partner_pro'>('pro')
  const [periodDays, setPeriodDays] = useState(30)

  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [introAiContent, setIntroAiContent] = useState('')
  const [generating, setGenerating] = useState(false)
  const [testingApi, setTestingApi] = useState(false)
  const [savedIntros, setSavedIntros] = useState<Array<{ id: string; form_json: Record<string, unknown>; ai_tone: string; period_days: number; intro_ai_json?: { content?: string }; created_at: string }>>([])
  const [loadingIntros, setLoadingIntros] = useState(false)
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
    fetchSavedIntros()
  }, [fetchPartners, fetchSavedIntros])

  const loadId = searchParams.get('load')
  useEffect(() => {
    if (!loadId || !savedIntros.length) return
    const item = savedIntros.find((x) => x.id === loadId)
    if (item) loadSavedIntro(item)
  }, [loadId, savedIntros])

  const loadSavedIntro = (item: { form_json: Record<string, unknown>; ai_tone: string; period_days: number; intro_ai_json?: { content?: string } }) => {
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
    setAiTone(item.ai_tone === 'partner_pro' ? 'partner_pro' : 'pro')
    setPeriodDays(Number(item.period_days) || 30)
    setIntroAiContent(item.intro_ai_json?.content ?? '')
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
        body: JSON.stringify({ form: formData, ai_tone: aiTone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.error || `생성 실패 (HTTP ${res.status})`)
      if (!data.success || !data.text) throw new Error(data.message || 'AI 응답이 비어 있습니다.')
      setIntroAiContent(data.text)
      showMsg('AI 소개글 생성 완료')
    } catch (e) {
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
            ⚠ AI 소개글은 2000자 이내로 생성됩니다 (선택 항목을 충분히 체크하면 더 디테일해집니다)
          </p>

          <div style={{ fontSize: 12, lineHeight: 1.8, maxHeight: '70vh', overflowY: 'auto' }}>
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
              <span style={{ color: 'var(--muted)' }}>톤</span>
              <div>{aiTone === 'pro' ? '💎 전문가' : '🤝 듬직한 파트너'}</div>
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
