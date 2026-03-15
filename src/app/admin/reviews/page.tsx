'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { REGION_SLUG_TO_NAME } from '@/lib/data/venues'
import { REVIEW_TYPE_TO_NAME } from '@/lib/data/review-posts'
import { REVIEW_TONES } from '@/lib/review-scenarios'

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
  const [msg, setMsg] = useState('')
  const [editItem, setEditItem] = useState<ReviewItem | null>(null)
  const [editForm, setEditForm] = useState<{ title: string; star: number; sec_overview: string; sec_lineup: string; sec_price: string; sec_facility: string; sec_summary: string } | null>(null)

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/reviews', { credentials: 'include' })
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch { setItems([]) }
    setLoading(false)
  }, [])

  const fetchNextSchedules = useCallback(async () => {
    setScheduleLoading(true)
    try {
      const res = await fetch('/api/admin/reviews/next-schedule', { credentials: 'include' })
      const data = await res.json()
      setNextSchedules(Array.isArray(data) ? data : [])
    } catch { setNextSchedules([]) }
    setScheduleLoading(false)
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
          각 제휴업체별 다음 리뷰 가능 시각·남은 시간 (분 단위 표기). <strong>「곧」</strong> = 이미 가능 시각이 지났거나 1분 이내(다음 Cron 실행 시 우선 처리). Cron은 <strong>다음 가능 시각이 가장 빠른 업체부터</strong> 최대 25건까지 처리합니다.
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
            {latestCronRun.endedAt != null && !latestCronRun.ok && latestCronRun.msg && (
              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--red)' }}>실패 원인: {latestCronRun.msg}</div>
            )}
            <div style={{ marginTop: 6, fontSize: 11 }}>
              <Link href="/admin/cron-health" style={{ color: 'var(--gold)' }}>전체 실행 이력 보기 (크론헬스) →</Link>
            </div>
          </div>
        ) : null}
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
                  <th>다음 가능 시각 (KST)</th>
                  <th>남은 시간</th>
                </tr>
              </thead>
              <tbody>
                {nextSchedules.map((s) => (
                  <tr key={s.partnerId}>
                    <td><strong>{s.name}</strong></td>
                    <td>{REGION_SLUG_TO_NAME[s.region] ?? s.region}</td>
                    <td>{REVIEW_TYPE_TO_NAME[s.type] ?? s.type}</td>
                    <td style={{ fontSize: 11, color: 'var(--muted)' }}>{s.presetLabel}</td>
                    <td style={{ fontSize: 12 }}>{s.nextAtKST}{s.isTomorrow ? ' (내일)' : ''}</td>
                    <td style={{ fontWeight: 600, color: 'var(--gold)' }}>{s.inText}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card-box">
        <div className="card-box-title">📋 등록된 리뷰</div>
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
                    <td>{r.is_ai_written ? 'Y' : '-'}</td>
                    <td>
                      <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: 11, marginRight: 6 }} onClick={() => openEdit(r)}>수정</button>
                      <button className="btn-danger" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => deleteItem(r.id, r.title)}>삭제</button>
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
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => { setEditItem(null); setEditForm(null) }}
        >
          <div
            style={{
              background: 'var(--bg)',
              borderRadius: 12,
              padding: 24,
              maxWidth: 560,
              width: '90%',
              maxHeight: '85vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 16 }}>리뷰 수정</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label>
                <span style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>제목</span>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  style={{ width: '100%', padding: 8 }}
                />
              </label>
              <label>
                <span style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>별점 (1~5)</span>
                <select value={editForm.star} onChange={(e) => setEditForm({ ...editForm, star: Number(e.target.value) })} style={{ padding: 8 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}점</option>
                  ))}
                </select>
              </label>
              <label>
                <span style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>방문 개요</span>
                <textarea value={editForm.sec_overview} onChange={(e) => setEditForm({ ...editForm, sec_overview: e.target.value })} rows={4} style={{ width: '100%', padding: 8 }} />
              </label>
              <label>
                <span style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>라인업 / 서비스</span>
                <textarea value={editForm.sec_lineup} onChange={(e) => setEditForm({ ...editForm, sec_lineup: e.target.value })} rows={3} style={{ width: '100%', padding: 8 }} />
              </label>
              <label>
                <span style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>가격 분석</span>
                <textarea value={editForm.sec_price} onChange={(e) => setEditForm({ ...editForm, sec_price: e.target.value })} rows={3} style={{ width: '100%', padding: 8 }} />
              </label>
              <label>
                <span style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>시설 / 분위기</span>
                <textarea value={editForm.sec_facility} onChange={(e) => setEditForm({ ...editForm, sec_facility: e.target.value })} rows={3} style={{ width: '100%', padding: 8 }} />
              </label>
              <label>
                <span style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>종합 평가</span>
                <textarea value={editForm.sec_summary} onChange={(e) => setEditForm({ ...editForm, sec_summary: e.target.value })} rows={3} style={{ width: '100%', padding: 8 }} />
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
