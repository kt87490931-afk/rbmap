'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { REGION_SLUG_TO_NAME } from '@/lib/data/venues'
import { REVIEW_TYPE_TO_NAME } from '@/lib/data/review-posts'
import { REVIEW_TONES } from '@/lib/review-scenarios'
import {
  TOPIC_PRIORITY_OPTIONS,
  TONE_PRIORITY_OPTIONS,
  formatAppliedConfig,
  type ReviewPriorityConfig,
} from '@/lib/review-priority-config'

interface ReviewItem {
  id: string
  region: string
  type: string
  venue: string
  venue_slug: string
  slug: string
  title: string
  star: number
  published_at: string | null
  created_at: string
  status: string
  is_ai_written: boolean
  view_count?: number
  sec_overview?: string
  sec_lineup?: string
  sec_price?: string
  sec_facility?: string
  sec_summary?: string
  scenario_used?: { tone?: string }
}

interface NextScheduleItem {
  partnerId: string
  name: string
  region: string
  type: string
  presetLabel: string
  nextAt: string
  nextAtKST: string
  inText: string
  isTomorrow: boolean
  canGenerateNow: boolean
  statusLabel: string
  nextCronKST: string
}

interface LatestCronRun {
  startedAt: string
  endedAt: string | null
  ok: boolean
  msg: string | null
}

function getToneName(toneId: string | undefined): string {
  if (!toneId) return '-'
  const t = REVIEW_TONES.find((x) => x.id === toneId)
  return t ? t.name : toneId
}

function getCharCount(r: ReviewItem): number {
  return (
    (r.sec_overview?.length ?? 0) +
    (r.sec_lineup?.length ?? 0) +
    (r.sec_price?.length ?? 0) +
    (r.sec_facility?.length ?? 0) +
    (r.sec_summary?.length ?? 0)
  )
}

