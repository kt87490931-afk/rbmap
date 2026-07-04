import fs from 'fs'
import path from 'path'

export type Lady = { id: number; name: string; active: boolean }
export type Room = { id: number; name: string; active: boolean }

export type SessionAssignment = {
  lady_id: number
  from_start: boolean
  joined_at: string
  removed_at: string | null
}

export type RoomSession = {
  id: number
  room_id: number
  chat_id: number
  customer_count: number
  start_time: string
  hour_count: number
  end_scheduled: string
  status: 'active' | 'ended'
  ended_at: string | null
  alert_minutes: number
  alert_time: string
  alert_sent: boolean
  assignments: SessionAssignment[]
}

export type DayData = {
  ladies: Record<string, { checked_in: boolean; checked_out: boolean; checkin_time: string; checkout_time: string | null }>
  sessions: RoomSession[]
  completed_counts: Record<string, number>
}

export type AttendanceSettings = {
  store_name: string
  alert_minutes: number
  delegated_ids: string[]
  delegated_labels: Record<string, string>
  last_alert_change: string | null
  last_alert_changed_by: string | null
}

export type AttendanceDataV2 = {
  version: number
  settings: AttendanceSettings
  ladies: Lady[]
  rooms: Room[]
  days: Record<string, DayData>
  next_lady_id: number
  next_room_id: number
  next_session_id: number
  audit_log: { at: string; by: string; action: string; detail: string }[]
}

const VALID_ALERTS = [45, 50, 55]
const DEFAULT_ALERT = 55

export function getAttendanceDataPath(): string {
  if (process.env.ATTENDANCE_DATA_PATH) return process.env.ATTENDANCE_DATA_PATH
  const fromRoot = path.join(process.cwd(), '..', '..', 'data', 'attendance-data.json')
  if (fs.existsSync(fromRoot)) return fromRoot
  return path.join(process.cwd(), 'data', 'attendance-data.json')
}

function initialData(): AttendanceDataV2 {
  return {
    version: 2,
    settings: {
      store_name: '간지',
      alert_minutes: DEFAULT_ALERT,
      delegated_ids: [],
      delegated_labels: {},
      last_alert_change: null,
      last_alert_changed_by: null,
    },
    ladies: [],
    rooms: [],
    days: {},
    next_lady_id: 1,
    next_room_id: 1,
    next_session_id: 1,
    audit_log: [],
  }
}

export function loadAttendanceData(): AttendanceDataV2 {
  const file = getAttendanceDataPath()
  const dir = path.dirname(file)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(file)) {
    const init = initialData()
    fs.writeFileSync(file, JSON.stringify(init, null, 2))
    return init
  }
  return JSON.parse(fs.readFileSync(file, 'utf8')) as AttendanceDataV2
}

export function saveAttendanceData(data: AttendanceDataV2): void {
  const file = getAttendanceDataPath()
  const dir = path.dirname(file)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const tmp = `${file}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
  fs.renameSync(tmp, file)
}

export function todayDateStringKST(): string {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const kst = new Date(utc + 9 * 60 * 60000)
  const y = kst.getFullYear()
  const m = String(kst.getMonth() + 1).padStart(2, '0')
  const d = String(kst.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatTimeKST(iso: string): string {
  const d = new Date(iso)
  const utc = d.getTime() + d.getTimezoneOffset() * 60000
  const kst = new Date(utc + 9 * 60 * 60000)
  return `${String(kst.getHours()).padStart(2, '0')}:${String(kst.getMinutes()).padStart(2, '0')}`
}

export function appendAudit(
  data: AttendanceDataV2,
  action: string,
  detail: string,
  by = 'admin-web'
): void {
  data.audit_log.unshift({ at: new Date().toISOString(), by, action, detail })
  if (data.audit_log.length > 200) data.audit_log.length = 200
}

export { VALID_ALERTS, DEFAULT_ALERT }
