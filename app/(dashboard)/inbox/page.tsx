'use client'

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Inbox, RefreshCw } from 'lucide-react'
import { PaginationControls } from '@/components/ui/pagination-controls'

type MailAccountOption = {
  id: string
  email: string
  displayName: string
  type: 'zoho' | 'gmail'
}

type EmailInboxMessage = {
  id: string
  mailAccountId: string
  folderKind: 'INBOX' | 'SPAM' | 'SENT' | 'ARCHIVE' | 'OTHER'
  direction: 'inbound' | 'outbound'
  fromEmail: string | null
  toEmail: string | null
  subject: string | null
  snippet: string | null
  sentAt: string | null
  receivedAt: string | null
  isWarmup: boolean
  isRead: boolean
  isSpam: boolean
  repliedAt: string | null
  openedAt: string | null
  rescuedAt: string | null
  mailAccount: MailAccountOption
}

type EmailMessageModalState = {
  id: string
  subject: string | null
  fromEmail: string | null
  toEmail: string | null
  sentAt: string | null
  receivedAt: string | null
  html: string | null
  text: string | null
}

type InboxRetention = {
  emailDays: number
}

type PaginatedPayload<T> = {
  items: T[]
  total: number
  page: number
  pages: number
  limit: number
}

function emptyPage<T>(limit: number): PaginatedPayload<T> {
  return { items: [], total: 0, page: 1, pages: 1, limit }
}

function formatDate(value?: string | null) {
  if (!value) return 'No timestamp'
  return new Date(value).toLocaleString()
}

async function readJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(url)
    return (await response.json()) as T
  } catch {
    return fallback
  }
}

