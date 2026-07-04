import fs from 'fs'
import path from 'path'

export type AttendanceSession = {
  hour_count: number
  start_time: string
  alert_minutes: number
  alert_time: string
  alert_sent: number
}

export type AttendanceCheckin = {
  id: number
  chat_id: number
  user_id: string
  user_name: string
  date: string
  checkin_time: string
  checkout_time: string | null
  status: 'WAITING' | 'IN_SESSION' | 'DONE'
  session: AttendanceSession | null
  session_history: { start_time: string; end_time: string; hours: number }[]
}

export type AttendanceSettings = {
  alert_minutes: number
  delegated_ids: string[]
  delegated_labels: Record<string, string>
  last_alert_change: string | null
  last_alert_changed_by: string | null
}

export type AttendanceData = {
  settings: AttendanceSettings
  checkins: AttendanceCheckin[]
  nextId: number
  audit_log: { at: string; by: string; action: string; detail: string }[]
}

const DEFAULT_ALERT = 60

export function getAttendanceDataPath(): string {
  if (process.env.ATTENDANCE_DATA_PATH) return process.env.ATTENDANCE_DATA_PATH
  // standalone: repo root 기준 (deploy 시 env 권장)
  const fromRoot = path.join(process.cwd(), '..', '..', 'data', 'attendance-data.json')
  if (fs.existsSync(fromRoot)) return fromRoot
  return path.join(process.cwd(), 'data', 'attendance-data.json')
}

function initialData(): AttendanceData {
  return {
    settings: {
      alert_minutes: DEFAULT_ALERT,
      delegated_ids: [],
      delegated_labels: {},
      last_alert_change: null,
      last_alert_changed_by: null,
    },
    checkins: [],
    nextId: 1,
    audit_log: [],
  }
}

export function loadAttendanceData(): AttendanceData {
  const file = getAttendanceDataPath()
  const dir = path.dirname(file)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(file)) {
    const init = initialData()
    fs.writeFileSync(file, JSON.stringify(init, null, 2))
    return init
  }
  const raw = fs.readFileSync(file, 'utf8')
  const data = JSON.parse(raw) as AttendanceData
  if (!data.settings.delegated_ids) data.settings.delegated_ids = []
  if (!data.settings.delegated_labels) data.settings.delegated_labels = {}
  if (!data.audit_log) data.audit_log = []
  return data
}

export function saveAttendanceData(data: AttendanceData): void {
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

export function parseTimeOnDateKST(dateStr: string, timeStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const [hh, mm] = timeStr.split(':').map(Number)
  const kstMs = Date.UTC(y, m - 1, d, hh, mm, 0, 0) - 9 * 60 * 60 * 1000
  return new Date(kstMs).toISOString()
}

export function isValidTimeString(str: string): boolean {
  return /^([01]?\d|2[0-3]):[0-5]\d$/.test(str)
}

export function appendAudit(
  data: AttendanceData,
  action: string,
  detail: string,
  by = 'admin-web'
): void {
  data.audit_log.unshift({ at: new Date().toISOString(), by, action, detail })
  if (data.audit_log.length > 200) data.audit_log.length = 200
}
