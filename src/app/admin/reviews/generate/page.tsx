'use client'

import { useState, useEffect, useCallback } from 'react'
import { REVIEW_SCHEDULE_PRESETS, type ReviewSchedulePresetId } from '@/lib/review-schedule'
import { REVIEW_TONES } from '@/lib/review-scenarios'
import { REVIEW_TOPICS_FOR_MANUAL_SELECT } from '@/lib/review-topics'

interface ScheduleItem {
  partnerId: string
  name: string
  region: string
  type: string
  href: string
  hasIntro: boolean
  lastReviewAt: string | null
  lastCharCount: number | null
  lastTone: string | null
  nextReviewAt: string | null
  canGenerate: boolean
  reviewSchedulePreset?: string
}

export default function AdminReviewGeneratePage() {
  const [items, setItems] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'success' | 'error'>('success')
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [topicByPartner, setTopicByPartner] = useState<Record<string, string>>({})
  const [toneByPartner, setToneByPartner] = useState<Record<string, string>>({})

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/reviews/schedule', { credentials: 'include' })
      const data = await res.json()
      const arr = Array.isArray(data) ? data : []
      setItems(arr)
      setTopicByPartner((prev) => {
        const next = { ...prev }
        for (const r of arr) {
          if (!(r.partnerId in next)) next[r.partnerId] = ''
        }
        return next
      })
      setToneByPartner((prev) => {
        const next = { ...prev }
        for (const r of arr) {
          if (!(r.partnerId in next)) next[r.partnerId] = ''
        }
        return next
      })
    } catch { setItems([]) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  function showMsg(text: string, type: 'success' | 'error' = 'success') {
    setMsgType(type)
    setMsg(text)
    setTimeout(() => setMsg(''), 4000)
  }

  async function generateForPartner(partnerId: string) {
    setGeneratingId(partnerId)
    const topic = topicByPartner[partnerId] ?? ''
    const tone = toneByPartner[partnerId] ?? ''
    try {
      const res = await fetch('/api/admin/reviews/generate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_id: partnerId,
          topic: topic || undefined,
          tone: tone || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        showMsg(`리뷰 생성 완료: ${data.charCount}자, ${data.tone}`)
        fetchItems()
      } else {
        showMsg(data.error || '생성 실패', 'error')
      }
    } catch (e) {
      showMsg(String(e), 'error')
    } finally {
      setGeneratingId(null)
    }
  }

  function formatDate(iso: string | null) {
    if (!iso) return '-'
    const d = new Date(iso)
    return d.toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>로딩 중...</p>

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-title">리뷰생성</h1>
        <p className="admin-subtitle">제휴업체별 AI 리뷰 수동 생성 · 8시간마다 자동 생성 (Cron)</p>
      </div>

      {msg && (
        <div
          style={{
            padding: '10px 16px',
            marginBottom: 14,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            background: msgType === 'error' ? 'rgba(255,71,87,.15)' : 'rgba(46,204,113,.1)',
            color: msgType === 'error' ? 'var(--red)' : 'var(--green)',
            border: msgType === 'error' ? '1px solid rgba(255,71,87,.3)' : '1px solid rgba(46,204,113,.3)',
          }}
        >
          {msg}
        </div>
      )}

      <div className="card-box">
        <div className="card-box-title">📋 제휴업체별 스케줄</div>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
          적용된 소개글이 있고 활성화된 제휴업체만 표시됩니다. 제휴업체별 스케줄(6h/4건, 8h/3건, 12h/2건, 24h/1건)에 따라 자동·수동 생성 가능 시점이 달라집니다.
        </p>
        <div style={{ padding: 12, marginBottom: 16, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}>
          <strong>🌱 시드 기반 다양성</strong>
          <p style={{ margin: '6px 0 0', color: 'var(--muted)', lineHeight: 1.5 }}>
            업체명·지역·기존 리뷰 수 기준으로 시나리오·톤·오프닝·포커스가 결정론적으로 선택됩니다. 
            같은 업체도 리뷰가 쌓일수록 다른 조합이 적용되어 다양성이 확보됩니다.
          </p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>업체명</th>
                <th>지역</th>
                <th>업종</th>
                <th>스케줄</th>
                <th>소개글</th>
                <th>마지막 리뷰</th>
                <th>글자수</th>
                <th>주제</th>
                <th>말투톤</th>
                <th>다음 작성 가능</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => {
                const presetId = (r.reviewSchedulePreset || '8h_3') as ReviewSchedulePresetId
                const presetLabel = REVIEW_SCHEDULE_PRESETS[presetId]?.label ?? presetId
                return (
                <tr key={r.partnerId}>
                  <td style={{ fontWeight: 600 }}>{r.name}</td>
                  <td>{r.region}</td>
                  <td>{r.type}</td>
                  <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{presetLabel}</td>
                  <td>{r.hasIntro ? '✓' : <span style={{ color: 'var(--red)' }}>없음</span>}</td>
                  <td style={{ fontSize: 12 }}>{formatDate(r.lastReviewAt)}</td>
                  <td>{r.lastCharCount != null ? `${r.lastCharCount}자` : '-'}</td>
                  <td style={{ minWidth: 160 }}>
                    <select
                      value={topicByPartner[r.partnerId] ?? ''}
                      onChange={(e) => setTopicByPartner((prev) => ({ ...prev, [r.partnerId]: e.target.value }))}
                      style={{ width: '100%', maxWidth: 180, padding: '4px 6px', fontSize: 11, borderRadius: 4, border: '1px solid var(--border)' }}
                    >
                      {REVIEW_TOPICS_FOR_MANUAL_SELECT.map((opt) => (
                        <option key={opt.value || 'rand'} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ minWidth: 160 }}>
                    <select
                      value={toneByPartner[r.partnerId] ?? ''}
                      onChange={(e) => setToneByPartner((prev) => ({ ...prev, [r.partnerId]: e.target.value }))}
                      style={{ width: '100%', maxWidth: 180, padding: '4px 6px', fontSize: 11, borderRadius: 4, border: '1px solid var(--border)' }}
                    >
                      <option value="">랜덤 (자동)</option>
                      {REVIEW_TONES.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ fontSize: 12 }}>{formatDate(r.nextReviewAt)}</td>
                  <td>
                    <button
                      className="btn-save"
                      style={{ padding: '4px 10px', fontSize: 11 }}
                      onClick={() => generateForPartner(r.partnerId)}
                      disabled={!r.canGenerate || generatingId === r.partnerId}
                      title={!r.hasIntro ? '적용된 소개글 필요' : !r.canGenerate ? '간격/일 한도 대기 중' : '지금 생성'}
                    >
                      {generatingId === r.partnerId ? '생성 중…' : r.canGenerate ? '지금 생성' : '대기 중'}
                    </button>
                  </td>
                </tr>
              )
              })}
            </tbody>
          </table>
        </div>
        {items.length === 0 && (
          <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 24 }}>
            활성 제휴업체가 없거나 적용된 소개글이 없습니다. 제휴업체 관리에서 활성화하고, 업체소개글을 작성·적용해 주세요.
          </p>
        )}
      </div>
    </>
  )
}
