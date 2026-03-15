'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface IntroItem {
  id: string
  partner_id?: string | null
  form_json: { name?: string; region?: string; type?: string }
  ai_tone: string
  period_days: number
  intro_ai_json?: { content?: string; v2?: { intro?: { lead?: string; quote?: string; body_paragraphs?: string[] } }; generated_at?: string; elapsed_ms?: number; needs_review?: boolean }
  is_applied?: boolean
  is_public?: boolean
  created_at: string
}

/** JSON 블록처럼 보이는 문자열에서 intro 본문만 추출 */
function extractTextFromJsonLike(str: string): string | null {
  const trimmed = str.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null
  try {
    const cleaned = trimmed.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?\s*```\s*$/i, '').trim()
    const first = cleaned.indexOf('{')
    const last = cleaned.lastIndexOf('}')
    if (first >= 0 && last > first) {
      const parsed = JSON.parse(cleaned.slice(first, last + 1)) as { intro?: { lead?: string; quote?: string; body_paragraphs?: string[] } }
      if (parsed?.intro) {
        const parts = [parsed.intro.lead, parsed.intro.quote, ...(parsed.intro.body_paragraphs ?? [])].filter(Boolean)
        return parts.join('\n\n')
      }
    }
  } catch { /* ignore */ }
  return null
}

/** JSON 형태로 저장된 content를 읽기용 텍스트로 변환 (코드/키 노출 없이 본문만) */
function contentToDisplayText(item: IntroItem): string {
  const raw = item.intro_ai_json?.content ?? ''
  const v2 = item.intro_ai_json?.v2
  if (v2?.intro) {
    const parts = [v2.intro.lead, v2.intro.quote, ...(v2.intro.body_paragraphs ?? [])].filter(Boolean)
    const joined = parts.join('\n\n')
    if (joined.startsWith('{') || joined.includes('"tagline"') || joined.includes('"intro"')) {
      const extracted = extractTextFromJsonLike(joined)
      if (extracted) return extracted
      return '[JSON 형식으로 저장된 항목입니다. 수정 버튼으로 편집 후 적용해 주세요.]'
    }
    return joined
  }
  const trimmed = raw.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('```')) {
    const extracted = extractTextFromJsonLike(trimmed)
    if (extracted) return extracted
    try {
      const cleaned = trimmed.replace(/^```json?\s*/i, '').replace(/\s*```\s*$/, '').trim()
      const parsed = JSON.parse(cleaned) as { intro?: { lead?: string; quote?: string; body_paragraphs?: string[] } }
      if (parsed?.intro) {
        const parts = [parsed.intro.lead, parsed.intro.quote, ...(parsed.intro.body_paragraphs ?? [])].filter(Boolean)
        return parts.join('\n\n')
      }
    } catch { /* fallthrough */ }
    return '[JSON 형식으로 저장된 항목입니다. 수정 버튼으로 편집 후 적용해 주세요.]'
  }
  return raw
}

