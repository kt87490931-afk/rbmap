'use client'

import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useRef, useCallback, useEffect } from 'react'

const CLICK_THRESHOLD = 5
const RESET_MS = 2000
const SINGLE_CLICK_MS = 400

interface LogoWithAdminTriggerProps {
  logoIcon: string
  logoText: string
  logoSub: string
}

export default function LogoWithAdminTrigger({ logoIcon, logoText, logoSub }: LogoWithAdminTriggerProps) {
  const router = useRouter()
  const countRef = useRef(0)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const singleClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current)
      resetTimerRef.current = null
    }
    if (singleClickTimerRef.current) {
      clearTimeout(singleClickTimerRef.current)
      singleClickTimerRef.current = null
    }
  }, [])

  useEffect(() => () => clearTimers(), [clearTimers])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      countRef.current += 1
      const currentCount = countRef.current

      if (currentCount >= CLICK_THRESHOLD) {
        clearTimers()
        countRef.current = 0
        signIn('google')
        return
      }

      clearTimers()

      singleClickTimerRef.current = setTimeout(() => {
        singleClickTimerRef.current = null
        if (countRef.current === 1) {
          router.push('/')
        }
        countRef.current = 0
      }, SINGLE_CLICK_MS)

      resetTimerRef.current = setTimeout(() => {
        resetTimerRef.current = null
        countRef.current = 0
      }, RESET_MS)
    },
    [router, clearTimers]
  )

  return (
    <a
      href="/"
      className="logo"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick(e as unknown as React.MouseEvent)
        }
      }}
    >
      <div className="logo-icon">{logoIcon}</div>
      <div>
        <div className="logo-text">{logoText}</div>
        <div className="logo-sub">{logoSub}</div>
      </div>
    </a>
  )
}
