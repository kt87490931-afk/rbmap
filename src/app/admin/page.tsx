'use client'

import { useState, useEffect, useCallback } from 'react'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({ regions: 0, partners: 0, feed: 0, reviews: 0 })
  const [telegramTest, setTelegramTest] = useState<'idle' | 'sending' | 'ok' | 'fail'>('idle')
  const [visitorOffset, setVisitorOffset] = useState(0)
  const [todayVisitors, setTodayVisitors] = useState(0)
  const [visitorSaving, setVisitorSaving] = useState(false)
  const [visitorSaved, setVisitorSaved] = useState(false)

  // 24시 KST 기준 점진 반영: 추가 인원이 00시에는 0, 24시에 가까울수록 설정값까지 증가
  const effectiveVisitorOffset = (() => {
    const msKST = Date.now() + 9 * 60 * 60 * 1000
    const msInDay = 24 * 60 * 60 * 1000
    const msSinceMidnight = ((msKST % msInDay) + msInDay) % msInDay
    const minutesSinceMidnight = msSinceMidnight / (60 * 1000)
    const ratio = Math.min(1, minutesSinceMidnight / (24 * 60))
    return Math.round(visitorOffset * ratio)
  })()

  const fetchCounts = useCallback(async () => {
    try {
      const [r, p, f, rev, logs, config] = await Promise.all([
        fetch('/api/admin/regions'),
        fetch('/api/admin/partners'),
        fetch('/api/admin/feed'),
        fetch('/api/admin/reviews'),
        fetch('/api/admin/visit-logs'),
        fetch('/api/admin/site/visitor_config'),
      ])
      const regions = await r.json()
      const partners = await p.json()
      const feed = await f.json()
      const reviews = await rev.json()
      const logsData = await logs.json()
      const configData = await config.json()
      setCounts({
        regions: Array.isArray(regions) ? regions.length : 0,
        partners: Array.isArray(partners) ? partners.length : 0,
        feed: Array.isArray(feed) ? feed.length : 0,
        reviews: Array.isArray(reviews) ? reviews.length : 0,
      })
      setTodayVisitors(Number(logsData?.todayVisitors ?? 0))
      setVisitorOffset(Number(configData?.visitor_offset ?? 0))
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchCounts() }, [fetchCounts])

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
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
          <a href="/admin/regions" className="btn-save" style={{ textDecoration: 'none' }}>🗺 지역 관리</a>
          <a href="/admin/partners" className="btn-success" style={{ textDecoration: 'none' }}>🤝 제휴업체 관리</a>
          <a href="/admin/live-feed" className="btn-save" style={{ textDecoration: 'none' }}>📡 Live Feed 관리</a>
          <a href="/admin/reviews" className="btn-success" style={{ textDecoration: 'none' }}>⭐ 리뷰 관리</a>
          <a href="/admin/seo" className="btn-save" style={{ textDecoration: 'none' }}>🔍 SEO</a>
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
