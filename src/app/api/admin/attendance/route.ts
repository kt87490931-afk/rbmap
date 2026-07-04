import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import {
  loadAttendanceData,
  saveAttendanceData,
  todayDateStringKST,
  appendAudit,
  formatTimeKST,
  parseTimeOnDateKST,
  isValidTimeString,
} from '@/lib/attendance/data'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || todayDateStringKST()

  const data = loadAttendanceData()
  const checkins = data.checkins
    .filter((c) => c.date === date)
    .sort((a, b) => new Date(a.checkin_time).getTime() - new Date(b.checkin_time).getTime())

  const adminIds = (process.env.ATTENDANCE_ADMIN_IDS || process.env.ADMIN_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  return NextResponse.json({
    settings: data.settings,
    checkins,
    date,
    dataPath: process.env.ATTENDANCE_DATA_PATH || '(auto)',
    adminIds,
    auditLog: data.audit_log.slice(0, 30),
    botRunningHint: 'PM2 attendance-bot 프로세스 확인',
  })
}

type PatchBody = {
  alert_minutes?: number
  delegated_ids?: string[]
  delegated_labels?: Record<string, string>
  add_delegated?: { id: string; label?: string }
  remove_delegated?: string
  checkin_id?: number
  checkin_time?: string
  checkout_time?: string
  session_start_time?: string
  delete_checkin_id?: number
}

export async function PATCH(request: Request) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  let body: PatchBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON 필요' }, { status: 400 })
  }

  const data = loadAttendanceData()

  if (body.alert_minutes != null) {
    if (![50, 55, 60].includes(body.alert_minutes)) {
      return NextResponse.json({ error: '50, 55, 60만 가능' }, { status: 400 })
    }
    const prev = data.settings.alert_minutes
    data.settings.alert_minutes = body.alert_minutes
    data.settings.last_alert_change = new Date().toISOString()
    data.settings.last_alert_changed_by = 'admin-web'
    appendAudit(data, 'alert_change', `${prev}분 → ${body.alert_minutes}분`)
  }

  if (body.delegated_ids != null) {
    data.settings.delegated_ids = body.delegated_ids.map(String)
  }
  if (body.delegated_labels != null) {
    data.settings.delegated_labels = body.delegated_labels
  }

  if (body.add_delegated?.id) {
    const id = String(body.add_delegated.id)
    if (!data.settings.delegated_ids.includes(id)) {
      data.settings.delegated_ids.push(id)
    }
    if (body.add_delegated.label) {
      data.settings.delegated_labels[id] = body.add_delegated.label
    }
    appendAudit(data, 'delegate_add', id)
  }

  if (body.remove_delegated) {
    const id = String(body.remove_delegated)
    data.settings.delegated_ids = data.settings.delegated_ids.filter((x) => x !== id)
    delete data.settings.delegated_labels[id]
    appendAudit(data, 'delegate_remove', id)
  }

  if (body.checkin_id != null && body.checkin_time) {
    if (!isValidTimeString(body.checkin_time)) {
      return NextResponse.json({ error: 'HH:MM 형식' }, { status: 400 })
    }
    const row = data.checkins.find((c) => c.id === body.checkin_id)
    if (!row) return NextResponse.json({ error: '기록 없음' }, { status: 404 })
    const prev = formatTimeKST(row.checkin_time)
    row.checkin_time = parseTimeOnDateKST(row.date, body.checkin_time)
    appendAudit(data, 'checkin_edit', `${row.user_name} ${prev}→${body.checkin_time}`)
  }

  if (body.checkin_id != null && body.checkout_time) {
    if (!isValidTimeString(body.checkout_time)) {
      return NextResponse.json({ error: 'HH:MM 형식' }, { status: 400 })
    }
    const row = data.checkins.find((c) => c.id === body.checkin_id)
    if (!row || row.status !== 'DONE') {
      return NextResponse.json({ error: '퇴근 완료 기록만 수정 가능' }, { status: 400 })
    }
    const prev = row.checkout_time ? formatTimeKST(row.checkout_time) : '-'
    row.checkout_time = parseTimeOnDateKST(row.date, body.checkout_time)
    appendAudit(data, 'checkout_edit', `${row.user_name} ${prev}→${body.checkout_time}`)
  }

  if (body.checkin_id != null && body.session_start_time) {
    if (!isValidTimeString(body.session_start_time)) {
      return NextResponse.json({ error: 'HH:MM 형식' }, { status: 400 })
    }
    const row = data.checkins.find((c) => c.id === body.checkin_id)
    if (!row || row.status !== 'IN_SESSION' || !row.session) {
      return NextResponse.json({ error: '진행 중 세션만 수정 가능' }, { status: 400 })
    }
    const prev = formatTimeKST(row.session.start_time)
    const iso = parseTimeOnDateKST(row.date, body.session_start_time)
    const alertMin = data.settings.alert_minutes
    row.session.start_time = iso
    row.session.alert_minutes = alertMin
    row.session.alert_time = new Date(new Date(iso).getTime() + alertMin * 60000).toISOString()
    row.session.alert_sent = 0
    appendAudit(data, 'session_edit', `${row.user_name} ${prev}→${body.session_start_time}`)
  }

  if (body.delete_checkin_id != null) {
    const idx = data.checkins.findIndex((c) => c.id === body.delete_checkin_id)
    if (idx === -1) return NextResponse.json({ error: '기록 없음' }, { status: 404 })
    const removed = data.checkins.splice(idx, 1)[0]
    appendAudit(data, 'record_delete', removed.user_name)
  }

  saveAttendanceData(data)
  return NextResponse.json({ ok: true, settings: data.settings })
}
