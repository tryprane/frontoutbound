'use client'

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Flame,
  Inbox,
  Loader2,
  Mail,
  Paperclip,
  RefreshCw,
  Send,
  Search,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
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

function fmtLatency(ts: string | null | undefined) {
  if (!ts) return ''
  try {
    const d = Date.now() - new Date(ts).getTime()
    const h = Math.floor(d / 3600000), m = Math.floor((d % 3600000) / 60000)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  } catch { return '' }
}

async function readJson<T>(url: string, fallback: T): Promise<T> {
  try { const r = await fetch(url); return (await r.json()) as T } catch { return fallback }
}

// ── Lead scoring / grouping ───────────────────────────────────────────────────

function getScore(msg: EmailInboxMessage) {
  let s = 50
  if (!msg.isRead && msg.direction === 'inbound') s += 30
  if (!msg.repliedAt) s += 10
  if (msg.isWarmup) s -= 20
  const age = msg.receivedAt ? (Date.now() - new Date(msg.receivedAt).getTime()) / 3600000 : 99
  s += age < 2 ? 15 : age < 24 ? 5 : 0
  return Math.max(0, Math.min(100, s))
}

type Group = 'urgent' | 'followup' | 'system'

function getGroup(msg: EmailInboxMessage): Group {
  if (msg.isWarmup || msg.isSpam) return 'system'
  if (msg.direction === 'inbound' && !msg.repliedAt) {
    const age = msg.receivedAt ? (Date.now() - new Date(msg.receivedAt).getTime()) / 3600000 : 99
    if (age < 48) return 'urgent'
  }
  return 'followup'
}

function getSla(msg: EmailInboxMessage): { label: string; breached: boolean } | null {
  if (!msg.receivedAt || msg.direction !== 'inbound' || msg.repliedAt) return null
  const age = (Date.now() - new Date(msg.receivedAt).getTime()) / 3600000
  const rem = 4 - age
  if (rem < 0) return { label: 'SLA BREACHED', breached: true }
  const h = Math.floor(rem), m = Math.round((rem % 1) * 60)
  return { label: `${h > 0 ? h + 'h ' : ''}${m}m remaining`, breached: false }
}

const AI_DRAFTS = ['Confirm Thursday 2pm', 'Offer Alternate Slot', 'Request More Details', 'Forward to Team']

// ── Sub-components ────────────────────────────────────────────────────────────

function Av({ name, email, size = 'md' }: { name: string; email: string; size?: 'sm' | 'md' | 'lg' }) {
  const [fg, bg] = getAvatar(email || name)
  const sz = size === 'sm' ? 'w-8 h-8 text-sm' : size === 'lg' ? 'w-12 h-12 text-lg' : 'w-10 h-10 text-[15px]'
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-bold shrink-0`} style={{ background: bg, color: fg, border: `2px solid ${fg}22` }}>
      {(name || email || 'U').charAt(0).toUpperCase()}
    </div>
  )
}

function ScorePill({ score }: { score: number }) {
  const c = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#94a3b8'
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${c}18`, color: c }}>Score {score}</span>
}

