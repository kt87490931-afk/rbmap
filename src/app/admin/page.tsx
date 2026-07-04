'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

type PublishCronStats = {
  published: number
  draft: number
  schedule: string
  lastSuccess: string | null
  lastFailure: string | null
  lastSuccessMsg: string | null
  lastFailureMsg: string | null
  totalRuns: number
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({ regions: 0, partners: 0, feed: 0, reviews: 0 })
  const [telegramTest, setTelegramTest] = useState<'idle' | 'sending' | 'ok' | 'fail'>('idle')
  const [cronPaused, setCronPaused] = useState<boolean | null>(null)
  const [cronPauseLoading, setCronPauseLoading] = useState(false)
  const [visitorOffset, setVisitorOffset] = useState(0)
  const [todayVisitors, setTodayVisitors] = useState(0)
  const [visitorSaving, setVisitorSaving] = useState(false)
  const [visitorSaved, setVisitorSaved] = useState(false)
  const [publishCron, setPublishCron] = useState<PublishCronStats | null>(null)
  const [publishTestRunning, setPublishTestRunning] = useState(false)
  const [publishTestMsg, setPublishTestMsg] = useState('')
  const [publishTestOk, setPublishTestOk] = useState(true)

  // 24시 KST 기준 점진 반영: 추가 인원이 00시에는 0, 24시에 가까울수록 설정값까지 증가
  const effectiveVisitorOffset = (() => {
    const msKST = Date.now() + 9 * 60 * 60 * 1000
    const msInDay = 24 * 60 * 60 * 1000
    const msSinceMidnight = ((msKST % msInDay) + msInDay) % msInDay
    const minutesSinceMidnight = msSinceMidnight / (60 * 1000)
    const ratio = Math.min(1, minutesSinceMidnight / (24 * 60))
    return Math.round(visitorOffset * ratio)
  })()

  const fetchPublishCron = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/cron-health/run-publish-reviews', { credentials: 'include' })
      if (res.ok) setPublishCron(await res.json())
    } catch { setPublishCron(null) }
  }, [])

  const fetchCounts = useCallback(async () => {
    try {
      const [r, p, f, rev, logs, config, cronControl] = await Promise.all([
        fetch('/api/admin/regions'),
        fetch('/api/admin/partners'),
        fetch('/api/admin/feed'),
        fetch('/api/admin/reviews'),
        fetch('/api/admin/visit-logs'),
        fetch('/api/admin/site/visitor_config'),
        fetch('/api/admin/site/cron_control'),
      ])
      const regions = await r.json()
      const partners = await p.json()
      const feed = await f.json()
      const reviews = await rev.json()
      const logsData = await logs.json()
      const configData = await config.json()
      const cronControlData = await cronControl.json()
      setCounts({
        regions: Array.isArray(regions) ? regions.length : 0,
        partners: Array.isArray(partners) ? partners.length : 0,
        feed: Array.isArray(feed) ? feed.length : 0,
        reviews: Array.isArray(reviews) ? reviews.length : 0,
      })
      setTodayVisitors(Number(logsData?.todayVisitors ?? 0))
      setVisitorOffset(Number(configData?.visitor_offset ?? 0))
      setCronPaused(cronControlData?.review_cron_paused === true)
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCounts()
    fetchPublishCron()
  }, [fetchCounts, fetchPublishCron])

  function formatKst(iso: string | null) {
    if (!iso) return '-'
    return new Date(iso).toLocaleString('ko-KR', {
      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  }

  async function runPublishTest() {
    setPublishTestRunning(true)
    setPublishTestMsg('')
    try {
      const res = await fetch('/api/admin/cron-health/run-publish-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ test: true }),
      })
      const json = await res.json()
      if (res.ok) {
        setPublishTestOk(json.ok !== false)
        const title = json.results?.[0]?.title as string | undefined
        setPublishTestMsg(title ? `1건 공개 · ${title.slice(0, 28)}…` : '1건 공개 완료')
        fetchPublishCron()
      } else {
        setPublishTestOk(false)
        setPublishTestMsg(json?.error ?? '실패')
      }
    } catch {
      setPublishTestOk(false)
      setPublishTestMsg('요청 실패')
    }
    setPublishTestRunning(false)
    setTimeout(() => setPublishTestMsg(''), 6000)
  }

  async function setCronPausedState(paused: boolean) {
    setCronPauseLoading(true)
    try {
      const res = await fetch('/api/admin/site/cron_control', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ review_cron_paused: paused }),
      })
      const json = await res.json()
      if (res.ok) setCronPaused(json?.review_cron_paused === true)
    } catch { /* ignore */ }
    setCronPauseLoading(false)
  }

  if (loading) {
    return <p style={{ color: 'var(--muted)' }}>로딩 중...</p>
  }

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-title">DASHBOARD</h1>
        <p className="admin-subtitle">관리자 대시보드 · 룸빵여지도</p>
      </div>

      <div className="stats-grid4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-card-num" style={{ color: 'var(--gold)' }}>{counts.regions}</div>
          <div className="stat-card-label">지역 수</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-num" style={{ color: 'var(--blue)' }}>{counts.partners}</div>
          <div className="stat-card-label">제휴업체 수</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-num" style={{ color: 'var(--green)' }}>{counts.feed}</div>
          <div className="stat-card-label">Live Feed</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-num" style={{ color: 'var(--purple)' }}>{counts.reviews}</div>
          <div className="stat-card-label">리뷰 수</div>
        </div>
      </div>

      <div className="card-box">
        <div className="card-box-title">📤 00:00 리뷰 자동 공개</div>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 12 }}>
          매일 <strong>00:00 KST</strong>에 비공개(draft) 리뷰 중 <strong>랜덤 5건</strong>을 자동 공개합니다. 메인 후기(최신 100개)에 최신순으로 반영됩니다.
        </p>
        {publishCron ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>공개 / 비공개</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                <span style={{ color: 'var(--green)' }}>{publishCron.published}</span>
                {' / '}
                <span style={{ color: 'var(--muted)' }}>{publishCron.draft}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>마지막 성공</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>{formatKst(publishCron.lastSuccess)}</div>
              {publishCron.lastSuccessMsg && (
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{publishCron.lastSuccessMsg}</div>
              )}
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>마지막 실패</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: publishCron.lastFailure ? 'var(--red)' : 'var(--muted)' }}>
                {formatKst(publishCron.lastFailure)}
              </div>
              {publishCron.lastFailureMsg && (
                <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 2 }}>{publishCron.lastFailureMsg}</div>
              )}
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>총 실행</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{publishCron.totalRuns}회</div>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>크론 상태 로딩 중…</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-save"
            disabled={publishTestRunning}
            onClick={runPublishTest}
          >
            {publishTestRunning ? '테스트 중…' : '🧪 테스트 (1건 공개)'}
          </button>
          {publishTestMsg && (
            <span style={{ fontSize: 13, color: publishTestOk ? 'var(--green)' : 'var(--red)' }}>{publishTestMsg}</span>
          )}
          <Link href="/admin/cron-health" style={{ fontSize: 13, color: 'var(--gold)' }}>
            전체 실행 이력 →
          </Link>
        </div>
      </div>

      <div className="card-box">
        <div className="card-box-title">오늘 접속자 설정</div>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 12 }}>
          메인 페이지에는 &quot;오늘의접속자: (실제 방문자 + 추가 인원)&quot;이 <strong>24시 기준으로 점차 증가</strong>하는 방식으로 표시됩니다. 00시에는 추가 인원이 0에서 시작해, 24시에 가까울수록 설정한 추가 인원까지 천천히 반영됩니다.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span>실제 방문자: {todayVisitors.toLocaleString()}</span>
          <span>+</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>추가 인원 (24시 목표)</span>
            <input
              type="number"
              className="admin-form-control"
              min={0}
              value={visitorOffset}
              onChange={(e) => setVisitorOffset(Number(e.target.value) || 0)}
              style={{ width: 80, padding: '6px 8px' }}
            />
          </label>
          <span>=</span>
          <strong>메인 표시 (현재): {(todayVisitors + effectiveVisitorOffset).toLocaleString()}</strong>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>
            (현재 시점 반영: +{effectiveVisitorOffset.toLocaleString()})
          </span>
          <button
            type="button"
            className="btn-save"
            disabled={visitorSaving}
            onClick={async () => {
              setVisitorSaving(true)
              setVisitorSaved(false)
              try {
                const r = await fetch('/api/admin/site/visitor_config', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ visitor_offset: visitorOffset }),
                })
                if (r.ok) setVisitorSaved(true)
              } catch { /* ignore */ }
              setVisitorSaving(false)
              setTimeout(() => setVisitorSaved(false), 2000)
            }}
          >
            {visitorSaving ? '저장 중...' : visitorSaved ? '저장됨' : '저장'}
          </button>
        </div>
      </div>

      <div className="card-box">
        <div className="card-box-title">⚡ 빠른 액션</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <strong>리뷰 생성 크론:</strong>
          {cronPaused === null ? (
            <span style={{ color: 'var(--muted)' }}>확인 중...</span>
          ) : cronPaused ? (
            <span style={{ color: 'var(--gold)', fontWeight: 700 }}>정지</span>
          ) : (
            <span style={{ color: 'var(--green)', fontWeight: 700 }}>동작 중</span>
          )}
          <button
            type="button"
            className="btn-danger"
            style={{ padding: '6px 12px' }}
            disabled={cronPauseLoading || cronPaused === true}
            onClick={() => setCronPausedState(true)}
          >
            {cronPauseLoading ? '처리 중...' : '크론 정지'}
          </button>
          <button
            type="button"
            className="btn-save"
            style={{ padding: '6px 12px' }}
            disabled={cronPauseLoading || cronPaused === false}
            onClick={() => setCronPausedState(false)}
          >
            {cronPauseLoading ? '처리 중...' : '크론 재개'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
          <a href="/admin/regions" className="btn-save" style={{ textDecoration: 'none' }}>🗺 지역 관리</a>
          <a href="/admin/partners" className="btn-success" style={{ textDecoration: 'none' }}>🤝 제휴업체 관리</a>
          <a href="/admin/live-feed" className="btn-save" style={{ textDecoration: 'none' }}>📡 Live Feed 관리</a>
          <a href="/admin/reviews" className="btn-success" style={{ textDecoration: 'none' }}>⭐ 리뷰 관리</a>
          <a href="/admin/seo" className="btn-save" style={{ textDecoration: 'none' }}>🔍 SEO</a>
          <a href="/admin/analytics" className="btn-success" style={{ textDecoration: 'none' }}>📈 통계</a>
          <a href="/admin/visit-logs" className="btn-save" style={{ textDecoration: 'none' }}>📋 접속자 로그</a>
          <a href="/admin/threats" className="btn-save" style={{ textDecoration: 'none' }}>🚨 위험 감지</a>
          <button
            type="button"
            className="btn-save"
            disabled={telegramTest === 'sending'}
            onClick={async () => {
              setTelegramTest('sending')
              try {
                const r = await fetch('/api/admin/telegram-test', { method: 'POST' })
                const data = await r.json()
                setTelegramTest(data.ok ? 'ok' : 'fail')
              } catch { setTelegramTest('fail') }
              setTimeout(() => setTelegramTest('idle'), 2000)
            }}
          >
            {telegramTest === 'sending' ? '📤 전송 중...' : telegramTest === 'ok' ? '✅ 텔레그램 성공' : telegramTest === 'fail' ? '❌ 실패' : '📱 텔레그램 테스트'}
          </button>
        </div>
      </div>
    </>
  )
}
