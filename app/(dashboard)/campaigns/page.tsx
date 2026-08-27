'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  HardDrive,
  Mail,
  MessageCircle,
  Plus,
  Send,
  Users,
  Megaphone,
  Search,
  RefreshCw,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Layers,
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
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(12)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)

  // Client-side quick filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChannel, setSelectedChannel] = useState<'ALL' | 'EMAIL' | 'GDRIVE' | 'WHATSAPP'>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')

  const fetchCampaigns = (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    else setLoading(true)

    fetch(`/api/campaigns?page=${page}&limit=${limit}`)
      .then((r) => r.json())
      .then((data) => {
        setCampaigns(Array.isArray(data?.items) ? data.items : [])
        setTotal(data?.total || 0)
        setPages(data?.pages || 1)
        setLoading(false)
        setRefreshing(false)
      })
      .catch(() => {
        setLoading(false)
        setRefreshing(false)
      })
  }

  useEffect(() => {
    fetchCampaigns()
  }, [limit, page])

  // Filtered campaigns based on channel, status, search
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((camp) => {
      // Channel match
      if (selectedChannel !== 'ALL' && camp.channel !== selectedChannel) return false
      // Status match
      if (selectedStatus !== 'ALL' && camp.status !== selectedStatus) return false
      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = camp.name.toLowerCase().includes(q)
        const matchCsv = camp.csvFile?.originalName?.toLowerCase().includes(q)
        const matchChannel = camp.channel.toLowerCase().includes(q)
        if (!matchName && !matchCsv && !matchChannel) return false
      }
      return true
    })
  }, [campaigns, selectedChannel, selectedStatus, searchQuery])

  // Aggregate stats
  const activeCount = campaigns.filter((c) => c.status === 'active').length
  const pausedCount = campaigns.filter((c) => c.status === 'paused').length
  const completedCount = campaigns.filter((c) => c.status === 'completed').length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header Card */}
      <header className="uneevo-card p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#121316] text-white shadow-xs">
            <Megaphone className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block">
                WORKSPACE SEQUENCES
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0f8a5f] bg-[#0f8a5f]/10 px-2.5 py-0.5 rounded-full border border-[#0f8a5f]/20">
                <Flame className="h-3 w-3" />
                {activeCount} Active
              </span>
            </div>
            <h1 className="zoho-puvi-headline text-2xl sm:text-3xl font-bold tracking-tight text-[#121316]">
              Campaigns & Outbound Cadences
            </h1>
            <p className="text-xs sm:text-sm text-[#62605c] mt-0.5">
              Monitor multi-step sequences, automated delivery pacing, and pooled mailbox rotation.
            </p>
          </div>
        </div>

        {/* Action Controls & KPI Pill */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fetchCampaigns(true)}
            disabled={refreshing || loading}
            title="Refresh Campaigns"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#121316]/12 bg-white text-[#121316] transition-all hover:bg-[#faf8f4] hover:shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-[#ee382b]' : ''}`} />
          </button>

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

      {/* Filter & Search Bar */}
      <div className="uneevo-card p-4 sm:p-5 rounded-[20px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Channel Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(
            [
              { id: 'ALL', label: 'All Channels', icon: Layers },
              { id: 'EMAIL', label: 'Email Pool', icon: Mail },
              { id: 'GDRIVE', label: 'GDrive Share', icon: HardDrive },
              { id: 'WHATSAPP', label: 'WhatsApp', icon: MessageCircle },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon
            const isSelected = selectedChannel === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedChannel(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#121316] text-white shadow-xs'
                    : 'text-[#62605c] hover:text-[#121316] hover:bg-[#121316]/06'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Right: Search & Status Pill Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status filter dropdown / pills */}
          <div className="flex items-center gap-1 bg-[#121316]/06 p-1 rounded-full text-xs">
            {['ALL', 'active', 'paused', 'completed'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1 rounded-full font-semibold capitalize transition-all ${
                  selectedStatus === st
                    ? 'bg-white text-[#121316] shadow-2xs'
                    : 'text-[#62605c] hover:text-[#121316]'
                }`}
              >
                {st === 'ALL' ? 'All Status' : st}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8a8780]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search campaigns or CSVs..."
              className="w-full pl-9 pr-3 py-1.5 rounded-full border border-[#121316]/12 bg-[#faf8f4] text-xs text-[#121316] placeholder:text-[#8a8780] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#121316]/15"
            />
          </div>
        </div>
      </div>

      {/* Main Content: Loading, Empty, or Populated Grid */}
      {loading ? (
        <div className="uneevo-card rounded-[28px] p-16 text-center text-[#62605c] font-medium shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#121316]/06 text-[#121316] shadow-xs mx-auto animate-pulse">
            <Megaphone className="h-6 w-6" />
          </div>
          <div className="text-sm font-semibold text-[#121316]">Loading active sequences...</div>
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
      ) : filteredCampaigns.length === 0 ? (
        <div className="uneevo-card rounded-[28px] border border-[#121316]/08 bg-white p-12 text-center shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-3">
          <div className="text-sm font-bold text-[#121316]">No campaigns match your filter</div>
          <p className="text-xs text-[#62605c]">
            Try adjusting your search query or channel filter to find campaigns.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setSelectedChannel('ALL')
              setSelectedStatus('ALL')
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#121316]/12 bg-white px-4 py-1.5 text-xs font-semibold text-[#121316] hover:bg-[#faf8f4]"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredCampaigns.map((camp) => {
              const rowCount = camp.csvFile?.rowCount || 0
              const sent = camp.stats?.sent || 0
              const senderCount = camp.senderPoolCount || 0
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
                          <span className="truncate">{camp.csvFile?.originalName || 'No dataset'}</span>
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
                          <span className="h-1.5 w-1.5 rounded-full bg-[#8a8780] ml-1 mr-0.5" />
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
                            {camp.stats?.sent || 0}
                          </div>
                        </div>
                        <div className="rounded-xl bg-[#faf8f4] border border-[#121316]/06 p-2.5 text-center">
                          <div className="text-[10px] font-mono font-bold uppercase text-[#62605c]">
                            Remaining
                          </div>
                          <div className="font-mono font-bold text-sm text-[#62605c] tabular-nums mt-0.5">
                            {camp.stats?.remaining || 0}
                          </div>
                        </div>
                        <div className="rounded-xl bg-[#0f8a5f]/08 border border-[#0f8a5f]/15 p-2.5 text-center">
                          <div className="text-[10px] font-mono font-bold uppercase text-[#0f8a5f]">
                            Replies
                          </div>
                          <div className="font-mono font-bold text-sm text-[#0f8a5f] tabular-nums mt-0.5">
                            {camp.stats?.replies || 0}
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
                          {camp.stats?.rampPercent || 100}% sending ramp
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
