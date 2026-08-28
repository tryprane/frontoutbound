'use client'

import { useEffect, useMemo, useState } from 'react'
import { Send, Users, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

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
      setToast({ type: 'error', message: 'Add at least one recipient email in the prospect list.' })
      return
    }

    if (!form.subject.trim() || !form.body.trim()) {
      setToast({ type: 'error', message: 'Subject and email body are required.' })
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
        setToast({ type: 'error', message: data.error || 'Failed to queue direct mail send.' })
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
      setToast({ type: 'error', message: 'Failed to queue direct mail send.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center items-center py-6 sm:py-10 px-2 sm:px-4 animate-fade-in">
      <div className="w-full max-w-6xl space-y-4">
        {/* Toast Feedback */}
        {toast ? (
          <div
            role="status"
            className={`flex items-center gap-2.5 rounded-[18px] border p-4 text-xs font-semibold shadow-xs ${
              toast.type === 'success'
                ? 'border-[#0f8a5f]/20 bg-[#0f8a5f]/10 text-[#0f8a5f]'
                : 'border-[#ee382b]/20 bg-[#ee382b]/10 text-[#ee382b]'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        ) : null}

        {/* Main Composer Container */}
        <main className="w-full bg-white rounded-2xl shadow-lg flex flex-col md:flex-row overflow-hidden border border-[#121316]/12">
          {/* Settings Sidebar */}
          <aside className="w-full md:w-1/3 bg-[#faf8f4] p-6 md:p-8 flex flex-col gap-5 border-b md:border-b-0 md:border-r border-[#121316]/10">
            {/* Header Area */}
            <div className="flex items-center gap-2 mb-1">
              <div className="bg-white px-4 py-2 rounded-full border border-[#121316]/10 shadow-2xs flex items-center gap-2 text-xs font-semibold text-[#121316]">
                <Send className="h-3.5 w-3.5 text-[#ee382b]" />
                <span>Direct Mail Composer</span>
              </div>
            </div>

            {/* Sender Mailbox */}
            <div>
              <label className="block text-[11px] font-bold text-[#62605c] tracking-wider mb-2 uppercase" htmlFor="sender-mailbox">
                Sender Mailbox
              </label>
              <select
                id="sender-mailbox"
                value={form.mailAccountId}
                onChange={(e) => setForm((current) => ({ ...current, mailAccountId: e.target.value }))}
                disabled={loadingAccounts || accounts.length === 0}
                className="mt-1 block w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#121316]/12 focus:outline-none focus:ring-2 focus:ring-[#ee382b]/20 focus:border-[#ee382b] rounded-xl bg-white shadow-2xs text-[#121316] font-medium transition-all"
              >
                <option value="">{loadingAccounts ? 'Loading sender accounts...' : 'Select sender account'}</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.email} ({account.sentToday}/{account.dailyLimit} today)
                  </option>
                ))}
              </select>
              {selectedAccount && (
                <div className="text-[11px] text-[#62605c] font-medium mt-1.5 flex items-center gap-2">
                  <span className="font-semibold text-[#121316]">{selectedAccount.displayName}</span>
                  <span>•</span>
                  <span className="text-[#0f8a5f] font-bold">{selectedAccount.warmupStatus}</span>
                </div>
              )}
            </div>

            {/* Target Recipients */}
            <div>
              <label className="block text-[11px] font-bold text-[#62605c] tracking-wider mb-2 uppercase" htmlFor="target-recipients">
                Target Recipients
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <input
                  id="target-recipients"
                  name="target-recipients"
                  readOnly
                  type="text"
                  value={`${parsedRecipients.length} recipient${parsedRecipients.length === 1 ? '' : 's'}`}
                  className="block w-full pr-10 text-xs sm:text-sm border border-[#121316]/12 rounded-xl py-2.5 px-3.5 bg-white font-mono font-semibold text-[#121316]"
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#8a8780]">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-1.5 text-[11px] text-[#8a8780]">Separate multiple emails with commas or newlines.</p>
            </div>

            {/* Delivery Format */}
            <div>
              <label className="block text-[11px] font-bold text-[#62605c] tracking-wider mb-2 uppercase" htmlFor="delivery-format">
                Delivery Format
              </label>
              <select
                id="delivery-format"
                value={form.sendFormat}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    sendFormat: e.target.value,
                    openTrackingEnabled: e.target.value === 'text_only' ? false : current.openTrackingEnabled,
                  }))
                }
                className="mt-1 block w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#121316]/12 focus:outline-none focus:ring-2 focus:ring-[#ee382b]/20 focus:border-[#ee382b] rounded-xl bg-white shadow-2xs text-[#121316] font-medium transition-all cursor-pointer"
              >
                <option value="html">HTML Format (Rich text with open pixel tracking)</option>
                <option value="text_only">Plain Text (Clean ASCII, strictly no tracking)</option>
              </select>
            </div>

            {/* Open Tracking */}
            <div>
              <label className="block text-[11px] font-bold text-[#62605c] tracking-wider mb-2 uppercase">
                Open Tracking
              </label>
              <div className="flex items-center px-4 py-2.5 bg-white border border-[#121316]/12 rounded-xl shadow-2xs">
                <input
                  id="track-opens"
                  name="track-opens"
                  type="checkbox"
                  checked={form.openTrackingEnabled}
                  disabled={form.sendFormat === 'text_only'}
                  onChange={(e) => setForm((current) => ({ ...current, openTrackingEnabled: e.target.checked }))}
                  className="h-4 w-4 text-[#ee382b] focus:ring-[#ee382b] border-[#121316]/20 rounded cursor-pointer"
                />
                <label htmlFor="track-opens" className="ml-2.5 block text-xs font-semibold text-[#121316] cursor-pointer">
                  Track email opens {form.sendFormat === 'text_only' && '(Disabled in plain text)'}
                </label>
              </div>
            </div>

            {/* Prospect Email List */}
            <div className="flex-grow flex flex-col">
              <label className="block text-[11px] font-bold text-[#62605c] tracking-wider mb-2 uppercase" htmlFor="prospect-list">
                Prospect Email List
              </label>
              <textarea
                id="prospect-list"
                name="prospect-list"
                rows={6}
                value={form.recipients}
                onChange={(e) => setForm((current) => ({ ...current, recipients: e.target.value }))}
                placeholder={'prospect1@example.com\nprospect2@example.com'}
                className="mt-1 block w-full text-xs font-mono text-[#121316] p-3.5 flex-grow resize-none border border-[#121316]/12 rounded-xl bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#ee382b]/20 focus:border-[#ee382b] transition-all placeholder:text-[#8a8780]"
              />
            </div>
          </aside>

          {/* Content Area */}
          <section className="w-full md:w-2/3 bg-white p-6 md:p-8 flex flex-col justify-between relative min-h-[560px]">
            <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
              {/* Subject Line */}
              <div className="mb-6">
                <label className="block text-[11px] font-bold text-[#62605c] tracking-wider mb-2 uppercase" htmlFor="subject-line">
                  Subject Line
                </label>
                <input
                  id="subject-line"
                  name="subject-line"
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm((current) => ({ ...current, subject: e.target.value }))}
                  placeholder="Quick question regarding your growth strategy"
                  className="block w-full text-sm font-semibold border border-[#121316]/12 rounded-xl py-3 px-4 text-[#121316] placeholder:text-[#8a8780] focus:outline-none focus:ring-2 focus:ring-[#ee382b]/20 focus:border-[#ee382b] shadow-2xs transition-all"
                />
              </div>

              {/* Email Body */}
              <div className="flex-grow flex flex-col mb-24">
                <label className="block text-[11px] font-bold text-[#62605c] tracking-wider mb-2 uppercase" htmlFor="email-body">
                  Email Body
                </label>
                <textarea
                  id="email-body"
                  name="email-body"
                  rows={12}
                  value={form.body}
                  onChange={(e) => setForm((current) => ({ ...current, body: e.target.value }))}
                  placeholder={`Hi there,\n\nWanted to share a quick update regarding our outreach infrastructure.\n\nBest,\nTeam`}
                  className="mt-1 block w-full text-xs sm:text-sm border border-[#121316]/12 rounded-xl p-4 text-[#121316] flex-grow resize-none placeholder:text-[#8a8780] focus:outline-none focus:ring-2 focus:ring-[#ee382b]/20 focus:border-[#ee382b] shadow-2xs transition-all leading-relaxed"
                />
              </div>

              {/* Footer Action Area */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-white border-t border-[#121316]/08 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-[#62605c]">
                  Direct sends are processed through our standard worker queue and recorded in Sent logs.
                </p>
                <button
                  type="submit"
                  disabled={saving || loadingAccounts || accounts.length === 0}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white bg-[#ee382b] hover:bg-[#d92b1f] shadow-sm hover:shadow-[0_6px_20px_rgba(238,56,43,0.25)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ee382b] transition-all disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Queueing Send...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Dispatch Email</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </main>
      </div>
    </div>
  )
}
