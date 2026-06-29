import { NextResponse } from 'next/server'
import {
  buildVideoEmbedHtml,
  CELL_HEIGHT,
  CELL_WIDTH,
  GRID_WIDTH,
  listVideoSlots,
  publicUrl,
} from '@/lib/hosting'

export const dynamic = 'force-dynamic'

/** 4m 릴스 2×2 미리보기 — 홈·사이트맵 미노출, 게시판 embed 확인용 */
export async function GET() {
  const slots = await listVideoSlots()
  const filled = slots
    .filter((s) => s.storagePath)
    .sort((a, b) => a.slot - b.slot)

  const videoTags = filled
    .map((s) => {
      const src = publicUrl(s.storagePath!, s.updatedAt ? Date.parse(s.updatedAt) : undefined)
      return `<video src="${src}" autoplay muted loop playsinline preload="metadata"></video>`
    })
    .join('\n')

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>4m 영상 미리보기</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #111; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 12px; }
.rb-4m { width: ${GRID_WIDTH}px; max-width: 100%; display: grid; grid-template-columns: ${CELL_WIDTH}px ${CELL_WIDTH}px; gap: 0; line-height: 0; font-size: 0; }
.rb-4m video { width: ${CELL_WIDTH}px; height: ${CELL_HEIGHT}px; object-fit: cover; display: block; background: #222; }
.empty { color: #aaa; font: 14px/1.6 sans-serif; text-align: center; padding: 40px 20px; }
@media (max-width: ${GRID_WIDTH - 1}px) {
  .rb-4m { grid-template-columns: 1fr 1fr; width: 100%; }
  .rb-4m video { width: 100%; height: auto; aspect-ratio: 9/16; }
}
</style>
</head>
<body>
${
  filled.length
    ? `<div class="rb-4m">\n${videoTags}\n</div>`
    : '<p class="empty">등록된 영상이 없습니다.<br>어드민 → 영상 호스팅에서 슬롯 1~4를 업로드하세요.</p>'
}
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-cache',
    },
  })
}
