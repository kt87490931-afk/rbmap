'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

type Lady = { id: number; name: string }
type Room = { id: number; name: string }
type Session = {
  id: number
  room_id: number
  customer_count: number
  course?: string
  start_time: string
  hour_count: number
  status: string
  assignments: { lady_id: number; from_start: boolean; removed_at: string | null }[]
}

type Settings = {
  store_name: string
  alert_minutes: number
  operator_ids: string[]
  staff_ids: string[]
  role_labels: Record<string, string>
  delegated_ids?: string[]
  delegated_labels?: Record<string, string>
}

type StoreOption = { id: string; label: string }

export default function AdminAttendancePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const storeId = searchParams.get('store') || 'ganji'

  const [stores, setStores] = useState<StoreOption[]>([])
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [ladies, setLadies] = useState<Lady[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [completed, setCompleted] = useState<Record<string, { A: number; B: number } | number>>({})
  const [adminIds, setAdminIds] = useState<string[]>([])
  const [msg, setMsg] = useState('')
  const [msgOk, setMsgOk] = useState(true)
  const [newLady, setNewLady] = useState('')
  const [newRoom, setNewRoom] = useState('')
  const [newDelegateId, setNewDelegateId] = useState('')
  const [newDelegateLabel, setNewDelegateLabel] = useState('')
  const [newStaffId, setNewStaffId] = useState('')
  const [newStaffLabel, setNewStaffLabel] = useState('')
  const [storeName, setStoreName] = useState('간지')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/attendance?store=${encodeURIComponent(storeId)}`, { credentials: 'include' })
      const json = await res.json()
      if (res.ok) {
        setStores(json.stores ?? [])
        setSettings(json.settings)
        setStoreName(json.settings?.store_name || '간지')
        setLadies(json.ladies ?? [])
        setRooms(json.rooms ?? [])
        setSessions(json.day?.sessions ?? [])
        setCompleted(json.day?.completed_counts ?? {})
        setAdminIds(json.adminIds ?? [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [storeId])

  useEffect(() => { fetchData() }, [fetchData])

  function switchStore(id: string) {
    router.push(`/admin/attendance?store=${encodeURIComponent(id)}`)
  }

  async function patch(body: Record<string, unknown>) {
    setMsg('')
    try {
      const res = await fetch(`/api/admin/attendance?store=${encodeURIComponent(storeId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (res.ok) {
        setMsgOk(true)
        setMsg('저장되었습니다.')
        fetchData()
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

  function ladyName(id: number) {
    return ladies.find((l) => l.id === id)?.name ?? `#${id}`
  }

  function roomName(id: number) {
    return rooms.find((r) => r.id === id)?.name ?? `#${id}`
  }

  const currentStoreLabel = stores.find((s) => s.id === storeId)?.label || storeId

  return (
    <>
      <h1 className="admin-page-title">📋 출근부 · {currentStoreLabel}</h1>
      {stores.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {stores.map((s) => (
            <button
              key={s.id}
              type="button"
              className={s.id === storeId ? 'btn-success' : 'btn-save'}
              onClick={() => switchStore(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
      <p style={{ fontSize: 13, color: 'var(--text-muted, #888)', marginBottom: 16, lineHeight: 1.6 }}>
        텔레그램 <code>/출근부</code> 와 동일 데이터 · 매장별 봇·JSON 분리 ({storeId})
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

      {loading && !settings ? <p>불러오는 중…</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="admin-card">
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>🏪 매장명</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="form-input" value={storeName} onChange={(e) => setStoreName(e.target.value)} style={{ width: 120 }} />
              <button type="button" className="btn-success" onClick={() => patch({ store_name: storeName })}>저장</button>
            </div>
          </div>

          <div className="admin-card">
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>⏰ 알람 (코스 종료 N분 전)</h2>
            <p style={{ fontSize: 13, marginBottom: 10 }}>현재: <strong>{settings?.alert_minutes ?? 5}분전</strong></p>
            <div style={{ display: 'flex', gap: 8 }}>
              {[5, 10, 15].map((m) => (
                <button key={m} type="button" className={settings?.alert_minutes === m ? 'btn-success' : 'btn-save'} onClick={() => patch({ alert_minutes: m })}>
                  {m}분전
                </button>
              ))}
            </div>
          </div>

          <div className="admin-card">
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>🙍 언니 등록 ({ladies.length}명)</h2>
            <p style={{ fontSize: 13, marginBottom: 8 }}>{ladies.map((l) => `[🙍${l.name}]`).join(' ') || '(없음)'}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="form-input" placeholder="이름" value={newLady} onChange={(e) => setNewLady(e.target.value)} style={{ width: 100 }} />
              <button type="button" className="btn-success" onClick={() => { patch({ add_lady: newLady }); setNewLady('') }}>추가</button>
            </div>
          </div>

          <div className="admin-card">
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>❤️ 룸 등록 ({rooms.length}개)</h2>
            <p style={{ fontSize: 13, marginBottom: 8 }}>{rooms.map((r) => `[❤️${r.name}]`).join(' ') || '(없음)'}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="form-input" placeholder="1T" value={newRoom} onChange={(e) => setNewRoom(e.target.value)} style={{ width: 80 }} />
              <button type="button" className="btn-success" onClick={() => { patch({ add_room: newRoom }); setNewRoom('') }}>추가</button>
            </div>
          </div>

          <div className="admin-card">
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>📊 금일 완료 세션</h2>
            {ladies.length === 0 ? <p style={{ fontSize: 13, opacity: 0.6 }}>등록 없음</p> : (
              <p style={{ fontSize: 13 }}>{ladies.map((l) => {
                const c = completed[String(l.id)]
                const ab = typeof c === 'object' && c ? c : { A: typeof c === 'number' ? c : 0 }
                const parts = Object.entries(ab).map(([k, v]) => `${k}${v}`).join(' / ')
                return `[${l.name} ${parts}]`
              }).join(' ')}</p>
            )}
          </div>

          <div className="admin-card">
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>💋 오늘 세션</h2>
            {sessions.length === 0 ? <p style={{ fontSize: 13, opacity: 0.6 }}>없음 — 텔레그램 /방시작 사용</p> : (
              <ul style={{ fontSize: 12, lineHeight: 1.8, paddingLeft: 16 }}>
                {sessions.map((s) => (
                  <li key={s.id}>
                    ❤️{roomName(s.room_id)} · {s.course || 'A'}코스 · 🤵{s.customer_count} · {s.status} ·{' '}
                    {s.assignments.filter((a) => !a.removed_at).map((a) => ladyName(a.lady_id)).join(', ')}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="admin-card">
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>👥 권한 (3등급)</h2>
            <p style={{ fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>
              <strong>슈퍼관리자</strong> (서버 env): {adminIds.join(', ') || '(매장별 ADMIN_IDS)'} — /운영자추가 · /스탭추가
            </p>

            <h3 style={{ fontSize: 14, marginBottom: 8 }}>🔧 운영자 (전체 조작)</h3>
            {(settings?.operator_ids ?? settings?.delegated_ids ?? []).map((id) => (
              <div key={`op-${id}`} style={{ fontSize: 13, marginBottom: 4 }}>
                {id}{(settings!.role_labels?.[id] || settings!.delegated_labels?.[id]) ? ` (${settings!.role_labels?.[id] || settings!.delegated_labels?.[id]})` : ''}
                <button type="button" className="btn-save" style={{ marginLeft: 8, fontSize: 11, padding: '2px 6px' }} onClick={() => patch({ remove_operator: id })}>제거</button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: 16 }}>
              <input className="form-input" placeholder="텔레그램 ID" value={newDelegateId} onChange={(e) => setNewDelegateId(e.target.value)} style={{ width: 140 }} />
              <input className="form-input" placeholder="별칭" value={newDelegateLabel} onChange={(e) => setNewDelegateLabel(e.target.value)} style={{ width: 80 }} />
              <button type="button" className="btn-success" onClick={() => { patch({ add_operator: { id: newDelegateId, label: newDelegateLabel || undefined } }); setNewDelegateId(''); setNewDelegateLabel('') }}>운영자 추가</button>
            </div>

            <h3 style={{ fontSize: 14, marginBottom: 8 }}>👀 스탭 (보기만)</h3>
            {(settings?.staff_ids ?? []).map((id) => (
              <div key={`st-${id}`} style={{ fontSize: 13, marginBottom: 4 }}>
                {id}{settings!.role_labels?.[id] ? ` (${settings!.role_labels[id]})` : ''}
                <button type="button" className="btn-save" style={{ marginLeft: 8, fontSize: 11, padding: '2px 6px' }} onClick={() => patch({ remove_staff: id })}>제거</button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input className="form-input" placeholder="텔레그램 ID" value={newStaffId} onChange={(e) => setNewStaffId(e.target.value)} style={{ width: 140 }} />
              <input className="form-input" placeholder="별칭" value={newStaffLabel} onChange={(e) => setNewStaffLabel(e.target.value)} style={{ width: 80 }} />
              <button type="button" className="btn-success" onClick={() => { patch({ add_staff: { id: newStaffId, label: newStaffLabel || undefined } }); setNewStaffId(''); setNewStaffLabel('') }}>스탭 추가</button>
            </div>
          </div>

          <div className="admin-card">
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>📱 텔레그램 명령</h2>
            <pre style={{ fontSize: 11, lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
{`/출근부 — 보드 + 버튼
/언니등록 하나 · /룸등록 1T
/출근 하나 · /퇴근 하나
/방시작 1T 3 하나,사랑,이슬 [01:00]
/운영자추가 @username · /스탭추가 @username · /권한목록
/내id — 본인 ID 확인`}
            </pre>
          </div>
        </div>
      )}
    </>
  )
}
