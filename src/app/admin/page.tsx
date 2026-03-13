'use client'

import { useState, useEffect, useCallback } from 'react'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({ regions: 0, partners: 0, feed: 0, reviews: 0 })
  const [telegramTest, setTelegramTest] = useState<'idle' | 'sending' | 'ok' | 'fail'>('idle')

  const fetchCounts = useCallback(async () => {
    try {
      const [r, p, f, rev] = await Promise.all([
        fetch('/api/admin/regions'),
        fetch('/api/admin/partners'),
        fetch('/api/admin/feed'),
        fetch('/api/admin/reviews'),
      ])
      const regions = await r.json()
      const partners = await p.json()
      const feed = await f.json()
      const reviews = await rev.json()
      setCounts({
        regions: Array.isArray(regions) ? regions.length : 0,
        partners: Array.isArray(partners) ? partners.length : 0,
        feed: Array.isArray(feed) ? feed.length : 0,
        reviews: Array.isArray(reviews) ? reviews.length : 0,
      })
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
