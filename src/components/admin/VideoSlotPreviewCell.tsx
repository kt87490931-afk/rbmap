'use client'

import { useCallback, useRef, useState } from 'react'
import { ADMIN_CELL_HEIGHT, ADMIN_CELL_WIDTH } from '@/lib/hosting/layout-constants'

export function VideoSlotPreviewCell({
  slotNum,
  url,
}: {
  slotNum: number
  url: string | null
}) {
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const play = useCallback(() => {
    setPlaying(true)
    requestAnimationFrame(() => {
      const el = videoRef.current
      if (!el) return
      el.muted = false
      void el.play().catch(() => {
        el.muted = true
        void el.play()
      })
    })
  }, [])

  if (!url) {
    return (
      <div
        style={{
          width: ADMIN_CELL_WIDTH,
          height: ADMIN_CELL_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#888',
          fontSize: 11,
          background: '#222',
        }}
      >
        슬롯 {slotNum}
      </div>
    )
  }

  if (!playing) {
    return (
      <button
        type="button"
        onClick={play}
        aria-label={`슬롯 ${slotNum} 재생`}
        style={{
          position: 'relative',
          width: ADMIN_CELL_WIDTH,
          height: ADMIN_CELL_HEIGHT,
          padding: 0,
          border: 'none',
          cursor: 'pointer',
          background: '#111',
          overflow: 'hidden',
        }}
      >
        <video
          ref={videoRef}
          src={url}
          muted
          playsInline
          preload="metadata"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            pointerEvents: 'none',
          }}
        />
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.35)',
          }}
        >
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.92)',
              color: '#111',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              paddingLeft: 2,
            }}
          >
            ▶
          </span>
        </span>
      </button>
    )
  }

  return (
    <video
      ref={videoRef}
      src={url}
      controls
      playsInline
      style={{
        width: ADMIN_CELL_WIDTH,
        height: ADMIN_CELL_HEIGHT,
        objectFit: 'cover',
        display: 'block',
        background: '#000',
      }}
    />
  )
}
