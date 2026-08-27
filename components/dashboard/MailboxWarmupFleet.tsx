'use client'

import Link from 'next/link'
import {
  Flame,
  ShieldCheck,
  AtSign,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  Plus,
} from 'lucide-react'

export interface MailboxFleetItem {
  id: string
  email: string
  displayName: string | null
  type: string
  isActive: boolean
  warmupStatus: 'COLD' | 'WARMING' | 'WARMED' | 'PAUSED' | string
  warmupStage: number
  warmupDailyLimit: number
  warmupSentToday: number
  warmupRepliesToday: number
  sentToday: number
  dailyLimit: number
  mailboxHealthScore: number
  mailboxHealthStatus: string
  lastWarmupSentAt: string | null
}

type Props = {
  mailboxes: MailboxFleetItem[]
  totalAccounts: number
  activeAccounts: number
  warmingAccounts: number
  warmedAccounts: number
  warmupSentToday: number
}

function getProviderBadge(type: string) {
  switch (type.toLowerCase()) {
    case 'gmail':
    case 'google':
      return { label: 'Google', bg: 'bg-[#ea4335]/10 text-[#c5221f] border-[#ea4335]/20' }
    case 'outlook':
    case 'microsoft':
    case 'office365':
      return { label: 'Outlook', bg: 'bg-[#0078d4]/10 text-[#005a9e] border-[#0078d4]/20' }
    case 'zoho':
      return { label: 'Zoho', bg: 'bg-[#0f8a5f]/10 text-[#0f8a5f] border-[#0f8a5f]/20' }
    default:
      return { label: 'SMTP / IMAP', bg: 'bg-[#121316]/06 text-[#121316] border-[#121316]/10' }
  }
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return 'No dispatches yet'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return 'Recently'
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function MailboxWarmupFleet({
  mailboxes,
  totalAccounts,
  activeAccounts,
  warmingAccounts,
  warmedAccounts,
  warmupSentToday,
}: Props) {
  return (
    <div className="uneevo-card p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#121316]/08">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block">
              WARMUP POOL PULSE
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8a5c0a] bg-[#fde9b0] px-2.5 py-0.5 rounded-full border border-[#b7791f]/20">
              <Flame className="h-3 w-3" />
              Active Ramp
            </span>
          </div>
          <h3 className="zoho-puvi-headline text-lg sm:text-xl font-bold text-[#121316]">
            Active & Warmed Mailbox Fleet
          </h3>
          <p className="text-xs text-[#62605c] mt-0.5">
            Deliverability health, sending ramp, and warmup execution across connected accounts
          </p>
        </div>

        {/* Quick Summary Badges & Nav Link */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 bg-[#faf8f4] border border-[#121316]/08 px-3 py-1.5 rounded-xl text-xs font-medium">
            <span className="flex items-center gap-1 font-bold text-[#0f8a5f]">
              <ShieldCheck className="h-3.5 w-3.5" />
              {warmedAccounts} Warmed
            </span>
            <span className="text-[#121316]/20">•</span>
            <span className="flex items-center gap-1 font-bold text-[#8a5c0a]">
              <Flame className="h-3.5 w-3.5" />
              {warmingAccounts} Warming
            </span>
            <span className="text-[#121316]/20">•</span>
            <span className="font-bold text-[#121316]">
              {warmupSentToday} Mails Today
            </span>
          </div>

          <Link
            href="/warmup"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#121316] bg-[#121316]/06 hover:bg-[#121316]/10 rounded-xl transition-colors"
          >
            <span>Warmup Settings</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Content */}
      {mailboxes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fde9b0] text-[#5c4211] mb-3">
            <AtSign className="h-6 w-6" />
          </div>
          <div className="text-base font-bold text-[#121316]">
            No mailboxes connected yet
          </div>
          <p className="text-xs text-[#52504b] mt-1 max-w-sm">
            Connect Google Workspace, Microsoft 365, Zoho, or custom SMTP accounts to start automated warmup and protect domain reputation.
          </p>
          <Link
            href="/mail-accounts"
            className="mt-4 inline-flex items-center gap-2 uneevo-btn-red text-xs px-4 py-2"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Connect First Mailbox</span>
          </Link>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {mailboxes.map((account) => {
              const provider = getProviderBadge(account.type)
              const warmupPct = account.warmupDailyLimit > 0
                ? Math.min(100, Math.round((account.warmupSentToday / account.warmupDailyLimit) * 100))
                : 0
              const isWarmed = account.warmupStatus === 'WARMED'
              const isWarming = account.warmupStatus === 'WARMING'
              const isPaused = account.warmupStatus === 'PAUSED'
              const healthScore = account.mailboxHealthScore > 0 ? account.mailboxHealthScore : 100

              return (
                <div
                  key={account.id}
                  className="rounded-[16px] border border-[#121316]/08 bg-[#faf8f4] p-4 transition-all hover:border-[#121316]/18 hover:bg-white hover:shadow-sm"
                >
                  {/* Top row: Email & Provider */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${provider.bg}`}
                        >
                          {provider.label}
                        </span>
                        {account.isActive ? (
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#0f8a5f]" title="Active sender" />
                        ) : (
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#62605c]" title="Inactive" />
                        )}
                      </div>
                      <h4
                        className="font-bold text-sm text-[#121316] truncate mt-1.5"
                        title={account.email}
                      >
                        {account.email}
                      </h4>
                    </div>

                    {/* Status Badge */}
                    <div className="flex-shrink-0">
                      {isWarmed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0f8a5f] bg-[#0f8a5f]/10 px-2.5 py-1 rounded-full border border-[#0f8a5f]/20">
                          <ShieldCheck className="h-3 w-3" />
                          Warmed
                        </span>
                      ) : isWarming ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8a5c0a] bg-[#fde9b0] px-2.5 py-1 rounded-full border border-[#b7791f]/20">
                          <Flame className="h-3 w-3" />
                          Stage {account.warmupStage}
                        </span>
                      ) : isPaused ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#62605c] bg-[#121316]/06 px-2.5 py-1 rounded-full">
                          <PauseCircle className="h-3 w-3" />
                          Paused
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#62605c] bg-[#121316]/06 px-2.5 py-1 rounded-full">
                          Cold
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Warmup Progress Bar & Count */}
                  <div className="space-y-1.5 mb-3 bg-white p-2.5 rounded-xl border border-[#121316]/06">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#62605c] flex items-center gap-1">
                        <Flame className="h-3 w-3 text-[#8a5c0a]" />
                        Warmup Sent Today
                      </span>
                      <span className="font-mono font-bold text-[#121316] tabular-nums">
                        {account.warmupSentToday} / {account.warmupDailyLimit}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#121316]/08 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isWarmed
                            ? 'bg-[#0f8a5f]'
                            : warmupPct >= 80
                            ? 'bg-[#8a5c0a]'
                            : 'bg-[#d8b06d]'
                        }`}
                        style={{ width: `${Math.max(warmupPct, 4)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#62605c] pt-0.5">
                      <span>{account.warmupRepliesToday} replies received</span>
                      <span className="font-mono font-semibold">{warmupPct}% of daily cap</span>
                    </div>
                  </div>

                  {/* Bottom details row */}
                  <div className="flex items-center justify-between text-[11px] text-[#62605c] pt-1">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Health:</span>
                      <span
                        className={`font-bold ${
                          healthScore >= 80 ? 'text-[#0f8a5f]' : 'text-[#8a5c0a]'
                        }`}
                      >
                        {healthScore}%
                      </span>
                    </div>
                    <div className="truncate max-w-[150px] text-right font-mono text-[10px]">
                      {formatTimeAgo(account.lastWarmupSentAt)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Bottom Fleet Link */}
          {totalAccounts > mailboxes.length && (
            <div className="text-center pt-2">
              <Link
                href="/mail-accounts"
                className="text-xs font-bold text-[#ee382b] hover:underline inline-flex items-center gap-1"
              >
                <span>View all {totalAccounts} connected mailboxes →</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
