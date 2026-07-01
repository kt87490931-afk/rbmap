import { mkdir, readFile, writeFile, unlink, readdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import {
  getImagesDir,
  getStorageRoot,
  getVideosDir,
  sanitizeFolderName,
  slotStoragePath,
  IMAGE_MIME,
  VIDEO_MIME,
} from './constants'
import { prepareHostingStorage } from './migrate'

export interface HostingImageRecord {
  id: string
  folder: string
  filename: string
  storagePath: string
  mimeType: string
  sizeBytes: number
  createdAt: string
}

export interface HostingVideoSlot {
  slot: number
  storagePath: string | null
  filename: string | null
  mimeType: string | null
  sizeBytes: number
  updatedAt: string | null
}

interface ImagesManifest {
  images: HostingImageRecord[]
}

interface VideosManifest {
  slots: HostingVideoSlot[]
}

function imagesManifestPath(): string {
  return join(getStorageRoot(), 'images.json')
}

function videosManifestPath(): string {
  return join(getStorageRoot(), 'videos.json')
}

function absFromStoragePath(storagePath: string): string {
  const parts = storagePath.split('/')
  if (parts[0] === 'h') {
    return join(getImagesDir(), ...parts.slice(1))
  }
  if (parts[0] === '4m') {
    return join(getVideosDir(), ...parts.slice(1))
  }
  return join(getImagesDir(), ...parts)
}

async function ensureStorageDir(): Promise<void> {
  await prepareHostingStorage()
}

async function readJsonFile<T>(path: string, fallback: T): Promise<T> {
  if (!existsSync(path)) return fallback
  try {
    const raw = await readFile(path, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

async function writeJsonFile(path: string, data: unknown): Promise<void> {
  await ensureStorageDir()
  await writeFile(path, JSON.stringify(data, null, 2), 'utf-8')
}

function defaultVideoSlots(): HostingVideoSlot[] {
  return [1, 2, 3, 4].map((slot) => ({
    slot,
    storagePath: null,
    filename: null,
    mimeType: null,
    sizeBytes: 0,
    updatedAt: null,
  }))
}

export async function listHostingImages(folder?: string): Promise<HostingImageRecord[]> {
  const manifest = await readJsonFile<ImagesManifest>(imagesManifestPath(), { images: [] })
  const items = manifest.images.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  if (!folder) return items
  const f = sanitizeFolderName(folder)
  return items.filter((item) => item.folder === f)
}

export async function listHostingFolders(): Promise<string[]> {
  await ensureStorageDir()
  const manifest = await readJsonFile<ImagesManifest>(imagesManifestPath(), { images: [] })
  const set = new Set<string>(['default'])
  for (const item of manifest.images) set.add(item.folder)

  const imagesDir = getImagesDir()
  if (existsSync(imagesDir)) {
    const entries = await readdir(imagesDir, { withFileTypes: true }).catch(() => [])
    for (const entry of entries) {
      if (entry.isDirectory()) set.add(entry.name)
    }
  }

  return Array.from(set).sort()
}

export async function createHostingFolder(raw: string): Promise<string> {
  const trimmed = raw.trim()
  if (!trimmed) throw new Error('폴더 이름을 입력해 주세요.')

  const folder = sanitizeFolderName(trimmed)
  const normalized = trimmed.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
  if (!normalized || normalized !== folder) {
    throw new Error('폴더 이름은 영문, 숫자, -, _ 만 사용할 수 있습니다.')
  }

  await ensureStorageDir()
  await mkdir(join(getImagesDir(), folder), { recursive: true })
  return folder
}

export async function getHostingImage(id: string): Promise<HostingImageRecord | null> {
  const manifest = await readJsonFile<ImagesManifest>(imagesManifestPath(), { images: [] })
  return manifest.images.find((item) => item.id === id) ?? null
}

function basenameFilename(name: string): string {
  const n = (name || '').replace(/\\/g, '/')
  const i = n.lastIndexOf('/')
  return i >= 0 ? n.slice(i + 1) : n
}

export async function addHostingImage(input: {
  folder: string
  originalFilename: string
  mimeType: string
  buffer: Buffer
}): Promise<HostingImageRecord & { overwritten: boolean }> {
  const ext = IMAGE_MIME[input.mimeType]
  if (!ext) throw new Error('지원하지 않는 이미지 형식입니다.')

  await ensureStorageDir()
  const folder = sanitizeFolderName(input.folder)
  const displayName = basenameFilename(input.originalFilename) || `image${ext}`

  const manifest = await readJsonFile<ImagesManifest>(imagesManifestPath(), { images: [] })
  const existingIdx = manifest.images.findIndex(
    (item) =>
      item.folder === folder && basenameFilename(item.filename).toLowerCase() === displayName.toLowerCase()
  )

  await mkdir(join(getImagesDir(), folder), { recursive: true })

  if (existingIdx >= 0) {
    const existing = manifest.images[existingIdx]
    const oldAbs = absFromStoragePath(existing.storagePath)
    const storedName = `${existing.id}${ext}`
    const storagePath = `h/${folder}/${storedName}`
    const absPath = join(getImagesDir(), folder, storedName)

    if (oldAbs !== absPath && existsSync(oldAbs)) {
      await unlink(oldAbs).catch(() => {})
    }

    await writeFile(absPath, input.buffer)

    const record: HostingImageRecord = {
      ...existing,
      filename: displayName,
      storagePath,
      mimeType: input.mimeType,
      sizeBytes: input.buffer.length,
    }
    manifest.images[existingIdx] = record
    await writeJsonFile(imagesManifestPath(), manifest)
    return { ...record, overwritten: true }
  }

  const id = randomUUID()
  const storedName = `${id}${ext}`
  const storagePath = `h/${folder}/${storedName}`
  const absPath = join(getImagesDir(), folder, storedName)

  await writeFile(absPath, input.buffer)

  const record: HostingImageRecord = {
    id,
    folder,
    filename: displayName,
    storagePath,
    mimeType: input.mimeType,
    sizeBytes: input.buffer.length,
    createdAt: new Date().toISOString(),
  }

  manifest.images.push(record)
  await writeJsonFile(imagesManifestPath(), manifest)
  return { ...record, overwritten: false }
}

export async function deleteHostingImage(id: string): Promise<boolean> {
  const manifest = await readJsonFile<ImagesManifest>(imagesManifestPath(), { images: [] })
  const idx = manifest.images.findIndex((item) => item.id === id)
  if (idx < 0) return false

  const [removed] = manifest.images.splice(idx, 1)
  const absPath = absFromStoragePath(removed.storagePath)
  if (existsSync(absPath)) await unlink(absPath).catch(() => {})
  await writeJsonFile(imagesManifestPath(), manifest)
  return true
}

export async function listVideoSlots(): Promise<HostingVideoSlot[]> {
  const manifest = await readJsonFile<VideosManifest>(videosManifestPath(), { slots: defaultVideoSlots() })
  const bySlot = new Map(manifest.slots.map((s) => [s.slot, s]))
  return defaultVideoSlots().map((d) => bySlot.get(d.slot) ?? d)
}

export async function upsertVideoSlot(input: {
  slot: number
  originalFilename: string
  mimeType: string
  buffer: Buffer
}): Promise<HostingVideoSlot> {
  if (input.slot < 1 || input.slot > 4) throw new Error('슬롯은 1~4만 가능합니다.')
  const ext = VIDEO_MIME[input.mimeType]
  if (!ext) throw new Error('지원하지 않는 영상 형식입니다.')

  await ensureStorageDir()
  const manifest = await readJsonFile<VideosManifest>(videosManifestPath(), { slots: defaultVideoSlots() })
  const existing = manifest.slots.find((s) => s.slot === input.slot)

  if (existing?.storagePath) {
    const oldAbs = absFromStoragePath(existing.storagePath)
    if (existsSync(oldAbs)) await unlink(oldAbs).catch(() => {})
    // 다른 확장자 슬롯 파일도 정리
    for (const otherExt of Object.values(VIDEO_MIME)) {
      const alt = join(getVideosDir(), `slot-${input.slot}${otherExt}`)
      if (existsSync(alt)) await unlink(alt).catch(() => {})
    }
  }

  const storagePath = slotStoragePath(input.slot, ext)
  const absPath = join(getVideosDir(), `slot-${input.slot}${ext}`)
  await writeFile(absPath, input.buffer)

  const record: HostingVideoSlot = {
    slot: input.slot,
    storagePath,
    filename: input.originalFilename || `slot-${input.slot}${ext}`,
    mimeType: input.mimeType,
    sizeBytes: input.buffer.length,
    updatedAt: new Date().toISOString(),
  }

  const others = manifest.slots.filter((s) => s.slot !== input.slot)
  manifest.slots = [...others, record].sort((a, b) => a.slot - b.slot)
  await writeJsonFile(videosManifestPath(), manifest)
  return record
}

export async function clearVideoSlot(slot: number): Promise<boolean> {
  if (slot < 1 || slot > 4) return false
  const manifest = await readJsonFile<VideosManifest>(videosManifestPath(), { slots: defaultVideoSlots() })
  const existing = manifest.slots.find((s) => s.slot === slot)
  if (!existing?.storagePath) return false

  const absPath = absFromStoragePath(existing.storagePath)
  if (existsSync(absPath)) await unlink(absPath).catch(() => {})
  for (const otherExt of Object.values(VIDEO_MIME)) {
    const alt = join(getVideosDir(), `slot-${slot}${otherExt}`)
    if (existsSync(alt)) await unlink(alt).catch(() => {})
  }

  const empty: HostingVideoSlot = {
    slot,
    storagePath: null,
    filename: null,
    mimeType: null,
    sizeBytes: 0,
    updatedAt: new Date().toISOString(),
  }
  const others = manifest.slots.filter((s) => s.slot !== slot)
  manifest.slots = [...others, empty].sort((a, b) => a.slot - b.slot)
  await writeJsonFile(videosManifestPath(), manifest)
  return true
}
