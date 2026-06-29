'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { HostingCopyField } from '@/components/admin/HostingCopyField'
import { CELL_HEIGHT, CELL_WIDTH, GRID_WIDTH } from '@/lib/hosting/layout-constants'

interface VideoSlotItem {
  slot: number
  storagePath: string | null
  filename: string | null
  url: string | null
  sizeBytes: number
  updatedAt: string | null
}

export default function AdminHostingVideosPage() {
  const [slots, setSlots] = useState<VideoSlotItem[]>([])
  const [embedHtml, setEmbedHtml] = useState('')
  const [previewUrl, setPreviewUrl] = useState('https://rbbmap.com/4m')
  const [loading, setLoading] = useState(true)
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null)
  const [msg, setMsg] = useState('')
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/hosting/videos', { credentials: 'include' })
      const data = await res.json()
      setSlots(Array.isArray(data.slots) ? data.slots : [])
      setEmbedHtml(data.embedHtml || '')
      setPreviewUrl(data.previewUrl || 'https://rbbmap.com/4m')
    } catch {
      setMsg('불러오기 실패')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function uploadSlot(slot: number, files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    setUploadingSlot(slot)
    setMsg('')
    const fd = new FormData()
    fd.append('file', file)
    fd.append('slot', String(slot))
    const res = await fetch('/api/admin/hosting/videos/upload', {
      method: 'POST',
      credentials: 'include',
      body: fd,
    })
    if (res.ok) {
      setMsg(`슬롯 ${slot} 업로드 완료`)
      await fetchData()
    } else {
      const err = await res.json().catch(() => ({}))
      setMsg(err.error || '업로드 실패')
    }
    setUploadingSlot(null)
    const ref = fileRefs.current[slot]
    if (ref) ref.value = ''
  }

  async function deleteSlot(slot: number) {
    if (!confirm(`슬롯 ${slot} 영상을 삭제할까요?`)) return
    const res = await fetch(`/api/admin/hosting/videos/${slot}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (res.ok) {
      setMsg(`슬롯 ${slot} 삭제 완료`)
      await fetchData()
    } else {
      setMsg('삭제 실패')
    }
  }

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>🎬 영상 호스팅 (4m)</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>
          794px 2×2 릴스 4칸 영상을 관리합니다. 자동재생·음소거·반복이며, 게시판용 HTML 코드를 복사해 사용하세요.
        </p>
      </div>

      {msg && (
        <div className="admin-section" style={{ marginBottom: 16, padding: '10px 14px', fontSize: 13 }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, alignItems: 'start' }}>
        <div>
          <div className="admin-section" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>미리보기 ({GRID_WIDTH}px)</div>
            <div
              style={{
                width: GRID_WIDTH,
                maxWidth: '100%',
                display: 'grid',
                gridTemplateColumns: `${CELL_WIDTH}px ${CELL_WIDTH}px`,
                gap: 0,
                lineHeight: 0,
                background: '#111',
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              {[1, 2, 3, 4].map((slotNum) => {
                const slot = slots.find((s) => s.slot === slotNum)
                return (
                  <div key={slotNum} style={{ position: 'relative', background: '#222' }}>
                    {slot?.url ? (
                      <video
                        src={slot.url}
                        autoPlay
                        muted
                        loop
                        playsInline
                        style={{ width: CELL_WIDTH, maxWidth: '100%', height: CELL_HEIGHT, objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <div style={{ width: CELL_WIDTH, maxWidth: '100%', height: CELL_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 12 }}>
                        슬롯 {slotNum}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
              공개 URL: <a href={previewUrl} target="_blank" rel="noopener noreferrer">{previewUrl}</a>
            </p>
          </div>

          <div className="admin-section">
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>슬롯 관리</div>
            {loading ? (
              <p style={{ color: 'var(--muted)' }}>불러오는 중…</p>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {[1, 2, 3, 4].map((slotNum) => {
                  const slot = slots.find((s) => s.slot === slotNum)
                  return (
                    <div key={slotNum} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <strong style={{ minWidth: 56 }}>슬롯 {slotNum}</strong>
                      <span style={{ flex: 1, fontSize: 12, color: 'var(--muted)', wordBreak: 'break-all' }}>
                        {slot?.filename || '비어 있음'}
                        {slot?.sizeBytes ? ` · ${(slot.sizeBytes / 1024 / 1024).toFixed(2)} MB` : ''}
                      </span>
                      <input
                        ref={(el) => { fileRefs.current[slotNum] = el }}
                        type="file"
                        accept="video/mp4,video/webm"
                        style={{ display: 'none' }}
                        onChange={(e) => uploadSlot(slotNum, e.target.files)}
                      />
                      <button
                        type="button"
                        className="btn-save"
                        disabled={uploadingSlot === slotNum}
                        onClick={() => fileRefs.current[slotNum]?.click()}
                      >
                        {uploadingSlot === slotNum ? '업로드…' : slot?.url ? '교체' : '업로드'}
                      </button>
                      {slot?.url && (
                        <button type="button" className="btn-ghost" onClick={() => deleteSlot(slotNum)}>삭제</button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="admin-section" style={{ position: 'sticky', top: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>게시판 붙여넣기 코드</div>
          <HostingCopyField label="Html 삽입코드 (4m 그리드)" value={embedHtml} mono />
          <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>
            등록된 슬롯만 포함됩니다. 영상 교체 후 게시판에도 반영하려면 코드를 다시 복사하거나 URL의 ?v= 값이 갱신되었는지 확인하세요.
          </p>
        </div>
      </div>
    </>
  )
}
