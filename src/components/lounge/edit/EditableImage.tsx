'use client'

import { loungeImageSrc } from '@/lib/data/lounge-home'
import { useLoungeEdit } from './LoungeEditContext'

type Props = {
  path: string
  url: string
  placeholder: string
  slot?: string
  className?: string
}

export function EditableImage({ path, url, placeholder, slot, className }: Props) {
  const { editMode, openImageModal } = useLoungeEdit()
  const src = loungeImageSrc(url)
  const hasImage = !!src

  return (
    <div
      className={`ph${hasImage ? ' has-image' : ''}${className ? ` ${className}` : ''}`}
      data-slot={slot}
      style={src ? { backgroundImage: `url(${src})` } : undefined}
    >
      <span>{placeholder}</span>
      {editMode && (
        <button
          type="button"
          className="img-edit-btn"
          aria-label="이미지 수정"
          onClick={() => openImageModal(path, url, placeholder)}
        >
          ✎
        </button>
      )}
    </div>
  )
}
