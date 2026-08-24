'use client'

import { useEffect, useState } from 'react'
import { KeyRound, RefreshCw, Plus, Copy, Check, Terminal, Code, Layers } from 'lucide-react'
import {
  createApiKey,
  fetchApiKeys,
  fetchApiManagementOverview,
  fetchApiRequests,
  revokeApiKey,
} from '@/lib/apiManagementClient'
import type {
  ApiDispatchRequestRecord,
  ApiKeyRecord,
  ApiManagementOverview,
} from '@/components/api-management/types'

function formatDate(value: string | null) {
  if (!value) return 'Never'
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusBadge(status: ApiDispatchRequestRecord['status']) {
  if (status === 'SENT')
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0f8a5f]/10 text-[#0f8a5f] border border-[#0f8a5f]/20">SENT</span>
  if (status === 'FAILED' || status === 'REJECTED_NO_CAPACITY')
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ee382b]/10 text-[#ee382b] border border-[#ee382b]/20">{status}</span>
  if (status === 'PROCESSING')
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#b7791f]/10 text-[#b7791f] border border-[#b7791f]/20">PROCESSING</span>
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#121316]/06 text-[#121316] border border-[#121316]/08">{status}</span>
}

const SEND_EMAIL_CURL = `curl -X POST "$BASE_URL/api/v1/email/send" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "lead@example.com",
    "subject": "Quick intro",
    "html": "<p>Hello there</p>"
  }'`

const GET_REQUEST_CURL = `curl "$BASE_URL/api/v1/requests/REQUEST_ID" \\
  -H "Authorization: Bearer YOUR_API_KEY"`

export default function ApiManagementPage() {
  const [overview, setOverview] = useState<ApiManagementOverview | null>(null)
  const [keys, setKeys] = useState<ApiKeyRecord[]>([])
  const [requests, setRequests] = useState<ApiDispatchRequestRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [keyName, setKeyName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [lastCreatedKey, setLastCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null)
  async function copySnippet(text: string, id: string) {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = text
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setCopiedSnippet(id)
    setTimeout(() => {
      setCopiedSnippet((prev) => (prev === id ? null : prev))
    }, 2500)
  }

  async function loadAll() {
    setLoading(true)
    const [overviewResult, keysResult, requestsResult] = await Promise.all([
      fetchApiManagementOverview(),
      fetchApiKeys(),
      fetchApiRequests(),
    ])
    setOverview(overviewResult)
    setKeys(keysResult)
    setRequests(requestsResult)
    setLoading(false)
  }

  useEffect(() => {
    void loadAll()
  }, [])

  async function handleCreateKey(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!keyName.trim()) return
    setSubmitting(true)
    try {
      const response = await createApiKey({ name: keyName.trim() })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create API key')
      }
      setLastCreatedKey(data.plaintextKey || null)
      setKeyName('')
      await loadAll()
    } catch (error) {
      setLastCreatedKey(error instanceof Error ? error.message : 'Failed to create API key')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRevokeKey(id: string) {
    if (!confirm('Revoke this API key? Applications using it will immediately lose access.')) return
    const response = await revokeApiKey(id)
    if (response.ok) {
      await loadAll()
    }
  }

  async function copyLastKey() {
    if (!lastCreatedKey) return
    await navigator.clipboard.writeText(lastCreatedKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Card */}
      <header className="uneevo-card p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#121316] text-white shadow-xs">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block mb-1">
              DEVELOPER INTERFACES
            </span>
            <h1 className="zoho-puvi-headline text-2xl sm:text-3xl font-bold tracking-tight text-[#121316]">
              API Keys & Dispatch Gateway
            </h1>
            <p className="text-xs sm:text-sm text-[#62605c] mt-0.5">
              Programmatic access to pooled sender dispatch, sequence queues, and delivery audit logs.
            </p>
          </div>
        </div>

        <button
          className="inline-flex items-center gap-1.5 rounded-full border border-[#121316]/12 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#121316] transition-all hover:bg-[#faf8f4] hover:shadow-xs shrink-0"
          onClick={() => void loadAll()}
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Data</span>
        </button>
      </header>

      {lastCreatedKey ? (
        <div className="uneevo-card p-6 rounded-[24px] border border-[#0f8a5f]/20 bg-[#0f8a5f]/06 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <div className="text-xs font-bold uppercase tracking-wider text-[#0f8a5f] mb-1">
            New API Key Generated
          </div>
          <p className="text-xs text-[#62605c] mb-3">
            Copy and store this secret key in a secure location. It will never be displayed again.
          </p>
          <div className="flex flex-wrap gap-2.5 items-center">
            <code className="p-3 rounded-xl bg-white border border-[#0f8a5f]/20 font-mono text-xs text-[#121316] font-bold select-all flex-1 min-w-[280px]">
              {lastCreatedKey}
            </code>
            <button
              className="inline-flex items-center gap-1.5 rounded-full bg-[#121316] px-5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-black"
              onClick={() => void copyLastKey()}
            >
              {copied ? <Check className="h-3.5 w-3.5 text-[#0f8a5f]" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Key'}</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* 3 Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="uneevo-card p-6 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#62605c] mb-1">
            Eligible Senders
          </div>
          <div className="font-mono text-3xl font-bold text-[#121316] tabular-nums">
            {overview?.email.eligible ?? 0}
          </div>
          <div className="text-xs text-[#62605c] mt-2">
            <strong className="text-[#0f8a5f] font-bold">{overview?.email.warmed ?? 0} warmed</strong>, {overview?.email.remainingQuota ?? 0} daily quota left
          </div>
        </div>

        <div className="uneevo-card p-6 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#62605c] mb-1">
            Active Keys
          </div>
          <div className="font-mono text-3xl font-bold text-[#121316] tabular-nums">
            {keys.filter((key) => key.isActive).length}
          </div>
          <div className="text-xs text-[#62605c] mt-2">
            {keys.length} total API keys registered in workspace
          </div>
        </div>

        <div className="uneevo-card p-6 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#62605c] mb-1">
            Recent API Dispatches
          </div>
          <div className="font-mono text-3xl font-bold text-[#0f8a5f] tabular-nums">
            {requests.length}
          </div>
          <div className="text-xs text-[#62605c] mt-2">
            {requests.filter((r) => r.status === 'SENT').length} successfully dispatched
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(300px,420px)_minmax(0,1fr)]">
        {/* Keys Management Card */}
        <div className="uneevo-card p-6 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block mb-1">
            CREDENTIAL VAULT
          </span>
          <h2 className="zoho-puvi-headline text-lg font-bold text-[#121316] mb-4">
            Active Workspace Keys
          </h2>

          <form onSubmit={handleCreateKey} className="flex gap-2 mb-5">
            <input
              className="flex-1 h-10 px-4 rounded-xl border border-[#121316]/12 bg-white text-xs font-medium text-[#121316] focus:border-[#ee382b] focus:outline-hidden placeholder:text-[#8a8780]"
              value={keyName}
              onChange={(event) => setKeyName(event.target.value)}
              placeholder="e.g. Zapier Production Hook"
            />
            <button
              className="inline-flex items-center gap-1.5 rounded-full bg-[#ee382b] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#d92b1f] disabled:opacity-50 shrink-0"
              type="submit"
              disabled={submitting || !keyName.trim()}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{submitting ? 'Creating...' : 'Create'}</span>
            </button>
          </form>

          <div className="space-y-3">
            {loading ? (
              <div className="text-xs text-[#62605c] py-6 text-center">Loading API keys...</div>
            ) : keys.length === 0 ? (
              <div className="text-xs text-[#62605c] py-6 text-center">No API keys created yet.</div>
            ) : (
              keys.map((key) => (
                <div
                  key={key.id}
                  className="p-4 rounded-xl border border-[#121316]/08 bg-[#faf8f4] space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-[#121316]">{key.name}</span>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        key.isActive
                          ? 'bg-[#0f8a5f]/10 text-[#0f8a5f] border border-[#0f8a5f]/20'
                          : 'bg-[#ee382b]/10 text-[#ee382b] border border-[#ee382b]/20'
                      }`}
                    >
                      {key.isActive ? 'ACTIVE' : 'REVOKED'}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-[#8a8780]">{key.keyPrefix}...</div>
                  <div className="text-[11px] text-[#62605c] pt-1 border-t border-[#121316]/06">
                    Created {formatDate(key.createdAt)} • {key._count.apiDispatchRequests} dispatches
                  </div>
                  {key.isActive ? (
                    <button
                      className="mt-2 text-xs font-bold text-[#ee382b] hover:underline"
                      onClick={() => void handleRevokeKey(key.id)}
                    >
                      Revoke Key
                    </button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Integration Documentation Card */}
        <div className="uneevo-card p-6 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block mb-1">
            QUICKSTART ENDPOINTS
          </span>
          <h2 className="zoho-puvi-headline text-lg font-bold text-[#121316] mb-4">
            cURL Request Examples
          </h2>

          <div className="space-y-4">
            {/* POST /api/v1/email/send Example */}
            <div className="p-4 rounded-xl bg-[#121316] text-white space-y-2.5">
              <div className="flex items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2 text-[#8a8780]">
                  <Terminal className="h-3.5 w-3.5 text-[#ee382b]" />
                  <span className="text-white font-bold">POST /api/v1/email/send</span>
                </div>
                <button
                  type="button"
                  onClick={() => copySnippet(SEND_EMAIL_CURL, 'send-email')}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer"
                  title={copiedSnippet === 'send-email' ? 'Copied!' : 'Copy cURL command'}
                  aria-label={copiedSnippet === 'send-email' ? 'Copied!' : 'Copy cURL command'}
                >
                  {copiedSnippet === 'send-email' ? (
                    <Check className="h-4 w-4 text-[#0f8a5f]" />
                  ) : (
                    <Copy className="h-4 w-4 text-[#8a8780] hover:text-white transition-colors" />
                  )}
                </button>
              </div>
              <pre className="font-mono text-xs text-[#faf8f4] overflow-x-auto leading-relaxed whitespace-pre-wrap selection:bg-[#ee382b]/30">{SEND_EMAIL_CURL}</pre>
            </div>

            {/* GET /api/v1/requests/:id Example */}
            <div className="p-4 rounded-xl bg-[#121316] text-white space-y-2.5">
              <div className="flex items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2 text-[#8a8780]">
                  <Code className="h-3.5 w-3.5 text-[#ee382b]" />
                  <span className="text-white font-bold">GET /api/v1/requests/:id</span>
                </div>
                <button
                  type="button"
                  onClick={() => copySnippet(GET_REQUEST_CURL, 'get-request')}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer"
                  title={copiedSnippet === 'get-request' ? 'Copied!' : 'Copy cURL command'}
                  aria-label={copiedSnippet === 'get-request' ? 'Copied!' : 'Copy cURL command'}
                >
                  {copiedSnippet === 'get-request' ? (
                    <Check className="h-4 w-4 text-[#0f8a5f]" />
                  ) : (
                    <Copy className="h-4 w-4 text-[#8a8780] hover:text-white transition-colors" />
                  )}
                </button>
              </div>
              <pre className="font-mono text-xs text-[#faf8f4] overflow-x-auto leading-relaxed whitespace-pre-wrap selection:bg-[#ee382b]/30">{GET_REQUEST_CURL}</pre>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Dispatches Table */}
      <div className="uneevo-card overflow-hidden rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
        <div className="p-5 border-b border-[#121316]/08 bg-[#faf8f4] flex items-center justify-between">
          <div className="text-sm font-bold text-[#121316]">
            API Dispatch Stream ({requests.length})
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#121316]/08 text-[11px] font-bold uppercase tracking-wider text-[#62605c] bg-white">
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Channel</th>
                <th className="px-6 py-3.5">Recipient</th>
                <th className="px-6 py-3.5">API Key</th>
                <th className="px-6 py-3.5">Selected Mailbox</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#121316]/06 font-mono text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#62605c]">Loading dispatches...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#62605c]">No API dispatches recorded yet.</td>
                </tr>
              ) : (
                requests.map((request) => {
                  const sender =
                    request.channel === 'EMAIL'
                      ? request.selectedMailAccount?.email || 'Pending selection'
                      : request.selectedWhatsAppAccount?.phoneNumber || request.selectedWhatsAppAccount?.displayName || 'Pending selection'

                  return (
                    <tr key={request.id} className="transition-colors hover:bg-[#faf8f4]/60">
                      <td className="px-6 py-3.5 text-[#8a8780]">{formatDate(request.createdAt)}</td>
                      <td className="px-6 py-3.5 font-bold text-[#121316]">{request.channel}</td>
                      <td className="px-6 py-3.5 font-sans text-[#121316]">{request.requestedTo}</td>
                      <td className="px-6 py-3.5 text-[#62605c]">{request.apiKey.name}</td>
                      <td className="px-6 py-3.5 text-[#121316]">{sender}</td>
                      <td className="px-6 py-3.5">{statusBadge(request.status)}</td>
                      <td className="px-6 py-3.5 font-sans text-xs text-[#62605c] max-w-xs truncate">
                        {request.errorMessage || request.providerMessageId || request.subject || 'Queued'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
