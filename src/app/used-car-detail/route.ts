import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'

function resolveUsedCarDetailPath(): string | null {
  const rel = join('public', 'used-car-detail.html')
  const candidates = [
    join(process.cwd(), rel),
    join(process.cwd(), '..', rel),
  ]
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  return null
}

/** public/used-car-detail.html 디자인 미리보기 — [region] 라우트 충돌 회피 */
export async function GET() {
  const path = resolveUsedCarDetailPath()
  if (!path) {
    return new NextResponse('used-car-detail.html not found on server', { status: 404 })
  }
  const html = await readFile(path, 'utf-8')
  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-cache',
    },
  })
}
