export {
  SITE_URL,
  IMAGE_MAX_BYTES,
  VIDEO_MAX_BYTES,
  IMAGE_MIME,
  VIDEO_MIME,
  GRID_WIDTH,
  CELL_WIDTH,
  CELL_HEIGHT,
  getProjectRoot,
  getPublicRoot,
  getStorageRoot,
  getImagesDir,
  getVideosDir,
  publicUrl,
  sanitizeFolderName,
  buildImageHtml,
  buildImageHtmlFullWidth,
  buildVideoEmbedHtml,
  slotStoragePath,
} from './constants'

export type { HostingImageRecord, HostingVideoSlot } from './manifest'
export {
  listHostingImages,
  listHostingFolders,
  getHostingImage,
  addHostingImage,
  deleteHostingImage,
  listVideoSlots,
  upsertVideoSlot,
  clearVideoSlot,
} from './manifest'

import { listVideoSlots } from './manifest'
import { buildVideoEmbedHtml, publicUrl } from './constants'

export async function buildVideoEmbedFromSlots(): Promise<{ urls: string[]; html: string }> {
  const slots = await listVideoSlots()
  const urls = slots
    .sort((a, b) => a.slot - b.slot)
    .filter((s) => s.storagePath)
    .map((s) => publicUrl(s.storagePath!, s.updatedAt ? Date.parse(s.updatedAt) : undefined))
  return { urls, html: buildVideoEmbedHtml(urls) }
}
