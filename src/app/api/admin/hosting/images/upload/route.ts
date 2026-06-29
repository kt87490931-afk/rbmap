import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import { addHostingImage, IMAGE_MAX_BYTES } from '@/lib/hosting'
import { resolveImageMime } from '@/lib/hosting/mime'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const form = await request.formData()
  const file = form.get('file')
  const folder = String(form.get('folder') ?? 'default')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
  }

  const mimeType = resolveImageMime(file.name, file.type || '')
  if (!mimeType) {
    return NextResponse.json({ error: 'jpg, png, gif만 업로드할 수 있습니다.' }, { status: 400 })
  }

  if (file.size > IMAGE_MAX_BYTES) {
    return NextResponse.json({ error: '이미지는 10MB 이하만 업로드할 수 있습니다.' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  try {
    const record = await addHostingImage({
      folder,
      originalFilename: file.name,
      mimeType,
      buffer,
    })
    return NextResponse.json(record, { status: record.overwritten ? 200 : 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : '업로드 실패'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
