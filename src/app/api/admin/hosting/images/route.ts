import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import {
  IMAGE_MAX_BYTES,
  IMAGE_MIME,
  buildImageHtml,
  buildImageHtmlFullWidth,
  listHostingFolders,
  listHostingImages,
  publicUrl,
} from '@/lib/hosting'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const folder = request.nextUrl.searchParams.get('folder') ?? undefined
  const [images, folders] = await Promise.all([
    listHostingImages(folder),
    listHostingFolders(),
  ])

  const items = images.map((item) => {
    const url = publicUrl(item.storagePath, Date.parse(item.createdAt))
    return {
      ...item,
      url,
      html: buildImageHtml(url),
      htmlFullWidth: buildImageHtmlFullWidth(url),
    }
  })

  return NextResponse.json({ folders, items })
}
