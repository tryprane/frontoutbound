'use client'

import { useEffect, useMemo, useState } from 'react'
import { Send, Mail, Users, CheckCircle2, AlertCircle } from 'lucide-react'

type SenderAccount = {
  id: string
  email: string
  displayName: string
  dailyLimit: number
  sentToday: number
  isActive: boolean
  warmupStatus: 'COLD' | 'WARMING' | 'WARMED' | 'PAUSED'
  mailboxSyncStatus: 'idle' | 'syncing' | 'error'
}

type SenderResponse = {
  items: SenderAccount[]
}

function parseRecipients(input: string) {
  return Array.from(
    new Set(
      input
        .split(/[\n,;]+/)
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
    )
  )
}

export default function SendMailPage() {
  const [accounts, setAccounts] = useState<SenderAccount[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [form, setForm] = useState({
    mailAccountId: '',
    recipients: '',
    subject: '',
    body: '',
    sendFormat: 'html',
    openTrackingEnabled: true,
  })

  useEffect(() => {
    let cancelled = false

    async function loadAccounts() {
      setLoadingAccounts(true)
      try {
        const response = await fetch('/api/mail-accounts?resource=sent-filter-options&page=1&limit=200')
        const data = (await response.json()) as SenderResponse
        if (cancelled) return
        const available = Array.isArray(data?.items) ? data.items : []
        setAccounts(available)
        setForm((current) => ({
          ...current,
          mailAccountId: current.mailAccountId || available[0]?.id || '',
        }))
      } catch {
        if (!cancelled) {
          setAccounts([])
          setToast({ type: 'error', message: 'Failed to load sender accounts.' })
        }
      } finally {
        if (!cancelled) setLoadingAccounts(false)
      }
    }

    void loadAccounts()
    return () => {
      cancelled = true
    }
  }, [])

  const parsedRecipients = useMemo(() => parseRecipients(form.recipients), [form.recipients])
  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === form.mailAccountId) || null,
    [accounts, form.mailAccountId]
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setToast(null)

    if (!form.mailAccountId) {
      setToast({ type: 'error', message: 'Choose a sender account first.' })
      return
    }

    if (parsedRecipients.length === 0) {
      setToast({ type: 'error', message: 'Add at least one recipient email.' })
      return
    }

    if (!form.subject.trim() || !form.body.trim()) {
      setToast({ type: 'error', message: 'Subject and body are required.' })
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/send-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mailAccountId: form.mailAccountId,
          recipients: parsedRecipients,
          subject: form.subject.trim(),
          body: form.body,
          sendFormat: form.sendFormat,
          openTrackingEnabled: form.sendFormat === 'text_only' ? false : form.openTrackingEnabled,
        }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setToast({ type: 'error', message: data.error || 'Failed to queue manual mail send.' })
        return
      }

      setToast({
        type: 'success',
        message: `Queued ${data.queuedCount || parsedRecipients.length} email${
          parsedRecipients.length === 1 ? '' : 's'
        } from ${data.sender?.email || 'the selected sender'}.`,
      })
      setForm((current) => ({
        ...current,
        recipients: '',
        subject: '',
        body: '',
      }))
    } catch {
      setToast({ type: 'error', message: 'Failed to queue manual mail send.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header Card */}
      <header className="uneevo-card p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#121316] text-white shadow-xs">
            <Send className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block mb-1">
              AD-HOC DISPATCH
            </span>
            <h1 className="zoho-puvi-headline text-2xl sm:text-3xl font-bold tracking-tight text-[#121316]">
              Direct Mail Composer
            </h1>
            <p className="text-xs sm:text-sm text-[#62605c] mt-0.5">
              Send one-off messages or tests through any connected mailbox with verified deliverability.
            </p>
          </div>
        </div>
      </header>

      {toast ? (
        <div
          role="status"
          className={`flex items-center gap-2.5 rounded-[18px] border p-4 text-xs font-semibold shadow-xs ${
            toast.type === 'success'
              ? 'border-[#0f8a5f]/20 bg-[#0f8a5f]/10 text-[#0f8a5f]'
              : 'border-[#ee382b]/20 bg-[#ee382b]/10 text-[#ee382b]'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{toast.message}</span>
        </div>
      ) : null}

      {/* Composer Card */}
      <div className="uneevo-card p-6 md:p-8 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Sender Account */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#62605c]">
                Sender Mailbox
              </label>
              <select
                className="w-full h-11 px-4 rounded-xl border border-[#121316]/12 bg-white text-xs sm:text-sm font-medium text-[#121316] focus:border-[#ee382b] focus:outline-hidden transition-colors"
                value={form.mailAccountId}
                onChange={(event) => setForm((current) => ({ ...current, mailAccountId: event.target.value }))}
                disabled={loadingAccounts || accounts.length === 0}
              >
                <option value="">{loadingAccounts ? 'Loading senders...' : 'Select sender account'}</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.email} ({account.sentToday}/{account.dailyLimit} today)
                  </option>
                ))}
              </select>
              {selectedAccount ? (
                <div className="text-xs text-[#62605c] font-medium flex items-center gap-2">
                  <span className="font-semibold text-[#121316]">{selectedAccount.displayName}</span>
                  <span>•</span>
                  <span className="text-[#0f8a5f] font-bold">{selectedAccount.warmupStatus}</span>
                </div>
              ) : null}
            </div>

            {/* Recipient Counter */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#62605c]">
                Target Recipients
              </label>
              <div className="h-11 px-4 rounded-xl border border-[#121316]/12 bg-[#faf8f4] flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-[#121316]">
                  {parsedRecipients.length} recipient{parsedRecipients.length === 1 ? '' : 's'}
                </span>
                <Users className="h-4 w-4 text-[#8a8780]" />
              </div>
              <p className="text-xs text-[#62605c]">
                Separate multiple emails with commas or newlines.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Delivery Format */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#62605c]">
                Delivery Format
              </label>
              <select
                className="w-full h-11 px-4 rounded-xl border border-[#121316]/12 bg-white text-xs sm:text-sm font-medium text-[#121316] focus:border-[#ee382b] focus:outline-hidden transition-colors"
                value={form.sendFormat}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sendFormat: event.target.value,
                    openTrackingEnabled: event.target.value === 'text_only' ? false : current.openTrackingEnabled,
                  }))
                }
              >
                <option value="html">HTML Format (Rich text with open pixel tracking)</option>
                <option value="text_only">Plain Text (Clean ASCII, strictly no tracking)</option>
              </select>
            </div>

            {/* Open Tracking */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#62605c]">
                Open Tracking
              </label>
              <label className="h-11 px-4 rounded-xl border border-[#121316]/12 bg-[#faf8f4] flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.openTrackingEnabled}
                  disabled={form.sendFormat === 'text_only'}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, openTrackingEnabled: event.target.checked }))
                  }
                  className="rounded border-[#121316]/20 text-[#ee382b] focus:ring-[#ee382b]"
                />
                <span className="text-xs font-semibold text-[#121316]">
                  Track email opens {form.sendFormat === 'text_only' && '(Disabled in plain text)'}
                </span>
              </label>
            </div>
          </div>

          {/* Recipients List */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#62605c]">
              Prospect Email List
            </label>
            <textarea
              className="w-full p-4 rounded-xl border border-[#121316]/12 bg-white text-xs sm:text-sm font-mono text-[#121316] focus:border-[#ee382b] focus:outline-hidden transition-colors placeholder:text-[#8a8780]"
              value={form.recipients}
              onChange={(event) => setForm((current) => ({ ...current, recipients: event.target.value }))}
              placeholder={'prospect1@example.com\nprospect2@example.com'}
              rows={4}
            />
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#62605c]">
              Subject Line
            </label>
            <input
              className="w-full h-11 px-4 rounded-xl border border-[#121316]/12 bg-white text-xs sm:text-sm font-semibold text-[#121316] focus:border-[#ee382b] focus:outline-hidden transition-colors placeholder:text-[#8a8780]"
              value={form.subject}
              onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
              placeholder="Quick question regarding your growth strategy"
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#62605c]">
              Email Body
            </label>
            <textarea
              className="w-full p-4 rounded-xl border border-[#121316]/12 bg-white text-xs sm:text-sm text-[#121316] focus:border-[#ee382b] focus:outline-hidden transition-colors placeholder:text-[#8a8780] leading-relaxed"
              value={form.body}
              onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
              placeholder={'Hi there,\n\nWanted to share a quick update regarding our outreach infrastructure.\n\nBest,\nTeam'}
              rows={8}
            />
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#121316]/08">
            <p className="text-xs text-[#62605c]">
              Direct sends are processed through our standard worker queue and recorded in Sent logs.
            </p>
            <button
              type="submit"
              disabled={saving || loadingAccounts || accounts.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ee382b] px-7 py-3 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(238,56,43,0.22)] transition-all hover:bg-[#d92b1f] hover:shadow-[0_10px_28px_rgba(238,56,43,0.32)] disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>{saving ? 'Queueing Send...' : 'Dispatch Email'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
