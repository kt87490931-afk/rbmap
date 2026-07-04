import { NextResponse } from 'next/server'
import { requireAdminOrSetup } from '@/lib/admin-auth'
import {
  loadAttendanceData,
  saveAttendanceData,
  todayDateStringKST,
  appendAudit,
  VALID_ALERTS,
} from '@/lib/attendance/data'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authErr = await requireAdminOrSetup()
  if (authErr) return authErr

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || todayDateStringKST()
  const data = loadAttendanceData()
  const day = data.days[date] || { ladies: {}, sessions: [], completed_counts: {} }

  const adminIds = (process.env.ATTENDANCE_ADMIN_IDS || process.env.ADMIN_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  return NextResponse.json({
    version: data.version,
    settings: data.settings,
    ladies: data.ladies.filter((l) => l.active),
    rooms: data.rooms.filter((r) => r.active),
    day,
    date,
    adminIds,
    auditLog: data.audit_log.slice(0, 30),
    validAlerts: VALID_ALERTS,
  })
}

type PatchBody = {
  store_name?: string
  alert_minutes?: number
  add_delegated?: { id: string; label?: string }
  remove_delegated?: string
  add_lady?: string
  remove_lady?: string
  add_room?: string
  remove_room?: string
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

  if (body.store_name != null) {
    data.settings.store_name = body.store_name.trim() || '간지'
    appendAudit(data, 'store_name', data.settings.store_name)
  }

  if (body.alert_minutes != null) {
    if (!VALID_ALERTS.includes(body.alert_minutes)) {
      return NextResponse.json({ error: '45, 50, 55만 가능' }, { status: 400 })
    }
    const prev = data.settings.alert_minutes
    data.settings.alert_minutes = body.alert_minutes
    data.settings.last_alert_change = new Date().toISOString()
    data.settings.last_alert_changed_by = 'admin-web'
    appendAudit(data, 'alert_change', `${prev}→${body.alert_minutes}`)
  }

  if (body.add_delegated?.id) {
    const id = String(body.add_delegated.id)
    if (!data.settings.delegated_ids.includes(id)) data.settings.delegated_ids.push(id)
    if (body.add_delegated.label) data.settings.delegated_labels[id] = body.add_delegated.label
    appendAudit(data, 'delegate_add', id)
  }

  if (body.remove_delegated) {
    const id = String(body.remove_delegated)
    data.settings.delegated_ids = data.settings.delegated_ids.filter((x) => x !== id)
    delete data.settings.delegated_labels[id]
    appendAudit(data, 'delegate_remove', id)
  }

  if (body.add_lady) {
    const name = body.add_lady.trim()
    if (name && !data.ladies.some((l) => l.active && l.name === name)) {
      data.ladies.push({ id: data.next_lady_id++, name, active: true })
      appendAudit(data, 'lady_add', name)
    }
  }

  if (body.remove_lady) {
    const lady = data.ladies.find((l) => l.active && l.name === body.remove_lady?.trim())
    if (lady) {
      lady.active = false
      appendAudit(data, 'lady_remove', lady.name)
    }
  }

  if (body.add_room) {
    const name = body.add_room.trim()
    if (name && !data.rooms.some((r) => r.active && r.name === name)) {
      data.rooms.push({ id: data.next_room_id++, name, active: true })
      appendAudit(data, 'room_add', name)
    }
  }

  if (body.remove_room) {
    const room = data.rooms.find((r) => r.active && r.name === body.remove_room?.trim())
    if (room) {
      room.active = false
      appendAudit(data, 'room_remove', room.name)
    }
  }

  saveAttendanceData(data)
  return NextResponse.json({ ok: true, settings: data.settings })
}
