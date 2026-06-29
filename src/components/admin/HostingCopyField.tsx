'use client'

import { useCallback, useState } from 'react'

export function HostingCopyField({
  label,
  value,
  mono = true,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async () => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }, [value])

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--muted)' }}>{label}</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
        <textarea
          readOnly
          value={value}
          rows={mono ? 2 : 4}
          style={{
            flex: 1,
            resize: 'vertical',
            fontFamily: mono ? 'ui-monospace, monospace' : 'inherit',
            fontSize: 12,
            padding: '8px 10px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--card2)',
            color: 'var(--text)',
          }}
        />
        <button type="button" className="btn-save" onClick={copy} disabled={!value} style={{ whiteSpace: 'nowrap' }}>
          {copied ? '복사됨' : '복사'}
        </button>
      </div>
    </div>
  )
}
