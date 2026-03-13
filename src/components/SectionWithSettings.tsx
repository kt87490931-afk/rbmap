'use client'

import { useState } from 'react'
import Link from 'next/link'
import SectionFormEditor from './admin/SectionFormEditor'

const SECTION_LABELS: Record<string, string> = {
  hero: '0. 히어로',
  about: '1. about 룸빵여지도',
  region_guide: '2. 지역별 완전가이드',
  category_guide: '3. 업종별 완전 이해',
  partners: '4. 제휴업체',
  feed: '5. 실시간 최신 업데이트',
  widgets_a: '6. 평균가격·위젯·랭킹·트랜드',
  region_preview: '7. 지역별 주요업소',
  reviews: '8. 6시간마다 최신리뷰',
  widgets_b: '9. 타임라인·지역빠른이동·공지·FAQ',
  stats: '10. 통계',
  cta: '11. 광고 및 등록 문의',
  header: '헤더',
  ticker: '티커',
  footer: '푸터',
  reviews_full: '최신 리뷰 전문',
}

const SITE_SECTION_KEYS = [
  'hero', 'ticker', 'header', 'about', 'region_guide', 'category_guide',
  'widgets_a', 'widgets_b', 'stats', 'cta', 'footer', 'region_preview',
  'partners_config', 'feed_config', 'review_config',
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
    >
      <div
        style={{
          background: 'var(--bg, #1a1a1a)',
          borderRadius: 12,
          maxWidth: 680,
          width: '95%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {adminLink && !isSiteSection ? (
          <AdminLinkContent sectionLabel={sectionLabel} adminLink={adminLink} onClose={onClose} />
        ) : isSiteSection ? (
          <SectionFormEditor sectionKey={sectionKey} sectionLabel={sectionLabel} onClose={onClose} adminLink={adminLink} />
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

