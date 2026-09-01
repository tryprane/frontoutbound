'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  XCircle,
} from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'

type Channel = 'EMAIL' | 'WHATSAPP'

interface CampaignMeta {
  name: string
  channel: Channel
}

interface EmailLog {
  id: string
  toEmail: string
  subject: string
  status: 'sent' | 'failed' | 'bounced'
  sentAt: string
  errorMessage: string | null
  mailAccount: { id: string; email: string; displayName: string }
}

interface WhatsAppLog {
  id: string
  toPhone: string
  message: string
  status: 'sent' | 'failed'
  sentAt: string
  errorMessage: string | null
  whatsappAccount: { id: string; displayName: string; phoneNumber: string | null }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function CampaignLogsPage({ params }: { params?: { id?: string } }) {
  const routeParams = useParams<{ id?: string }>()
  const campaignId = String(routeParams?.id ?? params?.id ?? '')
  const [campaign, setCampaign] = useState<CampaignMeta>({ name: 'Loading...', channel: 'EMAIL' })
  const [logs, setLogs] = useState<Array<EmailLog | WhatsAppLog>>([])
  const [counts, setCounts] = useState({ sent: 0, failed: 0, bounced: 0 })
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', page: 1 })

  useEffect(() => {
    if (!campaignId) return
    fetch(`/api/campaigns/${encodeURIComponent(campaignId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.name) {
          setCampaign({
            name: data.name,
            channel: data.channel === 'WHATSAPP' ? 'WHATSAPP' : 'EMAIL',
          })
        } else {
          setCampaign({ name: 'Unknown Campaign', channel: 'EMAIL' })
        }
      })
      .catch(() => setCampaign({ name: 'Unknown Campaign', channel: 'EMAIL' }))
  }, [campaignId])

  useEffect(() => {
    if (!campaignId) return
    setLoading(true)
    const urlParams = new URLSearchParams()
    urlParams.append('campaignId', campaignId)
    urlParams.append('channel', campaign.channel === 'WHATSAPP' ? 'whatsapp' : 'email')
    if (filters.status) urlParams.append('status', filters.status)
    urlParams.append('page', String(filters.page))

    fetch(`/api/sent?${urlParams.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setLogs(Array.isArray(data.logs) ? data.logs : [])
        setCounts(data.counts || { sent: 0, failed: 0, bounced: 0 })
        setTotal(data.total || 0)
        setPages(data.pages || 1)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [filters, campaignId, campaign.channel])

  const handleExport = () => {
    const urlParams = new URLSearchParams()
    urlParams.append('campaignId', campaignId)
    urlParams.append('channel', campaign.channel === 'WHATSAPP' ? 'whatsapp' : 'email')
    if (filters.status) urlParams.append('status', filters.status)
    urlParams.append('export', 'csv')
    window.open(`/api/sent?${urlParams.toString()}`)
  }

  const isWhatsApp = campaign.channel === 'WHATSAPP'

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Top Floating Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5">
          <Link
            href={`/campaigns/${campaignId}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#121316]/10 bg-white/90 backdrop-blur-md px-4 py-2 text-xs font-semibold text-[#121316] shadow-sm transition-all hover:bg-white hover:shadow-md active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Campaign</span>
          </Link>
          <span className="text-xs font-bold text-[#121316] truncate max-w-xs sm:max-w-md">
            {campaign.name} • Audit Logs
          </span>
        </div>

        <div className="flex items-center gap-2.5 ml-auto">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-full bg-[#121316] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-black transition-all cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="uneevo-card p-5 rounded-[20px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#8a8780] mb-1">
            Total Dispatched
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-[#121316] tabular-nums">
            {total.toLocaleString()}
          </div>
        </div>

        <div className="uneevo-card p-5 rounded-[20px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#0f8a5f] mb-1">
            Delivered
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-[#0f8a5f] tabular-nums">
            {counts.sent.toLocaleString()}
          </div>
        </div>

        <div className="uneevo-card p-5 rounded-[20px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#c2414c] mb-1">
            Failed
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-[#c2414c] tabular-nums">
            {counts.failed.toLocaleString()}
          </div>
        </div>

        <div className="uneevo-card p-5 rounded-[20px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#b7791f] mb-1">
            Bounced
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-[#b7791f] tabular-nums">
            {counts.bounced.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div className="uneevo-card p-4 rounded-[18px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-[#8a8780]" />
          <span className="text-xs font-bold text-[#121316]">Filter by Status:</span>
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
            className="rounded-[10px] border border-[#121316]/12 bg-[#faf8f4] px-3 py-1.5 text-xs text-[#121316] font-medium"
          >
            <option value="">All Statuses</option>
            <option value="sent">Delivered / Sent</option>
            <option value="failed">Failed</option>
            {!isWhatsApp && <option value="bounced">Bounced</option>}
          </select>
        </div>

        <div className="text-xs text-[#62605c] font-mono">
          Page {filters.page} of {pages}
        </div>
      </div>

      {/* Data Table Card */}
      <div className="uneevo-card rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#faf8f4] border-b border-[#121316]/08">
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8a8780]">
                  {isWhatsApp ? 'Recipient Phone' : 'Recipient Email'}
                </th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8a8780]">
                  {isWhatsApp ? 'Message Note' : 'Subject Line'}
                </th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8a8780]">
                  Sender
                </th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8a8780]">
                  Dispatch Date
                </th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8a8780]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#121316]/06 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-[#8a8780]">
                    Loading delivery audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-[#8a8780]">
                    No delivery audit logs recorded matching this filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const recipient = isWhatsApp ? (log as WhatsAppLog).toPhone : (log as EmailLog).toEmail
                  const content = isWhatsApp ? (log as WhatsAppLog).message : (log as EmailLog).subject
                  const sender = isWhatsApp
                    ? (log as WhatsAppLog).whatsappAccount.phoneNumber || (log as WhatsAppLog).whatsappAccount.displayName
                    : (log as EmailLog).mailAccount.email
                  return (
                    <tr key={log.id} className="hover:bg-[#faf8f4]/60 transition-colors">
                      <td className="px-5 py-4 font-bold text-[#121316]">{recipient}</td>
                      <td className="px-5 py-4 text-[#62605c] max-w-xs truncate">{content}</td>
                      <td className="px-5 py-4 text-[#62605c] font-mono text-[11px]">{sender}</td>
                      <td className="px-5 py-4 text-[#8a8780] font-mono text-[11px]">{formatDate(log.sentAt)}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={log.status} />
                        {log.errorMessage && (
                          <div className="text-[11px] text-[#c2414c] mt-1">{log.errorMessage}</div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 bg-[#faf8f4] border-t border-[#121316]/08">
            <div className="text-xs text-[#62605c] font-mono">
              Showing page {filters.page} of {pages}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={filters.page === 1}
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                className="px-3.5 py-1.5 rounded-full border border-[#121316]/12 bg-white text-xs font-bold text-[#121316] hover:bg-[#faf8f4] disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={filters.page >= pages}
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                className="px-3.5 py-1.5 rounded-full border border-[#121316]/12 bg-white text-xs font-bold text-[#121316] hover:bg-[#faf8f4] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

