import fs from 'fs'
import path from 'path'

export type StoreDef = {
  id: string
  label: string
  botTokenEnv: string
  adminIdsEnv: string
  channelIdEnv: string
  dataFile: string
  defaultStoreName: string
}

type StoresFile = { stores: StoreDef[] }

function configPath(): string {
  return path.join(process.cwd(), 'config', 'stores.json')
}

function readStoresFile(): StoresFile {
  const p = configPath()
  if (!fs.existsSync(p)) {
    return {
      stores: [
        {
          id: 'ganji',
          label: '간지',
          botTokenEnv: 'ATTENDANCE_BOT_TOKEN_GANJI',
          adminIdsEnv: 'ATTENDANCE_ADMIN_IDS_GANJI',
          channelIdEnv: 'TELEGRAM_CHANNEL_ID_GANJI',
          dataFile: 'data/ganji/attendance-data.json',
          defaultStoreName: '간지',
        },
      ],
    }
  }
  return JSON.parse(fs.readFileSync(p, 'utf8')) as StoresFile
}

export function listStores(): StoreDef[] {
  return readStoresFile().stores
}

export function getStore(storeId: string): StoreDef | null {
  return listStores().find((s) => s.id === storeId) ?? null
}

export function resolveStoreId(raw: string | null | undefined): string {
  const id = (raw || 'ganji').trim()
  const store = getStore(id)
  if (!store) throw new Error(`알 수 없는 매장: ${id}`)
  return id
}

export function getAttendanceDataPathForStore(storeId: string): string {
  const store = getStore(storeId)
  if (!store) {
    if (process.env.ATTENDANCE_DATA_PATH) return process.env.ATTENDANCE_DATA_PATH
    return path.join(process.cwd(), 'data', 'attendance-data.json')
  }
  if (path.isAbsolute(store.dataFile)) return store.dataFile
  return path.join(process.cwd(), store.dataFile)
}

export function getAdminIdsForStore(storeId: string): string[] {
  const store = getStore(storeId)
  if (!store) {
    return (process.env.ATTENDANCE_ADMIN_IDS || process.env.ADMIN_IDS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  const raw = process.env[store.adminIdsEnv] || (storeId === 'ganji' ? process.env.ATTENDANCE_ADMIN_IDS : '') || ''
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}
