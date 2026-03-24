import { readFile } from 'fs/promises'
import { join } from 'path'
import { NextResponse } from 'next/server'

/** public/threeno-swtest.html 미리보기 — [region] 라우트와 public .html 우선순위 회피 */
export async function GET() {
  const path = join(process.cwd(), 'public', 'threeno-swtest.html')
  const html = await readFile(path, 'utf-8')
  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-cache',
    },
  })
}
