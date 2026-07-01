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
  const [creatingFolder, setCreatingFolder] = useState(false)
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

  async function createFolder() {
    const name = newFolder.trim()
    if (!name) {
      setMsg('폴더 이름을 입력해 주세요.')
      return
    }
    setCreatingFolder(true)
    setMsg('')
    try {
      const res = await fetch('/api/admin/hosting/images/folders', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMsg(data.error || '폴더 생성 실패')
        return
      }
      setFolders(Array.isArray(data.folders) ? data.folders : folders)
      setCurrentFolder(data.folder || name)
      setNewFolder('')
      setMsg(`폴더 "${data.folder}" 생성 완료`)
      await fetchItems()
    } catch {
      setMsg('폴더 생성 중 오류가 발생했습니다.')
    } finally {
      setCreatingFolder(false)
    }
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    setMsg('')
    let ok = 0
    let replaced = 0
    const errors: string[] = []
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', currentFolder)
      const res = await fetch('/api/admin/hosting/images/upload', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      })
      if (res.ok) {
        ok += 1
        const data = await res.json().catch(() => ({}))
        if (data.overwritten) replaced += 1
      } else {
        const err = await res.json().catch(() => ({}))
        errors.push(`${file.name}: ${err.error || `업로드 실패 (${res.status})`}`)
      }
    }
    if (ok > 0) {
      await fetchItems()
    }
    if (errors.length > 0) {
      setMsg(errors.join(' / '))
    } else if (ok > 0) {
      if (replaced > 0 && replaced === ok) {
        setMsg(`${replaced}개 덮어쓰기 완료`)
      } else if (replaced > 0) {
        setMsg(`${ok}개 처리 (${replaced}개 덮어쓰기)`)
      } else {
        setMsg(`${ok}개 업로드 완료`)
      }
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
          디스크엔처럼 이미지(jpg, png, gif, 최대 20MB)를 업로드하고 게시판에 붙여넣을 URL·HTML 코드를 복사합니다. 같은 파일명으로 덮어쓰면 주소·삽입코드는 그대로이고 이미지만 교체됩니다. 썸네일 더블클릭 시 원본을 볼 수 있습니다.
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
            새 폴더
            <input
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
              placeholder="예: product, banner"
              style={{ display: 'block', marginTop: 4, minWidth: 160, padding: '8px 10px', borderRadius: 8 }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void createFolder()
                }
              }}
            />
          </label>
          <button
            type="button"
            className="btn-save"
            disabled={creatingFolder || !newFolder.trim()}
            onClick={() => createFolder()}
          >
            {creatingFolder ? '생성 중…' : '폴더 만들기'}
          </button>
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
                  onDoubleClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                  title="클릭: 선택 · 더블클릭: 원본 보기"
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
                  <img
                    src={`${item.url}?_=${item.sizeBytes}`}
                    alt=""
                    style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 4, display: 'block' }}
                  />
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
              <div style={{ marginBottom: 12, textAlign: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${selected.url}?_=${selected.sizeBytes}`}
                  alt={selected.filename}
                  style={{ maxWidth: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: 8, cursor: 'pointer' }}
                  onClick={() => window.open(selected.url, '_blank', 'noopener,noreferrer')}
                  title="클릭하면 새 탭에서 원본 보기"
                />
              </div>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10, textAlign: 'center' }}>
                <a href={selected.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>
                  새 탭에서 원본 보기
                </a>
              </p>
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
