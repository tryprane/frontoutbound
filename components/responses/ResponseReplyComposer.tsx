'use client'

import { useRef, useState } from 'react'

type Props = {
  responseId: string
  defaultSubject?: string | null
  onSent: () => void
}

function command(name: string, value?: string) {
  document.execCommand(name, false, value)
}

export function ResponseReplyComposer({ responseId, defaultSubject, onSent }: Props) {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const [subject, setSubject] = useState(defaultSubject || '')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function sendReply() {
    const html = editorRef.current?.innerHTML.trim() || ''
    if (!html || html === '<br>') {
      setError('Write a reply before sending.')
      return
    }

    setSending(true)
    setError('')
    try {
      const response = await fetch(`/api/responses/${responseId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, html }),
      })
      const data = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) throw new Error(data.error || 'Failed to send reply')
      if (editorRef.current) editorRef.current.innerHTML = ''
      onSent()
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="response-reply-composer p-4">
      <input className="input-base mb-3" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject" />
      <div className="response-reply-toolbar mb-3">
        <button className="btn-ghost px-3 py-1 text-xs" type="button" onClick={() => command('bold')}>Bold</button>
        <button className="btn-ghost px-3 py-1 text-xs" type="button" onClick={() => command('italic')}>Italic</button>
        <button className="btn-ghost px-3 py-1 text-xs" type="button" onClick={() => command('underline')}>Underline</button>
        <button className="btn-ghost px-3 py-1 text-xs" type="button" onClick={() => command('insertUnorderedList')}>Bullets</button>
        <button className="btn-ghost px-3 py-1 text-xs" type="button" onClick={() => command('insertOrderedList')}>Numbers</button>
        <button className="btn-ghost px-3 py-1 text-xs" type="button" onClick={() => {
          const url = window.prompt('Link URL')
          if (url) command('createLink', url)
        }}>Link</button>
        <button className="btn-ghost px-3 py-1 text-xs" type="button" onClick={() => command('removeFormat')}>Clear</button>
      </div>
      <div
        ref={editorRef}
        className="response-message-body min-h-36 p-4 text-sm leading-7 outline-none"
        contentEditable
        role="textbox"
        aria-label="Reply body"
        suppressContentEditableWarning
      />
      {error ? <div className="mt-3 text-sm text-rose-700">{error}</div> : null}
      <div className="mt-4 flex justify-end">
        <button className="btn-primary" disabled={sending} onClick={() => void sendReply()}>
          {sending ? 'Sending...' : 'Send reply'}
        </button>
      </div>
    </div>
  )
}
