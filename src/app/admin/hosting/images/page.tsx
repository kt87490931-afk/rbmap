'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { HostingCopyField } from '@/components/admin/HostingCopyField'

interface ImageItem {
  id: string
  folder: string
  filename: string
  storagePath: string
  url: string
  html: string
  htmlFullWidth: string
  sizeBytes: number
  createdAt: string
}

export default function AdminHostingImagesPage() {
  const [folders, setFolders] = useState<string[]>(['default'])
  const [currentFolder, setCurrentFolder] = useState('default')
  const [newFolder, setNewFolder] = useState('')
  const [items, setItems] = useState<ImageItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const selected = items.find((i) => i.id === selectedId) ?? null

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/hosting/images?folder=${encodeURIComponent(currentFolder)}`, {
        credentials: 'include',
      })
      const data = await res.json()
      setFolders(Array.isArray(data.folders) ? data.folders : ['default'])
      const list = Array.isArray(data.items) ? data.items : []
      setItems(list)
      setSelectedId((prev) => (list.some((i: ImageItem) => i.id === prev) ? prev : list[0]?.id ?? null))
    } catch {
      setMsg('목록을 불러오지 못했습니다.')
    }
    setLoading(false)
  }, [currentFolder])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    setMsg('')
    const folder = newFolder.trim() || currentFolder
    let ok = 0
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', folder)
      const res = await fetch('/api/admin/hosting/images/upload', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      })
      if (res.ok) ok += 1
      else {
        const err = await res.json().catch(() => ({}))
        setMsg(err.error || '업로드 실패')
      }
    }
    if (ok > 0) {
      setMsg(`${ok}개 업로드 완료`)
      if (newFolder.trim()) setCurrentFolder(newFolder.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'default')
      setNewFolder('')
      await fetchItems()
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function deleteSelected() {
    if (!selected) return
    if (!confirm(`"${selected.filename}" 파일을 삭제할까요?`)) return
    const res = await fetch(`/api/admin/hosting/images/${selected.id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (res.ok) {
      setMsg('삭제했습니다.')
      await fetchItems()
    } else {
      setMsg('삭제 실패')
    }
  }

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>📷 이미지 호스팅</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>
          디스크엔처럼 이미지(jpg, png, gif)를 업로드하고 게시판에 붙여넣을 URL·HTML 코드를 복사합니다. 홈페이지에는 노출되지 않습니다.
        </p>
      </div>

      {msg && (
        <div className="admin-section" style={{ marginBottom: 16, padding: '10px 14px', fontSize: 13 }}>
          {msg}
        </div>
      )}

      <div className="admin-section" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'end' }}>
          <label style={{ fontSize: 12 }}>
            폴더
            <select
              value={currentFolder}
              onChange={(e) => setCurrentFolder(e.target.value)}
              style={{ display: 'block', marginTop: 4, minWidth: 140, padding: '8px 10px', borderRadius: 8 }}
            >
              {folders.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: 12 }}>
            새 폴더 (업로드 시)
            <input
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
              placeholder="예: sample"
              style={{ display: 'block', marginTop: 4, minWidth: 160, padding: '8px 10px', borderRadius: 8 }}
            />
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,.jpg,.jpeg,.png,.gif"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => uploadFiles(e.target.files)}
          />
          <button type="button" className="btn-success" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? '업로드 중…' : '파일 올리기'}
          </button>
          {selected && (
            <button type="button" className="btn-ghost" onClick={deleteSelected}>선택 삭제</button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>
        <div className="admin-section">
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
            {loading ? '불러오는 중…' : `${items.length}개 파일`}
          </div>
          {items.length === 0 && !loading ? (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>이 폴더에 이미지가 없습니다. 파일 올리기를 눌러주세요.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  style={{
                    border: selectedId === item.id ? '2px solid var(--gold)' : '1px solid var(--border)',
                    borderRadius: 8,
                    padding: 6,
                    background: 'var(--card2)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 4, display: 'block' }} />
                  <div style={{ fontSize: 11, marginTop: 6, wordBreak: 'break-all', color: 'var(--text)' }}>{item.filename}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="admin-section" style={{ position: 'sticky', top: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>외부링크 코드</div>
          {selected ? (
            <>
              <HostingCopyField label="파일 주소" value={selected.url} />
              <HostingCopyField label="Html 삽입코드" value={selected.html} />
              <HostingCopyField label="Html (가로 100%)" value={selected.htmlFullWidth} />
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
                {(selected.sizeBytes / 1024).toFixed(1)} KB · {selected.folder}/{selected.filename}
              </p>
            </>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>왼쪽에서 이미지를 선택하세요.</p>
          )}
        </div>
      </div>
    </>
  )
}
