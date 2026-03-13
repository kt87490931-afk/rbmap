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

interface CronHealthResponse {
  items: CronLogItem[]
  summary: { lastSuccess: string | null; lastFailure: string | null; totalRuns: number }
  error?: string
}

export default function AdminCronHealthPage() {
  const [data, setData] = useState<CronHealthResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/cron-health', { credentials: 'include' })
      const json = await res.json()
      setData(json)
    } catch { setData({ items: [], summary: { lastSuccess: null, lastFailure: null, totalRuns: 0 } }) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function formatDate(iso: string | null) {
    if (!iso) return '-'
    const d = new Date(iso)
    return d.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>로딩 중...</p>

  const items = data?.items ?? []
  const summary = data?.summary ?? { lastSuccess: null, lastFailure: null, totalRuns: 0 }
  const hasError = !!data?.error

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-title">크론헬스</h1>
        <p className="admin-subtitle">리뷰 자동 생성 Cron 실행 이력 · 정상 동작 여부 확인</p>
      </div>

      {hasError && (
        <div style={{ padding: 12, marginBottom: 14, borderRadius: 8, background: 'rgba(255,71,87,.1)', color: 'var(--red)', fontSize: 13 }}>
          cron_health 테이블이 없을 수 있습니다. Supabase에서 supabase-cron-health.sql을 실행해 주세요.
        </div>
      )}

      <div className="card-box" style={{ marginBottom: 16 }}>
        <div className="card-box-title">📊 요약</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
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
        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12 }}>
          Cron은 0시, 6시, 12시, 18시에 실행됩니다. 매 실행 시 적용된 소개글이 있는 제휴업체마다 리뷰 1건 생성.
        </p>
      </div>

      <div className="card-box">
        <div className="card-box-title">📋 실행 이력</div>
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
                    {resList.length > 0 && (
                      <tr key={`${r.id}-detail`} style={{ background: 'var(--card2)' }}>
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
      </div>
    </>
  )
}
