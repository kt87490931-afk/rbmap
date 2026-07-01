import { NextRequest, NextResponse } from 'next/server'
import { readHostedImageFile } from '@/lib/hosting/serve'

export const dynamic = 'force-dynamic'

const CACHE_CONTROL = 'public, max-age=0, must-revalidate'

/** public/h 이미지 — [region]/[category]/[venue] 동적 라우트보다 우선 서빙 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ folder: string; file: string }> }
) {
  const { folder, file } = await params
  const result = await readHostedImageFile(folder, file)
  if (!result) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const ifNoneMatch = request.headers.get('if-none-match')
  if (ifNoneMatch === result.etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: result.etag,
        'Cache-Control': CACHE_CONTROL,
      },
    })
  }

  return new NextResponse(new Uint8Array(result.body), {
    status: 200,
    headers: {
      'Content-Type': result.contentType,
      ETag: result.etag,
      'Cache-Control': CACHE_CONTROL,
    },
  })
}
