'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  type LoungeHomeContent,
  LOUNGE_HOME_DEFAULTS,
  setLoungeHomePath,
  getLoungeHomePath,
} from '@/lib/data/lounge-home'

type TextModalState = { path: string; value: string } | null
type ImageModalState = { path: string; value: string; label: string } | null

type LoungeEditContextValue = {
  editMode: boolean
  content: LoungeHomeContent
  saving: boolean
  openTextModal: (path: string, value: string) => void
  openImageModal: (path: string, value: string, label: string) => void
  textModal: TextModalState
  imageModal: ImageModalState
  closeTextModal: () => void
  closeImageModal: () => void
  saveText: (path: string, value: string) => Promise<void>
  saveImage: (path: string, file: File) => Promise<void>
}

const LoungeEditContext = createContext<LoungeEditContextValue | null>(null)

export function useLoungeEdit() {
  const ctx = useContext(LoungeEditContext)
  if (!ctx) {
    return {
      editMode: false,
      content: null as unknown as LoungeHomeContent,
      saving: false,
      openTextModal: () => {},
      openImageModal: () => {},
      textModal: null,
      imageModal: null,
      closeTextModal: () => {},
      closeImageModal: () => {},
      saveText: async () => {},
      saveImage: async () => {},
    }
  }
  return ctx
}

async function persistLoungeHome(content: LoungeHomeContent): Promise<void> {
  const res = await fetch('/api/admin/site/lounge_home', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(content),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error || '저장에 실패했습니다.')
  }
}

export function LoungeEditProvider({
  initialContent,
  children,
}: {
  initialContent: LoungeHomeContent
  children: ReactNode
}) {
  const [editMode, setEditMode] = useState(false)
  const [content, setContent] = useState(initialContent)
  const [saving, setSaving] = useState(false)
  const [textModal, setTextModal] = useState<TextModalState>(null)
  const [imageModal, setImageModal] = useState<ImageModalState>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/auth-check')
      .then((r) => {
        if (!cancelled && r.ok) setEditMode(true)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const openTextModal = useCallback((path: string, value: string) => {
    setTextModal({ path, value })
  }, [])

  const openImageModal = useCallback((path: string, value: string, label: string) => {
    setImageModal({ path, value, label })
  }, [])

  const closeTextModal = useCallback(() => setTextModal(null), [])
  const closeImageModal = useCallback(() => setImageModal(null), [])

  const saveText = useCallback(async (path: string, value: string) => {
    setSaving(true)
    try {
      const next = setLoungeHomePath(content, path, value)
      await persistLoungeHome(next)
      setContent(next)
      setTextModal(null)
    } finally {
      setSaving(false)
    }
  }, [content])

  const saveImage = useCallback(async (path: string, file: File) => {
    setSaving(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', 'lounge')
      const up = await fetch('/api/admin/hosting/images/upload', { method: 'POST', body: form })
      if (!up.ok) {
        const data = await up.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error || '이미지 업로드 실패')
      }
      const record = (await up.json()) as { storagePath: string }
      const imagePath = `/${record.storagePath.replace(/^\/+/, '')}`
      const next = setLoungeHomePath(content, path, imagePath)
      await persistLoungeHome(next)
      setContent(next)
      setImageModal(null)
    } finally {
      setSaving(false)
    }
  }, [content])

  const value = useMemo(
    () => ({
      editMode,
      content,
      saving,
      openTextModal,
      openImageModal,
      textModal,
      imageModal,
      closeTextModal,
      closeImageModal,
      saveText,
      saveImage,
    }),
    [
      editMode,
      content,
      saving,
      openTextModal,
      openImageModal,
      textModal,
      imageModal,
      closeTextModal,
      closeImageModal,
      saveText,
      saveImage,
    ]
  )

  return <LoungeEditContext.Provider value={value}>{children}</LoungeEditContext.Provider>
}

export function useLoungeContent(): LoungeHomeContent {
  const ctx = useContext(LoungeEditContext)
  if (!ctx) return LOUNGE_HOME_DEFAULTS
  return ctx.content
}

export { getLoungeHomePath }
