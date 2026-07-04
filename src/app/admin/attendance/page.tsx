'use client'

import { useCallback, useEffect, useState } from 'react'

type Checkin = {
  id: number
  user_id: string
  user_name: string
  date: string
  checkin_time: string
  checkout_time: string | null
  status: string
  session: { hour_count: number; start_time: string } | null
}

type Settings = {
  alert_minutes: number
  delegated_ids: string[]
  delegated_labels: Record<string, string>
  last_alert_change: string | null
  last_alert_changed_by: string | null
}

type AuditEntry = { at: string; by: string; action: string; detail: string }

function formatKstTime(iso: string) {
  const d = new Date(iso)
  const utc = d.getTime() + d.getTimezoneOffset() * 60000
  const kst = new Date(utc + 9 * 60 * 60000)
  return `${String(kst.getHours()).padStart(2, '0')}:${String(kst.getMinutes()).padStart(2, '0')}`
}

function statusLabel(row: Checkin) {
  if (row.status === 'DONE') return '퇴근'
  if (row.status === 'IN_SESSION' && row.session) return `${row.session.hour_count}시간째`
  return '대기중'
}

export default function AdminAttendancePage() {
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState('')
  const [settings, setSettings] = useState<Settings | null>(null)
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [adminIds, setAdminIds] = useState<string[]>([])
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [msg, setMsg] = useState('')
  const [msgOk, setMsgOk] = useState(true)
  const [newDelegateId, setNewDelegateId] = useState('')
  const [newDelegateLabel, setNewDelegateLabel] = useState('')
  const [editTimes, setEditTimes] = useState<Record<number, { checkin?: string; checkout?: string; session?: string }>>({})

  const fetchData = useCallback(async (d?: string) => {
    setLoading(true)
    try {
      const q = d ? `?date=${d}` : ''
      const res = await fetch(`/api/admin/attendance${q}`, { credentials: 'include' })
      const json = await res.json()
      if (res.ok) {
        setSettings(json.settings)
        setCheckins(json.checkins ?? [])
        setDate(json.date)
        setAdminIds(json.adminIds ?? [])
        setAuditLog(json.auditLog ?? [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function patch(body: Record<string, unknown>) {
    setMsg('')
    try {
      const res = await fetch('/api/admin/attendance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (res.ok) {
        setMsgOk(true)
        setMsg('저장되었습니다.')
        fetchData(date)
      } else {
        setMsgOk(false)
        setMsg(json.error ?? '실패')
      }
    } catch {
      setMsgOk(false)
      setMsg('요청 실패')
    }
    setTimeout(() => setMsg(''), 4000)
  }

  function setAlert(minutes: number) {
    patch({ alert_minutes: minutes })
  }

  function addDelegate() {
    if (!newDelegateId.trim()) return
    patch({
      add_delegated: { id: newDelegateId.trim(), label: newDelegateLabel.trim() || undefined },
    })
    setNewDelegateId('')
    setNewDelegateLabel('')
  }

  function removeDelegate(id: string) {
    if (!confirm(`${id} 권한을 해제할까요?`)) return
    patch({ remove_delegated: id })
  }

  function saveCheckinEdit(row: Checkin) {
    const e = editTimes[row.id]
    if (!e) return
    const body: Record<string, unknown> = { checkin_id: row.id }
    if (e.checkin) body.checkin_time = e.checkin
    if (e.checkout && row.status === 'DONE') body.checkout_time = e.checkout
    if (e.session && row.status === 'IN_SESSION') body.session_start_time = e.session
    patch(body)
  }

  function deleteRecord(id: number, name: string) {
    if (!confirm(`${name} 기록을 삭제할까요?`)) return
    patch({ delete_checkin_id: id })
  }

  return (
    <>
      <h1 className="admin-page-title">📋 출근부 · 타이머 관리</h1>
      <p style={{ fontSize: 13, color: 'var(--text-muted, #888)', marginBottom: 20, lineHeight: 1.6 }}>
        텔레그램 출근부 봇과 동일 설정을 공유합니다. 알림 50/55/60분 · 위임 직원 · 출근/세션 시각 수정.
        <br />
        운영자 ID는 서버 <code style={{ background: 'rgba(0,0,0,0.2)', padding: '1px 5px', borderRadius: 4 }}>ATTENDANCE_ADMIN_IDS</code> (.env)에서 설정합니다.
      </p>

      {msg && (
        <div style={{
          padding: '10px 14px', marginBottom: 16, borderRadius: 8, fontSize: 13,
          background: msgOk ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${msgOk ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
        }}>
          {msg}
        </div>
      )}

      {loading && !settings ? (
        <p>불러오는 중…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 알림 설정 */}
          <div className="admin-card">
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>⏰ 알림 기준 (50 / 55 / 60분)</h2>
            <p style={{ fontSize: 13, marginBottom: 12, opacity: 0.85 }}>
              현재: <strong>{settings?.alert_minutes ?? 60}분</strong>
              {settings?.last_alert_change && (
                <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.7 }}>
                  (마지막 변경: {new Date(settings.last_alert_change).toLocaleString('ko-KR')} · {settings.last_alert_changed_by})
                </span>
              )}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[50, 55, 60].map((m) => (
                <button
                  key={m}
                  type="button"
                  className={settings?.alert_minutes === m ? 'btn-success' : 'btn-save'}
                  onClick={() => setAlert(m)}
                >
                  {m}분{settings?.alert_minutes === m ? ' ✓' : ''}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 12, marginTop: 10, opacity: 0.65 }}>
              텔레그램: 전 직원 <code>/알림확인</code> · 운영자 <code>/알림설정 55</code>
            </p>
          </div>

          {/* 운영자 / 위임 */}
          <div className="admin-card">
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>👥 권한 관리</h2>
            <p style={{ fontSize: 13, marginBottom: 8 }}>
              <strong>운영자</strong> (텔레그램 ID): {adminIds.length ? adminIds.join(', ') : '(미설정 — .env에 ATTENDANCE_ADMIN_IDS 추가)'}
            </p>
            <p style={{ fontSize: 13, marginBottom: 12, opacity: 0.85 }}>
              <strong>위임 직원</strong> — 출근/타이머 조작 가능
            </p>
            {(settings?.delegated_ids ?? []).length === 0 ? (
              <p style={{ fontSize: 13, opacity: 0.6 }}>지정된 직원 없음</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px' }}>
                {settings!.delegated_ids.map((id) => (
                  <li key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 13 }}>
                    <span>{id}{settings!.delegated_labels[id] ? ` (${settings!.delegated_labels[id]})` : ''}</span>
                    <button type="button" className="btn-save" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => removeDelegate(id)}>제거</button>
                  </li>
                ))}
              </ul>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="텔레그램 user ID"
                value={newDelegateId}
                onChange={(e) => setNewDelegateId(e.target.value)}
                className="form-input"
                style={{ width: 160 }}
              />
              <input
                type="text"
                placeholder="별칭 (선택)"
                value={newDelegateLabel}
                onChange={(e) => setNewDelegateLabel(e.target.value)}
                className="form-input"
                style={{ width: 120 }}
              />
              <button type="button" className="btn-success" onClick={addDelegate}>추가</button>
            </div>
            <p style={{ fontSize: 12, marginTop: 10, opacity: 0.65 }}>
              텔레그램: <code>/권한추가 ID 별칭</code> · <code>/권한목록</code>
            </p>
          </div>

          {/* 출근부 */}
          <div className="admin-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 16, margin: 0 }}>📋 출근부</h2>
              <input
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); fetchData(e.target.value) }}
                className="form-input"
                style={{ width: 160 }}
              />
              <button type="button" className="btn-save" onClick={() => fetchData(date)}>새로고침</button>
            </div>

            {checkins.length === 0 ? (
              <p style={{ fontSize: 13, opacity: 0.6 }}>{date} 기록 없음</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', padding: '8px 6px' }}>이름</th>
                      <th style={{ textAlign: 'left', padding: '8px 6px' }}>상태</th>
                      <th style={{ textAlign: 'left', padding: '8px 6px' }}>출근</th>
                      <th style={{ textAlign: 'left', padding: '8px 6px' }}>세션시작</th>
                      <th style={{ textAlign: 'left', padding: '8px 6px' }}>퇴근</th>
                      <th style={{ padding: '8px 6px' }}>수정</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkins.map((row) => (
                      <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <td style={{ padding: '8px 6px' }}>{row.user_name}<br /><span style={{ fontSize: 11, opacity: 0.5 }}>{row.user_id}</span></td>
                        <td style={{ padding: '8px 6px' }}>{statusLabel(row)}</td>
                        <td style={{ padding: '8px 6px' }}>
                          <input
                            type="text"
                            placeholder={formatKstTime(row.checkin_time)}
                            className="form-input"
                            style={{ width: 70, fontSize: 12 }}
                            value={editTimes[row.id]?.checkin ?? ''}
                            onChange={(e) => setEditTimes((p) => ({ ...p, [row.id]: { ...p[row.id], checkin: e.target.value } }))}
                          />
                        </td>
                        <td style={{ padding: '8px 6px' }}>
                          {row.status === 'IN_SESSION' && row.session ? (
                            <input
                              type="text"
                              placeholder={formatKstTime(row.session.start_time)}
                              className="form-input"
                              style={{ width: 70, fontSize: 12 }}
                              value={editTimes[row.id]?.session ?? ''}
                              onChange={(e) => setEditTimes((p) => ({ ...p, [row.id]: { ...p[row.id], session: e.target.value } }))}
                            />
                          ) : '—'}
                        </td>
                        <td style={{ padding: '8px 6px' }}>
                          {row.status === 'DONE' && row.checkout_time ? (
                            <input
                              type="text"
                              placeholder={formatKstTime(row.checkout_time)}
                              className="form-input"
                              style={{ width: 70, fontSize: 12 }}
                              value={editTimes[row.id]?.checkout ?? ''}
                              onChange={(e) => setEditTimes((p) => ({ ...p, [row.id]: { ...p[row.id], checkout: e.target.value } }))}
                            />
                          ) : row.checkout_time ? formatKstTime(row.checkout_time) : '—'}
                        </td>
                        <td style={{ padding: '8px 6px', whiteSpace: 'nowrap' }}>
                          <button type="button" className="btn-save" style={{ fontSize: 11, marginRight: 4 }} onClick={() => saveCheckinEdit(row)}>저장</button>
                          <button type="button" className="btn-save" style={{ fontSize: 11, opacity: 0.7 }} onClick={() => deleteRecord(row.id, row.user_name)}>삭제</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p style={{ fontSize: 12, marginTop: 10, opacity: 0.65 }}>
              시간 입력 형식 HH:MM (예: 18:30). 봇 타이머는 약 1분 내 자동 동기화됩니다.
            </p>
          </div>

          {/* 감사 로그 */}
          {auditLog.length > 0 && (
            <div className="admin-card">
              <h2 style={{ fontSize: 16, marginBottom: 12 }}>📝 최근 변경 이력</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 12, lineHeight: 1.8 }}>
                {auditLog.slice(0, 15).map((a, i) => (
                  <li key={i} style={{ opacity: 0.85 }}>
                    {new Date(a.at).toLocaleString('ko-KR')} · {a.action} · {a.detail} ({a.by})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 텔레그램 명령 안내 */}
          <div className="admin-card">
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>📱 텔레그램 명령 요약</h2>
            <pre style={{ fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre-wrap', opacity: 0.9, margin: 0 }}>
{`[전 직원] /알림확인 · /출근현황 · /출근부목록 · /도움말
[권한 직원] /출근 [ID] [HH:MM] · /시작 · /퇴근 · /출근수정 · /시작수정 · /퇴근수정
[운영자] /알림설정 50|55|60 · /권한추가 · /권한제거 · /기록삭제`}
            </pre>
          </div>
        </div>
      )}
    </>
  )
}
