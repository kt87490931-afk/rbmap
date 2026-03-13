'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const NAV_ITEMS = [
  { href: '/admin', icon: '📊', label: '대시보드' },
  { href: '/admin/site', icon: '📄', label: '메인 페이지 설정' },
  { href: '/admin/regions', icon: '🗺', label: '지역 관리' },
  { href: '/admin/partners', icon: '🤝', label: '제휴업체 관리' },
  { href: '/admin/essential-keywords', icon: '🔑', label: '필수단어관리' },
  { href: '/admin/venues/intro', icon: '📝', label: '업체소개글 작성' },
  { href: '/admin/venues/intros', icon: '📋', label: '업체소개글관리' },
  { href: '/admin/live-feed', icon: '📡', label: 'Live Feed 관리' },
  { href: '/admin/reviews', icon: '⭐', label: '리뷰 관리' },
  { href: '/admin/reviews/generate', icon: '🤖', label: '리뷰생성' },
  { href: '/admin/reviews/write', icon: '✍️', label: '리뷰 작성' },
  { href: '/admin/seo', icon: '🔍', label: 'Google SEO' },
  { href: '/admin/visit-logs', icon: '📋', label: '접속자 로그' },
  { href: '/admin/threats', icon: '🚨', label: '위험 감지' },
  { href: '/admin/cron-health', icon: '💓', label: '크론헬스' },
]

export function AdminSidebar({ disabled, setupMode }: { disabled?: boolean; setupMode?: boolean }) {
  const pathname = usePathname()

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-title">ADMIN</div>
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === '/admin'
          ? pathname === '/admin'
          : pathname.startsWith(item.href)

        if (disabled) {
          return (
            <div
              key={item.href}
              className="admin-nav-item"
              style={{ opacity: 0.4, cursor: 'not-allowed', pointerEvents: 'none' }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          )
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        )
      })}
      {!setupMode && (
        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={async () => {
              await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {})
              signOut({ callbackUrl: '/' })
            }}
            className="admin-nav-item"
            style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <span>🚪</span>
            <span>로그아웃</span>
          </button>
        </div>
      )}
    </aside>
  )
}
