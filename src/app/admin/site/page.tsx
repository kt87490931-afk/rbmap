'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const SECTION_LABELS: Record<string, string> = {
  hero: '히어로',
  ticker: '티커',
  header: '헤더',
  seo: 'SEO/지역가이드',
  widgets_a: '위젯 A (가격/랭킹/업종)',
  widgets_b: '위젯 B (타임라인/지도/공지/FAQ)',
  stats: '통계',
  cta: 'CTA',
  footer: '푸터',
  region_preview: '지역별 업소 미리보기',
}

interface SectionMeta {
  key: string
  label: string
  updated_at: string | null
  has_content: boolean
}

export default function AdminSitePage() {
  const [sections, setSections] = useState<SectionMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [content, setContent] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch('/api/admin/site')
      .then((r) => r.json())
      .then((data) => setSections(Array.isArray(data) ? data : []))
      .catch(() => setSections([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selected) return
    fetch(`/api/admin/site/${selected}`)
      .then((r) => r.json())
      .then((data) => setContent(JSON.stringify(data, null, 2)))
      .catch(() => setContent('{}'))
  }, [selected])

  function showMsg(text: string) {
    setMsg(text)
    setTimeout(() => setMsg(''), 3000)
  }

  async function save() {
    if (!selected) return
    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch {
      showMsg('JSON 형식이 올바르지 않습니다.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/site/${selected}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      })
      if (res.ok) {
        showMsg('저장 완료!')
      } else {
        const err = await res.json()
        showMsg(err.error || '저장 실패')
      }
    } catch {
      showMsg('저장 실패')
    }
    setSaving(false)
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>로딩 중...</p>

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-title">메인 페이지 설정</h1>
        <p className="admin-subtitle">히어로, 티커, SEO, 위젯, 푸터 등 메인 페이지 전체 섹션 수정</p>
      </div>

      {msg && (
        <div style={{ padding: '10px 16px', marginBottom: 14, borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'rgba(46,204,113,.1)', color: 'var(--green)', border: '1px solid rgba(46,204,113,.3)' }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div className="card-box" style={{ width: 260, flexShrink: 0 }}>
          <div className="card-box-title">📄 섹션 선택</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sections.map((s) => (
              <button
                key={s.key}
                type="button"
                className={`admin-nav-item ${selected === s.key ? 'active' : ''}`}
                style={{ textAlign: 'left', width: '100%', border: 'none', borderRadius: 6, padding: '10px 12px', cursor: 'pointer', background: selected === s.key ? 'var(--gold-dim)' : 'transparent' }}
                onClick={() => setSelected(s.key)}
              >
                {SECTION_LABELS[s.key] ?? s.key}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)' }}>
            <Link href="/" target="_blank" rel="noopener noreferrer">메인 페이지 보기 ↗</Link>
          </div>
        </div>

        <div className="card-box" style={{ flex: 1, minWidth: 0 }}>
          {selected ? (
            <>
              <div className="card-box-title">{SECTION_LABELS[selected] ?? selected}</div>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                JSON 형식으로 수정하세요. 저장 후 메인 페이지에 반영됩니다.
              </p>
              <textarea
                className="form-input"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{ width: '100%', minHeight: 400, fontFamily: 'monospace', fontSize: 12 }}
                spellCheck={false}
              />
              <div style={{ marginTop: 12 }}>
                <button className="btn-save" onClick={save} disabled={saving}>
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>왼쪽에서 수정할 섹션을 선택하세요.</p>
          )}
        </div>
      </div>
    </>
  )
}
