'use client'

import { useMemo, useState } from 'react'
import { Mail, ArrowUpRight, ArrowDownLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { ResponseDeleteButton } from './ResponseDeleteButton'
import { ResponseReplyComposer } from './ResponseReplyComposer'
import type { ResponseThreadDetail, ResponseThreadMessage } from './types'

type Props = {
  detail: ResponseThreadDetail | null
  loading: boolean
  onBack: () => void
  onDeleted: () => void
  onReplied: () => void
}

function formatDate(value?: string | null) {
  if (!value) return 'No timestamp'
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Client-side deduplication: group by a fingerprint of (sentAt/receivedAt + fromEmail + first 120 chars of body).
 * This is a temporary workaround while the backend duplicate-ID bug is fixed.
 */
function deduplicateMessages(messages: ResponseThreadMessage[]): ResponseThreadMessage[] {
  const seen = new Set<string>()
  return messages.filter((msg) => {
    const timestamp = msg.sentAt ?? msg.receivedAt ?? msg.createdAt ?? ''
    const bodySnippet = (msg.bodyText ?? msg.bodyHtml ?? '').slice(0, 120)
    const key = `${timestamp}|${msg.fromEmail ?? ''}|${msg.direction}|${bodySnippet}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function sanitizeHtml(html: string) {
  if (typeof window === 'undefined') return html
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('script,style,iframe,object,embed,link,meta,form,input,button,textarea,select,video,audio,source,picture,img,svg,canvas').forEach((node) => node.remove())
  doc.body.querySelectorAll('*').forEach((node) => {
    for (const attribute of Array.from(node.attributes)) {
      const name = attribute.name.toLowerCase()
      const value = attribute.value.trim()
      const normalizedValue = value.toLowerCase()
      const isUrlAttribute = ['href', 'src', 'srcset', 'poster', 'action', 'formaction'].includes(name)
      const isUnsafeUrl =
        normalizedValue.startsWith('javascript:') ||
        normalizedValue.startsWith('data:') ||
        normalizedValue.startsWith('vbscript:') ||
        /^https?:\/\//i.test(value) ||
        value.startsWith('//')
      const isStyleAttribute = name === 'style'
      if (name.startsWith('on') || (isUrlAttribute && isUnsafeUrl) || isStyleAttribute) {
        node.removeAttribute(attribute.name)
      }
    }
    if (node.tagName.toLowerCase() === 'a') {
      node.setAttribute('rel', 'noreferrer noopener nofollow')
      node.setAttribute('target', '_blank')
    }
  })
  return doc.body.innerHTML
}

function MessageBody({ message }: { message: ResponseThreadMessage }) {
  if (message.bodyHtml) {
    return (
      <div
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(message.bodyHtml) }}
      />
    )
  }
  return (
    <div className="whitespace-pre-wrap text-sm leading-7 text-[var(--text-primary)]">
      {message.bodyText || 'No body available.'}
    </div>
  )
}

function ThreadMessage({ message, index }: { message: ResponseThreadMessage; index: number }) {
  const isOutbound = message.direction === 'outbound'
  const [expanded, setExpanded] = useState(index === 0)

  const timestamp = formatDate(message.sentAt ?? message.receivedAt ?? message.createdAt)
  const from = message.fromEmail ?? message.mailAccount?.email ?? 'Unknown'
  const to = message.toEmail ?? 'Unknown'

  return (
    <article className={`thread-message-card ${isOutbound ? 'is-outbound' : 'is-inbound'}`}>
      {/* Message header — always visible */}
      <button
        type="button"
        className="thread-message-header"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        {/* Avatar / direction icon */}
        <div className={`thread-message-avatar ${isOutbound ? 'is-outbound' : 'is-inbound'}`}>
          {isOutbound
            ? <ArrowUpRight className="h-3.5 w-3.5" />
            : <ArrowDownLeft className="h-3.5 w-3.5" />}
        </div>

        <div className="thread-message-meta">
          <div className="thread-message-from-row">
            <span className="thread-message-from">{from}</span>
            <span className="thread-message-to">→ {to}</span>
          </div>
          {message.subject && (
            <div className="thread-message-subject">{message.subject}</div>
          )}
          {!expanded && (
            <div className="thread-message-snippet">
              {(message.bodyText ?? '').slice(0, 100) || '…'}
            </div>
          )}
        </div>

        <div className="thread-message-right">
          <span className="thread-message-direction-badge">
            {isOutbound ? 'Outbound' : 'Inbound'}
          </span>
          <span className="thread-message-ts">{timestamp}</span>
          <span className="thread-message-chevron">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="thread-message-body-wrap">
          <div className="thread-message-body">
            <MessageBody message={message} />
          </div>
          {/* Footer meta */}
          <div className="thread-message-footer">
            {message.campaign && (
              <span className="thread-meta-chip">
                <Mail className="h-3 w-3" />
                {message.campaign.name}
              </span>
            )}
            {message.sequenceStepNumber != null && (
              <span className="thread-meta-chip">Step {message.sequenceStepNumber}</span>
            )}
            {message.mailAccount && (
              <span className="thread-meta-chip">{message.mailAccount.email}</span>
            )}
          </div>
        </div>
      )}
    </article>
  )
}

export function ResponseThreadView({ detail, loading, onBack, onDeleted, onReplied }: Props) {
  const dedupedThread = useMemo(
    () => (detail ? deduplicateMessages(detail.thread) : []),
    [detail],
  )

  if (loading) {
    return (
      <section className="response-thread p-5 sm:p-8">
        <div className="thread-loading-state">
          <div className="thread-loading-spinner" />
          <span>Loading thread…</span>
        </div>
      </section>
    )
  }

  if (!detail) {
    return (
      <section className="response-thread p-5 sm:p-8">
        <div className="thread-empty-state">
          <div className="thread-empty-icon">
            <Mail className="h-8 w-8" />
          </div>
          <p>Select a conversation to view the full thread.</p>
        </div>
      </section>
    )
  }

  const replySubject =
    detail.response.subject && /^re:/i.test(detail.response.subject)
      ? detail.response.subject
      : `Re: ${detail.response.subject || ''}`.trim()
  const classificationLabel = detail.response.classification.replace('_', ' ')

  const duplicatesRemoved = detail.thread.length - dedupedThread.length

  return (
    <section className="response-thread min-w-0 p-3 sm:p-5 lg:h-[calc(100vh-150px)] lg:overflow-y-auto">
      {/* Thread header */}
      <div className="thread-view-header">
        <div className="thread-view-header-left">
          <button className="btn-ghost mb-3 lg:hidden text-sm" onClick={onBack}>
            ← Back
          </button>
          <div className="thread-view-label">Thread workspace</div>
          <h2 className="thread-view-subject">{detail.response.subject || '(no subject)'}</h2>
          <div className="thread-view-counterpart">
            {detail.response.counterpartEmail || 'Unknown counterpart'}
          </div>
          <div className="thread-view-badges">
            <span className={`response-classification is-${detail.response.classification}`}>
              {classificationLabel}
            </span>
            {duplicatesRemoved > 0 && (
              <span className="thread-dedup-notice" title="Duplicate messages hidden (backend issue — fix in progress)">
                {duplicatesRemoved} duplicate{duplicatesRemoved > 1 ? 's' : ''} hidden
              </span>
            )}
          </div>
        </div>
        <ResponseDeleteButton responseId={detail.response.id} onDeleted={onDeleted} />
      </div>

      {/* Message thread */}
      <div className="thread-messages-list">
        {dedupedThread.map((message, index) => (
          <ThreadMessage
            key={`${message.sourceType}-${message.id}`}
            message={message}
            index={index}
          />
        ))}
      </div>

      {/* Reply composer */}
      <div className="mt-5">
        <ResponseReplyComposer
          responseId={detail.response.id}
          defaultSubject={replySubject}
          onSent={onReplied}
        />
      </div>
    </section>
  )
}
