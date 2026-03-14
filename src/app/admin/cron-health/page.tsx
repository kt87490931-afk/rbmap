'use client'

import React, { useState, useEffect, useCallback } from 'react'

interface CronLogItem {
  id: string
  jobName: string
  startedAt: string
  endedAt: string | null
  ok: boolean
  msg: string | null
  processed: number
  successCount: number
  durationMs: number | null
  results: unknown[]
}

interface CronJobData {
  items: CronLogItem[]
  summary: { lastSuccess: string | null; lastFailure: string | null; totalRuns: number }
}

interface CronHealthResponse {
  jobs?: Record<string, CronJobData>
  items?: CronLogItem[]
  summary?: { lastSuccess: string | null; lastFailure: string | null; totalRuns: number }
  error?: string
}

interface PartnerOption {
  id: string
  name: string
}

export default function AdminCronHealthPage() {
  const [data, setData] = useState<CronHealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [partners, setPartners] = useState<PartnerOption[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [running, setRunning] = useState(false)
  const [runMsg, setRunMsg] = useState('')
  const [runOk, setRunOk] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/cron-health?job=all', { credentials: 'include' })
      const json = await res.json()
      setData(json)
    } catch { setData({ jobs: {} }) }
    setLoading(false)
  }, [])

  const fetchPartners = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/cron-health/partners', { credentials: 'include' })
      const json = await res.json()
      setPartners(Array.isArray(json.partners) ? json.partners : [])
    } catch { setPartners([]) }
  }, [])

  useEffect(() => { fetchData(); fetchPartners() }, [fetchData, fetchPartners])

  async function runManual() {
    if (selectedIds.size === 0) {
      setRunOk(false)
      setRunMsg('제휴업체를 1개 이상 선택하세요.')
      setTimeout(() => setRunMsg(''), 3000)
      return
    }
    setRunning(true)
    setRunMsg('')
    try {
      const res = await fetch('/api/admin/cron-health/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ partnerIds: Array.from(selectedIds) }),
      })
      const json = await res.json()
      if (res.ok) {
        setRunOk(true)
        setRunMsg(`수동 실행 완료: ${json.success}/${json.processed}건`)
        setSelectedIds(new Set())
        fetchData()
      } else {
        setRunOk(false)
        setRunMsg(json?.error ?? '실행 실패')
      }
    } catch {
      setRunOk(false)
      setRunMsg('요청 실패')
    }
    setRunning(false)
    setTimeout(() => setRunMsg(''), 5000)
  }

  function togglePartner(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    if (selectedIds.size === partners.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(partners.map((p) => p.id)))
  }

  function formatDate(iso: string | null) {
    if (!iso) return '-'
    const d = new Date(iso)
    return d.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const [sitemapRunning, setSitemapRunning] = useState(false)
  const [sitemapMsg, setSitemapMsg] = useState('')

  async function runSitemapPing() {
    setSitemapRunning(true)
    setSitemapMsg('')
    try {
      const res = await fetch('/api/admin/cron-health/run-sitemap-ping', {
        method: 'POST',
        credentials: 'include',
      })
      const json = await res.json()
      if (res.ok) {
        setSitemapMsg(json.ok ? '구글 Ping 성공!' : (json.msg ?? '실패'))
        fetchData()
      } else {
        setSitemapMsg(json?.error ?? '실행 실패')
      }
    } catch {
      setSitemapMsg('요청 실패')
    }
    setSitemapRunning(false)
    setTimeout(() => setSitemapMsg(''), 5000)
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>로딩 중...</p>

  const jobs = data?.jobs ?? {}
  const reviewsJob = jobs['generate-reviews'] ?? { items: [], summary: { lastSuccess: null, lastFailure: null, totalRuns: 0 } }
  const sitemapJob = jobs['sitemap-ping'] ?? { items: [], summary: { lastSuccess: null, lastFailure: null, totalRuns: 0 } }
  const hasError = !!data?.error

  function renderJobSection(
    title: string,
    subtitle: string,
    jobData: CronJobData,
    renderExtra?: () => React.ReactNode,
    renderHistory: (items: CronLogItem[]) => React.ReactNode
  ) {
    const { items, summary } = jobData
    return (
      <div className="card-box" style={{ marginBottom: 16 }}>
        <div className="card-box-title">{title}</div>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>{subtitle}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 12 }}>
          <div style={{ padding: 16, background: 'var(--card2)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>마지막 성공</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{formatDate(summary.lastSuccess)}</div>
          </div>
          <div style={{ padding: 16, background: 'var(--card2)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>마지막 실패</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: summary.lastFailure ? 'var(--red)' : 'var(--muted)' }}>
              {formatDate(summary.lastFailure)}
            </div>
          </div>
          <div style={{ padding: 16, background: 'var(--card2)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>총 실행 횟수</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{summary.totalRuns}회</div>
          </div>
        </div>
        {renderExtra?.()}
        <div style={{ marginTop: 12 }}>
          <div className="card-box-title" style={{ marginBottom: 8 }}>📋 실행 이력</div>
          {renderHistory(items)}
        </div>
      </div>
    )
  }

  function renderHistoryTable(items: CronLogItem[], showDetail: (r: CronLogItem) => boolean) {
    return (
      <>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>실행 시각</th>
                <th>상태</th>
                <th>메시지</th>
                <th>처리</th>
                <th>성공</th>
                <th>소요(ms)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => {
                const resList = Array.isArray(r.results) ? r.results as { name?: string; ok?: boolean; msg?: string }[] : []
                return (
                  <React.Fragment key={r.id}>
                    <tr>
                      <td style={{ fontSize: 12 }}>{formatDate(r.startedAt)}</td>
                      <td>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            background: r.ok ? 'rgba(46,204,113,.2)' : 'rgba(255,71,87,.2)',
                            color: r.ok ? 'var(--green)' : 'var(--red)',
                          }}
                        >
                          {r.ok ? '성공' : '실패'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, maxWidth: 220 }} title={r.msg ?? ''}>
                        {r.msg ? (r.msg.length > 30 ? r.msg.slice(0, 30) + '…' : r.msg) : '-'}
                      </td>
                      <td>{r.processed}</td>
                      <td>{r.successCount}</td>
                      <td>{r.durationMs != null ? `${r.durationMs}ms` : '-'}</td>
                    </tr>
                    {showDetail(r) && resList.length > 0 && (
                      <tr style={{ background: 'var(--card2)' }}>
                        <td colSpan={6} style={{ padding: '8px 16px', fontSize: 11, color: 'var(--muted)', borderTop: 'none' }}>
                          {resList.map((x, i) => (
                            <div key={i} style={{ marginBottom: 4 }}>
                              <strong>{x.name ?? '업체'}</strong>: {x.ok ? '✓ 리뷰 생성' : (x.msg ?? '-')}
                            </div>
                          ))}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
        {items.length === 0 && (
          <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 24 }}>
            아직 실행 이력이 없습니다. Cron이 한 번이라도 실행되면 여기에 표시됩니다.
          </p>
        )}
      </>
    )
  }

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-title">크론헬스</h1>
        <p className="admin-subtitle">Cron 실행 이력 · 정상 동작 여부 확인</p>
      </div>

      {hasError && (
        <div style={{ padding: 12, marginBottom: 14, borderRadius: 8, background: 'rgba(255,71,87,.1)', color: 'var(--red)', fontSize: 13 }}>
          cron_health 테이블이 없을 수 있습니다. Supabase에서 supabase-cron-health.sql을 실행해 주세요.
        </div>
      )}

      {renderJobSection(
        '📌 리뷰 자동 생성',
        'Cron은 KST 0시, 6시, 12시, 18시에 실행됩니다. 적용된 소개글이 있는 제휴업체마다 리뷰 1건씩 생성됩니다.',
        reviewsJob,
        () => (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>제휴업체를 선택한 뒤 수동 실행하면 즉시 리뷰가 생성됩니다.</p>
            {partners.length > 0 ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <button type="button" onClick={selectAll} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
                    {selectedIds.size === partners.length ? '전체 해제' : '전체 선택'}
                  </button>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{selectedIds.size}개 선택</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  {partners.map((p) => (
                    <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                      <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => togglePartner(p.id)} />
                      {p.name}
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={runManual}
                  disabled={running || selectedIds.size === 0}
                  className="btn-save"
                  style={{ padding: '8px 20px', fontSize: 13 }}
                >
                  {running ? '실행 중...' : '수동 실행'}
                </button>
                {runMsg && <span style={{ marginLeft: 12, fontSize: 13, color: runOk ? 'var(--green)' : 'var(--red)' }}>{runMsg}</span>}
              </>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--muted)' }}>적용된 소개글이 있는 제휴업체가 없습니다.</p>
            )}
          </div>
        ),
        (items) => renderHistoryTable(items, (r) => Array.isArray(r.results) && (r.results as { name?: string }[]).some((x) => x.name))
      )}

      {renderJobSection(
        '🗺️ 사이트맵 Ping',
        '매일 KST 06시 실행. 구글에 sitemap.xml 크롤을 요청하여 새 콘텐츠 색인을 촉진합니다.',
        sitemapJob,
        () => (
          <div style={{ marginBottom: 12 }}>
            <button
              type="button"
              onClick={runSitemapPing}
              disabled={sitemapRunning}
              className="btn-save"
              style={{ padding: '8px 20px', fontSize: 13 }}
            >
              {sitemapRunning ? '실행 중...' : '수동 실행'}
            </button>
            {sitemapMsg && <span style={{ marginLeft: 12, fontSize: 13, color: sitemapMsg.includes('성공') ? 'var(--green)' : 'var(--red)' }}>{sitemapMsg}</span>}
          </div>
        ),
        (items) => renderHistoryTable(items, () => false)
      )}
    </>
  )
}
