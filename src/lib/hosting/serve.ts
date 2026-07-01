import { readFile, stat } from 'fs/promises'
import { existsSync } from 'fs'
import { basename, join } from 'path'
import { getImagesDir, getVideosDir, sanitizeFolderName } from './constants'
import { imageContentType, videoContentType } from './mime'

const VIDEO_FILE_RE = /^slot-[1-4]\.(mp4|webm)$/i
const IMAGE_FILE_RE = /^[a-f0-9-]{36}\.(jpg|jpeg|png|gif)$/i

export async function readHostedVideoFile(
  filename: string
): Promise<{ body: Buffer; contentType: string } | null> {
  const safe = basename(filename)
  if (!VIDEO_FILE_RE.test(safe)) return null
  const abs = join(getVideosDir(), safe)
  if (!existsSync(abs)) return null
  const body = await readFile(abs)
  const contentType = videoContentType(safe.endsWith('.webm') ? 'video/webm' : 'video/mp4')
  return { body, contentType }
}

export async function readHostedImageFile(
  folder: string,
  filename: string
): Promise<{ body: Buffer; contentType: string; etag: string } | null> {
  const safeFolder = sanitizeFolderName(folder)
  const safeFile = basename(filename)
  if (!IMAGE_FILE_RE.test(safeFile)) return null
  const abs = join(getImagesDir(), safeFolder, safeFile)
  if (!existsSync(abs)) return null
  const [body, fileStat] = await Promise.all([readFile(abs), stat(abs)])
  const ext = safeFile.toLowerCase().slice(safeFile.lastIndexOf('.'))
  const mime =
    ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : 'image/jpeg'
  const etag = `"${fileStat.mtimeMs.toString(16)}-${fileStat.size.toString(16)}"`
  return { body, contentType: imageContentType(mime), etag }
}
