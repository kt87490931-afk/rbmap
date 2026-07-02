'use client'

import { useLoungeEdit } from './LoungeEditContext'

type Props = {
  path: string
  value: string
  html?: boolean
  className?: string
  as?: 'span' | 'div'
  block?: boolean
}

export function EditableText({
  path,
  value,
  html = false,
  className,
  as = 'span',
  block = false,
}: Props) {
  const { editMode, openTextModal } = useLoungeEdit()
  const Tag = as

  if (!editMode) {
    if (html) {
      return <Tag className={className} dangerouslySetInnerHTML={{ __html: value }} />
    }
    return <Tag className={className}>{value}</Tag>
  }

  const wrapClass = block ? `editable-block${className ? ` ${className}` : ''}` : `editable${className ? ` ${className}` : ''}`

  return (
    <span className={wrapClass}>
      {html ? (
        <span className="editable-text" dangerouslySetInnerHTML={{ __html: value }} />
      ) : (
        <span className={`editable-text${className ? ` ${className}` : ''}`}>{value}</span>
      )}
      <button
        type="button"
        className="edit-btn text-edit-btn"
        aria-label="텍스트 수정"
        onClick={() => openTextModal(path, value)}
      >
        ✎
      </button>
    </span>
  )
}
