import { cp, mkdir, readdir, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import {
  getHostingDataRoot,
  getImagesDir,
  getProjectRoot,
  getStorageRoot,
  getVideosDir,
} from './constants'

const MARKER = '.legacy-migrated'

/** public/h·public/4m·storage/hosting 구경로 → data/hosting (1회) */
export async function migrateLegacyHostingData(): Promise<void> {
  const root = getHostingDataRoot()
  await mkdir(root, { recursive: true })
  await mkdir(getImagesDir(), { recursive: true })
  await mkdir(getVideosDir(), { recursive: true })

  if (existsSync(join(root, MARKER))) return

  const projectRoot = getProjectRoot()

  // public/h/{folder}/* → data/hosting/images/
  const legacyH = join(projectRoot, 'public', 'h')
  if (existsSync(legacyH)) {
    const folders = await readdir(legacyH, { withFileTypes: true }).catch(() => [])
    for (const entry of folders) {
      if (!entry.isDirectory()) continue
      const src = join(legacyH, entry.name)
      const dest = join(getImagesDir(), entry.name)
      await mkdir(dest, { recursive: true })
      await cp(src, dest, { recursive: true, force: false }).catch(() => {})
    }
  }

  // public/4m/slot-* → data/hosting/videos/
  const legacy4m = join(projectRoot, 'public', '4m')
  if (existsSync(legacy4m)) {
    const files = await readdir(legacy4m).catch(() => [])
    for (const name of files) {
      if (!/^slot-[1-4]\.(mp4|webm)$/i.test(name)) continue
      const src = join(legacy4m, name)
      const dest = join(getVideosDir(), name)
      if (!existsSync(dest)) {
        await cp(src, dest).catch(() => {})
      }
    }
  }

  // storage/hosting/*.json
  const legacyMeta = join(projectRoot, 'storage', 'hosting')
  for (const name of ['images.json', 'videos.json'] as const) {
    const src = join(legacyMeta, name)
    const dest = join(getStorageRoot(), name)
    if (existsSync(src) && !existsSync(dest)) {
      await cp(src, dest).catch(() => {})
    }
  }

  await writeFile(join(root, MARKER), new Date().toISOString(), 'utf-8').catch(() => {})
}

/** manifest 로드 전 마이그레이션 + 디렉터리 보장 */
export async function prepareHostingStorage(): Promise<void> {
  await migrateLegacyHostingData()
  await mkdir(getStorageRoot(), { recursive: true })
  await mkdir(getImagesDir(), { recursive: true })
  await mkdir(getVideosDir(), { recursive: true })
}
