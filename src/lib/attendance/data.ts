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

export type CourseSegment = {
  course: 'A' | 'B'
  start_time: string
  end_scheduled: string
  ended_at: string | null
}

export type CourseCounts = { A: number; B: number }

export type RoomSession = {
  id: number
  room_id: number
  chat_id: number
  customer_count: number
  start_time: string
  course: 'A' | 'B'
  duration_minutes: number
  hour_count: number
  end_scheduled: string
  status: 'active' | 'ended'
  ended_at: string | null
  alert_before_minutes: number
  alert_minutes: number
  alert_time: string
  alert_sent: boolean
  assignments: SessionAssignment[]
  course_segments: CourseSegment[]
}

export type DayData = {
  ladies: Record<string, { checked_in: boolean; checked_out: boolean; checkin_time: string; checkout_time: string | null }>
  sessions: RoomSession[]
  completed_counts: Record<string, CourseCounts | number>
}

export type AttendanceSettings = {
  store_name: string
  alert_minutes: number
  operator_ids: string[]
  staff_ids: string[]
  role_labels: Record<string, string>
  /** @deprecated operator_ids 와 동기화 */
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

const VALID_ALERTS = [5, 10, 15]
const DEFAULT_ALERT = 5
const COURSE_DURATIONS = { A: 60, B: 90 } as const

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
      operator_ids: [],
      staff_ids: [],
      role_labels: {},
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

/** 영업일 전환 15:00 — 18:00~익일 15:00 = 같은 영업일 */
export const BUSINESS_ROLLOVER_HOUR = 15

export function businessDateStringKST(): string {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const kst = new Date(utc + 9 * 60 * 60000)
  if (kst.getHours() < BUSINESS_ROLLOVER_HOUR) {
    kst.setDate(kst.getDate() - 1)
  }
  const y = kst.getFullYear()
  const m = String(kst.getMonth() + 1).padStart(2, '0')
  const d = String(kst.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayDateStringKST(): string {
  return businessDateStringKST()
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

export { VALID_ALERTS, DEFAULT_ALERT, COURSE_DURATIONS }
