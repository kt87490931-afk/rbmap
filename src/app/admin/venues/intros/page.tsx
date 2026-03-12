'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface IntroItem {
  id: string
  form_json: { name?: string; region?: string; type?: string }
  ai_tone: string
  period_days: number
  intro_ai_json?: { content?: string }
  is_public?: boolean
  created_at: string
}

export default function AdminVenueIntrosPage() {
  const [items, setItems] = useState<IntroItem[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/venues/intro')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  function showMsg(text: string) {
    setMsg(text)
    setTimeout(() => setMsg(''), 3000)
  }

  async function deleteItem(id: string, title: string) {
    if (!confirm(`"${title}" 소개글을 삭제하시겠습니까?`)) return
    const res = await fetch(`/api/admin/venues/intro/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setItems((prev) => prev.filter((r) => r.id !== id))
      showMsg('삭제 완료')
    } else {
      const err = await res.json()
      alert(err.error || '삭제 실패')
    }
  }

  const getName = (x: IntroItem) =>
    (x.form_json?.name as string) || '제목없음'

  if (loading) return <p style={{ color: 'var(--muted)' }}>로딩 중...</p>

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-title">업체소개글 관리</h1>
        <p className="admin-subtitle">저장된 업체소개글 목록 (공개/비공개는 DB 마이그레이션 후 사용)</p>
      </div>

      {msg && (
        <div
          style={{
            padding: '10px 16px',
            marginBottom: 14,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            background: 'rgba(46,204,113,.1)',
            color: 'var(--green)',
            border: '1px solid rgba(46,204,113,.3)',
          }}
        >
          {msg}
        </div>
      )}

      <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link
          href="/admin/venues/intro"
          className="btn-save"
          style={{ padding: '8px 16px', textDecoration: 'none', fontSize: 14 }}
        >
          📝 새 소개글 작성
        </Link>
        <button
          type="button"
          onClick={() => {
            setLoading(true)
            fetchItems()
          }}
          style={{ fontSize: 13, padding: '8px 12px' }}
        >
          새로고침
        </button>
      </div>

      <div className="card-box">
        <div className="card-box-title">📋 AI 작성글 리스트 (2000자 이내)</div>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
          AI가 생성한 소개글 원문입니다. 임시저장 시 AI 생성 후 저장해야 여기에서 확인할 수 있습니다.
        </p>
        {items.length === 0 ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 24 }}>
            저장된 업체소개글이 없습니다. 업체소개글 작성에서 AI 생성 후 임시저장해 주세요.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {items.map((r) => {
              const aiContent = r.intro_ai_json?.content || ''
              const hasAi = !!aiContent.trim()
              return (
                <div
                  key={r.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    overflow: 'hidden',
                    background: 'var(--card)',
                  }}
                >
                  <div
                    style={{
                      padding: '10px 14px',
                      background: 'var(--bg)',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{getName(r)}</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {String(r.form_json?.region || '')} · {r.ai_tone === 'partner_pro' ? '파트너' : '전문가'} · {new Date(r.created_at).toLocaleDateString('ko-KR')}
                    </span>
                    <div>
                      <Link
                        href={`/admin/venues/intro?load=${r.id}`}
                        style={{ marginRight: 8, fontSize: 12 }}
                      >
                        수정
                      </Link>
                      <button
                        type="button"
                        className="btn-danger"
                        style={{ padding: '4px 10px', fontSize: 11 }}
                        onClick={() => deleteItem(r.id, getName(r))}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  <div
                    style={{
                      padding: 14,
                      fontSize: 13,
                      lineHeight: 1.7,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      maxHeight: 280,
                      overflowY: 'auto',
                      color: hasAi ? 'var(--text)' : 'var(--muted)',
                    }}
                  >
                    {hasAi ? (
                      aiContent
                    ) : (
                      <span>— AI 작성글이 없습니다. 업체소개글 작성에서 AI 생성 버튼을 누른 뒤 임시저장해 주세요. —</span>
                    )}
                  </div>
                  {hasAi && (
                    <div style={{ padding: '6px 14px', fontSize: 11, color: 'var(--muted)', borderTop: '1px solid var(--border)' }}>
                      {aiContent.length}자
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
