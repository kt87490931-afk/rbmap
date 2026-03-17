'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * 우클릭(컨텍스트 메뉴) 제한. /admin 제외.
 * 리뷰 등 콘텐츠의 쉬운 복사 방지를 위한 최소 장벽.
 */
export function RightClickGuard() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [pathname])

  return null
}
