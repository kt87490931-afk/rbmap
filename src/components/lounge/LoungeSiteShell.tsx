'use client'

import { LoungeEditProvider } from '@/components/lounge/edit/LoungeEditContext'
import { LoungeEditModals } from '@/components/lounge/edit/LoungeEditModals'
import type { LoungeHomeContent } from '@/lib/data/lounge-home'

export function LoungeSiteShell({
  content,
  children,
}: {
  content: LoungeHomeContent
  children: React.ReactNode
}) {
  return (
    <LoungeEditProvider initialContent={content}>
      {children}
      <LoungeEditModals />
    </LoungeEditProvider>
  )
}
