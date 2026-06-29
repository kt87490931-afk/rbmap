import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { buildVideoEmbedFromSlots, listVideoSlots, publicUrl, SITE_URL } from '@/lib/hosting'

export const dynamic = 'force-dynamic'

export async function GET() {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const slots = await listVideoSlots()
  const { urls, html } = await buildVideoEmbedFromSlots()

  const items = slots.map((slot) => ({
    ...slot,
    url: slot.storagePath
      ? publicUrl(slot.storagePath, slot.updatedAt ? Date.parse(slot.updatedAt) : undefined)
      : null,
  }))

  return NextResponse.json({
    slots: items,
    previewUrl: `${SITE_URL}/4m`,
    embedHtml: html,
    filledCount: urls.length,
  })
}
