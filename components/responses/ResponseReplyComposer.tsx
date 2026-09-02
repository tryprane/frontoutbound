'use client'

import { useRef, useState } from 'react'
import {
  Bold, Italic, Underline, List, ListOrdered, Link, X,
  Send, ChevronDown, ChevronUp, Type
} from 'lucide-react'

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
  const [success, setSuccess] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  async function sendReply() {
    const html = editorRef.current?.innerHTML.trim() || ''
    if (!html || html === '<br>') {
      setError('Write a reply before sending.')
      return
    }

    setSending(true)
    setError('')
    setSuccess(false)
    try {
      const response = await fetch(`/api/responses/${responseId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, html }),
      })
      const data = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) throw new Error(data.error || 'Failed to send reply')
      if (editorRef.current) editorRef.current.innerHTML = ''
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
      onSent()
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  function handleLinkInsert() {
    const url = window.prompt('Enter URL (e.g. https://example.com)')
    if (url) command('createLink', url)
  }

  return (
    <div className={`reply-composer-shell ${isFocused ? 'is-focused' : ''}`}>
      {/* Composer header */}
      <div className="reply-composer-header" onClick={() => setCollapsed((c) => !c)}>
        <div className="reply-composer-header-left">
          <div className="reply-composer-icon">
            <Send className="h-3.5 w-3.5" />
          </div>
          <span className="reply-composer-header-label">Reply</span>
          {subject && (
            <span className="reply-composer-subject-preview">
              {subject}
            </span>
          )}
        </div>
        <button
          type="button"
          className="reply-composer-collapse-btn"
          aria-label={collapsed ? 'Expand reply' : 'Collapse reply'}
          onClick={(e) => { e.stopPropagation(); setCollapsed((c) => !c) }}
        >
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="reply-composer-body">
          {/* Subject row */}
          <div className="reply-subject-row">
            <label className="reply-subject-label">Subject</label>
            <input
              className="reply-subject-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Re: …"
            />
          </div>

          {/* Formatting toolbar */}
          <div className="reply-toolbar" role="toolbar" aria-label="Text formatting">
            <div className="reply-toolbar-group">
              <button
                className="reply-toolbar-btn"
                type="button"
                title="Bold (Ctrl+B)"
                onClick={() => command('bold')}
              >
                <Bold className="h-3.5 w-3.5" />
              </button>
              <button
                className="reply-toolbar-btn"
                type="button"
                title="Italic (Ctrl+I)"
                onClick={() => command('italic')}
              >
                <Italic className="h-3.5 w-3.5" />
              </button>
              <button
                className="reply-toolbar-btn"
                type="button"
                title="Underline (Ctrl+U)"
                onClick={() => command('underline')}
              >
                <Underline className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="reply-toolbar-divider" />
            <div className="reply-toolbar-group">
              <button
                className="reply-toolbar-btn"
                type="button"
                title="Bullet list"
                onClick={() => command('insertUnorderedList')}
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                className="reply-toolbar-btn"
                type="button"
                title="Numbered list"
                onClick={() => command('insertOrderedList')}
              >
                <ListOrdered className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="reply-toolbar-divider" />
            <div className="reply-toolbar-group">
              <button
                className="reply-toolbar-btn"
                type="button"
                title="Insert link"
                onClick={handleLinkInsert}
              >
                <Link className="h-3.5 w-3.5" />
              </button>
              <button
                className="reply-toolbar-btn"
                type="button"
                title="Clear formatting"
                onClick={() => command('removeFormat')}
              >
                <Type className="h-3.5 w-3.5" />
                <X className="h-2 w-2 -ml-0.5" />
              </button>
            </div>
          </div>

          {/* Editable body */}
          <div
            ref={editorRef}
            className="reply-editor-body"
            contentEditable
            role="textbox"
            aria-label="Reply body"
            aria-multiline="true"
            data-placeholder="Write your reply here…"
            suppressContentEditableWarning
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />

          {/* Error/success feedback */}
          {error && (
            <div className="reply-feedback reply-feedback--error">
              <span>{error}</span>
              <button type="button" onClick={() => setError('')} className="reply-feedback-close">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          {success && (
            <div className="reply-feedback reply-feedback--success">
              Reply sent successfully!
            </div>
          )}

          {/* Footer: send button */}
          <div className="reply-composer-footer">
            <span className="reply-composer-hint">Sends from the originating mailbox</span>
            <button
              className="reply-send-btn"
              disabled={sending}
              onClick={() => void sendReply()}
            >
              {sending ? (
                <>
                  <span className="reply-send-spinner" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send reply
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
