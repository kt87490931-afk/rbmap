'use client'

import { useEffect, useState } from 'react'
import { useLoungeEdit } from './LoungeEditContext'

export function LoungeEditModals() {
  const {
    editMode,
    textModal,
    imageModal,
    saving,
    closeTextModal,
    closeImageModal,
    saveText,
    saveImage,
  } = useLoungeEdit()

  const [textValue, setTextValue] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (textModal) setTextValue(textModal.value)
  }, [textModal])

  useEffect(() => {
    if (imageModal) {
      setPreview(imageModal.value ? imageModal.value : null)
      setFile(null)
    }
  }, [imageModal])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeTextModal()
        closeImageModal()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [closeTextModal, closeImageModal])

  if (!editMode) return null

  return (
    <>
      <div
        className={`modal-overlay${textModal ? ' open' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeTextModal()
        }}
      >
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="textModalTitle">
          <h3 id="textModalTitle">텍스트 수정</h3>
          <p className="modal-sub">내용을 수정하고 저장을 누르면 DB에 저장되어 모든 방문자에게 반영됩니다.</p>
          <textarea
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            disabled={saving}
          />
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={closeTextModal} disabled={saving}>
              취소
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={saving}
              onClick={() => textModal && saveText(textModal.path, textValue)}
            >
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`modal-overlay${imageModal ? ' open' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeImageModal()
        }}
      >
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="imageModalTitle">
          <h3 id="imageModalTitle">이미지 수정</h3>
          <p className="modal-sub">
            {imageModal?.label ?? '이미지'} — 파일을 선택한 뒤 적용하면 호스팅에 업로드됩니다.
          </p>
          <div className="image-preview-box">
            {preview ? (
              <img src={preview.startsWith('/') || preview.startsWith('http') ? preview : `/${preview}`} alt="미리보기" />
            ) : (
              <span>미리보기 없음</span>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            disabled={saving}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (!f) return
              setFile(f)
              const reader = new FileReader()
              reader.onload = (ev) => setPreview(String(ev.target?.result ?? ''))
              reader.readAsDataURL(f)
            }}
          />
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={closeImageModal} disabled={saving}>
              취소
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={saving || !file}
              onClick={() => imageModal && file && saveImage(imageModal.path, file)}
            >
              {saving ? '업로드 중…' : '적용'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
