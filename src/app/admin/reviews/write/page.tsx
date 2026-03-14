'use client'

import Link from 'next/link'
import { useState, useCallback } from 'react'

const REGION_KO: Record<string, string> = { gangnam: '강남', suwon: '수원', dongtan: '동탄', jeju: '제주' }
const TYPE_KO: Record<string, string> = {
  karaoke: '가라오케',
  highpublic: '하이퍼블릭',
  jjomoh: '쩜오',
  shirtsroom: '셔츠룸',
  public: '퍼블릭',
}
const KO_MAP: Record<string, string> = {
  달: 'dal', 토: 'to', 가라오케: 'karaoke', 강남: 'gangnam', 수원: 'suwon', 동탄: 'dongtan', 제주: 'jeju',
  라인업: 'lineup', 후기: 'review', 분석: 'analysis', '3월': 'march', 완전: 'complete',
}

function titleToSlug(title: string): string {
  let s = title.toLowerCase().trim()
  s = s.replace(/\s+/g, '-').replace(/[—–]/g, '-').replace(/[^a-z0-9가-힣-]/g, '')
  Object.entries(KO_MAP).forEach(([k, v]) => { s = s.replaceAll(k, v) })
  s = s.replace(/[가-힣]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '')
  return s || 'review'
}

function nameToSlug(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9가-힣-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'venue'
}

