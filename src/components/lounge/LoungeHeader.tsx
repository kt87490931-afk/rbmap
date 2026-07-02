'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

/** 로고 5회 연속 클릭 시 어드민 로그인으로 이동 (숨겨진 관리자 진입점) */
const ADMIN_TAP_COUNT = 5
const ADMIN_TAP_RESET_MS = 1500

export function LoungeHeader() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const tapCount = useRef(0)
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleLogoClick = (e: React.MouseEvent) => {
    setOpen(false)
    tapCount.current += 1
    if (tapTimer.current) clearTimeout(tapTimer.current)

    if (tapCount.current >= ADMIN_TAP_COUNT) {
      e.preventDefault()
      tapCount.current = 0
      router.push('/admin/login')
      return
    }

    tapTimer.current = setTimeout(() => {
      tapCount.current = 0
    }, ADMIN_TAP_RESET_MS)
  }

  return (
    <>
      <header>
        <nav className="nav container" aria-label="주요 메뉴">
          <Link href="/" className="brand" onClick={handleLogoClick}>
            룸빵<em>여지도</em>
          </Link>
          <ul className="nav-links" role="menubar">
            <li role="menuitem"><Link href="/#about">소개</Link></li>
            <li role="menuitem"><Link href="/#gallery">공간</Link></li>
            <li role="menuitem"><Link href="/#menu">이용요금</Link></li>
            <li role="menuitem"><Link href="/reviews">후기</Link></li>
            <li role="menuitem"><Link href="/#location">오시는 길</Link></li>
            <li role="menuitem"><Link href="/#contact">문의</Link></li>
          </ul>
          <div className="nav-cta">
            <Link href="/reviews" className="btn btn-primary btn-sm">후기 보기</Link>
            <button
              type="button"
              className="nav-toggle"
              aria-label="메뉴 열기"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              ☰
            </button>
          </div>
        </nav>
        <div className={`mobile-nav${open ? ' open' : ''}`} id="mobileNav">
          <ul>
            <li><Link href="/#about" onClick={() => setOpen(false)}>소개</Link></li>
            <li><Link href="/#gallery" onClick={() => setOpen(false)}>공간</Link></li>
            <li><Link href="/#menu" onClick={() => setOpen(false)}>이용요금</Link></li>
            <li><Link href="/reviews" onClick={() => setOpen(false)}>후기</Link></li>
            <li><Link href="/#location" onClick={() => setOpen(false)}>오시는 길</Link></li>
            <li><Link href="/#contact" onClick={() => setOpen(false)}>문의</Link></li>
          </ul>
        </div>
      </header>
    </>
  )
}
