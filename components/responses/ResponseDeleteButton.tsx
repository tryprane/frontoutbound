'use client'

import { useState } from 'react'

type Props = {
  responseId: string
  disabled?: boolean
  onDeleted: () => void
}

export function ResponseDeleteButton({ responseId, disabled, onDeleted }: Props) {
  const [error, setError] = useState('')

  async function archiveResponse() {
    if (!window.confirm('Archive this response from the workspace?')) return
    setError('')
    try {
      const response = await fetch(`/api/responses/${responseId}`, { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string }
        throw new Error(data.error || 'Failed to archive response')
      }
      onDeleted()
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Failed to archive response')
    }
  }

  return (
    <div className="space-y-2 text-right">
      <button className="btn-ghost text-rose-700" disabled={disabled} onClick={() => void archiveResponse()}>
        Delete
      </button>
      {error ? <div className="text-xs text-rose-700">{error}</div> : null}
    </div>
  )
}
