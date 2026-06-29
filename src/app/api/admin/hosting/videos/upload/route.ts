import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { upsertVideoSlot, VIDEO_MAX_BYTES } from '@/lib/hosting'
import { resolveVideoMime } from '@/lib/hosting/mime'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const form = await request.formData()
  const file = form.get('file')
  const slotRaw = Number(form.get('slot'))

  if (!(file instanceof File)) {
    return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
  }
  if (!Number.isInteger(slotRaw) || slotRaw < 1 || slotRaw > 4) {
    return NextResponse.json({ error: '슬롯은 1~4 사이여야 합니다.' }, { status: 400 })
  }

  const mimeType = resolveVideoMime(file.name, file.type || '')
  if (!mimeType) {
    return NextResponse.json({ error: 'mp4, webm만 업로드할 수 있습니다.' }, { status: 400 })
  }
  if (file.size > VIDEO_MAX_BYTES) {
    return NextResponse.json({ error: '영상은 50MB 이하만 업로드할 수 있습니다.' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  try {
    const record = await upsertVideoSlot({
      slot: slotRaw,
      originalFilename: file.name,
      mimeType,
      buffer,
    })
    return NextResponse.json(record, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : '업로드 실패'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