export default function AdminReviewWritePage() {
  const [region, setRegion] = useState('')
  const [type, setType] = useState('')
  const [venue, setVenue] = useState('')
  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  const [star, setStar] = useState('')
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10))
  const [secOverview, setSecOverview] = useState('')
  const [secLineup, setSecLineup] = useState('')
  const [secPrice, setSecPrice] = useState('')
  const [secFacility, setSecFacility] = useState('')
  const [secSummary, setSecSummary] = useState('')
  const [goodTags, setGoodTags] = useState<string[]>(['라인업 우수', '정찰제'])
  const [badTags, setBadTags] = useState<string[]>(['주말 예약 필수'])
  const [metaDesc, setMetaDesc] = useState('')
  const [status, setStatus] = useState<'draft' | 'publish'>('draft')
  const [publishDt, setPublishDt] = useState(() => {
    const d = new Date()
    d.setMinutes(0, 0)
    return d.toISOString().slice(0, 16)
  })
  const [aiLoading, setAiLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const totalChars = secOverview.length + secLineup.length + secPrice.length + secFacility.length + secSummary.length

  const updateSlug = useCallback(() => {
    const t = title.trim()
    const vs = nameToSlug(venue)
    const ts = t ? titleToSlug(t) + '-001' : 'slug-001'
    if (!slug || slug === '' || slug.endsWith('-001')) setSlug(ts)
  }, [title, venue, slug])

  const addTag = (kind: 'good' | 'bad', val: string) => {
    const v = val.trim()
    if (!v) return
    if (kind === 'good') setGoodTags((prev) => [...prev, v])
    else setBadTags((prev) => [...prev, v])
  }

  const removeTag = (kind: 'good' | 'bad', i: number) => {
    if (kind === 'good') setGoodTags((prev) => prev.filter((_, j) => j !== i))
    else setBadTags((prev) => prev.filter((_, j) => j !== i))
  }

  const triggerAI = () => {
    if (!venue || !region || !type) {
      alert('업소명, 지역, 업종을 먼저 입력해주세요.')
      return
    }
    setAiLoading(true)
    setTimeout(() => {
      const rn = REGION_KO[region] ?? region
      const tn = TYPE_KO[type] ?? type
      setSecOverview(`${rn} ${venue}를 최근 주말 금요일 저녁에 직접 방문했습니다. 전화 예약은 방문 하루 전 진행했으며, 담당 실장의 응대가 친절하고 신속했습니다.`)
      setSecLineup(`라인업은 금요일 기준 40명 이상이 출근해 있었으며 수준이 전반적으로 고른 편이었습니다. ${tn} 특성에 맞는 서비스 수준이 유지되고 있었습니다.`)
      setSecPrice('가격은 1인 기준 정찰제로 운영되며 입장 전 가격 안내가 명확하게 이루어집니다.')
      setSecFacility('룸 청결도는 높은 수준이었으며 음향 장비도 최신 기기로 관리되고 있습니다.')
      setSecSummary(`${rn} ${venue}은(는) ${tn} 입문자와 재방문 고객 모두에게 만족스러운 경험을 제공합니다.`)
      setAiLoading(false)
    }, 1200)
  }

  const saveDraft = async () => {
    await submit('draft')
  }

  const publishReview = async () => {
    if (!title.trim()) { alert('제목을 입력해주세요.'); return }
    if (!slug.trim() || !region || !type || !venue.trim()) {
      alert('지역, 업종, 업소명, 슬러그를 모두 입력해주세요.')
      return
    }
    await submit('publish')
  }

  const submit = async (s: 'draft' | 'publish') => {
    setSubmitting(true)
    try {
      const venueSlug = nameToSlug(venue)
      const res = await fetch('/api/admin/review-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region,
          type,
          venue: venue.trim(),
          venue_slug: venueSlug,
          slug: slug.trim(),
          title: title.trim(),
          star: star ? parseInt(star, 10) : 5,
          visit_date: visitDate || null,
          status: s,
          published_at: s === 'publish' ? publishDt : null,
          sec_overview: secOverview,
          sec_lineup: secLineup,
          sec_price: secPrice,
          sec_facility: secFacility,
          sec_summary: secSummary,
          good_tags: goodTags,
          bad_tags: badTags,
          meta_description: metaDesc,
          is_ai_written: true,
          venue_page_url: `/${region}/${type}/${venueSlug}`,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '저장 실패')
      if (s === 'publish') {
        const url = `/${region}/${type}/${venueSlug}/${slug.trim()}`
        alert(`발행 완료! ${url}`)
        window.location.href = url
      } else {
        alert('임시저장 되었습니다.')
      }
    } catch (e) {
      alert(String(e))
    } finally {
      setSubmitting(false)
    }
  }

  const venueSlug = nameToSlug(venue)
  const displaySlug = slug || 'slug-001'
  const regionName = REGION_KO[region] ?? '지역'
  const typeName = TYPE_KO[type] ?? '업종'
  const stars = star ? '★'.repeat(parseInt(star, 10)) + '☆'.repeat(5 - parseInt(star, 10)) : '★★★★★'

  return (
    <div className="admin-review-write" style={{ background: '#050505', minHeight: '100vh' }}>
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" className="logo">
            <div className="logo-icon">빵</div>
            <div className="logo-text">룸빵여지도</div>
          </Link>
          <span className="admin-badge">ADMIN</span>
        </div>
        <div className="header-right">
          <Link href="/reviews">← 리뷰 목록</Link>
          <a href="#" onClick={(e) => { e.preventDefault(); saveDraft(); }} style={{ display: status === 'draft' ? 'block' : 'none' }}>임시저장</a>
          <a href="#" onClick={(e) => { e.preventDefault(); publishReview(); }} className="btn-save">발행하기</a>
        </div>
      </header>

      <div className="admin-wrap">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="review-write-panel">
            <div className="review-write-panel-head"><h2>📍 분류 정보</h2><span>URL 자동 생성에 사용됩니다</span></div>
            <div className="review-write-panel-body">
              <div className="review-write-form-grid-3">
                <div className="review-write-form-row" style={{ marginBottom: 0 }}>
                  <label>지역 <span className="required">*</span></label>
                  <select value={region} onChange={(e) => setRegion(e.target.value)}>
                    <option value="">-- 선택 --</option>
                    <option value="gangnam">강남</option>
                    <option value="suwon">수원</option>
                    <option value="dongtan">동탄</option>
                    <option value="jeju">제주</option>
                  </select>
                </div>
                <div className="review-write-form-row" style={{ marginBottom: 0 }}>
                  <label>업종 <span className="required">*</span></label>
                  <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="">-- 선택 --</option>
                    <option value="karaoke">가라오케</option>
                    <option value="highpublic">하이퍼블릭</option>
                    <option value="jjomoh">쩜오</option>
                    <option value="shirtsroom">셔츠룸</option>
                    <option value="public">퍼블릭</option>
                  </select>
                </div>
                <div className="review-write-form-row" style={{ marginBottom: 0 }}>
                  <label>업소명 <span className="required">*</span></label>
                  <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="예: 달토" />
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <div className="review-write-url-box">
                  <span className="u-label">생성될 URL</span>
                  <span style={{ color: 'var(--gold)', wordBreak: 'break-all' }}>
                    <span style={{ color: 'var(--dim)' }}>yourdomain.com</span>
                    <span className="u-slash">/</span>{region || '지역'}
                    <span className="u-slash">/</span>{type || '업종'}
                    <span className="u-slash">/</span>{venueSlug || '업소명'}
                    <span className="u-slash">/</span><span style={{ color: 'var(--gold)' }}>{displaySlug}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="review-write-panel">
            <div className="review-write-panel-head"><h2>📝 리뷰 정보</h2></div>
            <div className="review-write-panel-body">
              <div className="review-write-form-row">
                <label>리뷰 제목 <span className="required">*</span></label>
                <input type="text" value={title} onChange={(e) => { setTitle(e.target.value); updateSlug(); }} placeholder="예: 달토 가라오케 3월 라인업 완전 분석" />
                <div className="review-write-form-hint">제목은 <em>업소명 + 핵심 키워드</em> 형태를 권장합니다.</div>
              </div>
              <div className="review-write-form-grid-2">
                <div className="review-write-form-row">
                  <label>별점 <span className="required">*</span></label>
                  <select value={star} onChange={(e) => setStar(e.target.value)}>
                    <option value="">-- 선택 --</option>
                    <option value="5">★★★★★ 5점</option>
                    <option value="4">★★★★☆ 4점</option>
                    <option value="3">★★★☆☆ 3점</option>
                    <option value="2">★★☆☆☆ 2점</option>
                    <option value="1">★☆☆☆☆ 1점</option>
                  </select>
                </div>
                <div className="review-write-form-row">
                  <label>방문 날짜</label>
                  <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
                </div>
              </div>
              <div className="review-write-form-row">
                <label>영문 슬러그 <span className="required">*</span></label>
                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="예: dalto-march-lineup-review-001" />
              </div>
            </div>
          </div>

          <div className="review-write-panel">
            <div className="review-write-panel-head"><h2>✍️ 본문</h2><span>{totalChars}자</span></div>
            <div className="review-write-panel-body">
              <button type="button" className="review-write-ai-btn" onClick={triggerAI} disabled={aiLoading}>
                <span>🤖</span>
                <span>AI로 본문 자동 생성</span>
                {aiLoading && <div className="review-write-ai-loader" />}
              </button>
              <div className="review-write-form-row">
                <label>방문 개요 <span className="required">*</span></label>
                <textarea value={secOverview} onChange={(e) => setSecOverview(e.target.value)} rows={4} placeholder="방문 날짜, 인원, 예약 방법, 첫인상 등을 작성하세요." />
              </div>
              <div className="review-write-form-row">
                <label>라인업 / 서비스 분석</label>
                <textarea value={secLineup} onChange={(e) => setSecLineup(e.target.value)} rows={4} placeholder="라인업 수준, 인원, 초이스 방식 등" />
              </div>
              <div className="review-write-form-row">
                <label>가격 분석</label>
                <textarea value={secPrice} onChange={(e) => setSecPrice(e.target.value)} rows={3} placeholder="주대, 정찰제 여부, 추가 비용 등" />
              </div>
              <div className="review-write-form-row">
                <label>시설 / 분위기</label>
                <textarea value={secFacility} onChange={(e) => setSecFacility(e.target.value)} rows={3} placeholder="룸 상태, 청결도, 음향, 주차 등" />
              </div>
              <div className="review-write-form-row">
                <label>종합 평가</label>
                <textarea value={secSummary} onChange={(e) => setSecSummary(e.target.value)} rows={3} placeholder="전체적인 총평, 추천 여부" />
                <div className="review-write-char-counter">총 <span style={{ color: 'var(--gold)' }}>{totalChars}</span>자</div>
              </div>
            </div>
          </div>

          <div className="review-write-panel">
            <div className="review-write-panel-head"><h2>🏷️ 평가 태그</h2></div>
            <div className="review-write-panel-body">
              <div className="review-write-form-row">
                <label>긍정 태그 <span style={{ color: 'var(--green)' }}>✓</span></label>
                <div className="review-write-tag-input-wrap">
                  <input type="text" placeholder="예: 라인업 우수" onKeyDown={(e) => { if (e.key === 'Enter') { addTag('good', (e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; e.preventDefault(); } }} />
                  <button type="button" className="review-write-tag-btn" onClick={(e) => { const inp = (e.target as HTMLElement).previousElementSibling as HTMLInputElement; addTag('good', inp?.value || ''); if (inp) inp.value = ''; }}>+ 추가</button>
                </div>
                <div className="review-write-tag-list">
                  {goodTags.map((t, i) => (
                    <span key={i} className="review-write-tag-item" style={{ color: 'var(--green)', borderColor: 'rgba(46,204,113,.25)' }}>
                      ✓ {t}<button type="button" onClick={() => removeTag('good', i)}>×</button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="review-write-form-row">
                <label>부정/참고 태그 <span style={{ color: 'var(--red)' }}>△</span></label>
                <div className="review-write-tag-input-wrap">
                  <input type="text" placeholder="예: 주말 예약 필수" onKeyDown={(e) => { if (e.key === 'Enter') { addTag('bad', (e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; e.preventDefault(); } }} />
                  <button type="button" className="review-write-tag-btn" onClick={(e) => { const inp = (e.target as HTMLElement).previousElementSibling as HTMLInputElement; addTag('bad', inp?.value || ''); if (inp) inp.value = ''; }}>+ 추가</button>
                </div>
                <div className="review-write-tag-list">
                  {badTags.map((t, i) => (
                    <span key={i} className="review-write-tag-item">
                      △ {t}<button type="button" onClick={() => removeTag('bad', i)}>×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="review-write-panel">
            <div className="review-write-panel-head"><h2>🔍 SEO 설정</h2></div>
            <div className="review-write-panel-body">
              <div className="review-write-form-row">
                <label>메타 설명</label>
                <textarea value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} rows={2} placeholder="80~120자 권장" />
                <div className="review-write-char-counter">{metaDesc.length} / 120자</div>
              </div>
            </div>
          </div>
        </div>

        <div className="review-write-preview-panel">
          <div className="review-write-panel" style={{ marginBottom: 14 }}>
            <div className="review-write-panel-head"><h2>🚀 발행 설정</h2></div>
            <div className="review-write-panel-body">
              <div className="review-write-form-row">
                <label>상태</label>
                <div className="review-write-status-btns">
                  <button type="button" className={`review-write-status-btn ${status === 'draft' ? 'active-draft' : ''}`} onClick={() => setStatus('draft')}>📝 임시저장</button>
                  <button type="button" className={`review-write-status-btn ${status === 'publish' ? 'active-publish' : ''}`} onClick={() => setStatus('publish')}>✅ 발행</button>
                </div>
              </div>
              <div className="review-write-form-row">
                <label>발행 날짜·시간</label>
                <input type="datetime-local" value={publishDt} onChange={(e) => setPublishDt(e.target.value)} className="review-write-form-row" style={{ marginBottom: 0 }} />
              </div>
              <button type="button" onClick={publishReview} disabled={submitting} style={{ width: '100%', marginTop: 16, padding: 11, background: 'var(--gold)', border: 'none', borderRadius: 6, color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                발행하기
              </button>
              <button type="button" onClick={saveDraft} disabled={submitting} style={{ width: '100%', marginTop: 8, padding: 10, background: 'var(--card2)', border: '1px solid var(--border2)', borderRadius: 6, color: 'var(--muted)', fontSize: 12, cursor: 'pointer' }}>
                임시저장
              </button>
            </div>
          </div>

          <div className="review-write-panel">
            <div className="review-write-panel-head"><h2>👁️ 카드 미리보기</h2></div>
            <div className="review-write-panel-body">
              <div className="review-write-preview-card">
                <div className="review-write-pv-label">FR-CARD PREVIEW</div>
                <div className="review-write-pv-head">
                  <span className="review-write-pv-num">01</span>
                  <span className="review-write-pv-rpill" style={{ background: 'rgba(192,57,43,.12)', color: '#e05c50', border: '1px solid rgba(192,57,43,.28)' }}>{regionName}</span>
                  <span className="review-write-pv-type">{typeName}</span>
                  <span className="review-write-pv-vtag">{venue || '업소명'}</span>
                  <span className="review-write-pv-date" style={{ marginLeft: 'auto' }}>{visitDate.replace(/-/g, '.')}</span>
                </div>
                <div className="review-write-pv-title">{title || '리뷰 제목이 여기에 표시됩니다'}</div>
                <div className="review-write-pv-stars">{stars}</div>
                <div className="review-write-pv-body">{secOverview || '본문 미리보기'}</div>
                <div className="review-write-pv-footer">
                  <span className="review-write-pv-cc">약 {totalChars}자</span>
                  <span className="review-write-pv-rm">전문 보기 →</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="review-write-bottom-bar">
        <button type="button" className="btn-draft" onClick={saveDraft} style={{ flex: 1 }}>임시저장</button>
        <button type="button" onClick={publishReview} style={{ flex: 2, background: 'var(--gold)', border: 'none', color: '#000', fontWeight: 700 }}>발행하기</button>
      </div>
    </div>
  )
}
