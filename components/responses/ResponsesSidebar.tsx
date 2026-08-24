'use client'

import { PaginationControls } from '@/components/ui/pagination-controls'
import type { MailAccountOption, ResponseListItem } from './types'

type Props = {
  items: ResponseListItem[]
  accounts: MailAccountOption[]
  selectedId: string | null
  loading: boolean
  search: string
  mailAccountId: string
  status: string
  classification: string
  page: number
  pages: number
  total: number
  limit: number
  onSearchChange: (value: string) => void
  onMailAccountChange: (value: string) => void
  onStatusChange: (value: string) => void
  onClassificationChange: (value: string) => void
  onPageChange: (value: number) => void
  onLimitChange: (value: number) => void
  onSelect: (id: string) => void
}

function formatDate(value?: string | null) {
  if (!value) return 'No timestamp'
  return new Date(value).toLocaleString()
}

export function ResponsesSidebar(props: Props) {
  return (
    <aside className="response-sidebar min-w-0 p-3 sm:p-4 lg:h-[calc(100vh-150px)] lg:overflow-hidden">
      <div className="response-sidebar-controls space-y-3">
        <input className="input-base" value={props.search} onChange={(event) => props.onSearchChange(event.target.value)} placeholder="Search responses" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <select className="input-base" value={props.mailAccountId} onChange={(event) => props.onMailAccountChange(event.target.value)}>
            <option value="">All mailboxes</option>
            {props.accounts.map((account) => <option key={account.id} value={account.id}>{account.email}</option>)}
          </select>
          <select className="input-base" value={props.status} onChange={(event) => props.onStatusChange(event.target.value)}>
            <option value="">Open</option>
            <option value="active">Needs reply</option>
            <option value="replied">Replied</option>
            <option value="archived">Archived</option>
          </select>
          <select className="input-base sm:col-span-2" value={props.classification} onChange={(event) => props.onClassificationChange(event.target.value)}>
            <option value="">All reply types</option>
            <option value="interested">Interested</option>
            <option value="not_interested">Not interested</option>
            <option value="automatic">Automatic reply</option>
            <option value="needs_review">Needs review</option>
          </select>
        </div>
      </div>

      <div className="mt-4 lg:h-[calc(100%-170px)] lg:overflow-y-auto">
        {props.loading ? (
          <div className="p-4 text-sm text-[var(--text-muted)]">Loading responses...</div>
        ) : props.items.length === 0 ? (
          <div className="p-4 text-sm leading-6 text-[var(--text-muted)]">No response threads match this view yet.</div>
        ) : (
          <div className="space-y-2">
            {props.items.map((item) => (
              <button
                key={item.id}
                className={`response-list-item w-full min-w-0 p-3 sm:p-4 text-left transition ${props.selectedId === item.id ? 'is-selected' : ''}`}
                onClick={() => props.onSelect(item.id)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-sm font-semibold text-[var(--text-primary)]">{item.counterpartEmail || 'Unknown sender'}</div>
                  <span className={`response-read-state ${item.unread ? 'is-unread' : ''}`}>{item.unread ? 'Unread' : 'Seen'}</span>
                </div>
                <div className="mt-1 truncate text-sm text-[var(--text-secondary)]">{item.subject || '(no subject)'}</div>
                <div className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--text-muted)]">{item.snippet || 'No preview available.'}</div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  <span>{formatDate(item.latestRespondedAt)}</span>
                  <span>{item.mailAccount.email}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="mail-status-pill">{item.status === 'replied' ? 'Replied' : 'Needs reply'}</span>
                  <span className={`response-classification is-${item.classification}`}>{item.classification.replace('_', ' ')}</span>
                  {item.source ? <span className="mail-status-pill">{item.source}</span> : null}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4">
        <PaginationControls page={props.page} pages={props.pages} total={props.total} limit={props.limit} onPageChange={props.onPageChange} onLimitChange={props.onLimitChange} label="responses" />
      </div>
    </aside>
  )
}
