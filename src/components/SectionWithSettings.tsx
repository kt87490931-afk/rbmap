'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'

const SECTION_LABELS: Record<string, string> = {
  hero: '히어로',
  ticker: '티커',
  header: '헤더',
  seo: 'SEO/지역가이드',
  widgets_a: '위젯 A',
  widgets_b: '위젯 B',
  stats: '통계',
  cta: 'CTA',
  footer: '푸터',
  region_preview: '지역 미리보기',
  partners: '제휴업체',
  feed: '라이브피드',
  reviews: '리뷰',
}

const SITE_SECTION_KEYS = [
  'hero', 'ticker', 'header', 'seo', 'widgets_a', 'widgets_b',
  'stats', 'cta', 'footer', 'region_preview',
] as const

interface SectionWithSettingsProps {
  isAdmin: boolean
  sectionKey: string
  sectionLabel?: string
  adminLink?: string
  children: React.ReactNode
}

export default function SectionWithSettings({
  isAdmin,
  sectionKey,
  sectionLabel,
  adminLink,
  children,
}: SectionWithSettingsProps) {
  const [open, setOpen] = useState(false)
  const label = sectionLabel ?? SECTION_LABELS[sectionKey] ?? sectionKey

  if (!isAdmin) {
    return <>{children}</>
  }

  return (
    <section className="section-with-settings" style={{ position: 'relative' }}>
      {children}
      <button
        type="button"
        aria-label={`${label} 설정`}
        onClick={() => setOpen(true)}
        className="section-settings-trigger"
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          width: 36,
          height: 36,
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'rgba(0,0,0,0.4)',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
        }}
      >
        ⚙
      </button>
      {open && (
        <SectionSettingsModal
          sectionKey={sectionKey}
          sectionLabel={label}
          adminLink={adminLink}
          onClose={() => setOpen(false)}
        />
      )}
    </section>
  )
}

interface SectionSettingsModalProps {
  sectionKey: string
  sectionLabel: string
  adminLink?: string
  onClose: () => void
}

function SectionSettingsModal({
  sectionKey,
  sectionLabel,
  adminLink,
  onClose,
}: SectionSettingsModalProps) {
  const isSiteSection = SITE_SECTION_KEYS.includes(sectionKey as (typeof SITE_SECTION_KEYS)[number])
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="section-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'var(--bg, #1a1a1a)',
          borderRadius: 12,
          maxWidth: 560,
          width: '90%',
          maxHeight: '85vh',
          overflow: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {adminLink ? (
          <AdminLinkContent sectionLabel={sectionLabel} adminLink={adminLink} onClose={onClose} />
        ) : isSiteSection ? (
          <SiteSectionEditor sectionKey={sectionKey} sectionLabel={sectionLabel} onClose={onClose} />
        ) : (
          <div style={{ padding: 24 }}>
            <p style={{ color: 'var(--muted)' }}>이 섹션은 별도 설정이 없습니다.</p>
            <button type="button" onClick={onClose} className="btn-save" style={{ marginTop: 16 }}>
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function AdminLinkContent({
  sectionLabel,
  adminLink,
  onClose,
}: {
  sectionLabel: string
  adminLink: string
  onClose: () => void
}) {
  return (
    <div style={{ padding: 24 }}>
      <h2 id="section-modal-title" style={{ marginBottom: 12 }}>
        {sectionLabel}
      </h2>
      <p style={{ color: 'var(--muted)', marginBottom: 16, fontSize: 14 }}>
        이 섹션은 별도 관리 페이지에서 수정합니다.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <Link
          href={adminLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-save"
          style={{ textDecoration: 'none' }}
        >
          관리 페이지로 이동 ↗
        </Link>
        <button type="button" onClick={onClose} style={{ background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)' }}>
          닫기
        </button>
      </div>
    </div>
  )
}

function SiteSectionEditor({
  sectionKey,
  sectionLabel,
  onClose,
}: {
  sectionKey: string
  sectionLabel: string
  onClose: () => void
}) {
  const [content, setContent] = useState('{}')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/admin/site/${sectionKey}`)
      .then((r) => r.json())
      .then((data) => setContent(JSON.stringify(data, null, 2)))
      .catch(() => setContent('{}'))
      .finally(() => setLoading(false))
  }, [sectionKey])

  const showMsg = useCallback((text: string) => {
    setMsg(text)
    setTimeout(() => setMsg(''), 3000)
  }, [])

  const save = async () => {
    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch {
      showMsg('JSON 형식이 올바르지 않습니다.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/site/${sectionKey}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      })
      if (res.ok) {
        showMsg('저장 완료!')
      } else {
        const err = await res.json()
        showMsg(err?.error || '저장 실패')
      }
    } catch {
      showMsg('저장 실패')
    }
    setSaving(false)
  }

  useEffect(() => {
    load()
  }, [load])

  return (
    <div style={{ padding: 24 }}>
      <h2 id="section-modal-title" style={{ marginBottom: 8 }}>
        {sectionLabel}
      </h2>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
        JSON 형식으로 수정 후 저장하면 메인 페이지에 반영됩니다.
      </p>
      {msg && (
        <div
          style={{
            padding: '10px 16px',
            marginBottom: 12,
            borderRadius: 8,
            fontSize: 13,
            background: 'rgba(46,204,113,.1)',
            color: 'var(--green)',
          }}
        >
          {msg}
        </div>
      )}
      {loading ? (
        <p style={{ color: 'var(--muted)' }}>로딩 중...</p>
      ) : (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            width: '100%',
            minHeight: 320,
            fontFamily: 'monospace',
            fontSize: 12,
            padding: 12,
            borderRadius: 8,
            background: 'var(--card)',
            border: '1px solid var(--border)',
            color: 'inherit',
          }}
          spellCheck={false}
        />
      )}
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button className="btn-save" onClick={save} disabled={saving || loading}>
          {saving ? '저장 중...' : '저장'}
        </button>
        <button
          type="button"
          onClick={onClose}
          style={{ background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)' }}
        >
          닫기
        </button>
      </div>
    </div>
  )
}
