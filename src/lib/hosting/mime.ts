import { IMAGE_MIME, VIDEO_MIME } from './constants'

const IMAGE_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
}

const VIDEO_EXT: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
}

function extFromFilename(filename: string): string {
  const lower = filename.toLowerCase()
  const dot = lower.lastIndexOf('.')
  if (dot < 0) return ''
  return lower.slice(dot)
}

export function resolveImageMime(filename: string, declaredType: string): string | null {
  if (declaredType && IMAGE_MIME[declaredType]) return declaredType
  const ext = extFromFilename(filename)
  if (IMAGE_EXT[ext] && (declaredType === 'application/octet-stream' || !declaredType)) {
    return IMAGE_EXT[ext]
  }
  return IMAGE_EXT[ext] ?? null
}

export function resolveVideoMime(filename: string, declaredType: string): string | null {
  if (declaredType && VIDEO_MIME[declaredType]) return declaredType
  const ext = extFromFilename(filename)
  if (ext === '.mp4' && (declaredType === 'video/quicktime' || declaredType === 'application/octet-stream' || !declaredType)) {
    return 'video/mp4'
  }
  return VIDEO_EXT[ext] ?? null
}

export function imageContentType(mimeType: string): string {
  return mimeType || 'image/jpeg'
}

export function videoContentType(mimeType: string): string {
  return mimeType || 'video/mp4'
}
