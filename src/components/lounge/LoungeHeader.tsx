'use client'

import Link from 'next/link'
import { useState } from 'react'

export function LoungeHeader() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <header>
        <nav className="nav container" aria-label="주요 메뉴">
          <Link href="/" className="brand" onClick={() => setOpen(false)}>
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
