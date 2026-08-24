'use client'

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
  return new Date(value).toLocaleString()
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
    return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(message.bodyHtml) }} />
  }
  return <div className="whitespace-pre-wrap text-sm leading-7">{message.bodyText || 'No synced body available.'}</div>
}

export function ResponseThreadView({ detail, loading, onBack, onDeleted, onReplied }: Props) {
  if (loading) {
    return <section className="response-thread p-5 sm:p-8 text-sm text-[var(--text-muted)]">Loading thread...</section>
  }

  if (!detail) {
    return <section className="response-thread p-5 sm:p-8 text-sm text-[var(--text-muted)]">Select a response to view the full thread.</section>
  }

  const replySubject = detail.response.subject && /^re:/i.test(detail.response.subject) ? detail.response.subject : `Re: ${detail.response.subject || ''}`.trim()
  const classificationLabel = detail.response.classification.replace('_', ' ')

  return (
    <section className="response-thread min-w-0 p-3 sm:p-5 lg:h-[calc(100vh-150px)] lg:overflow-y-auto">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <button className="btn-ghost mb-3 lg:hidden" onClick={onBack}>Back to responses</button>
          <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Thread workspace</div>
          <h2 className="mt-2 break-words text-xl font-semibold tracking-[-0.02em] sm:text-2xl sm:tracking-[-0.04em] text-[var(--text-primary)]">{detail.response.subject || '(no subject)'}</h2>
          <div className="mt-2 text-sm text-[var(--text-secondary)]">{detail.response.counterpartEmail || 'Unknown counterpart'}</div>
          <span className={`response-classification mt-3 inline-flex is-${detail.response.classification}`}>{classificationLabel}</span>
        </div>
        <ResponseDeleteButton responseId={detail.response.id} onDeleted={onDeleted} />
      </div>

      <div className="space-y-4">
        {detail.thread.map((message) => (
          <article key={`${message.sourceType}-${message.id}`} className={`response-thread-message min-w-0 p-3 sm:p-5 ${message.direction === 'outbound' ? 'is-outbound' : ''}`}>
            <div className="flex flex-wrap justify-between gap-3 text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
              <span>{message.direction}</span>
              <span>{formatDate(message.sentAt || message.receivedAt || message.createdAt)}</span>
            </div>
            <div className="mt-2 break-all text-sm font-medium text-[var(--text-primary)]">{message.fromEmail || message.mailAccount?.email || 'Unknown'} to {message.toEmail || 'Unknown'}</div>
            <div className="mt-1 break-words text-sm text-[var(--text-secondary)]">{message.subject || '(no subject)'}</div>
            <div className="response-message-body mt-4 overflow-x-auto p-3 sm:p-4 text-[var(--text-primary)]">
              <MessageBody message={message} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
              {message.campaign ? <span>Campaign: {message.campaign.name}</span> : null}
              {message.sequenceStepNumber ? <span>Step {message.sequenceStepNumber}</span> : null}
              {message.mailAccount ? <span>Mailbox: {message.mailAccount.email}</span> : null}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5">
        <ResponseReplyComposer responseId={detail.response.id} defaultSubject={replySubject} onSent={onReplied} />
      </div>
    </section>
  )
}
