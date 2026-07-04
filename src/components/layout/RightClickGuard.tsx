'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const NO_SELECT_CLASS = 'rbmap-no-select'

/**
 * 우클릭·텍스트 드래그(선택) 제한. /admin 제외.
 * 리뷰 등 콘텐츠의 쉬운 복사 방지를 위한 최소 장벽.
 */
export function RightClickGuard() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname?.startsWith('/admin')) {
      document.body.classList.remove(NO_SELECT_CLASS)
      return
    }

    document.body.classList.add(NO_SELECT_CLASS)

    const handleContextMenu = (e: MouseEvent) => {
      const t = e.target
      if (t instanceof Element && t.closest('a, button, input, textarea, select, [role="button"]')) return
      e.preventDefault()
    }
    const handleSelectStart = (e: Event) => {
      const t = e.target
      if (t instanceof Element && t.closest('a, button, input, textarea, select, [role="button"], .review-item')) return
      e.preventDefault()
    }
    const handleDragStart = (e: Event) => {
      const t = e.target
      if (t instanceof Element && t.closest('a, button, input, textarea, select, [role="button"], .review-item')) return
      e.preventDefault()
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('selectstart', handleSelectStart)
    document.addEventListener('dragstart', handleDragStart)

    return () => {
      document.body.classList.remove(NO_SELECT_CLASS)
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('selectstart', handleSelectStart)
      document.removeEventListener('dragstart', handleDragStart)
    }
  }, [pathname])

  return null
}