export default function InboxPage() {
  const [mailAccounts, setMailAccounts] = useState<MailAccountOption[]>([])
  const [retention, setRetention] = useState<InboxRetention>({ emailDays: 30 })
  const [emailFolder, setEmailFolder] = useState<'INBOX' | 'SPAM' | 'SENT'>('INBOX')
  const [selectedMailAccountId, setSelectedMailAccountId] = useState('')
  const [includeWarmup, setIncludeWarmup] = useState(false)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [emailData, setEmailData] = useState<PaginatedPayload<EmailInboxMessage>>(emptyPage(25))
  const [emailLoading, setEmailLoading] = useState(true)
  const [emailPage, setEmailPage] = useState(1)
  const [emailLimit, setEmailLimit] = useState(25)
  const [replyingMessageId, setReplyingMessageId] = useState<string | null>(null)
  const [emailReplySubject, setEmailReplySubject] = useState('Re: Quick follow-up')
  const [emailReplyBody, setEmailReplyBody] = useState('<p>Thanks for your message. Sharing a quick follow-up from the unified inbox.</p>')
  const [isClient, setIsClient] = useState(false)
  const [messageModal, setMessageModal] = useState<EmailMessageModalState | null>(null)
  const [messageLoadingId, setMessageLoadingId] = useState<string | null>(null)
  const [messageError, setMessageError] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [settingsReady, setSettingsReady] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    const loadAccountsAndSettings = async () => {
      const mailRes = await readJson<PaginatedPayload<MailAccountOption>>(
        '/api/mail-accounts?view=selector&page=1&limit=100',
        emptyPage(100)
      )
      setMailAccounts(mailRes.items || [])

      const settings = await readJson<{
        workspace?: {
          inboxPageSize?: number
          includeWarmupInInbox?: boolean
        }
      }>('/api/settings', {})

      if (settings.workspace?.inboxPageSize) setEmailLimit(settings.workspace.inboxPageSize)
      if (typeof settings.workspace?.includeWarmupInInbox === 'boolean') {
        setIncludeWarmup(settings.workspace.includeWarmupInInbox)
      }
      setSettingsReady(true)
    }

    void loadAccountsAndSettings()
  }, [])

  const loadEmail = useCallback(async () => {
    setEmailLoading(true)
    const params = new URLSearchParams({
      channel: 'email',
      folderKind: emailFolder,
      page: String(emailPage),
      limit: String(emailLimit),
    })
    if (selectedMailAccountId) params.set('mailAccountId', selectedMailAccountId)
    if (includeWarmup) params.set('includeWarmup', 'true')
    if (deferredSearch.trim()) params.set('search', deferredSearch.trim())

    const data = await readJson<PaginatedPayload<EmailInboxMessage> & { retention?: InboxRetention; messages?: EmailInboxMessage[] }>(
      `/api/inbox?${params.toString()}`,
      { ...emptyPage(emailLimit), messages: [] }
    )

    setEmailData({
      items: data.items || data.messages || [],
      total: data.total || 0,
      page: data.page || 1,
      pages: data.pages || 1,
      limit: data.limit || emailLimit,
    })
    if (data.retention) setRetention(data.retention)
    setEmailLoading(false)
  }, [deferredSearch, emailFolder, emailLimit, emailPage, includeWarmup, selectedMailAccountId])

  useEffect(() => {
    if (settingsReady) {
      void loadEmail()
    }
  }, [loadEmail, settingsReady])

  const selectedEmailCountLabel = useMemo(() => {
    if (!selectedMailAccountId) return 'All mail accounts'
    return mailAccounts.find((account) => account.id === selectedMailAccountId)?.email || 'Selected account'
  }, [mailAccounts, selectedMailAccountId])

  async function runEmailAction(message: EmailInboxMessage, action: 'mark-read' | 'rescue-to-inbox' | 'reply') {
    setBusyAction(`${action}:${message.id}`)
    const response = await fetch('/api/inbox', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: 'email',
        mailAccountId: message.mailAccountId,
        mailboxMessageId: message.id,
        action,
        ...(action === 'reply' ? { subject: emailReplySubject, html: emailReplyBody } : {}),
      }),
    })
    const data = await response.json().catch(() => ({ error: 'Inbox action failed' }))
    setBusyAction(null)
    if (!response.ok) {
      setToast({ type: 'error', message: data.error || 'Inbox action failed' })
      return
    }
    setToast({ type: 'success', message: action === 'reply' ? 'Reply queued for sync and sent' : 'Inbox updated' })
    setReplyingMessageId(null)
    await loadEmail()
  }

  async function clearSyncedData() {
    if (!window.confirm('Clear synced email inbox data from the database cache?')) return
    setBusyAction('clear:email')
    const response = await fetch('/api/inbox?scope=email', { method: 'DELETE' })
    const data = await response.json().catch(() => ({ error: 'Failed to clear inbox cache' }))
    setBusyAction(null)
    if (!response.ok) {
      setToast({ type: 'error', message: data.error || 'Failed to clear inbox cache' })
      return
    }
    setToast({ type: 'success', message: 'Cleared synced email inbox cache' })
    setEmailData(emptyPage(emailLimit))
  }

  async function openEmailMessage(message: EmailInboxMessage) {
    setMessageError(null)
    setMessageLoadingId(message.id)

    try {
      const response = await fetch(`/api/inbox/${message.id}/message`)
      const data = await response.json().catch(() => ({ error: 'Failed to load message content' }))

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load message content')
      }

      setMessageModal({
        id: message.id,
        subject: data.subject ?? message.subject,
        fromEmail: data.fromEmail ?? message.fromEmail,
        toEmail: data.toEmail ?? message.toEmail,
        sentAt: data.sentAt ?? message.sentAt,
        receivedAt: data.receivedAt ?? message.receivedAt,
        html: data.html ?? null,
        text: data.text ?? null,
      })
    } catch (error) {
      const nextError = error instanceof Error ? error.message : 'Failed to load message content'
      setMessageError(nextError)
      setToast({ type: 'error', message: nextError })
    } finally {
      setMessageLoadingId(null)
    }
  }

  useEffect(() => {
    if (!messageModal) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMessageModal(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [messageModal])

  return (
    <div className="animate-fade-in space-y-6">
      {toast ? (
        <div
          className={`fixed right-6 top-6 z-[100] rounded-2xl border px-4 py-3 text-xs font-semibold shadow-lg ${
            toast.type === 'success'
              ? 'border-[#0f8a5f]/20 bg-[#0f8a5f]/10 text-[#0f8a5f]'
              : 'border-[#ee382b]/20 bg-[#ee382b]/10 text-[#ee382b]'
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      {/* Top Floating Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#121316] bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-full border border-[#121316]/08 shadow-sm">
            <Inbox className="h-3.5 w-3.5 text-[#ee382b]" />
            <span>Unified Inbox</span>
          </span>
        </div>

        <div className="flex items-center gap-2.5 ml-auto">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#121316]/10 bg-white/90 backdrop-blur-md px-4 py-2 text-xs font-semibold text-[#121316] shadow-sm transition-all hover:bg-white hover:shadow-md active:scale-95 cursor-pointer"
            onClick={() => void loadEmail()}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#ee382b]/20 bg-[#ee382b]/08 backdrop-blur-md px-4 py-2 text-xs font-semibold text-[#ee382b] shadow-sm transition-all hover:bg-[#ee382b]/15 active:scale-95 disabled:opacity-50 cursor-pointer"
            onClick={() => void clearSyncedData()}
            disabled={busyAction === 'clear:email'}
          >
            <span>{busyAction === 'clear:email' ? 'Clearing...' : 'Clear Cache'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <section className="uneevo-card p-5 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
        <div className="grid gap-3 lg:grid-cols-4">
          <select
            className="h-10 px-4 rounded-xl border border-[#121316]/12 bg-white text-xs font-semibold text-[#121316] focus:border-[#ee382b] focus:outline-hidden"
            value={emailFolder}
            onChange={(event) => {
              setEmailFolder(event.target.value as 'INBOX' | 'SPAM' | 'SENT')
              setEmailPage(1)
            }}
          >
            <option value="INBOX">Inbox Folder</option>
            <option value="SPAM">Spam Quarantine</option>
            <option value="SENT">Sent Messages</option>
          </select>
          <select
            className="h-10 px-4 rounded-xl border border-[#121316]/12 bg-white text-xs font-semibold text-[#121316] focus:border-[#ee382b] focus:outline-hidden"
            value={selectedMailAccountId}
            onChange={(event) => {
              setSelectedMailAccountId(event.target.value)
              setEmailPage(1)
            }}
          >
            <option value="">All Mailboxes</option>
            {mailAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.email}
              </option>
            ))}
          </select>
          <input
            className="h-10 px-4 rounded-xl border border-[#121316]/12 bg-white text-xs text-[#121316] placeholder:text-[#8a8780] focus:border-[#ee382b] focus:outline-hidden"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setEmailPage(1)
            }}
            placeholder="Search prospect, subject, or content..."
          />
          <label className="flex items-center gap-2.5 rounded-xl border border-[#121316]/10 bg-[#faf8f4] px-4 text-xs font-semibold text-[#62605c] cursor-pointer">
            <input
              type="checkbox"
              checked={includeWarmup}
              onChange={(event) => {
                setIncludeWarmup(event.target.checked)
                setEmailPage(1)
              }}
              className="rounded border-[#121316]/20 text-[#ee382b] focus:ring-[#ee382b]"
            />
            <span>Include warmup threads</span>
          </label>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-[#62605c] font-mono">
          <span>Folder: <strong className="text-[#121316] uppercase">{emailFolder}</strong></span>
          <span>Total Messages: <strong className="text-[#121316]">{emailData.total}</strong></span>
        </div>
      </section>

      {/* Messages Feed */}
      <section className="uneevo-card p-6 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
        {emailLoading ? (
          <div className="py-16 text-center text-xs font-medium text-[#62605c]">Loading conversations...</div>
        ) : emailData.items.length === 0 ? (
          <div className="py-16 text-center text-xs font-medium text-[#62605c]">No synced messages found for this view.</div>
        ) : (
          <div className="space-y-3.5">
            {emailData.items.map((message) => (
              <div
                key={message.id}
                className="rounded-[20px] border border-[#121316]/08 bg-[#faf8f4]/60 p-5 transition-all hover:bg-[#faf8f4]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
                  <div className="max-w-3xl min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="zoho-puvi-headline text-base font-bold text-[#121316] truncate">
                        {message.subject || '(No Subject)'}
                      </span>
                      {!message.isRead ? (
                        <span className="h-2 w-2 rounded-full bg-[#ee382b] shrink-0" />
                      ) : null}
                    </div>
                    <div className="text-xs text-[#62605c] font-medium">
                      {message.direction === 'inbound'
                        ? `From ${message.fromEmail || 'Unknown'}`
                        : `To ${message.toEmail || 'Unknown'}`}{' '}
                      via <span className="font-mono font-semibold text-[#121316]">{message.mailAccount.email}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[#8a8780]">
                      <span>{formatDate(message.receivedAt || message.sentAt)}</span>
                      <span>•</span>
                      <span className="text-[#121316]">{message.folderKind}</span>
                      <span>•</span>
                      <span>{message.isRead ? 'Read' : 'Unread'}</span>
                      {message.isWarmup ? <span className="text-[#ee382b]">• Warmup</span> : ''}
                      {message.repliedAt ? <span className="text-[#0f8a5f]">• Replied</span> : ''}
                    </div>
                    {message.snippet ? (
                      <div className="mt-2.5 text-xs text-[#62605c] line-clamp-2 leading-relaxed">
                        {message.snippet}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end shrink-0">
                    <button
                      className="inline-flex items-center gap-1 rounded-full border border-[#121316]/12 bg-white px-4 py-1.5 text-xs font-semibold text-[#121316] hover:bg-[#f5f3ef]"
                      onClick={() => void openEmailMessage(message)}
                      disabled={messageLoadingId === message.id}
                    >
                      {messageLoadingId === message.id ? 'Loading...' : 'View Message'}
                    </button>
                    {!message.isRead ? (
                      <button
                        className="inline-flex items-center gap-1 rounded-full border border-[#121316]/12 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#62605c] hover:bg-[#f5f3ef]"
                        onClick={() => void runEmailAction(message, 'mark-read')}
                        disabled={busyAction === `mark-read:${message.id}`}
                      >
                        Mark Read
                      </button>
                    ) : null}
                    {message.isSpam ? (
                      <button
                        className="inline-flex items-center gap-1 rounded-full border border-[#0f8a5f]/20 bg-[#0f8a5f]/10 px-3.5 py-1.5 text-xs font-semibold text-[#0f8a5f]"
                        onClick={() => void runEmailAction(message, 'rescue-to-inbox')}
                        disabled={busyAction === `rescue-to-inbox:${message.id}`}
                      >
                        Rescue
                      </button>
                    ) : null}
                    {message.direction === 'inbound' ? (
                      <button
                        className="inline-flex items-center gap-1 rounded-full bg-[#ee382b] px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#d92b1f]"
                        onClick={() => {
                          setReplyingMessageId((current) => (current === message.id ? null : message.id))
                          setEmailReplySubject(
                            message.subject?.startsWith('Re:')
                              ? message.subject
                              : `Re: ${message.subject || 'Quick follow-up'}`
                          )
                        }}
                      >
                        Reply
                      </button>
                    ) : null}
                  </div>
                </div>

                {replyingMessageId === message.id ? (
                  <div className="mt-4 pt-4 border-t border-[#121316]/08 space-y-3">
                    <input
                      className="w-full h-10 px-4 rounded-xl border border-[#121316]/12 bg-white text-xs font-semibold text-[#121316] focus:border-[#ee382b] focus:outline-hidden"
                      value={emailReplySubject}
                      onChange={(event) => setEmailReplySubject(event.target.value)}
                      placeholder="Reply subject"
                    />
                    <textarea
                      className="w-full p-4 rounded-xl border border-[#121316]/12 bg-white text-xs text-[#121316] focus:border-[#ee382b] focus:outline-hidden min-h-[120px]"
                      value={emailReplyBody}
                      onChange={(event) => setEmailReplyBody(event.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        className="inline-flex items-center gap-2 rounded-full bg-[#ee382b] px-5 py-2 text-xs font-semibold text-white hover:bg-[#d92b1f]"
                        onClick={() => void runEmailAction(message, 'reply')}
                        disabled={busyAction === `reply:${message.id}`}
                      >
                        {busyAction === `reply:${message.id}` ? 'Sending...' : 'Send Reply'}
                      </button>
                      <button
                        className="inline-flex items-center gap-2 rounded-full border border-[#121316]/12 bg-white px-4 py-2 text-xs font-semibold text-[#121316] hover:bg-[#f5f3ef]"
                        onClick={() => setReplyingMessageId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-[#121316]/08">
          <PaginationControls
            page={emailData.page}
            pages={emailData.pages}
            total={emailData.total}
            limit={emailData.limit}
            onPageChange={setEmailPage}
            onLimitChange={(limit) => {
              setEmailLimit(limit)
              setEmailPage(1)
            }}
            label="messages"
          />
        </div>
      </section>

      {messageError ? (
        <div className="rounded-[20px] border border-[#ee382b]/20 bg-[#ee382b]/10 p-4 text-xs font-semibold text-[#ee382b]">
          {messageError}
        </div>
      ) : null}

      {/* Message Viewer Modal */}
      {isClient && messageModal
        ? createPortal(
            <div
              onClick={() => setMessageModal(null)}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#121316]/60 backdrop-blur-xs"
            >
              <div
                className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[28px] border border-[#121316]/12 bg-white p-6 sm:p-8 shadow-[0_24px_70px_rgba(0,0,0,0.25)]"
                role="dialog"
                aria-modal="true"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4 border-b border-[#121316]/08 pb-5">
                  <div>
                    <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block mb-1">
                      MESSAGE INSPECTOR
                    </span>
                    <h2 className="zoho-puvi-headline text-xl sm:text-2xl font-bold text-[#121316]">
                      {messageModal.subject || '(No Subject)'}
                    </h2>
                    <div className="text-xs text-[#62605c] mt-1 font-medium">
                      {messageModal.fromEmail ? `From ${messageModal.fromEmail}` : 'Unknown'}
                      {messageModal.toEmail ? ` to ${messageModal.toEmail}` : ''} •{' '}
                      <span className="font-mono text-[#8a8780]">
                        {formatDate(messageModal.receivedAt || messageModal.sentAt)}
                      </span>
                    </div>
                  </div>
                  <button
                    className="rounded-full border border-[#121316]/12 bg-white px-4 py-1.5 text-xs font-semibold text-[#121316] hover:bg-[#faf8f4]"
                    onClick={() => setMessageModal(null)}
                  >
                    Close
                  </button>
                </div>

                <div className="mt-5 overflow-hidden rounded-[20px] border border-[#121316]/08 bg-[#faf8f4]/50">
                  {messageModal.html ? (
                    <iframe
                      title={messageModal.subject || 'Inbox message'}
                      srcDoc={messageModal.html}
                      sandbox=""
                      className="w-full min-h-[60vh] border-0 bg-white"
                    />
                  ) : (
                    <div className="p-6 text-xs sm:text-sm leading-relaxed text-[#121316] font-sans whitespace-pre-wrap">
                      {messageModal.text || 'No message content available.'}
                    </div>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  )
}
