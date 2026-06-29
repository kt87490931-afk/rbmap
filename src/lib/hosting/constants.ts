import { existsSync } from 'fs'
import { join, resolve } from 'path'

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://rbbmap.com').replace(/\/$/, '')

export const IMAGE_MAX_BYTES = 20 * 1024 * 1024
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024

export const IMAGE_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
}

export const VIDEO_MIME: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
}

export const GRID_WIDTH = 794
export const CELL_WIDTH = 397
export const CELL_HEIGHT = Math.round((CELL_WIDTH * 16) / 9)

/** package.json + next.config 가 있는 저장소 루트 (standalone 하위에서도 /var/www/rbmap 탐색) */
export function resolveRepoRoot(): string {
  let dir = resolve(process.cwd())
  for (let i = 0; i < 10; i++) {
    if (
      existsSync(join(dir, 'package.json')) &&
      (existsSync(join(dir, 'next.config.mjs')) || existsSync(join(dir, 'next.config.js')))
    ) {
      return dir
    }
    const parent = join(dir, '..')
    if (parent === dir) break
    dir = parent
  }
  return resolve(process.cwd())
}

export function getProjectRoot(): string {
  return resolveRepoRoot()
}

export function getHostingDataRoot(): string {
  const fromEnv = (process.env.HOSTING_DATA_DIR || '').trim()
  if (fromEnv) return resolve(fromEnv)
  return join(resolveRepoRoot(), 'data', 'hosting')
}

export function getPublicRoot(): string {
  return join(getProjectRoot(), 'public')
}

/** manifest(images.json, videos.json) 경로 */
export function getStorageRoot(): string {
  return getHostingDataRoot()
}

export function getImagesDir(): string {
  return join(getHostingDataRoot(), 'images')
}

export function getVideosDir(): string {
  return join(getHostingDataRoot(), 'videos')
}

export function publicUrl(storagePath: string, version?: string | number): string {
  const base = `${SITE_URL}/${storagePath.replace(/^\/+/, '')}`
  if (version == null || version === '') return base
  return `${base}?v=${encodeURIComponent(String(version))}`
}

export function sanitizeFolderName(raw: string): string {
  const s = (raw || 'default')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return s || 'default'
}

export function buildImageHtml(url: string, alt = ''): string {
  return `<img src="${url}" alt="${alt}" />`
}

export function buildImageHtmlFullWidth(url: string, alt = ''): string {
  return `<img src="${url}" alt="${alt}" style="max-width:100%;height:auto;display:block;" />`
}

export function buildVideoEmbedHtml(videoUrls: string[]): string {
  const filled = videoUrls.filter(Boolean).slice(0, 4)
  if (filled.length === 0) return ''

  const videos = filled
    .map(
      (src) =>
        `  <video src="${src}" autoplay muted loop playsinline preload="metadata"></video>`
    )
    .join('\n')

  return `<style>
.rb-4m{width:${GRID_WIDTH}px;max-width:100%;display:grid;grid-template-columns:${CELL_WIDTH}px ${CELL_WIDTH}px;gap:0;line-height:0;font-size:0;box-sizing:border-box;}
.rb-4m video{width:${CELL_WIDTH}px;height:${CELL_HEIGHT}px;object-fit:cover;display:block;vertical-align:top;}
@media (max-width:${GRID_WIDTH - 1}px){.rb-4m{grid-template-columns:1fr 1fr;width:100%;}.rb-4m video{width:100%;height:auto;aspect-ratio:9/16;}}
</style>
<div class="rb-4m">
${videos}
</div>`
}

export function slotStoragePath(slot: number, ext: string): string {
  return `4m/slot-${slot}${ext}`
}
