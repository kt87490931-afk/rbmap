'use client'

import { useState, useEffect, useCallback } from 'react'

interface KeywordItem {
  id: string
  keyword: string
  sort_order: number
  created_at: string
}

const DEFAULT_KEYWORDS = ['가라오케', '룸싸롱', '퍼블릭', '노래방']

export default function AdminEssentialKeywordsPage() {
  const [items, setItems] = useState<KeywordItem[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [newKeyword, setNewKeyword] = useState('')
  const [adding, setAdding] = useState(false)

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/essential-keywords')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch { setItems([]) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  function showMsg(text: string) {
    setMsg(text)
    setTimeout(() => setMsg(''), 3000)
  }

  async function addKeyword() {
    const kw = newKeyword.trim()
    if (!kw) return
    setAdding(true)
    try {
      const res = await fetch('/api/admin/essential-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: kw }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '추가 실패')
      setNewKeyword('')
      showMsg('추가되었습니다.')
      fetchItems()
    } catch (e) {
      alert(String(e))
    } finally {
      setAdding(false)
    }
  }

  async function deleteItem(id: string, keyword: string) {
    if (!confirm(`"${keyword}" 키워드를 삭제하시겠습니까?`)) return
    const res = await fetch(`/api/admin/essential-keywords/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setItems((prev) => prev.filter((k) => k.id !== id))
      showMsg('삭제 완료')
    } else {
      const err = await res.json()
      alert(err.error || '삭제 실패')
    }
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>로딩 중...</p>

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-title">필수단어 관리</h1>
        <p className="admin-subtitle">
          AI 소개글 생성 시 반드시 자연스럽게 포함되어야 하는 키워드입니다. 룸빵여지도 필수 단어를 추가·삭제할 수 있습니다.
        </p>
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

      <div className="card-box">
        <div className="card-box-title">📋 필수 키워드 목록</div>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
          아래 키워드들은 업체소개글 작성 시 AI가 생성하는 글에 자연스럽게 포함됩니다. 구글 검색에 유리한 키워드를 관리하세요.
        </p>
        {items.length === 0 ? (
          <p style={{ color: 'var(--muted)', padding: 24, textAlign: 'center' }}>
            DB에 essential_keywords 테이블이 없을 수 있습니다. Supabase에서 supabase-essential-keywords.sql을 실행해 주세요.
            <br />
            <span style={{ fontSize: 11, marginTop: 8, display: 'block' }}>
              기본 키워드: {DEFAULT_KEYWORDS.join(', ')}
            </span>
          </p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {items.map((k) => (
              <span
                key={k.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 14,
                }}
              >
                {k.keyword}
                <button
                  type="button"
                  className="btn-danger"
                  style={{ padding: '2px 8px', fontSize: 11 }}
                  onClick={() => deleteItem(k.id, k.keyword)}
                >
                  삭제
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="card-box">
        <div className="card-box-title">➕ 키워드 추가</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            className="form-input"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
            placeholder="예: 하이퍼블릭"
            style={{ width: 200 }}
          />
          <button
            type="button"
            className="btn-save"
            onClick={addKeyword}
            disabled={adding || !newKeyword.trim()}
          >
            {adding ? '추가 중...' : '추가'}
          </button>
        </div>
      </div>
    </>
  )
}
