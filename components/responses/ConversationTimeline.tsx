'use client'

import { ArrowDownLeft, ArrowUpRight, Mail } from 'lucide-react'
import type { ResponseThreadMessage } from './types'
import { prepareEmailBody } from './emailBody'

export function messageTime(message: ResponseThreadMessage) {
  return message.occurredAt || message.receivedAt || message.sentAt || message.createdAt
}

function EmailBody({ message }: { message: ResponseThreadMessage }) {
  const content = prepareEmailBody(message.bodyHtml, message.bodyText)
  return (
    <div className="break-words text-[13px] leading-7 text-slate-700 sm:text-sm [overflow-wrap:anywhere] [&_a]:text-blue-700 [&_a]:underline [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5">
      {content.html ? <div dangerouslySetInnerHTML={{ __html: content.html }} /> : <div className="whitespace-pre-wrap">{content.text || 'No message content available.'}</div>}
      {(content.quotedHtml || content.quotedText) && (
        <details className="mt-4 border-t border-slate-100 pt-3 text-slate-500">
          <summary className="w-fit cursor-pointer rounded text-xs font-medium outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500">Show quoted email</summary>
          <div className="mt-3 border-l-2 border-slate-200 pl-4">
            {content.quotedHtml ? <div dangerouslySetInnerHTML={{ __html: content.quotedHtml }} /> : <div className="whitespace-pre-wrap">{content.quotedText}</div>}
          </div>
        </details>
      )}
    </div>
  )
}

export function ConversationTimeline({ messages }: { messages: ResponseThreadMessage[] }) {
  // Identity reconciliation belongs to the API. Do not hide genuine repeated
  // replies by comparing body snippets or timestamps in the browser.
  const ordered = [...messages].sort((a, b) => Date.parse(messageTime(a)) - Date.parse(messageTime(b)) || a.id.localeCompare(b.id))

  if (!ordered.length) return <p className="py-8 text-sm text-slate-500">No messages in this conversation yet.</p>

  return (
    <ol aria-label="Conversation history, oldest first" className="space-y-5">
      {ordered.map((message, index) => {
        const date = new Date(messageTime(message))
        const validDate = Number.isFinite(date.getTime())
        const day = validDate ? date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'Date unavailable'
        const previous = ordered[index - 1]
        const previousDate = previous ? new Date(messageTime(previous)) : null
        const previousDay = previousDate && Number.isFinite(previousDate.getTime())
          ? previousDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
          : previous ? 'Date unavailable' : null
        const showDay = day !== previousDay
        const outbound = message.direction === 'outbound'
        const earlier = ordered.slice(0, index)
        const kind = outbound
          ? earlier.some(item => item.direction === 'inbound')
            ? 'Your reply'
            : earlier.some(item => item.direction === 'outbound') ? 'Your follow-up' : 'Initial email'
          : 'Prospect reply'
        const from = message.fromEmail || (outbound ? message.mailAccount?.email : null) || 'Unknown sender'
        return (
          <li key={`${message.sourceType}-${message.id}`}>
            {showDay && <div className="mb-5 flex items-center gap-3" aria-label={day}><div className="h-px flex-1 bg-slate-200" /><span className="text-[11px] font-medium text-slate-500">{day}</span><div className="h-px flex-1 bg-slate-200" /></div>}
            <article aria-label={kind} className={`overflow-hidden rounded-xl border ${outbound ? 'border-slate-200 bg-white sm:ml-6' : 'border-blue-200 bg-blue-50/30 sm:mr-6'}`}>
              <header className={`flex flex-wrap items-start gap-3 border-b px-4 py-3 sm:px-5 ${outbound ? 'border-slate-100 bg-slate-50/70' : 'border-blue-100 bg-blue-50/70'}`}>
                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${outbound ? 'bg-slate-200/70 text-slate-600' : 'bg-blue-100 text-blue-700'}`} aria-hidden="true">
                  {outbound ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1 basis-40">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="text-sm font-semibold text-slate-900">{outbound ? 'You' : 'Prospect'}</span><span className={`text-[11px] font-medium ${outbound ? 'text-slate-500' : 'text-blue-700'}`}>{kind}</span></div>
                  <div className="mt-1 truncate text-[11px] text-slate-500" title={`${from} → ${message.toEmail || 'Unknown recipient'}`}>
                    {from}<span className="hidden sm:inline"><span className="mx-1.5" aria-hidden="true">→</span>{message.toEmail || 'Unknown recipient'}</span>
                  </div>
                </div>
                <time dateTime={validDate ? date.toISOString() : undefined} title={validDate ? date.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'long' }) : undefined} className="ml-auto whitespace-nowrap text-xs tabular-nums text-slate-500">
                  {validDate ? date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : 'Unknown time'}
                </time>
              </header>
              <div className="px-4 py-3 sm:px-5"><EmailBody message={message} /></div>
              {(message.campaign || message.sequenceStepNumber != null) && <footer className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-5 py-2 text-[11px] text-slate-500"><Mail className="h-3 w-3" />{message.campaign?.name}{message.sequenceStepNumber != null && <span>· Step {message.sequenceStepNumber}</span>}</footer>}
            </article>
          </li>
        )
      })}
    </ol>
  )
}