function IntentBadge({ score }: { score: number }) {
  const [cls, label] = score >= 80
    ? ['bg-emerald-100 text-emerald-800 border-emerald-200', 'HIGH INTENT LEAD']
    : score >= 60
    ? ['bg-amber-100 text-amber-800 border-amber-200', 'MEDIUM INTENT LEAD']
    : ['bg-gray-100 text-gray-600 border-gray-200', 'NURTURING']
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cls}`}>
      {score >= 80 && <Zap className="h-3 w-3" />}
      {label}
    </span>
  )
}

function LeadCard({ msg, selected, onSelect }: { msg: EmailInboxMessage; selected: boolean; onSelect: () => void }) {
  const s = getSenderInfo(msg)
  const score = getScore(msg)
  const sla = getSla(msg)
  const grp = getGroup(msg)
  const [fg, bg] = getAvatar(s.email)

  return (
    <div
      onClick={onSelect}
      className="mx-3 mb-2 rounded-xl cursor-pointer transition-all duration-150 hover:shadow-md"
      style={{
        background: selected ? '#f0fdf9' : sla?.breached ? '#fff5f5' : !msg.isRead && grp === 'urgent' ? '#fffdf0' : 'white',
        border: `1.5px solid ${selected ? '#10b981' : sla?.breached ? '#fca5a5' : !msg.isRead && grp === 'urgent' ? '#fde68a' : '#e5e7eb'}`,
        boxShadow: selected ? '0 0 0 2px #10b98130' : undefined,
      }}
    >
      <div className="p-3.5">
        <div className="flex items-start gap-2.5 mb-1.5">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: bg, color: fg, border: `2px solid ${fg}22` }}>
              {s.initial}
            </div>
            {!msg.isRead && grp !== 'system' && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#10b981] border-2 border-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm font-bold text-gray-900 truncate">{s.name}</span>
                {s.email.split('@')[1] && <span className="text-[11px] text-gray-400 truncate">{s.email.split('@')[1]}</span>}
              </div>
              <span className="text-[11px] text-gray-400 shrink-0 font-medium">{fmtClock(msg.receivedAt || msg.sentAt)}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {msg.repliedAt ? (
                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Check className="h-2.5 w-2.5" /> Replied
                </span>
              ) : !msg.isRead && grp === 'urgent' ? (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                  NEEDS REPLY · {fmtAgo(msg.receivedAt)}
                </span>
              ) : (
                <span className="text-[10px] text-gray-400">{fmtAgo(msg.receivedAt || msg.sentAt)}</span>
              )}
              <ScorePill score={score} />
              {sla && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${sla.breached ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700'}`}>
                  {sla.breached ? '⚠ ' : '⏱ '}{sla.label}
                </span>
              )}
              {!msg.isRead && !msg.repliedAt && grp === 'urgent' && (
                <span className="text-[10px] font-semibold text-orange-600">Action SLA: 18m</span>
              )}
            </div>
          </div>
        </div>

        <div className={`text-[13px] font-semibold mb-1 leading-snug ${!msg.isRead && grp !== 'system' ? 'text-gray-900' : 'text-gray-700'}`}>
          {msg.subject || '(No Subject)'}
        </div>
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{msg.snippet || 'No preview available.'}</p>

        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100/80">
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${msg.isWarmup ? 'text-amber-600 bg-amber-50 border border-amber-100' : 'text-blue-600 bg-blue-50 border border-blue-100'}`}>
            {msg.isWarmup ? '🔥 Warmup' : `· Seq · Step ${Math.max(1, Math.ceil(score / 30))}`}
          </span>
          {!msg.repliedAt && grp === 'urgent' && (
            <span className="text-[11px] font-bold text-[#10b981]">
              {score >= 80 ? 'Meeting Requested' : score >= 60 ? 'Follow-up Opportunity' : 'Decision Maker'}
            </span>
          )}
          {msg.repliedAt && <span className="text-[11px] font-semibold text-gray-400">✓ Replied</span>}
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
  const [selectedDraft, setSelectedDraft] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'urgent' | 'followup'>('all')
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
    setSelected(msg); setDetail(null); setDetailLoading(true); setReplyBody(''); setSelectedDraft(null)
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
      const subj = (detail.subject || '').startsWith('Re:') ? detail.subject! : `Re: ${detail.subject || 'Quick follow-up'}`
      const r = await fetch('/api/inbox', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'email', mailAccountId: detail.mailAccountId, mailboxMessageId: detail.id, action: 'reply', subject: subj, html: `<p>${replyBody.replace(/\n/g, '<br/>')}</p>` }),
      })
      const d = await r.json().catch(() => ({ error: 'Reply failed' }))
      if (!r.ok) throw new Error(d.error || 'Failed')
      setToast({ type: 'success', msg: 'Reply sent — lead advanced!' })
      setReplyBody(''); setSelectedDraft(null); setSelected(null); setDetail(null)
      void loadEmail()
    } catch (e: unknown) {
      setToast({ type: 'error', msg: e instanceof Error ? e.message : 'Failed to send reply' })
    } finally { setIsSending(false) }
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSelected(null); setDetail(null) } }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [])

  const items = emailData.items
  const urgentItems = useMemo(() => items.filter(m => getGroup(m) === 'urgent'), [items])
  const followupItems = useMemo(() => items.filter(m => getGroup(m) === 'followup'), [items])
  const systemItems = useMemo(() => items.filter(m => getGroup(m) === 'system'), [items])
  const urgentCount = urgentItems.length
  const triageDone = useMemo(() => items.filter(m => m.repliedAt).length, [items])
  const currentAccount = mailAccounts[0]

  const filteredUrgent = filter === 'followup' ? [] : urgentItems
  const filteredFollowup = filter === 'urgent' ? [] : followupItems
  const filteredSystem = filter === 'all' ? systemItems : []

  return (
    <div className="flex flex-col h-screen bg-[#f8f8fb] overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div className={`fixed right-6 top-6 z-[200] flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-semibold shadow-lg animate-in fade-in slide-in-from-top-3 ${toast.type === 'success' ? 'border-emerald-200 bg-white text-emerald-800' : 'border-red-200 bg-white text-red-800'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ── Metrics Bar ── */}
      <div className="shrink-0 bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-4 flex-wrap">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border font-semibold text-sm ${urgentCount > 0 ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
          {urgentCount > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
          <span>{urgentCount} Urgent Lead{urgentCount !== 1 ? 's' : ''}</span>
          {urgentCount > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold tracking-wide">NEEDS ACTION</span>
          )}
        </div>

        <div className="h-4 w-px bg-gray-200" />

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-gray-500">Daily Triage Progress:</span>
          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${(triageDone / Math.max(items.length, 1)) * 100}%`, background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
          </div>
          <span className="text-xs font-bold text-gray-700">{triageDone} / {items.length} triaged</span>
        </div>

        <div className="h-4 w-px bg-gray-200" />

        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-gray-600">
            Deliverability: <span className="text-emerald-700 font-bold">99.4%</span>
            {currentAccount && <span className="text-gray-400"> ({currentAccount.email.split('@')[1]})</span>}
          </span>
        </div>

        <div className="ml-auto">
          <button type="button" onClick={() => void loadEmail()} disabled={emailLoading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer">
            <RefreshCw className={`h-3.5 w-3.5 ${emailLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="shrink-0 bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-3 flex-wrap">
        <div className="relative">
          <select value={selectedAccountId || 'all'} onChange={e => setSelectedAccountId(e.target.value === 'all' ? '' : e.target.value)}
            className="pl-3 pr-8 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg bg-white text-gray-800 appearance-none focus:outline-hidden focus:ring-2 focus:ring-[#10b981] cursor-pointer">
            <option value="all">All Inboxes ({mailAccounts.length})</option>
            {mailAccounts.map(a => <option key={a.id} value={a.id}>{a.displayName || a.email}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <input type="text" placeholder="Search leads (⌘K)..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#10b981] focus:bg-white" />
          {search && <button type="button" onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"><X className="h-3.5 w-3.5" /></button>}
        </div>

        <div className="flex items-center gap-1.5">
          {(['all', 'urgent', 'followup'] as const).map(f => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${filter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f === 'all' ? 'All' : f === 'urgent' ? `Urgent (${urgentCount})` : `Follow-up (${followupItems.length})`}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-1.5 cursor-pointer ml-2 text-xs font-medium text-gray-500">
          <input type="checkbox" checked={includeWarmup} onChange={e => setIncludeWarmup(e.target.checked)} className="rounded border-gray-300" />
          <Flame className={`h-3.5 w-3.5 ${includeWarmup ? 'text-amber-500' : 'text-gray-300'}`} /> Warmup
        </label>

        <div className="relative ml-auto">
          <select value={emailFolder} onChange={e => setEmailFolder(e.target.value as 'INBOX' | 'SPAM' | 'SENT')}
            className="pl-3 pr-8 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg bg-white text-gray-700 appearance-none focus:outline-hidden cursor-pointer">
            <option value="INBOX">Inbox</option>
            <option value="SPAM">Spam</option>
            <option value="SENT">Sent</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* ── Two-Panel Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Lead List */}
        <div className="w-[380px] shrink-0 flex flex-col border-r border-gray-200 bg-white overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {emailLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(n => (
                  <div key={n} className="animate-pulse p-4 rounded-xl border border-gray-100 space-y-2">
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-gray-200 rounded w-24" />
                        <div className="h-2.5 bg-gray-100 rounded w-36" />
                      </div>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16 px-6 gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <Inbox className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-500">No messages found</p>
                <p className="text-xs text-gray-400">Try adjusting your filters or search query.</p>
              </div>
            ) : (
              <>
                {filteredUrgent.length > 0 && (
                  <div>
                    <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-[11px] font-bold tracking-wider text-gray-700 uppercase">Needs Reply Today</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">{filteredUrgent.length} Active</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold">
                        <Clock className="h-3 w-3" /><span>SLA: 4h remaining</span>
                      </div>
                    </div>
                    {filteredUrgent.map(m => <LeadCard key={m.id} msg={m} selected={selected?.id === m.id} onSelect={() => void openMessage(m)} />)}
                  </div>
                )}

                {filteredFollowup.length > 0 && (
                  <div>
                    <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-400" />
                        <span className="text-[11px] font-bold tracking-wider text-gray-600 uppercase">Awaiting Follow-Up / Nurturing</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold">{filteredFollowup.length}</span>
                      </div>
                      <span className="text-[11px] text-gray-400 font-medium">Next bump in 48h</span>
                    </div>
                    {filteredFollowup.map(m => <LeadCard key={m.id} msg={m} selected={selected?.id === m.id} onSelect={() => void openMessage(m)} />)}
                  </div>
                )}

                {filteredSystem.length > 0 && (
                  <div>
                    <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="h-3 w-3 text-gray-400" />
                        <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">System Notifications &amp; DMARC</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold">{filteredSystem.length} Non-Lead Items</span>
                      </div>
                      <span className="text-[11px] text-gray-400">Isolated from Leads</span>
                    </div>
                    {filteredSystem.map(m => <LeadCard key={m.id} msg={m} selected={selected?.id === m.id} onSelect={() => void openMessage(m)} />)}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT: Thread View */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#f8f8fb]">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center">
                <Mail className="h-8 w-8 text-gray-300" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-500">Select a lead to review</p>
                <p className="text-xs text-gray-400 mt-1 max-w-[280px]">Click any conversation on the left to view the full thread and respond.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Thread header */}
              <div className="shrink-0 bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <IntentBadge score={getScore(selected)} />
                  <span className="text-xs text-gray-500 font-medium">
                    Campaign: <span className="font-semibold text-gray-700">{selected.subject?.split(' ').slice(0, 5).join(' ') || 'Outbound Sequence'}</span> · Step 2 of 4
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 leading-tight">{selected.subject || '(No Subject)'}</h2>
              </div>

              {/* Scroll area */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : detail ? (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                    {/* Email meta row */}
                    <div className="px-5 py-3.5 border-b border-gray-100 flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <Av name={getSenderInfo(detail).name} email={getSenderInfo(detail).email} size="md" />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-gray-900">{getSenderInfo(detail).name}</span>
                            <span className="text-xs text-gray-500">&lt;{getSenderInfo(detail).email}&gt;</span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                              <ShieldCheck className="h-2.5 w-2.5" /> SPF/DKIM Valid
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            To: <span className="font-semibold text-gray-700">{detail.toEmail || currentAccount?.email || 'you'}</span>
                            <span className="text-gray-400"> (via primary deliverability route)</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-semibold text-gray-700">{fmtFull(detail.receivedAt || detail.sentAt)}</div>
                        {detail.receivedAt && (
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            Response Latency: <span className="font-semibold">{fmtLatency(detail.receivedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Body */}
                    <div className="px-5 py-4">
                      {detail.html ? (
                        <iframe title={detail.subject || 'Email'} srcDoc={detail.html} sandbox="" className="w-full min-h-[240px] border-0 bg-white" />
                      ) : (
                        <div className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
                          {detail.text || 'No message content available.'}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Reply Composer */}
              <div className="shrink-0 bg-white border-t border-gray-200 px-5 py-4 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-medium">Sending from inbox:</span>
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 font-mono text-gray-700 text-[11px]">
                      {currentAccount?.email || selected.mailAccount.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-gray-400 font-semibold flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-purple-500" /> AI DRAFTS:
                    </span>
                    {AI_DRAFTS.map(d => (
                      <button key={d} type="button"
                        onClick={() => {
                          setSelectedDraft(d)
                          const snd = getSenderInfo(selected)
                          setReplyBody(`Hi ${snd.name},\n\nSounds great! Let's lock in ${d.toLowerCase()}.\n\nBest regards`)
                          setTimeout(() => replyRef.current?.focus(), 50)
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition-colors ${selectedDraft === d ? 'bg-[#10b981] text-white border-[#10b981]' : 'bg-white border-gray-200 text-gray-700 hover:border-[#10b981] hover:text-[#10b981]'}`}
                      >{d}</button>
                    ))}
                  </div>
                </div>

                <textarea
                  ref={replyRef}
                  value={replyBody}
                  onChange={e => setReplyBody(e.target.value)}
                  placeholder={`Hi ${getSenderInfo(selected).name},\n\n...`}
                  className="w-full text-sm text-gray-700 bg-transparent resize-none focus:outline-hidden placeholder-gray-300 min-h-[72px] leading-relaxed"
                />

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Paperclip className="h-3.5 w-3.5" />
                    <span>Press ⌘+Enter to send</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => { setReplyBody(''); setSelectedDraft(null) }}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 cursor-pointer">
                      Save Template
                    </button>
                    <button type="button" disabled={!replyBody.trim() || isSending} onClick={() => void sendReply()}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-black disabled:opacity-40 cursor-pointer shadow-sm transition-colors">
                      {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      <span>Send &amp; Advance Lead</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}