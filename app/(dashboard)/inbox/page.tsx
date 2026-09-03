'use client'

import { useCallback, useDeferredValue, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Flame,
  Inbox,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Send,
  X,
  Reply,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

type MailAccountOption = {
  id: string
  email: string
  displayName: string
  type: 'zoho' | 'gmail' | 'outlook' | 'smtp'
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

type EmailMessageDetail = {
  id: string
  mailAccountId: string
  subject: string | null
  fromEmail: string | null
  toEmail: string | null
  sentAt: string | null
  receivedAt: string | null
  html: string | null
  text: string | null
  direction: 'inbound' | 'outbound'
  isWarmup: boolean
  isSpam: boolean
  isRead: boolean
  folderKind: string
  mailAccount: MailAccountOption
}

type PaginatedPayload<T> = { items: T[]; total: number; page: number; pages: number; limit: number }

function emptyPage<T>(limit: number): PaginatedPayload<T> {
  return { items: [], total: 0, page: 1, pages: 1, limit }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSenderInfo(msg: Pick<EmailInboxMessage, 'direction' | 'fromEmail' | 'toEmail'>) {
  const raw = msg.direction === 'outbound' ? msg.toEmail || 'Unknown' : msg.fromEmail || 'Unknown'
  let name = '', email = raw
  if (raw.includes('<') && raw.includes('>')) {
    const m = raw.match(/(.*?)\s*<([^>]+)>/)
    if (m) { name = m[1].replace(/["']/g, '').trim(); email = m[2].trim() }
  }
  if (!name && email) {
    const u = email.split('@')[0]
    if (u) name = u.split(/[._+-]/).filter(Boolean).map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  }
  return { name: name || email || 'Prospect', email, initial: (name || email || 'U').charAt(0).toUpperCase() }
}

const PALETTE: [string, string][] = [
  ['#f97316', '#fff7ed'], ['#8b5cf6', '#f5f3ff'], ['#06b6d4', '#ecfeff'],
  ['#10b981', '#ecfdf5'], ['#ec4899', '#fdf2f8'], ['#3b82f6', '#eff6ff'],
  ['#f59e0b', '#fffbeb'], ['#6366f1', '#eef2ff'],
]

function getAvatar(id: string): [string, string] {
  let h = 0
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h)
  return PALETTE[Math.abs(h) % PALETTE.length]
}

function fmtClock(ts: string | null | undefined) {
  if (!ts) return ''
  try { return new Date(ts).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) } catch { return '' }
}

function fmtAgo(ts: string | null | undefined) {
  if (!ts) return ''
  try {
    const d = Date.now() - new Date(ts).getTime()
    const m = Math.floor(d / 60000), h = Math.floor(d / 3600000), day = Math.floor(d / 86400000)
    if (m < 2) return 'Just now'
    if (m < 60) return `${m}m ago`
    if (h < 24) return `${h}h ago`
    if (day === 1) return 'Yesterday'
    return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric' })
  } catch { return '' }
}

function fmtFull(ts: string | null | undefined) {
  if (!ts) return ''
  try { return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) } catch { return '' }
}

async function readJson<T>(url: string, fallback: T): Promise<T> {
  try { const r = await fetch(url); return (await r.json()) as T } catch { return fallback }
}

// ── Components ────────────────────────────────────────────────────────────

function Av({ name, email, size = 'md' }: { name: string; email: string; size?: 'sm' | 'md' | 'lg' }) {
  const [fg, bg] = getAvatar(email || name)
  const sz = size === 'sm' ? 'w-8 h-8 text-sm' : size === 'lg' ? 'w-12 h-12 text-lg' : 'w-10 h-10 text-[15px]'
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-bold shrink-0`} style={{ background: bg, color: fg, border: `1px solid ${fg}33` }}>
      {(name || email || 'U').charAt(0).toUpperCase()}
    </div>
  )
}

function MessageCard({ msg, selected, onSelect }: { msg: EmailInboxMessage; selected: boolean; onSelect: () => void }) {
  const s = getSenderInfo(msg)
  const [fg, bg] = getAvatar(s.email)

  return (
    <div
      onClick={onSelect}
      className={`mx-3 mb-2 p-3.5 rounded-xl cursor-pointer transition-all duration-150 group border ${
        selected
          ? 'bg-blue-50/50 border-blue-200 shadow-xs ring-1 ring-blue-500/10'
          : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50 hover:shadow-xs'
      }`}
    >
      <div className="flex items-start gap-3 mb-1.5">
        <div className="relative shrink-0 pt-0.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: bg, color: fg, border: `1px solid ${fg}33` }}>
            {s.initial}
          </div>
          {!msg.isRead && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`text-sm truncate ${!msg.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                {s.name}
              </span>
            </div>
            <span className={`text-[11px] shrink-0 ${!msg.isRead ? 'font-semibold text-blue-600' : 'text-gray-400'}`}>
              {fmtClock(msg.receivedAt || msg.sentAt) || fmtAgo(msg.receivedAt || msg.sentAt)}
            </span>
          </div>
          <div className={`text-[13px] mt-0.5 mb-1 leading-snug truncate ${!msg.isRead ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
            {msg.subject || '(No Subject)'}
          </div>
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {msg.snippet || 'No preview available.'}
          </p>
          
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-50">
            {msg.isWarmup && (
              <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100 flex items-center gap-1">
                <Flame className="w-3 h-3" /> Warmup
              </span>
            )}
            {msg.repliedAt && (
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
                <Reply className="w-3 h-3" /> Replied
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const [mailAccounts, setMailAccounts] = useState<MailAccountOption[]>([])
  const [emailFolder, setEmailFolder] = useState<'INBOX' | 'SPAM' | 'SENT'>('INBOX')
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [includeWarmup, setIncludeWarmup] = useState(false)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [emailData, setEmailData] = useState<PaginatedPayload<EmailInboxMessage>>(emptyPage(50))
  const [emailLoading, setEmailLoading] = useState(true)
  const [settingsReady, setSettingsReady] = useState(false)
  const [selected, setSelected] = useState<EmailInboxMessage | null>(null)
  const [detail, setDetail] = useState<EmailMessageDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [isSending, setIsSending] = useState(false)
  const replyRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t) }, [toast])

  useEffect(() => {
    const load = async () => {
      const r = await readJson<PaginatedPayload<MailAccountOption>>('/api/mail-accounts?view=selector&page=1&limit=100', emptyPage(100))
      setMailAccounts(r.items || [])
      const s = await readJson<{ workspace?: { includeWarmupInInbox?: boolean } }>('/api/settings', {})
      if (typeof s.workspace?.includeWarmupInInbox === 'boolean') setIncludeWarmup(s.workspace.includeWarmupInInbox)
      setSettingsReady(true)
    }
    void load()
  }, [])

  const loadEmail = useCallback(async () => {
    setEmailLoading(true)
    const p = new URLSearchParams({ channel: 'email', folderKind: emailFolder, page: '1', limit: '50' })
    if (selectedAccountId) p.set('mailAccountId', selectedAccountId)
    if (includeWarmup) p.set('includeWarmup', 'true')
    if (deferredSearch.trim()) p.set('search', deferredSearch.trim())
    const d = await readJson<PaginatedPayload<EmailInboxMessage> & { messages?: EmailInboxMessage[] }>(
      `/api/inbox?${p}`, { ...emptyPage(50), messages: [] }
    )
    setEmailData({ items: d.items || d.messages || [], total: d.total || 0, page: d.page || 1, pages: d.pages || 1, limit: d.limit || 50 })
    setEmailLoading(false)
  }, [deferredSearch, emailFolder, includeWarmup, selectedAccountId])

  useEffect(() => { if (settingsReady) void loadEmail() }, [loadEmail, settingsReady])

  async function openMessage(msg: EmailInboxMessage) {
    setSelected(msg); setDetail(null); setDetailLoading(true); setReplyBody('');
    
    // Optimistically mark read in UI
    setEmailData(prev => ({
      ...prev,
      items: prev.items.map(m => m.id === msg.id ? { ...m, isRead: true } : m)
    }))

    try {
      const r = await fetch(`/api/inbox/${msg.id}/message`)
      const data = await r.json().catch(() => ({}))
      if (r.ok) {
        setDetail({
          ...msg,
          html: data.html ?? null, text: data.text ?? null,
          subject: data.subject ?? msg.subject, fromEmail: data.fromEmail ?? msg.fromEmail,
          toEmail: data.toEmail ?? msg.toEmail, sentAt: data.sentAt ?? msg.sentAt,
          receivedAt: data.receivedAt ?? msg.receivedAt,
        })
      }
      if (!msg.isRead) {
        void fetch('/api/inbox', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel: 'email', mailAccountId: msg.mailAccountId, mailboxMessageId: msg.id, action: 'mark-read' }),
        })
      }
    } finally { setDetailLoading(false) }
  }

  async function sendReply() {
    if (!detail || !replyBody.trim()) return
    setIsSending(true)
    try {
      const subj = (detail.subject || '').startsWith('Re:') ? detail.subject! : `Re: ${detail.subject || 'Follow-up'}`
      const r = await fetch('/api/inbox', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'email', mailAccountId: detail.mailAccountId, mailboxMessageId: detail.id, action: 'reply', subject: subj, html: `<p>${replyBody.replace(/\n/g, '<br/>')}</p>` }),
      })
      const d = await r.json().catch(() => ({ error: 'Reply failed' }))
      if (!r.ok) throw new Error(d.error || 'Failed')
      setToast({ type: 'success', msg: 'Reply sent successfully.' })
      setReplyBody('');
      
      // Update local state to show replied badge
      setEmailData(prev => ({
        ...prev,
        items: prev.items.map(m => m.id === detail.id ? { ...m, repliedAt: new Date().toISOString() } : m)
      }))
      
    } catch (e: unknown) {
      setToast({ type: 'error', msg: e instanceof Error ? e.message : 'Failed to send reply' })
    } finally { setIsSending(false) }
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSelected(null); setDetail(null) } }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [])

  const items = emailData.items
  const currentAccount = mailAccounts.find(a => a.id === selectedAccountId) || mailAccounts[0]

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] bg-white rounded-[28px] border border-white/60 shadow-[0_2px_20px_rgba(60,45,25,0.02)] overflow-hidden font-sans">
      
      {/* Toast */}
      {toast && (
        <div className={`fixed right-6 top-6 z-[200] flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-semibold shadow-lg animate-in fade-in slide-in-from-top-3 ${toast.type === 'success' ? 'border-emerald-200 bg-white text-emerald-800' : 'border-red-200 bg-white text-red-800'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ── Header ── */}
      <div className="shrink-0 border-b border-gray-100/80 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Inbox className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Inbox</h1>
            <p className="text-xs text-gray-500 font-medium">Manage your connected mailboxes</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {/* Account Selector */}
          <div className="relative">
            <select value={selectedAccountId || 'all'} onChange={e => setSelectedAccountId(e.target.value === 'all' ? '' : e.target.value)}
              className="pl-3 pr-8 py-2 text-sm font-semibold border border-gray-200 rounded-xl bg-white text-gray-800 appearance-none focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer shadow-xs min-w-[200px]">
              <option value="all">All Connected Accounts ({mailAccounts.length})</option>
              {mailAccounts.map(a => <option key={a.id} value={a.id}>{a.displayName || a.email}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          <button type="button" onClick={() => void loadEmail()} disabled={emailLoading} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer shadow-xs transition-colors">
            <RefreshCw className={`h-4 w-4 ${emailLoading ? 'animate-spin text-gray-400' : 'text-gray-500'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="shrink-0 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center p-1 bg-gray-100/80 rounded-lg">
          {(['INBOX', 'SENT', 'SPAM'] as const).map(f => (
            <button key={f} type="button" onClick={() => setEmailFolder(f)}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                emailFolder === f 
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
              }`}>
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="flex flex-1 max-w-md items-center gap-4 ml-auto">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-600 hover:text-gray-900 shrink-0">
            <input type="checkbox" checked={includeWarmup} onChange={e => setIncludeWarmup(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <Flame className={`h-4 w-4 ${includeWarmup ? 'text-amber-500' : 'text-gray-300'}`} />
            Show Warmup
          </label>
          
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input type="text" placeholder="Search emails..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            {search && <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>}
          </div>
        </div>
      </div>

      {/* ── Two-Panel Body ── */}
      <div className="flex flex-1 overflow-hidden bg-gray-50/30">
        
        {/* LEFT: Email List */}
        <div className="w-full md:w-[360px] lg:w-[420px] shrink-0 flex flex-col border-r border-gray-200 bg-white overflow-hidden">
          <div className="flex-1 overflow-y-auto pt-3 pb-6 custom-scrollbar">
            {emailLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map(n => (
                  <div key={n} className="animate-pulse p-4 rounded-xl border border-gray-100 space-y-3 mx-3">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between">
                          <div className="h-3.5 bg-gray-200 rounded w-24" />
                          <div className="h-3 bg-gray-100 rounded w-12" />
                        </div>
                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-2.5 bg-gray-100 rounded w-full" />
                      <div className="h-2.5 bg-gray-100 rounded w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-3">
                <div className="w-14 h-14 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
                  <Inbox className="h-7 w-7 text-gray-300" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700">No emails found</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-[200px] mx-auto">
                    {search ? "No results match your search." : "Your inbox is empty."}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                {items.map(m => (
                  <MessageCard 
                    key={m.id} 
                    msg={m} 
                    selected={selected?.id === m.id} 
                    onSelect={() => void openMessage(m)} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Detail View */}
        <div className="hidden md:flex flex-1 flex-col overflow-hidden bg-white">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 bg-gray-50/50">
              <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-300">
                <Mail className="h-8 w-8" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-700">Select an email to read</p>
                <p className="text-sm text-gray-500 mt-1">Nothing is selected</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Email Header */}
              <div className="shrink-0 px-8 py-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-6">
                  {selected.subject || '(No Subject)'}
                </h2>
                
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Av name={getSenderInfo(selected).name} email={getSenderInfo(selected).email} size="lg" />
                    <div>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-base font-bold text-gray-900">{getSenderInfo(selected).name}</span>
                        <span className="text-sm text-gray-500">&lt;{getSenderInfo(selected).email}&gt;</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 font-medium">
                        To: <span className="text-gray-700">{selected.toEmail || currentAccount?.email || 'you'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-gray-700">{fmtFull(selected.receivedAt || selected.sentAt)}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{fmtAgo(selected.receivedAt || selected.sentAt)}</div>
                  </div>
                </div>
              </div>

              {/* Email Body */}
              <div className="flex-1 overflow-y-auto px-8 py-6">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600/50" />
                  </div>
                ) : detail ? (
                  <div className="max-w-4xl">
                    {detail.html ? (
                      <iframe title="Email Content" srcDoc={detail.html} sandbox="" className="w-full min-h-[400px] border-0" />
                    ) : (
                      <div className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap font-sans">
                        {detail.text || 'No message content available.'}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Reply Composer */}
              {detail && (
                <div className="shrink-0 border-t border-gray-100 bg-gray-50/50 px-8 py-5">
                  <div className="max-w-4xl space-y-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                      <Reply className="w-4 h-4 text-gray-400" />
                      Reply as <span className="text-gray-800 font-semibold">{currentAccount?.email || selected.mailAccount.email}</span>
                    </div>

                    <textarea
                      ref={replyRef}
                      value={replyBody}
                      onChange={e => setReplyBody(e.target.value)}
                      placeholder={`Draft your reply to ${getSenderInfo(selected).name}...`}
                      className="w-full text-sm text-gray-800 bg-white border border-gray-200 rounded-xl p-4 resize-none focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px] leading-relaxed shadow-xs transition-shadow"
                    />

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-400">Press ⌘+Enter to send</span>
                      <button type="button" disabled={!replyBody.trim() || isSending} onClick={() => void sendReply()}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 cursor-pointer shadow-sm transition-all active:scale-95">
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        <span>Send Reply</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}} />
    </div>
  )
}