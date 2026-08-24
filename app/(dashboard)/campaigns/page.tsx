'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  HardDrive,
  Mail,
  MessageCircle,
  Plus,
  Send,
  Users,
  Megaphone,
  Sparkles,
} from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PaginationControls } from '@/components/ui/pagination-controls'

interface Campaign {
  id: string
  name: string
  channel: 'EMAIL' | 'WHATSAPP' | 'GDRIVE'
  status: 'draft' | 'active' | 'paused' | 'completed' | 'failed'
  guardrailReason: string | null
  createdAt: string
  senderAccountPreference: 'random' | 'gmail' | 'zoho' | 'outlook'
  csvFile: { originalName: string; rowCount: number }
  mailAccounts: { mailAccount: { displayName: string } }[]
  whatsappAccounts: { whatsappAccount: { displayName: string } }[]
  senderPoolCount: number
  stats: {
    sent: number
    failed: number
    bounced: number
    replies: number
    remaining: number
    todaySent: number
    rampPercent: number
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(12)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/campaigns?page=${page}&limit=${limit}`)
      .then((r) => r.json())
      .then((data) => {
        setCampaigns(Array.isArray(data?.items) ? data.items : [])
        setTotal(data?.total || 0)
        setPages(data?.pages || 1)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [limit, page])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header Card */}
      <header className="uneevo-card p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#121316] text-white shadow-xs">
            <Megaphone className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block mb-1">
              WORKSPACE SEQUENCES
            </span>
            <h1 className="zoho-puvi-headline text-2xl sm:text-3xl font-bold tracking-tight text-[#121316]">
              Campaigns & Sequences
            </h1>
            <p className="text-xs sm:text-sm text-[#62605c] mt-0.5">
              Monitor delivery pacing, multi-step email cadences, and pooled sender momentum.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5 bg-[#121316]/06 border border-[#121316]/08 px-4 py-2 rounded-full">
            <span className="font-mono text-base font-bold tabular-nums text-[#121316]">
              {total}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#62605c]">
              Total
            </span>
          </div>
          <Link
            href="/campaigns/new?mode=gdrive"
            className="inline-flex items-center gap-2 rounded-full border border-[#121316]/12 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#121316] transition-all hover:bg-[#faf8f4] hover:shadow-xs"
          >
            <HardDrive className="h-4 w-4 text-[#62605c]" />
            <span>GDrive campaign</span>
          </Link>
          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-2 rounded-full bg-[#ee382b] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-[0_6px_20px_rgba(238,56,43,0.22)] transition-all hover:bg-[#d92b1f] hover:shadow-[0_10px_28px_rgba(238,56,43,0.32)]"
          >
            <Plus className="h-4 w-4" />
            <span>New campaign</span>
          </Link>
        </div>
      </header>

      {/* Main Content: Loading, Empty, or Populated Grid */}
      {loading ? (
        <div className="uneevo-card rounded-[28px] p-16 text-center text-[#62605c] font-medium shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          Loading campaigns...
        </div>
      ) : campaigns.length === 0 ? (
        <div className="uneevo-card rounded-[28px] border border-[#121316]/08 bg-white p-12 sm:p-16 text-center shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#121316] text-white shadow-xs mx-auto mb-4">
            <Megaphone className="h-7 w-7" />
          </div>
          <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block mb-1">
            GET STARTED
          </span>
          <h2 className="zoho-puvi-headline text-xl sm:text-2xl font-bold text-[#121316] mb-2">
            No Active Campaigns Yet
          </h2>
          <p className="text-xs sm:text-sm text-[#62605c] max-w-md mx-auto mb-8">
            Create your first sequence with automated step cadences, multi-mailbox rotation, and verified prospect lists.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/campaigns/new"
              className="inline-flex items-center gap-2 rounded-full bg-[#ee382b] px-7 py-3 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(238,56,43,0.22)] transition-all hover:bg-[#d92b1f] hover:shadow-[0_10px_28px_rgba(238,56,43,0.32)]"
            >
              <Plus className="h-4 w-4" />
              <span>Create campaign</span>
            </Link>
            <Link
              href="/campaigns/new?mode=gdrive"
              className="inline-flex items-center gap-2 rounded-full border border-[#121316]/12 bg-white px-6 py-3 text-sm font-semibold text-[#121316] transition-all hover:bg-[#faf8f4] hover:shadow-xs"
            >
              <HardDrive className="h-4 w-4 text-[#62605c]" />
              <span>Create GDrive campaign</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {campaigns.map((camp) => {
              const rowCount = camp.csvFile.rowCount
              const sent = camp.stats.sent
              const senderCount = camp.senderPoolCount
              const progress =
                rowCount > 0 ? Math.min(100, Math.round((sent / rowCount) * 100)) : 0

              return (
                <Link
                  href={`/campaigns/${camp.id}`}
                  key={camp.id}
                  className="group block"
                >
                  <div className="uneevo-card h-full flex flex-col justify-between rounded-[24px] border border-[#121316]/08 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] shadow-xs ${
                              camp.channel === 'WHATSAPP'
                                ? 'bg-[#0f8a5f]/15 text-[#0f8a5f]'
                                : camp.channel === 'GDRIVE'
                                ? 'bg-[#fde9b0] text-[#5c4211]'
                                : 'bg-[#121316] text-white'
                            }`}
                          >
                            {camp.channel === 'WHATSAPP' ? (
                              <MessageCircle className="h-5 w-5" />
                            ) : camp.channel === 'GDRIVE' ? (
                              <HardDrive className="h-5 w-5" />
                            ) : (
                              <Mail className="h-5 w-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="zoho-puvi-headline text-base font-bold text-[#121316] truncate">
                              {camp.name}
                            </div>
                            <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#62605c] mt-0.5">
                              {camp.channel}
                            </div>
                          </div>
                        </div>
                        <StatusBadge status={camp.status} />
                      </div>

                      {/* Meta Information */}
                      <div className="space-y-2 py-3 border-y border-[#121316]/06 text-xs text-[#62605c]">
                        <div className="flex items-center gap-2">
                          <Send className="h-3.5 w-3.5 text-[#8a8780] shrink-0" />
                          <span className="truncate">{camp.csvFile.originalName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-[#8a8780] shrink-0" />
                          <span>
                            {senderCount}{' '}
                            {camp.channel === 'GDRIVE' ? 'Drive account' : 'pooled sender'}
                            {senderCount !== 1 ? 's' : ''}
                            {camp.channel === 'EMAIL'
                              ? ` · ${camp.senderAccountPreference}`
                              : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-3.5 w-3.5 text-[#8a8780] shrink-0" />
                          <span>Created {formatDate(camp.createdAt)}</span>
                        </div>
                      </div>

                      {camp.guardrailReason && (
                        <div className="mt-3 rounded-xl border border-[#b7791f]/20 bg-[#fde9b0]/30 p-2.5 text-xs text-[#5c4211] font-medium leading-relaxed">
                          {camp.guardrailReason}
                        </div>
                      )}
                    </div>

                    {/* Metric Stats & Progress */}
                    <div className="mt-4 pt-2">
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="rounded-xl bg-[#faf8f4] border border-[#121316]/06 p-2.5 text-center">
                          <div className="text-[10px] font-mono font-bold uppercase text-[#62605c]">
                            Sent
                          </div>
                          <div className="font-mono font-bold text-sm text-[#121316] tabular-nums mt-0.5">
                            {camp.stats.sent}
                          </div>
                        </div>
                        <div className="rounded-xl bg-[#faf8f4] border border-[#121316]/06 p-2.5 text-center">
                          <div className="text-[10px] font-mono font-bold uppercase text-[#62605c]">
                            Remaining
                          </div>
                          <div className="font-mono font-bold text-sm text-[#62605c] tabular-nums mt-0.5">
                            {camp.stats.remaining}
                          </div>
                        </div>
                        <div className="rounded-xl bg-[#0f8a5f]/08 border border-[#0f8a5f]/15 p-2.5 text-center">
                          <div className="text-[10px] font-mono font-bold uppercase text-[#0f8a5f]">
                            Replies
                          </div>
                          <div className="font-mono font-bold text-sm text-[#0f8a5f] tabular-nums mt-0.5">
                            {camp.stats.replies}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
                        <span className="text-[#62605c]">
                          {sent.toLocaleString()} / {rowCount.toLocaleString()} sent
                        </span>
                        <span className="font-mono font-bold text-[#121316]">{progress}%</span>
                      </div>

                      <div className="h-2 rounded-full bg-[#121316]/08 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#121316] transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center mt-3.5 pt-2 text-xs font-semibold">
                        <span className="text-[#62605c]">
                          {camp.stats.rampPercent}% sending ramp
                        </span>
                        <span className="inline-flex items-center gap-1 text-[#ee382b] group-hover:translate-x-1 transition-transform">
                          <span>Open sequence</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          <PaginationControls
            page={page}
            pages={pages}
            total={total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(value) => {
              setLimit(value)
              setPage(1)
            }}
            label="campaigns"
          />
        </div>
      )}
    </div>
  )
}