export default function AdminReviewsPage() {
  const [items, setItems] = useState<ReviewItem[]>([])
  const [nextSchedules, setNextSchedules] = useState<NextScheduleItem[]>([])
  const [latestCronRun, setLatestCronRun] = useState<LatestCronRun | null>(null)
  const [loading, setLoading] = useState(true)
  const [scheduleLoading, setScheduleLoading] = useState(true)
  const [cronStatusLoading, setCronStatusLoading] = useState(true)
  const [manualRunLoading, setManualRunLoading] = useState(false)
  const [manualRunMsg, setManualRunMsg] = useState('')
  const [singleProcessPartnerId, setSingleProcessPartnerId] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [holdRestoreLoadingId, setHoldRestoreLoadingId] = useState<string | null>(null)
  const [editItem, setEditItem] = useState<ReviewItem | null>(null)
  const [editForm, setEditForm] = useState<{ title: string; star: number; sec_overview: string; sec_lineup: string; sec_price: string; sec_facility: string; sec_summary: string } | null>(null)
  const [sort, setSort] = useState<'latest' | 'popular'>('latest')
  const [priorityConfig, setPriorityConfig] = useState<ReviewPriorityConfig | null>(null)
  const [priorityConfigLoading, setPriorityConfigLoading] = useState(true)
  const [priorityApplyLoading, setPriorityApplyLoading] = useState(false)
  const [priorityForm, setPriorityForm] = useState<ReviewPriorityConfig>({ topic_1: '', topic_2: '', tone_1: '', tone_2: '' })

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reviews?sort=${sort}`, { credentials: 'include' })
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch { setItems([]) }
    setLoading(false)
  }, [sort])

  const fetchNextSchedules = useCallback(async () => {
    setScheduleLoading(true)
    try {
      const res = await fetch('/api/admin/reviews/next-schedule', { credentials: 'include' })
      const data = await res.json()
      setNextSchedules(Array.isArray(data) ? data : [])
    } catch { setNextSchedules([]) }
    setScheduleLoading(false)
  }, [])

  const fetchPriorityConfig = useCallback(async () => {
    setPriorityConfigLoading(true)
    try {
      const res = await fetch('/api/admin/review-priority-config', { credentials: 'include' })
      const data = await res.json()
      if (res.ok && data) {
        setPriorityConfig(data)
        setPriorityForm({
          topic_1: data.topic_1 ?? '',
          topic_2: data.topic_2 ?? '',
          tone_1: data.tone_1 ?? '',
          tone_2: data.tone_2 ?? '',
        })
      }
    } catch { /* ignore */ }
    setPriorityConfigLoading(false)
  }, [])

  const fetchLatestCronRun = useCallback(async () => {
    setCronStatusLoading(true)
    try {
      const res = await fetch('/api/admin/cron-health?job=generate-reviews&limit=5', { credentials: 'include' })
      const json = await res.json()
      const items = json?.jobs?.['generate-reviews']?.items ?? []
      const latest = items[0]
      if (latest) {
        setLatestCronRun({
          startedAt: latest.startedAt,
          endedAt: latest.endedAt ?? null,
          ok: !!latest.ok,
          msg: latest.msg ?? null,
        })
      } else {
        setLatestCronRun(null)
      }
    } catch { setLatestCronRun(null) }
    setCronStatusLoading(false)
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])
  useEffect(() => { fetchNextSchedules() }, [fetchNextSchedules])
  useEffect(() => { fetchLatestCronRun() }, [fetchLatestCronRun])
  useEffect(() => { fetchPriorityConfig() }, [fetchPriorityConfig])

  async function applyPriorityConfig() {
    setPriorityApplyLoading(true)
    try {
      const res = await fetch('/api/admin/review-priority-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(priorityForm),
      })
      if (res.ok) {
        const data = await res.json()
        setPriorityConfig(data)
        showMsg('우선순위 설정이 적용되었습니다.')
      } else {
        showMsg('적용 실패')
      }
    } catch {
      showMsg('적용 실패')
    }
    setPriorityApplyLoading(false)
  }

  async function runDueNow() {
    setManualRunLoading(true)
    setManualRunMsg('')
    try {
      const res = await fetch('/api/admin/cron-health/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      })
      const json = await res.json()
      if (res.ok) {
        setManualRunMsg(`완료: 성공 ${json.success ?? 0}건 / 처리 ${json.processed ?? 0}건`)
        fetchNextSchedules()
        fetchLatestCronRun()
        fetchItems()
      } else {
        setManualRunMsg(json?.error ?? '실패')
      }
    } catch {
      setManualRunMsg('요청 실패')
    }
    setManualRunLoading(false)
    setTimeout(() => setManualRunMsg(''), 8000)
  }

  /** 한 개 업체만 수동 처리 (과부하 방지용) */
  async function runSingleVenue(s: NextScheduleItem) {
    if (!s.canGenerateNow) return
    setSingleProcessPartnerId(s.partnerId)
    try {
      const res = await fetch('/api/admin/cron-health/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ partnerIds: [s.partnerId] }),
      })
      const json = await res.json()
      if (res.ok) {
        showMsg(`처리 완료: ${s.name} (성공 ${json.success ?? 0}건)`)
        fetchNextSchedules()
        fetchLatestCronRun()
        fetchItems()
      } else {
        showMsg(`실패: ${json?.error ?? res.statusText}`)
      }
    } catch {
      showMsg('요청 실패')
    }
    setSingleProcessPartnerId(null)
  }

  /** 업체별 리뷰 수 (region|type|venue_slug → count) */
  const venueCountMap = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of items) {
      const key = `${r.region}|${r.type}|${r.venue_slug}`
      m.set(key, (m.get(key) ?? 0) + 1)
    }
    return m
  }, [items])

  /** 업체별 리뷰 수 정렬 (건수 내림차순) */
  const venueCountList = useMemo(() => {
    const list: { key: string; venue: string; region: string; type: string; count: number }[] = []
    const seen = new Set<string>()
    for (const r of items) {
      const key = `${r.region}|${r.type}|${r.venue_slug}`
      if (seen.has(key)) continue
      seen.add(key)
      list.push({
        key,
        venue: r.venue,
        region: r.region,
        type: r.type,
        count: venueCountMap.get(key) ?? 0,
      })
    }
    return list.sort((a, b) => b.count - a.count)
  }, [items, venueCountMap])

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

  /** 보류: 홈페이지에서 비공개. DB에는 유지되어 중복 제목 검사에 사용됨 (status=draft) */
  async function holdItem(r: ReviewItem) {
    setHoldRestoreLoadingId(r.id)
    try {
      const res = await fetch(`/api/admin/reviews/${r.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'draft' }),
      })
      const data = res.ok ? await res.json().catch(() => null) : null
      const errBody = res.ok ? null : await res.json().catch(() => ({ error: res.statusText }))
      if (res.ok && data) {
        setItems((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: (data as ReviewItem).status ?? 'draft' } : x)))
        showMsg('보류 처리됨. 홈페이지에서 비공개됩니다.')
      } else {
        showMsg(`보류 실패: ${(errBody as { error?: string })?.error ?? res.statusText}`)
      }
    } finally {
      setHoldRestoreLoadingId(null)
    }
  }

  /** 복원: 보류 → 게시로 전환, 홈페이지에 다시 노출 */
  async function restoreItem(r: ReviewItem) {
    setHoldRestoreLoadingId(r.id)
    try {
      const res = await fetch(`/api/admin/reviews/${r.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'published' }),
      })
      const data = res.ok ? await res.json().catch(() => null) : null
      const errBody = res.ok ? null : await res.json().catch(() => ({ error: res.statusText }))
      if (res.ok && data) {
        setItems((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: (data as ReviewItem).status ?? 'published' } : x)))
        showMsg('복원됨. 홈페이지에 다시 노출됩니다.')
      } else {
        showMsg(`복원 실패: ${(errBody as { error?: string })?.error ?? res.statusText}`)
      }
    } finally {
      setHoldRestoreLoadingId(null)
    }
  }

  function openEdit(r: ReviewItem) {
    setEditItem(r)
    setEditForm({
      title: r.title,
      star: r.star,
      sec_overview: r.sec_overview ?? '',
      sec_lineup: r.sec_lineup ?? '',
      sec_price: r.sec_price ?? '',
      sec_facility: r.sec_facility ?? '',
      sec_summary: r.sec_summary ?? '',
    })
  }

  async function saveEdit() {
    if (!editItem || !editForm) return
    const res = await fetch(`/api/admin/reviews/${editItem.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(editForm),
    })
    if (res.ok) {
      setItems((prev) =>
        prev.map((r) =>
          r.id === editItem.id
            ? {
                ...r,
                ...editForm,
              }
            : r
        )
      )
      setEditItem(null)
      setEditForm(null)
      showMsg('수정 완료!')
    } else {
      const err = await res.json()
      showMsg(`수정 실패: ${err?.error ?? res.statusText}`)
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

      {venueCountList.length > 0 && (
        <div className="card-box" style={{ marginBottom: 16 }}>
          <div className="card-box-title">📊 업체별 리뷰 수</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', fontSize: 13 }}>
            {venueCountList.map((v) => (
              <span key={v.key} style={{ color: 'var(--fg)' }}>
                <strong>{v.venue}</strong>
                <span style={{ color: 'var(--muted)', marginLeft: 4 }}>({REGION_SLUG_TO_NAME[v.region] ?? v.region} · {REVIEW_TYPE_TO_NAME[v.type] ?? v.type})</span>
                <span style={{ marginLeft: 6, fontWeight: 600, color: 'var(--accent)' }}>{v.count}건</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="card-box" style={{ marginBottom: 16 }}>
        <div className="card-box-title">⏱ 다음 리뷰 생성 예정 (스케줄)</div>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
          각 제휴업체별 다음 리뷰 가능 시각·상태. <strong>「생성 가능」</strong> = 지금 시점에 크론 후보로 들어감(다음 크론 실행 시 처리 대상). <strong>「처리 대기 중」</strong> = 예정 시각이 이미 지나 다음 크론(20분 간격)에서 처리 예정. 「오늘 한도 소진」/「간격 미충족」은 이번 크론에 포함되지 않음. Cron은 <strong>20분마다</strong> 실행되며, <strong>생성 가능</strong>인 업체 중 다음 가능 시각이 빠른 순 최대 25건 처리.
        </p>
        {cronStatusLoading ? (
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>크론 상태 로딩 중...</p>
        ) : latestCronRun ? (
          <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: latestCronRun.endedAt == null ? 'rgba(230,201,110,.1)' : latestCronRun.ok ? 'rgba(46,204,113,.08)' : 'rgba(255,71,87,.08)' }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>최근 크론 실행: </span>
            <span
              style={{
                fontWeight: 600,
                color: latestCronRun.endedAt == null ? 'var(--gold)' : latestCronRun.ok ? 'var(--green)' : 'var(--red)',
              }}
            >
              {latestCronRun.endedAt == null ? '진행 중' : latestCronRun.ok ? '완료 (성공)' : '완료 (실패)'}
            </span>
            <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 8 }}>
              {new Date(latestCronRun.startedAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            {latestCronRun.endedAt != null && latestCronRun.msg && (
              <div style={{ marginTop: 6, fontSize: 12, color: latestCronRun.ok ? 'var(--muted)' : 'var(--red)' }}>
                {latestCronRun.ok ? null : '실패 원인: '}{latestCronRun.msg}
              </div>
            )}
            {latestCronRun.endedAt != null && (
              <p style={{ marginTop: 6, fontSize: 11, color: 'var(--muted)' }}>
                「제휴 N개」= 크론이 조회한 활성(is_active=true) 제휴업체 수. 예상보다 적으면 <Link href="/admin/partners" style={{ color: 'var(--accent)' }}>제휴업체 관리</Link>에서 활성 여부를 확인하세요.
              </p>
            )}
            <div style={{ marginTop: 6, fontSize: 11, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/admin/cron-health" style={{ color: 'var(--gold)' }}>전체 실행 이력 보기 (크론헬스) →</Link>
            </div>
          </div>
        ) : null}
        {priorityConfigLoading ? (
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>우선순위 설정 로딩 중...</p>
        ) : (
          <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: 'var(--fg)' }}>🎯 리뷰 생성 우선순위 (전역)</div>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>
              1순위·2순위 중 랜덤 선택. 미설정/랜덤 = 전체 풀에서 랜덤. 설정 후 적용 버튼을 눌러 저장하세요.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 10 }}>
              <label style={{ fontSize: 11 }}>
                <span style={{ display: 'block', marginBottom: 4, color: 'var(--muted)' }}>주제 1순위</span>
                <select
                  value={priorityForm.topic_1}
                  onChange={(e) => setPriorityForm((p) => ({ ...p, topic_1: e.target.value }))}
                  style={{ width: '100%', padding: '6px 8px', fontSize: 11, borderRadius: 4, border: '1px solid var(--border)', color: '#000', backgroundColor: '#fff' }}
                >
                  {TOPIC_PRIORITY_OPTIONS.map((o) => (
                    <option key={o.value || 't1-empty'} value={o.value} style={{ color: '#000' }}>{o.label}</option>
                  ))}
                </select>
              </label>
              <label style={{ fontSize: 11 }}>
                <span style={{ display: 'block', marginBottom: 4, color: 'var(--muted)' }}>주제 2순위</span>
                <select
                  value={priorityForm.topic_2}
                  onChange={(e) => setPriorityForm((p) => ({ ...p, topic_2: e.target.value }))}
                  style={{ width: '100%', padding: '6px 8px', fontSize: 11, borderRadius: 4, border: '1px solid var(--border)', color: '#000', backgroundColor: '#fff' }}
                >
                  {TOPIC_PRIORITY_OPTIONS.map((o) => (
                    <option key={o.value || 't2-empty'} value={o.value} style={{ color: '#000' }}>{o.label}</option>
                  ))}
                </select>
              </label>
              <label style={{ fontSize: 11 }}>
                <span style={{ display: 'block', marginBottom: 4, color: 'var(--muted)' }}>말투 1순위</span>
                <select
                  value={priorityForm.tone_1}
                  onChange={(e) => setPriorityForm((p) => ({ ...p, tone_1: e.target.value }))}
                  style={{ width: '100%', padding: '6px 8px', fontSize: 11, borderRadius: 4, border: '1px solid var(--border)', color: '#000', backgroundColor: '#fff' }}
                >
                  {TONE_PRIORITY_OPTIONS.map((o) => (
                    <option key={o.value || 'n1-empty'} value={o.value} style={{ color: '#000' }}>{o.label}</option>
                  ))}
                </select>
              </label>
              <label style={{ fontSize: 11 }}>
                <span style={{ display: 'block', marginBottom: 4, color: 'var(--muted)' }}>말투 2순위</span>
                <select
                  value={priorityForm.tone_2}
                  onChange={(e) => setPriorityForm((p) => ({ ...p, tone_2: e.target.value }))}
                  style={{ width: '100%', padding: '6px 8px', fontSize: 11, borderRadius: 4, border: '1px solid var(--border)', color: '#000', backgroundColor: '#fff' }}
                >
                  {TONE_PRIORITY_OPTIONS.map((o) => (
                    <option key={o.value || 'n2-empty'} value={o.value} style={{ color: '#000' }}>{o.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={applyPriorityConfig}
                disabled={priorityApplyLoading}
                className="btn-save"
                style={{ padding: '6px 14px', fontSize: 12 }}
              >
                {priorityApplyLoading ? '적용 중...' : '적용'}
              </button>
              {priorityConfig && (
                <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 500 }}>
                  적용됨: {formatAppliedConfig(priorityConfig)}
                </span>
              )}
            </div>
          </div>
        )}
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={runDueNow}
            disabled={manualRunLoading}
            className="btn-save"
            style={{ padding: '6px 14px', fontSize: 12 }}
          >
            {manualRunLoading ? '처리 중...' : '곧 항목 수동 처리'}
          </button>
          {manualRunMsg && <span style={{ fontSize: 12, color: 'var(--green)' }}>{manualRunMsg}</span>}
        </div>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>
          「곧」으로 표시된 업체는 다음 가능 시각이 이미 지난 상태입니다. <strong>곧 항목 수동 처리</strong>를 누르면 지금 당장 같은 규칙(다음 가능 시각 빠른 순, 최대 25건)으로 리뷰를 생성합니다. 수동 처리해도 다음 스케줄(예: 12시간 후)은 그대로 적용됩니다.
        </p>
        {scheduleLoading ? (
          <p style={{ color: 'var(--muted)' }}>로딩 중...</p>
        ) : nextSchedules.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>적용된 소개글이 있는 제휴업체가 없습니다.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>업소명</th>
                  <th>지역</th>
                  <th>업종</th>
                  <th>스케줄</th>
                  <th>상태</th>
                  <th>다음 가능 시각 (KST)</th>
                  <th>남은 시간 / 비고</th>
                </tr>
              </thead>
              <tbody>
                {nextSchedules.map((s) => (
                  <tr key={s.partnerId}>
                    <td><strong>{s.name}</strong></td>
                    <td>{REGION_SLUG_TO_NAME[s.region] ?? s.region}</td>
                    <td>{REVIEW_TYPE_TO_NAME[s.type] ?? s.type}</td>
                    <td style={{ fontSize: 11, color: 'var(--muted)' }}>{s.presetLabel}</td>
                    <td>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: s.canGenerateNow ? 'var(--green)' : 'var(--muted)',
                        }}
                      >
                        {s.statusLabel}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{s.nextAtKST}{s.isTomorrow ? ' (내일)' : ''}</td>
                    <td style={{ fontWeight: 500, color: s.canGenerateNow ? 'var(--gold)' : 'var(--muted)' }}>
                      <span style={{ marginRight: 8 }}>{s.inText}</span>
                      <button
                        type="button"
                        onClick={() => runSingleVenue(s)}
                        disabled={!s.canGenerateNow || singleProcessPartnerId !== null}
                        className="btn-save"
                        style={{ padding: '4px 10px', fontSize: 11, opacity: s.canGenerateNow ? 1 : 0.6 }}
                        title={!s.canGenerateNow ? `${s.statusLabel} 상태에서는 다음 가능 시각 이후에 사용 가능` : undefined}
                      >
                        {singleProcessPartnerId === s.partnerId ? '처리 중…' : '처리'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card-box">
        <div className="card-box-title">📋 등록된 리뷰</div>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>
          <strong>보류</strong> = 홈페이지에서 비공개(노출 끔). DB에는 남아 있어 같은 제목 중복 생성 방지에 사용됩니다. <strong>복원</strong> 시 다시 게시됩니다.
        </p>
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>정렬:</span>
          <button
            type="button"
            onClick={() => setSort('latest')}
            className={sort === 'latest' ? 'btn-save' : 'btn-secondary'}
            style={{ padding: '4px 12px', fontSize: 12 }}
          >
            최신순
          </button>
          <button
            type="button"
            onClick={() => setSort('popular')}
            className={sort === 'popular' ? 'btn-save' : 'btn-secondary'}
            style={{ padding: '4px 12px', fontSize: 12 }}
          >
            인기순
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>지역</th>
                <th>업종</th>
                <th>업소</th>
                <th>리뷰수</th>
                <th>제목</th>
                <th>글자수</th>
                <th>말투</th>
                <th>날짜</th>
                <th>상태</th>
                <th>조회수</th>
                <th>AI</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => {
                const reviewUrl = `/${r.region}/${r.type}/${r.venue_slug}/${r.slug}`
                const venueKey = `${r.region}|${r.type}|${r.venue_slug}`
                const venueCount = venueCountMap.get(venueKey) ?? 0
                const dateStr = r.published_at || r.created_at
                const dateFormatted = dateStr
                  ? new Date(dateStr).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                  : '-'
                const toneId = (r.scenario_used as { tone?: string } | null)?.tone
                const toneName = getToneName(toneId)
                const charCount = getCharCount(r)
                return (
                  <tr key={r.id}>
                    <td>{REGION_SLUG_TO_NAME[r.region] ?? r.region}</td>
                    <td>{REVIEW_TYPE_TO_NAME[r.type] ?? r.type}</td>
                    <td>{r.venue}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{venueCount}건</td>
                    <td style={{ maxWidth: 220 }}>
                      <Link href={reviewUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--gold)', textDecoration: 'underline' }}>
                        {r.title}
                      </Link>
                    </td>
                    <td style={{ fontSize: 12 }}>약 {charCount}자</td>
                    <td style={{ fontSize: 11, maxWidth: 140 }} title={toneName}>{toneName !== '-' ? toneName : '-'}</td>
                    <td style={{ fontSize: 12 }}>{dateFormatted}</td>
                    <td>
                      <span style={{ fontSize: 11, fontWeight: 600, color: r.status === 'draft' ? 'var(--gold)' : 'var(--green)' }}>
                        {r.status === 'draft' ? '보류' : '게시'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{(r.view_count ?? 0).toLocaleString()}</td>
                    <td>{r.is_ai_written ? 'Y' : '-'}</td>
                    <td>
                      {r.status === 'draft' ? (
                        <button type="button" className="btn-save" style={{ padding: '4px 10px', fontSize: 11, marginRight: 6 }} onClick={() => restoreItem(r)} disabled={holdRestoreLoadingId === r.id}>{holdRestoreLoadingId === r.id ? '처리 중…' : '복원'}</button>
                      ) : (
                        <button type="button" className="btn-secondary" style={{ padding: '4px 10px', fontSize: 11, marginRight: 6 }} onClick={() => holdItem(r)} disabled={holdRestoreLoadingId === r.id}>{holdRestoreLoadingId === r.id ? '처리 중…' : '보류'}</button>
                      )}
                      <button type="button" className="btn-secondary" style={{ padding: '4px 10px', fontSize: 11, marginRight: 6 }} onClick={() => openEdit(r)}>수정</button>
                      <button type="button" className="btn-danger" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => deleteItem(r.id, r.title)}>삭제</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {items.length === 0 && <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 24 }}>등록된 리뷰가 없습니다.</p>}
      </div>

      {editItem && editForm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-edit-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            className="admin-form-control"
            style={{
              background: '#fff',
              color: '#111',
              borderRadius: 12,
              padding: 24,
              maxWidth: 560,
              width: '90%',
              maxHeight: '85vh',
              overflow: 'auto',
              boxShadow: '0 8px 32px rgba(0,0,0,.3)',
            }}
          >
            <h3 id="review-edit-title" style={{ marginBottom: 16, color: '#111' }}>리뷰 수정</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label>
                <span style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#333' }}>제목</span>
                <input
                  type="text"
                  className="admin-form-control"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  style={{ width: '100%', padding: 8 }}
                />
              </label>
              <label>
                <span style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#333' }}>별점 (1~5)</span>
                <select className="admin-form-control" value={editForm.star} onChange={(e) => setEditForm({ ...editForm, star: Number(e.target.value) })} style={{ padding: 8, width: '100%' }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}점</option>
                  ))}
                </select>
              </label>
              <label>
                <span style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#333' }}>방문 개요</span>
                <textarea className="admin-form-control" value={editForm.sec_overview} onChange={(e) => setEditForm({ ...editForm, sec_overview: e.target.value })} rows={4} style={{ width: '100%', padding: 8 }} />
              </label>
              <label>
                <span style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#333' }}>라인업 / 서비스</span>
                <textarea className="admin-form-control" value={editForm.sec_lineup} onChange={(e) => setEditForm({ ...editForm, sec_lineup: e.target.value })} rows={3} style={{ width: '100%', padding: 8 }} />
              </label>
              <label>
                <span style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#333' }}>가격 분석</span>
                <textarea className="admin-form-control" value={editForm.sec_price} onChange={(e) => setEditForm({ ...editForm, sec_price: e.target.value })} rows={3} style={{ width: '100%', padding: 8 }} />
              </label>
              <label>
                <span style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#333' }}>시설 / 분위기</span>
                <textarea className="admin-form-control" value={editForm.sec_facility} onChange={(e) => setEditForm({ ...editForm, sec_facility: e.target.value })} rows={3} style={{ width: '100%', padding: 8 }} />
              </label>
              <label>
                <span style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#333' }}>종합 평가</span>
                <textarea className="admin-form-control" value={editForm.sec_summary} onChange={(e) => setEditForm({ ...editForm, sec_summary: e.target.value })} rows={3} style={{ width: '100%', padding: 8 }} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button className="btn-primary" onClick={saveEdit}>저장</button>
              <button className="btn-secondary" onClick={() => { setEditItem(null); setEditForm(null) }}>취소</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
