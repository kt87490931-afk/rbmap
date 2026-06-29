import { NextRequest, NextResponse } from 'next/server'
import { readHostedVideoFile } from '@/lib/hosting/serve'

export const dynamic = 'force-dynamic'

/** public/4m 영상 — [region]/[category] 동적 라우트보다 우선 서빙 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params
  const result = await readHostedVideoFile(file)
  if (!result) {
    return new NextResponse('Not Found', { status: 404 })
  }

  return new NextResponse(new Uint8Array(result.body), {
    status: 200,
    headers: {
      'Content-Type': result.contentType,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