function formatDateTime(s: string) {
  try {
    const d = new Date(s)
    return d.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch { return s }
}

export default function AdminVenueIntrosPage() {
  const [items, setItems] = useState<IntroItem[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [viewingItem, setViewingItem] = useState<IntroItem | null>(null)
  const [editingItem, setEditingItem] = useState<IntroItem | null>(null)
  const [editContent, setEditContent] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [applyingId, setApplyingId] = useState<string | null>(null)

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

  async function saveContentEdit() {
    if (!editingItem) return
    setSavingEdit(true)
    try {
      const payload = {
        intro_ai_json: {
          ...editingItem.intro_ai_json,
          content: editContent,
          v2: undefined,
        },
      }
      const res = await fetch(`/api/admin/venues/intro/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '저장 실패')
      }
      setItems((prev) =>
        prev.map((r) =>
          r.id === editingItem.id
            ? { ...r, intro_ai_json: { ...r.intro_ai_json, content: editContent, v2: undefined } }
            : r
        )
      )
      setEditingItem(null)
      setEditContent('')
      showMsg('수정 완료')
    } catch (e) {
      alert(String(e))
    } finally {
      setSavingEdit(false)
    }
  }

  function openEditModal(item: IntroItem) {
    setEditingItem(item)
    setEditContent(contentToDisplayText(item))
  }

  async function applyIntro(item: IntroItem) {
    if (!contentToDisplayText(item).trim()) {
      alert('적용할 AI 작성글이 없습니다.')
      return
    }
    setApplyingId(item.id)
    try {
      const res = await fetch(`/api/admin/venues/intro/${item.id}/apply`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '적용 실패')
      await fetchItems()
      showMsg('페이지에 적용되었습니다.')
    } catch (e) {
      alert(String(e))
    } finally {
      setApplyingId(null)
    }
  }

  const getName = (x: IntroItem) =>
    (x.form_json?.name as string) || '제목없음'

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showMsg('클립보드에 복사되었습니다.')
  }

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
        <div className="card-box-title">📋 AI 작성글 리스트 (3,000자 이상 4,000자 미만)</div>
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginBottom: 16,
            padding: '10px 12px',
            background: 'var(--bg)',
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          <span>
            <strong>성공</strong>{' '}
            <span style={{ color: 'var(--green)' }}>
              {items.filter((x) => contentToDisplayText(x).trim().length > 0).length}
            </span>
          </span>
          <span>
            <strong>실패</strong>{' '}
            <span style={{ color: 'var(--red, #ff4757)' }}>
              {items.filter((x) => contentToDisplayText(x).trim().length === 0).length}
            </span>
          </span>
          <span>
            <strong>전체</strong> {items.length}
          </span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
          AI 소개글 생성 버튼을 누르면 자동 저장 후 이 리스트에 반영됩니다.
        </p>
        {items.length === 0 ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 24 }}>
            저장된 업체소개글이 없습니다. 업체소개글 작성에서 AI 생성 후 임시저장해 주세요.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {items.map((r) => {
              const rawContent = r.intro_ai_json?.content || ''
              const displayContent = contentToDisplayText(r)
              const hasAi = !!(rawContent.trim() || displayContent.trim())
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
                      flexWrap: 'wrap',
                      gap: 8,
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 600 }}>{getName(r)}</span>
                      <span
                        style={{
                          fontSize: 11,
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontWeight: 600,
                          background: hasAi ? 'rgba(46,204,113,.2)' : 'rgba(255,71,87,.15)',
                          color: hasAi ? 'var(--green)' : 'var(--red, #ff4757)',
                        }}
                      >
                        {hasAi ? '성공' : '실패'}
                      </span>
                      {r.is_applied && (
                        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--accent)', color: '#fff', fontWeight: 600 }}>
                          적용됨
                        </span>
                      )}
                      {r.intro_ai_json?.needs_review && (
                        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--gold, #c8a84b)', color: '#fff', fontWeight: 600 }} title="분량 초과 또는 파싱 보조 저장 · 수정 후 적용 권장">
                          검토 필요
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                        생성일시 {formatDateTime(r.intro_ai_json?.generated_at || r.created_at)}
                        {r.intro_ai_json?.elapsed_ms != null && ` · ${Number(r.intro_ai_json.elapsed_ms).toLocaleString()}ms`}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {String(r.form_json?.region || '')} · {r.ai_tone === 'partner_pro' ? '파트너' : '전문가'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn-apply"
                        style={{
                          marginRight: 4,
                          fontSize: 13,
                          fontWeight: 600,
                          padding: '6px 14px',
                          cursor: hasAi && !r.is_applied ? 'pointer' : 'default',
                          background: r.is_applied ? '#2ecc71' : hasAi ? 'var(--gold, #c8a84b)' : 'var(--card)',
                          color: (hasAi || r.is_applied) ? '#fff' : 'var(--muted)',
                          border: `1px solid ${r.is_applied ? '#2ecc71' : hasAi ? 'var(--gold, #c8a84b)' : 'var(--border)'}`,
                          borderRadius: 6,
                          opacity: applyingId === r.id ? 0.7 : 1,
                        }}
                        onClick={() => hasAi && applyIntro(r)}
                        disabled={!hasAi || applyingId !== null}
                        title={r.is_applied ? '페이지에 적용됨' : hasAi ? '이 글로 상세 페이지에 적용' : 'AI 작성글이 없습니다'}
                      >
                        {applyingId === r.id ? '적용 중...' : r.is_applied ? '✓ 적용됨' : '적용'}
                      </button>
                      <button
                        type="button"
                        style={{ marginRight: 8, fontSize: 12, padding: '4px 10px', cursor: 'pointer', background: hasAi ? 'var(--accent)' : 'var(--bg)', color: hasAi ? '#fff' : 'var(--muted)', border: '1px solid var(--border)', borderRadius: 6 }}
                        onClick={() => setViewingItem(r)}
                        disabled={!hasAi}
                        title={hasAi ? 'AI 작성 원문 보기' : 'AI 작성글이 없습니다'}
                      >
                        보기
                      </button>
                      <button
                        type="button"
                        style={{ marginRight: 8, fontSize: 12, padding: '4px 10px', cursor: hasAi ? 'pointer' : 'not-allowed', background: hasAi ? 'var(--bg)' : 'var(--bg)', color: hasAi ? 'var(--fg)' : 'var(--muted)', border: '1px solid var(--border)', borderRadius: 6 }}
                        onClick={() => hasAi && openEditModal(r)}
                        disabled={!hasAi}
                        title={hasAi ? '글 내용 직접 수정' : 'AI 작성글이 없습니다'}
                      >
                        수정
                      </button>
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
                      displayContent
                    ) : (
                      <span>— AI 작성글이 없습니다. 업체소개글 작성에서 AI 생성 버튼을 누른 뒤 임시저장해 주세요. —</span>
                    )}
                  </div>
                  {hasAi && (
                    <div style={{ padding: '6px 14px', fontSize: 11, color: 'var(--muted)', borderTop: '1px solid var(--border)' }}>
                      {displayContent.length}자
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {viewingItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 24,
          }}
          onClick={() => setViewingItem(null)}
        >
          <div
            style={{
              background: 'var(--card)',
              borderRadius: 12,
              maxWidth: 640,
              width: '100%',
              maxHeight: '85vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg)',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 15 }}>
                AI 작성 원문 — {getName(viewingItem)}
              </span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => copyToClipboard(contentToDisplayText(viewingItem))}
                  style={{ fontSize: 12, padding: '6px 12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                >
                  복사
                </button>
                <button
                  type="button"
                  onClick={() => setViewingItem(null)}
                  style={{ fontSize: 12, padding: '6px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}
                >
                  닫기
                </button>
              </div>
            </div>
            <div
              style={{
                padding: 18,
                fontSize: 14,
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflowY: 'auto',
                flex: 1,
              }}
            >
              {contentToDisplayText(viewingItem) || '— AI 작성글이 없습니다. —'}
            </div>
          </div>
        </div>
      )}

      {editingItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 24,
          }}
          onClick={() => !savingEdit && (setEditingItem(null), setEditContent(''))}
        >
          <div
            style={{
              background: 'var(--card)',
              borderRadius: 12,
              maxWidth: 720,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg)',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 15 }}>
                글 수정 — {getName(editingItem)} (불법·과장 문구 확인 후 수정)
              </span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={saveContentEdit}
                  disabled={savingEdit}
                  style={{ fontSize: 12, padding: '6px 14px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, cursor: savingEdit ? 'not-allowed' : 'pointer' }}
                >
                  {savingEdit ? '저장 중...' : '저장'}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingItem(null); setEditContent('') }}
                  disabled={savingEdit}
                  style={{ fontSize: 12, padding: '6px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}
                >
                  취소
                </button>
              </div>
            </div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="AI가 생성한 글을 직접 수정하세요. 불법 표현, 과장된 내용을 확인·수정할 수 있습니다."
              style={{
                flex: 1,
                minHeight: 360,
                padding: 18,
                fontSize: 14,
                lineHeight: 1.8,
                resize: 'vertical',
                border: 'none',
                outline: 'none',
                background: 'var(--card)',
                color: 'var(--fg)',
              }}
            />
            <div style={{ padding: '8px 18px', fontSize: 11, color: 'var(--muted)', borderTop: '1px solid var(--border)' }}>
              {editContent.length}자
            </div>
          </div>
        </div>
      )}
    </>
  )
}
