import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'

function resolveDt9inPath(): string | null {
  const rel = join('public', 'dt9in.html')
  const candidates = [
    join(process.cwd(), rel),
    join(process.cwd(), '..', rel),
  ]
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  return null
}

/** public/dt9in.html — /threeno/dt9in.png 단일 이미지 랜딩 */
export async function GET() {
  const path = resolveDt9inPath()
  if (!path) {
    return new NextResponse('dt9in.html not found on server', { status: 404 })
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
