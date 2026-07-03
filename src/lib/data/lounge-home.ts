import { getSiteSection } from './site'
import { LOUNGE_HOME_DEFAULTS } from './lounge-home-defaults'
import type {
  LoungeAboutItem,
  LoungeHomeContent,
  LoungeInfoItem,
  LoungeMenuGroup,
  LoungeMenuRow,
} from './lounge-home-defaults'

export { LOUNGE_HOME_DEFAULTS }
export type {
  LoungeAboutItem,
  LoungeHomeContent,
  LoungeInfoItem,
  LoungeMenuGroup,
  LoungeMenuRow,
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function deepMergeLoungeHome<T>(base: T, patch: Partial<T> | null | undefined): T {
  if (!patch) return structuredClone(base)
  const patchObj = patch as Record<string, unknown>
  if (Array.isArray(base) && Array.isArray(patch)) {
    return (patch.length > 0 ? patch : base) as T
  }
  if (!isPlainObject(base) || !isPlainObject(patch)) {
    return (patch as T) ?? base
  }
  const out = { ...base } as Record<string, unknown>
  for (const key of Object.keys(patchObj)) {
    const bv = (base as Record<string, unknown>)[key]
    const pv = patchObj[key]
    if (pv === undefined) continue
    if (Array.isArray(pv)) {
      out[key] = pv.length > 0 ? pv : bv
    } else if (isPlainObject(bv) && isPlainObject(pv)) {
      out[key] = deepMergeLoungeHome(bv, pv)
    } else {
      out[key] = pv
    }
  }
  return out as T
}

/** 공간 둘러보기 갤러리 슬롯 수 (가로 4 × 2줄) */
export const LOUNGE_GALLERY_SLOTS = 8

export async function getLoungeHomeContent(): Promise<LoungeHomeContent> {
  const db = await getSiteSection<Partial<LoungeHomeContent>>('lounge_home')
  const merged = deepMergeLoungeHome(LOUNGE_HOME_DEFAULTS, db)
  const imgs = merged.gallery.images.slice(0, LOUNGE_GALLERY_SLOTS)
  while (imgs.length < LOUNGE_GALLERY_SLOTS) imgs.push('')
  merged.gallery = { ...merged.gallery, images: imgs }
  return merged
}

/** dot 경로로 값 설정 (예: hero.badge1, gallery.images.0) */
export function setLoungeHomePath(
  content: LoungeHomeContent,
  path: string,
  value: string
): LoungeHomeContent {
  const keys = path.split('.')
  const next = structuredClone(content)
  let cur: unknown = next
  for (let i = 0; i < keys.length - 1; i++) {
    const idx = Number(keys[i])
    cur = !Number.isNaN(idx) ? (cur as unknown[])[idx] : (cur as Record<string, unknown>)[keys[i]]
  }
  const last = keys[keys.length - 1]
  const lastIdx = Number(last)
  if (!Number.isNaN(lastIdx)) {
    (cur as unknown[])[lastIdx] = value
  } else {
    (cur as Record<string, unknown>)[last] = value
  }
  return next
}

/** dot 경로로 값 읽기 */
export function getLoungeHomePath(content: LoungeHomeContent, path: string): string {
  const keys = path.split('.')
  let cur: unknown = content
  for (const k of keys) {
    if (cur == null) return ''
    const idx = Number(k)
    cur = !Number.isNaN(idx) ? (cur as unknown[])[idx] : (cur as Record<string, unknown>)[k]
  }
  return typeof cur === 'string' ? cur : ''
}

export function loungeImageSrc(path: string): string | undefined {
  const p = path.trim()
  if (!p) return undefined
  if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('/')) return p
  return `/${p.replace(/^\/+/, '')}`
}
