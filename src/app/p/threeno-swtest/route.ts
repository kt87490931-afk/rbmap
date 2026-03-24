import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'

function resolveThreenoSwtestPath(): string | null {
  const rel = join('public', 'threeno-swtest.html')
  const candidates = [
    join(process.cwd(), rel),
    join(process.cwd(), '..', rel),
  ]
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  return null
}

/** public/threeno-swtest.html 미리보기 — [region] 라우트와 public .html 우선순위 회피 */
export async function GET() {
  const path = resolveThreenoSwtestPath()
  if (!path) {
    return new NextResponse('threeno-swtest.html not found on server', { status: 404 })
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
